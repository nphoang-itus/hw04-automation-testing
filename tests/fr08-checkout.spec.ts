import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../pages/CheckoutPage';
import {
  createTestAccount, deleteTestAccount, getProducts, getToken, getMyOrders, countOrdersWithoutUser,
} from '../utils/api';
import { parseItems, computeTotal } from '../utils/cart';
import { loadData } from '../utils/data';

interface CheckoutCase {
  id: string;
  type: string;
  title: string;
  login: 'user' | 'guest';
  items: string;
  add_via: 'home' | 'detail' | 'none';
  entry: 'cart' | 'direct';
  tamper_mode: 'none' | 'absolute' | 'multiplier';
  tamper_value: string;
  expected_outcome: 'order_created' | 'no_order';
  expected_total: string;
  expected_text: string;
}

const cases = loadData<CheckoutCase>('fr08-checkout.csv');

test.describe('FR-08 Checkout (web)', () => {
  for (const tc of cases) {
    test(`${tc.id} [${tc.type}] ${tc.title}`, async ({ page, request }, testInfo) => {
      const products = await getProducts(request);
      const items = parseItems(tc.items);
      const expectedTotal = computeTotal(items, products);
      const account = tc.login === 'user'
        ? await createTestAccount(request, `${testInfo.project.name}_${tc.id}`.toLowerCase())
        : null;

      try {
        const checkout = new CheckoutPage(page);
        const guestOrdersBefore = await countOrdersWithoutUser(request);
        const token = account ? await getToken(request, account) : null;
        if (token) await checkout.loginWithToken(token);

        if (tc.entry === 'direct') {
          await page.goto('/checkout');
        } else {
          await checkout.openHome();
          await checkout.fillCart(items, tc.add_via as 'home' | 'detail');
          await checkout.goToCart();
          await checkout.proceedToCheckout();
        }

        if (tc.expected_outcome === 'order_created') {
          await expect(checkout.heading).toBeVisible();

          if (tc.tamper_mode !== 'none') {
            const value = tc.tamper_mode === 'absolute'
              ? Number(tc.tamper_value)
              : expectedTotal * Number(tc.tamper_value);
            const tampered = await checkout.setTotal(value);
            if (!tampered) {
              // read-only input (spec-compliant): nothing to tamper with in the UI, backend is covered by FR08-B06
              testInfo.annotations.push({ type: 'note', description: 'total input not editable; tamper step skipped' });
            }
          }

          const attempt = await checkout.confirm();
          expect(attempt.status).toBe(200);
          await expect(page.getByRole('heading', { name: tc.expected_text })).toBeVisible();

          const orders = await getMyOrders(request, token!);
          expect(orders).toHaveLength(1);
          expect(orders[0].total_amount).toBe(expectedTotal);
        } else if (tc.entry === 'cart') {
          // guest stopped at the cart
          await expect.poll(() => checkout.dialogs).toContain(tc.expected_text);
          await expect(page).toHaveURL(/\/login$/);
        } else {
          // guest submits the checkout page directly
          const attempt = await checkout.confirm();
          expect(attempt.status).toBeGreaterThanOrEqual(400);
          await expect(checkout.successHeading).toBeHidden();
        }

        if (tc.expected_outcome === 'no_order') {
          expect(await countOrdersWithoutUser(request)).toBe(guestOrdersBefore);
        }
      } finally {
        if (account) await deleteTestAccount(request, account.id);
      }
    });
  }
});
