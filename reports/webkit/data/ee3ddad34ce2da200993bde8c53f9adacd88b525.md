# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fr02-login-lockout.spec.ts >> FR-02 Login & account lockout >> FR02-A13 [edge] Verify wrong,wrong,correct,wrong,wrong does not lock (only consecutive failures count)
- Location: tests/fr02-login-lockout.spec.ts:47:5

# Error details

```
Error: expect(received).toBeNull()

Received: "2026-11-13T19:45:30.669Z"
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - link "EShop" [ref=e5]:
      - /url: /
    - navigation [ref=e6]:
      - link "Giỏ hàng" [ref=e7]:
        - /url: /cart
      - link "Đăng nhập" [ref=e8]:
        - /url: /login
      - link "Đăng ký" [ref=e9]:
        - /url: /register
  - main [ref=e10]:
    - generic [ref=e11]:
      - heading "Đăng Ký" [level=2] [ref=e12]
      - generic [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e15]: Username
          - textbox [ref=e16]
        - generic [ref=e17]:
          - generic [ref=e18]: Mật khẩu
          - textbox [ref=e19]
        - link "Quên mật khẩu?" [ref=e21]:
          - /url: /forgot-password
        - button "Sign In" [ref=e22] [cursor=pointer]
        - generic [ref=e23]:
          - text: Chưa có tài khoản?
          - link "Đăng ký ngay" [ref=e24]:
            - /url: /register
  - contentinfo [ref=e25]: © 2026 EShop SUT. Dành cho mục đích kiểm thử.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { LoginPage } from '../pages/LoginPage';
  3   | import { createTestAccount, deleteTestAccount, getAccountState, loginApi, TestAccount } from '../utils/api';
  4   | import { loadData } from '../utils/data';
  5   | 
  6   | interface LoginCase {
  7   |   id: string;
  8   |   type: string;
  9   |   title: string;
  10  |   wrong_attempts: string;
  11  |   email_kind: string;
  12  |   password_kind: string;
  13  |   wait_after_lock_s: string;
  14  |   expected_outcome: 'logged_in' | 'rejected' | 'blocked_client';
  15  |   expected_text: string;
  16  |   blocked_field: 'email' | 'password' | '';
  17  |   expected_validity: 'valueMissing' | 'typeMismatch' | '';
  18  |   locked_after_wrong: 'yes' | 'no' | '';
  19  |   sequence: string; // optional arrange steps through the API, e.g. wrong|wrong|valid|wrong|wrong
  20  | }
  21  | 
  22  | const WRONG_PASSWORD = 'Wrong@1234';
  23  | const cases = loadData<LoginCase>('fr02-login-lockout.csv');
  24  | 
  25  | function emailFor(kind: string, acct: TestAccount): string {
  26  |   switch (kind) {
  27  |     case 'valid': return acct.email;
  28  |     case 'unregistered': return `nobody_${Date.now()}@hcmus.edu.vn`;
  29  |     case 'empty': return '';
  30  |     case 'malformed': return 'abc.hcmus.edu.vn';
  31  |     case 'sqli': return "' OR '1'='1";
  32  |     default: throw new Error(`Unknown email_kind ${kind}`);
  33  |   }
  34  | }
  35  | 
  36  | function passwordFor(kind: string, acct: TestAccount): string {
  37  |   switch (kind) {
  38  |     case 'valid': return acct.password;
  39  |     case 'wrong': return WRONG_PASSWORD;
  40  |     case 'empty': return '';
  41  |     default: throw new Error(`Unknown password_kind ${kind}`);
  42  |   }
  43  | }
  44  | 
  45  | test.describe('FR-02 Login & account lockout', () => {
  46  |   for (const tc of cases) {
  47  |     test(`${tc.id} [${tc.type}] ${tc.title}`, async ({ page, request }, testInfo) => {
  48  |       const waitS = Number(tc.wait_after_lock_s);
  49  |       test.setTimeout(30_000 + waitS * 1000);
  50  | 
  51  |       const acct = await createTestAccount(request, `${testInfo.project.name}_${tc.id}`.toLowerCase());
  52  |       try {
  53  |         const login = new LoginPage(page);
  54  |         await login.goto();
  55  | 
  56  |         for (let i = 0; i < Number(tc.wrong_attempts); i++) {
  57  |           await login.attempt(acct.email, WRONG_PASSWORD);
  58  |         }
  59  | 
  60  |         for (const step of tc.sequence ? tc.sequence.split('|') : []) {
  61  |           await loginApi(request, acct.email, step === 'valid' ? acct.password : WRONG_PASSWORD);
  62  |         }
  63  | 
  64  |         // spec: locked from the 3rd consecutive wrong attempt, not before
  65  |         if (tc.locked_after_wrong) {
  66  |           const state = await getAccountState(request, acct.email);
  67  |           if (tc.locked_after_wrong === 'yes') expect(state.locked_until).not.toBeNull();
> 68  |           else expect(state.locked_until).toBeNull();
      |                                           ^ Error: expect(received).toBeNull()
  69  |         }
  70  | 
  71  |         const lockedAt = Date.now(); // the last wrong attempt is the one that locks the account
  72  |         const email = emailFor(tc.email_kind, acct);
  73  |         const password = passwordFor(tc.password_kind, acct);
  74  | 
  75  |         if (tc.expected_outcome === 'blocked_client') {
  76  |           let apiCalls = 0;
  77  |           page.on('request', (r) => { if (r.url().includes('/api/login')) apiCalls++; });
  78  |           await login.fill(email, password);
  79  |           await login.submit();
  80  | 
  81  |           const validity = await login.validity(tc.blocked_field as 'email' | 'password');
  82  |           expect(validity[tc.expected_validity as 'valueMissing' | 'typeMismatch']).toBe(true);
  83  |           expect(apiCalls).toBe(0);
  84  |           await expect(page).toHaveURL(/\/login$/);
  85  |         } else if (tc.expected_outcome === 'rejected') {
  86  |           const response = await login.attempt(email, password);
  87  |           expect(response.status()).toBeLessThan(500);
  88  |           await login.expectRejected();
  89  |           if (tc.expected_text) await expect(login.errorBox).toContainText(tc.expected_text);
  90  |         } else {
  91  |           if (waitS > 0) {
  92  |             // spec lock = waitS seconds: wait until it should have expired, then try exactly once
  93  |             await expect.poll(() => Date.now() - lockedAt, { timeout: (waitS + 5) * 1000, intervals: [500] })
  94  |               .toBeGreaterThan((waitS + 1) * 1000);
  95  |           }
  96  |           await login.attempt(email, password);
  97  |           await login.expectLoggedIn();
  98  |         }
  99  |       } finally {
  100 |         await deleteTestAccount(request, acct.id);
  101 |       }
  102 |     });
  103 |   }
  104 | });
  105 | 
```