import { Page, Locator, Response, expect } from '@playwright/test';

// Login.jsx has no ids, names or test-ids and its <label>s are not bound to the inputs,
// so inputs are located by position inside the form.
export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submitButton: Locator;
  readonly errorBox: Locator;
  readonly logoutButton: Locator;

  constructor(private readonly page: Page) {
    this.email = page.locator('form input').nth(0);
    this.password = page.locator('form input').nth(1);
    this.submitButton = page.getByRole('button', { name: 'Sign In' });
    this.errorBox = page.locator('div.bg-red-100');
    this.logoutButton = page.getByRole('button', { name: 'Thoát' });
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.submitButton).toBeVisible();
  }

  async fill(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
  }

  // Submit without waiting: used when the browser is expected to block the request
  async submit() {
    await this.submitButton.click();
  }

  // Submit and wait for the /api/login response, so repeated attempts never race
  async submitAndWait(): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/api/login') && r.request().method() === 'POST'),
      this.submitButton.click(),
    ]);
    return response;
  }

  async attempt(email: string, password: string): Promise<Response> {
    await this.fill(email, password);
    return this.submitAndWait();
  }

  async token(): Promise<string | null> {
    return this.page.evaluate(() => localStorage.getItem('token'));
  }

  // HTML5 validity of an input, read from the DOM (the validation bubble differs per browser)
  async validity(field: 'email' | 'password') {
    return this[field].evaluate((el: HTMLInputElement) => ({
      valueMissing: el.validity.valueMissing,
      typeMismatch: el.validity.typeMismatch,
    }));
  }

  async expectLoggedIn() {
    await expect(this.page).toHaveURL(/\/$/);
    await expect(this.logoutButton).toBeVisible();
    expect(await this.token()).toBeTruthy();
  }

  async expectRejected() {
    await expect(this.page).toHaveURL(/\/login$/);
    await expect(this.errorBox).toBeVisible();
    expect(await this.token()).toBeNull();
  }
}
