import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { createTestAccount, deleteTestAccount, getAccountState, TestAccount } from '../utils/api';
import { loadData } from '../utils/data';

interface LoginCase {
  id: string;
  type: string;
  title: string;
  wrong_attempts: string;
  email_kind: string;
  password_kind: string;
  wait_after_lock_s: string;
  expected_outcome: 'logged_in' | 'rejected' | 'blocked_client';
  expected_text: string;
  blocked_field: 'email' | 'password' | '';
  expected_validity: 'valueMissing' | 'typeMismatch' | '';
  locked_after_wrong: 'yes' | 'no' | '';
}

const WRONG_PASSWORD = 'Wrong@1234';
const cases = loadData<LoginCase>('fr02-login-lockout.csv');

function emailFor(kind: string, acct: TestAccount): string {
  switch (kind) {
    case 'valid': return acct.email;
    case 'unregistered': return `nobody_${Date.now()}@hcmus.edu.vn`;
    case 'empty': return '';
    case 'malformed': return 'abc.hcmus.edu.vn';
    case 'sqli': return "' OR '1'='1";
    default: throw new Error(`Unknown email_kind ${kind}`);
  }
}

function passwordFor(kind: string, acct: TestAccount): string {
  switch (kind) {
    case 'valid': return acct.password;
    case 'wrong': return WRONG_PASSWORD;
    case 'empty': return '';
    default: throw new Error(`Unknown password_kind ${kind}`);
  }
}

test.describe('FR-02 Login & account lockout', () => {
  for (const tc of cases) {
    test(`${tc.id} [${tc.type}] ${tc.title}`, async ({ page, request }, testInfo) => {
      const waitS = Number(tc.wait_after_lock_s);
      test.setTimeout(30_000 + waitS * 1000);

      const acct = await createTestAccount(request, `${testInfo.project.name}_${tc.id}`.toLowerCase());
      try {
        const login = new LoginPage(page);
        await login.goto();

        for (let i = 0; i < Number(tc.wrong_attempts); i++) {
          await login.attempt(acct.email, WRONG_PASSWORD);
        }

        // spec: locked from the 3rd consecutive wrong attempt, not before
        if (tc.locked_after_wrong) {
          const state = await getAccountState(request, acct.email);
          if (tc.locked_after_wrong === 'yes') expect(state.locked_until).not.toBeNull();
          else expect(state.locked_until).toBeNull();
        }

        const lockedAt = Date.now(); // the last wrong attempt is the one that locks the account
        const email = emailFor(tc.email_kind, acct);
        const password = passwordFor(tc.password_kind, acct);

        if (tc.expected_outcome === 'blocked_client') {
          let apiCalls = 0;
          page.on('request', (r) => { if (r.url().includes('/api/login')) apiCalls++; });
          await login.fill(email, password);
          await login.submit();

          const validity = await login.validity(tc.blocked_field as 'email' | 'password');
          expect(validity[tc.expected_validity as 'valueMissing' | 'typeMismatch']).toBe(true);
          expect(apiCalls).toBe(0);
          await expect(page).toHaveURL(/\/login$/);
        } else if (tc.expected_outcome === 'rejected') {
          const response = await login.attempt(email, password);
          expect(response.status()).toBeLessThan(500);
          await login.expectRejected();
          if (tc.expected_text) await expect(login.errorBox).toContainText(tc.expected_text);
        } else {
          if (waitS > 0) {
            // spec lock = waitS seconds: wait until it should have expired, then try exactly once
            await expect.poll(() => Date.now() - lockedAt, { timeout: (waitS + 5) * 1000, intervals: [500] })
              .toBeGreaterThan((waitS + 1) * 1000);
          }
          await login.attempt(email, password);
          await login.expectLoggedIn();
        }
      } finally {
        await deleteTestAccount(request, acct.id);
      }
    });
  }
});
