import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { createTestAccount, deleteTestAccount, getAccountState, getMe, loginApi } from '../utils/api';
import { loadData } from '../utils/data';

interface Check {
  id: string;
  type: string;
  title: string;
  check: 'attribute' | 'attempts_after_wrong' | 'attempts_after_success' | 'message_equal' | 'api_body_lacks' | 'token_bearer';
  target?: 'email_input' | 'password_input';
  attribute?: string;
  expected?: string;
  wrong_attempts?: number;
  expected_attempts?: number;
  expected_locked?: boolean;
  lock_after?: number;
  must_not_contain?: string[];
  field?: string;
  endpoint?: string;
  expected_status?: number;
}

const WRONG_PASSWORD = 'Wrong@1234';
const checks = loadData<Check>('fr02-checks.json');

test.describe('FR-02 Structure, state and security checks', () => {
  for (const c of checks) {
    test(`${c.id} [${c.type}] ${c.title}`, async ({ page, request }, testInfo) => {
      const tag = `${testInfo.project.name}_${c.id}`.toLowerCase();
      const acct = await createTestAccount(request, tag);
      try {
        const login = new LoginPage(page);
        await login.goto();

        switch (c.check) {
          case 'attribute': {
            const input = c.target === 'email_input' ? login.email : login.password;
            await expect(input).toHaveAttribute(c.attribute!, c.expected!);
            break;
          }
          case 'attempts_after_wrong': {
            for (let i = 0; i < c.wrong_attempts!; i++) await login.attempt(acct.email, WRONG_PASSWORD);
            const state = await getAccountState(request, acct.email);
            expect(state.login_attempts).toBe(c.expected_attempts);
            if (!c.expected_locked) expect(state.locked_until).toBeNull();
            break;
          }
          case 'attempts_after_success': {
            for (let i = 0; i < c.wrong_attempts!; i++) await login.attempt(acct.email, WRONG_PASSWORD);
            await login.attempt(acct.email, acct.password);
            await login.expectLoggedIn();
            const state = await getAccountState(request, acct.email);
            expect(state.login_attempts).toBe(c.expected_attempts);
            expect(state.locked_until).toBeNull();
            break;
          }
          case 'message_equal': {
            await login.attempt(acct.email, WRONG_PASSWORD);
            const normalText = await login.errorBox.innerText();

            const locked = await createTestAccount(request, `${tag}_locked`);
            try {
              for (let i = 0; i < c.lock_after!; i++) await login.attempt(locked.email, WRONG_PASSWORD);
              await login.attempt(locked.email, locked.password);
              const lockedText = await login.errorBox.innerText();
              expect(lockedText).toBe(normalText);
              for (const word of c.must_not_contain!) expect(lockedText.toLowerCase()).not.toContain(word);

              // the UI shows one constant string, so also compare what the API says in each case
              const whileLocked = await loginApi(request, locked.email, locked.password);
              const wrongPassword = await loginApi(request, acct.email, WRONG_PASSWORD);
              expect(whileLocked.body.error).toBe(wrongPassword.body.error);
            } finally {
              await deleteTestAccount(request, locked.id);
            }
            break;
          }
          case 'api_body_lacks': {
            const { body } = await loginApi(request, acct.email, acct.password);
            expect(body).not.toHaveProperty(c.field!);
            expect(body.user).not.toHaveProperty(c.field!);
            break;
          }
          case 'token_bearer': {
            await login.attempt(acct.email, acct.password);
            await login.expectLoggedIn();
            const me = await getMe(request, (await login.token())!);
            expect(me.status).toBe(c.expected_status);
            expect(me.body.email).toBe(acct.email);
            break;
          }
        }
      } finally {
        await deleteTestAccount(request, acct.id);
      }
    });
  }
});
