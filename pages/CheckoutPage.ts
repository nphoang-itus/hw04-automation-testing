import { Page, Locator, expect } from '@playwright/test';
import { CartItem } from '../utils/cart';

export interface CheckoutAttempt {
  status: number;
  requestBody: any;
}

// The cart lives only in React state: a full page load (goto/reload) empties it, so after the first
// item is added, navigate ONLY by clicking links. The checkout page has no ids, test-ids or bound
// labels, so the total input is found by type="number".
export class CheckoutPage {
  readonly dialogs: string[] = [];
  readonly addButtons: Locator;
  readonly detailLinks: Locator;
  readonly cartLink: Locator;
  readonly checkoutButton: Locator;
  readonly heading: Locator;
  readonly lines: Locator;
  readonly totalInput: Locator;
  readonly totalSummary: Locator;
  readonly confirmButton: Locator;
  readonly successHeading: Locator;
  readonly emptyCartMessage: Locator;

  constructor(private readonly page: Page) {
    // errors and guest warnings are shown with alert(): record them instead of letting them vanish
    page.on('dialog', (d) => { this.dialogs.push(d.message()); d.accept(); });
    this.addButtons = page.getByRole('button', { name: 'Thêm vào giỏ', exact: true });
    this.detailLinks = page.getByRole('link', { name: 'Xem chi tiết' });
    this.cartLink = page.getByRole('link', { name: 'Giỏ hàng' });
    this.checkoutButton = page.getByRole('button', { name: 'Tiến hành thanh toán' });
    this.heading = page.getByRole('heading', { name: 'Xác Nhận Đơn Hàng' });
    this.lines = page.locator('ul li');
    this.totalInput = page.locator('input[type="number"]');
    this.totalSummary = page.getByText(/Tổng thanh toán:/);
    this.confirmButton = page.getByRole('button', { name: 'Xác Nhận Thanh Toán' });
    this.successHeading = page.getByRole('heading', { name: 'Thanh toán thành công!' });
    this.emptyCartMessage = page.getByText('Giỏ hàng của bạn đang trống');
  }

  // Log in without the UI: AuthContext reads the token from localStorage on load. Call before the first goto.
  async loginWithToken(token: string) {
    await this.page.addInitScript((t) => localStorage.setItem('token', t), token);
  }

  // entry point expected by the spec template (`ui.goto()`)
  async goto() {
    await this.openHome();
  }

  async openHome() {
    await this.page.goto('/');
    await expect(this.addButtons.first()).toBeVisible();
  }

  async addFromHome(index: number, times = 1) {
    for (let i = 0; i < times; i++) await this.addButtons.nth(index).click();
  }

  // Quantity input exists only on the detail page; its add button ignores the first click (hidden UI rule)
  async addFromDetail(index: number, quantity: number) {
    await this.detailLinks.nth(index).click();
    const add = this.page.getByRole('button', { name: /Thêm vào giỏ hàng|Đã thêm/ });
    await this.page.locator('input[type="number"]').fill(String(quantity));
    await add.click();
    await add.click();
    await expect(this.page.getByRole('button', { name: 'Đã thêm' })).toBeVisible();
    await this.page.getByRole('link', { name: 'EShop' }).click(); // back to Home without a page load
    await expect(this.addButtons.first()).toBeVisible();
  }

  // Fill the cart from parsed items using only link/button clicks
  async fillCart(items: CartItem[], via: 'home' | 'detail') {
    for (const it of items) {
      if (via === 'detail') await this.addFromDetail(it.index, it.quantity);
      else await this.addFromHome(it.index, it.quantity);
    }
  }

  async goToCart() {
    await this.cartLink.click();
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }

  // Open the checkout page through the cart (login and items must be ready)
  async openCheckout() {
    await this.goToCart();
    await this.proceedToCheckout();
    await expect(this.heading).toBeVisible();
  }

  async isTotalEditable(): Promise<boolean> {
    return this.totalInput.isEditable();
  }

  // Tamper with the total like a user could; returns false when the page does not allow editing
  async setTotal(value: number): Promise<boolean> {
    if (!(await this.isTotalEditable())) return false;
    await this.totalInput.fill(String(value));
    return true;
  }

  async inputTotal(): Promise<number> {
    return Number(await this.totalInput.inputValue());
  }

  async summaryTotal(): Promise<number> {
    const text = (await this.totalSummary.innerText()).split(':')[1] ?? '';
    return Number(text.replace(/[^\d-]/g, ''));
  }

  // Click confirm and wait for the checkout response; resolves after the request/response were observed
  async confirm(): Promise<CheckoutAttempt> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/api/checkout') && r.request().method() === 'POST'),
      this.confirmButton.click(),
    ]);
    return { status: response.status(), requestBody: response.request().postDataJSON() };
  }

  async token(): Promise<string | null> {
    return this.page.evaluate(() => localStorage.getItem('token'));
  }
}
