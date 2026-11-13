import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../pages/CheckoutPage';
import { loadData } from '../utils/data';
// import { createTestAccount, deleteTestAccount } from '../utils/api';

interface Case {
  id: string;
  type: string;
  title: string;
  expected_outcome: string;
  spec_ref: string;
  // TODO: one column per varying input / expected value in data/fr08-checkout.csv
}

const cases = loadData<Case>('fr08-checkout.csv');

test.describe('FR-08 Checkout', () => {
  for (const tc of cases) {
    test(`${tc.id} [${tc.type}] ${tc.title}`, async ({ page, request }, testInfo) => {
      // Arrange: isolated data for this test and browser, e.g.
      // const acct = await createTestAccount(request, `${testInfo.project.name}_${tc.id}`.toLowerCase());
      try {
        const ui = new CheckoutPage(page);
        await ui.goto();

        // Act: one behaviour under test, using values from `tc`

        // Assert: expected result from the SPEC; use several kinds (URL, text, visibility,
        // attribute, state via API, status code). Never wait with fixed sleeps.
        expect(tc.expected_outcome).toBeTruthy(); // TODO replace
      } finally {
        // await deleteTestAccount(request, acct.id);
      }
    });
  }
});
