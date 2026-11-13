import { test, expect } from '@playwright/test';
import { loadData } from '../utils/data';

// TODO: replace with the real feature (Pool A, FR-02) and >= 12 rows in data/fr02-login-lockout.csv
const cases = loadData('fr02-login-lockout.csv');

test.describe('Feature A - FR-02 Login & lockout', () => {
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
