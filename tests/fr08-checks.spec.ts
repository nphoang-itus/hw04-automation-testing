import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../pages/CheckoutPage';
import {
  createTestAccount, deleteTestAccount, getProducts, getToken, getMyOrders, countOrdersWithoutUser, checkoutApi,
} from '../utils/api';
import { parseItems, computeTotal } from '../utils/cart';
import { loadData } from '../utils/data';

interface Check {
  id: string;
  type: string;
  title: string;
  check: 'input_not_editable' | 'lines_listed' | 'totals_agree' | 'cart_empty_after_success' | 'api_guest_rejected';
  items?: string;
  expected_lines?: number;
  expected_text?: string;
  expected_status_in?: number[];
}

const checks = loadData<Check>('fr08-checkout-checks.json');

test.describe('FR-08 Structure, state and security checks', () => {
  for (const c of checks) {
    test(`${c.id} [${c.type}] ${c.title}`, async ({ page, request }, testInfo) => {
      const account = await createTestAccount(request, `${testInfo.project.name}_${c.id}`.toLowerCase());
      try {
        const products = await getProducts(request);
        const items = parseItems(c.items ?? '');
        const expectedTotal = computeTotal(items, products);
        const token = await getToken(request, account);
        const checkout = new CheckoutPage(page);

        switch (c.check) {
          case 'input_not_editable': {
            await checkout.startAsUser(token, items, 'home');
            await expect(checkout.totalInput).not.toBeEditable();
            break;
          }
          case 'lines_listed': {
            await checkout.startAsUser(token, items, 'home');
            await expect(checkout.lines).toHaveCount(c.expected_lines!);
            for (const [i, it] of items.entries()) {
              const product = products[it.index];
              const line = checkout.lines.nth(i);
              await expect(line).toContainText(product.name);
              await expect(line).toContainText(`x ${it.quantity}`);
              await expect(line).toContainText((Number(product.price) * it.quantity).toLocaleString('en-US'));
            }
            break;
          }
          case 'totals_agree': {
            await checkout.startAsUser(token, items, 'home');
            expect(await checkout.inputTotal()).toBe(expectedTotal);
            expect(await checkout.summaryTotal()).toBe(expectedTotal);
            const attempt = await checkout.confirm();
            expect(attempt.requestBody.total_amount).toBe(expectedTotal);
            await expect(checkout.successHeading).toBeVisible();
            const orders = await getMyOrders(request, token);
            expect(orders[0].total_amount).toBe(expectedTotal);
            break;
          }
          case 'cart_empty_after_success': {
            await checkout.startAsUser(token, items, 'home');
            await checkout.confirm();
            await expect(checkout.successHeading).toBeVisible();
            await page.getByRole('button', { name: 'Quay lại trang chủ' }).click();
            await checkout.goToCart();
            await expect(checkout.emptyCartMessage).toBeVisible();
            await expect(page.locator('tbody tr')).toHaveCount(0);
            break;
          }
          case 'api_guest_rejected': {
            const before = await countOrdersWithoutUser(request);
            const res = await checkoutApi(request, null, { total_amount: 1000 });
            expect(c.expected_status_in).toContain(res.status);
            expect(await countOrdersWithoutUser(request)).toBe(before);
            break;
          }
        }
      } finally {
        await deleteTestAccount(request, account.id);
      }
    });
  }
});
