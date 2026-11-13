import { test, expect } from '@playwright/test';
import { loadData } from '../utils/data';

// TODO: replace with the real feature (Pool B, FR-08) and >= 12 rows in data/fr08-checkout.csv
const cases = loadData('fr08-checkout.csv');

test.describe('Feature B - FR-08 Checkout', () => {
  for (const tc of cases) {
    test(`${tc.id} [${tc.type}]`, async ({ page }) => {
      await page.goto('/'); // TODO: feature URL

      // TODO: perform steps using tc.input1 / tc.input2

      // Use >= 3 distinct assertion patterns across the suite, e.g.:
      // await expect(page).toHaveURL(/.../);                    // URL
      // await expect(page.getByRole('alert')).toContainText(tc.expected); // text
      // await expect(page.locator('...')).toBeVisible();        // visibility
      // await expect(page.locator('...')).toHaveCount(n);       // count
      expect(tc.expected).toBeDefined();
    });
  }
});
