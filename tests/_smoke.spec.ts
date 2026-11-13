import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { createTestAccount, deleteTestAccount, getAccountState, loginApi, getMe } from '../utils/api';

test('smoke: helpers and locators against live SUT', async ({ page, request }) => {
  const acct = await createTestAccount(request, 'smoke');
  try {
    expect(await getAccountState(request, acct.email)).toEqual({ login_attempts: 0, locked_until: null });
    const lp = new LoginPage(page);
    await lp.goto();
    console.log('email type:', await lp.email.getAttribute('type'), '| pw type:', await lp.password.getAttribute('type'));
    const r = await lp.attempt(acct.email, 'Wrong@1234');
    console.log('wrong attempt status', r.status(), 'state', JSON.stringify(await getAccountState(request, acct.email)));
    await lp.expectRejected();
    console.log('error text:', await lp.errorBox.innerText());
    await lp.attempt(acct.email, acct.password);
    await lp.expectLoggedIn();
    const me = await getMe(request, (await lp.token())!);
    console.log('me status', me.status, 'has password field:', 'password' in (me.body ?? {}));
    console.log('api login', (await loginApi(request, acct.email, acct.password)).status);
  } finally {
    await deleteTestAccount(request, acct.id);
  }
});
