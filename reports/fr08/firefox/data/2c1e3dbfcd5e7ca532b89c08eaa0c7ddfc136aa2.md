# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fr08-checkout.spec.ts >> FR-08 Checkout (web) >> FR08-A10 [negative] Verify backend ignores a client total higher than the real total
- Location: tests/fr08-checkout.spec.ts:28:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 30000000
Received: 300000000
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - link "EShop" [ref=e5] [cursor=pointer]:
      - /url: /
    - navigation [ref=e6]:
      - link "Giỏ hàng" [ref=e7] [cursor=pointer]:
        - /url: /cart
      - generic [ref=e8]:
        - link "Chào, Test firefox_fr08-a10" [ref=e9] [cursor=pointer]:
          - /url: /profile
        - button "Thoát" [ref=e10] [cursor=pointer]
  - main [ref=e11]:
    - generic [ref=e12]:
      - heading "Thanh toán thành công!" [level=2] [ref=e13]
      - paragraph [ref=e14]: Cảm ơn bạn đã mua sắm tại EShop.
      - button "Quay lại trang chủ" [ref=e15] [cursor=pointer]
  - contentinfo [ref=e16]: © 2026 EShop SUT. Dành cho mục đích kiểm thử.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { CheckoutPage } from '../pages/CheckoutPage';
  3  | import {
  4  |   createTestAccount, deleteTestAccount, getProducts, getToken, getMyOrders, countOrdersWithoutUser,
  5  | } from '../utils/api';
  6  | import { parseItems, computeTotal } from '../utils/cart';
  7  | import { loadData } from '../utils/data';
  8  | 
  9  | interface CheckoutCase {
  10 |   id: string;
  11 |   type: string;
  12 |   title: string;
  13 |   login: 'user' | 'guest';
  14 |   items: string;
  15 |   add_via: 'home' | 'detail' | 'none';
  16 |   entry: 'cart' | 'direct';
  17 |   tamper_mode: 'none' | 'absolute' | 'multiplier';
  18 |   tamper_value: string;
  19 |   expected_outcome: 'order_created' | 'no_order';
  20 |   expected_total: string;
  21 |   expected_text: string;
  22 | }
  23 | 
  24 | const cases = loadData<CheckoutCase>('fr08-checkout.csv');
  25 | 
  26 | test.describe('FR-08 Checkout (web)', () => {
  27 |   for (const tc of cases) {
  28 |     test(`${tc.id} [${tc.type}] ${tc.title}`, async ({ page, request }, testInfo) => {
  29 |       const products = await getProducts(request);
  30 |       const items = parseItems(tc.items);
  31 |       const expectedTotal = computeTotal(items, products);
  32 |       const account = tc.login === 'user'
  33 |         ? await createTestAccount(request, `${testInfo.project.name}_${tc.id}`.toLowerCase())
  34 |         : null;
  35 | 
  36 |       try {
  37 |         const checkout = new CheckoutPage(page);
  38 |         const guestOrdersBefore = await countOrdersWithoutUser(request);
  39 |         const token = account ? await getToken(request, account) : null;
  40 |         if (token) await checkout.loginWithToken(token);
  41 | 
  42 |         if (tc.entry === 'direct') {
  43 |           await page.goto('/checkout');
  44 |         } else {
  45 |           await checkout.openHome();
  46 |           await checkout.fillCart(items, tc.add_via as 'home' | 'detail');
  47 |           await checkout.goToCart();
  48 |           await checkout.proceedToCheckout();
  49 |         }
  50 | 
  51 |         if (tc.expected_outcome === 'order_created') {
  52 |           await expect(checkout.heading).toBeVisible();
  53 | 
  54 |           if (tc.tamper_mode !== 'none') {
  55 |             const value = tc.tamper_mode === 'absolute'
  56 |               ? Number(tc.tamper_value)
  57 |               : expectedTotal * Number(tc.tamper_value);
  58 |             const tampered = await checkout.setTotal(value);
  59 |             if (!tampered) {
  60 |               // read-only input (spec-compliant): nothing to tamper with in the UI, backend is covered by FR08-B06
  61 |               testInfo.annotations.push({ type: 'note', description: 'total input not editable; tamper step skipped' });
  62 |             }
  63 |           }
  64 | 
  65 |           const attempt = await checkout.confirm();
  66 |           expect(attempt.status).toBe(200);
  67 |           await expect(page.getByRole('heading', { name: tc.expected_text })).toBeVisible();
  68 | 
  69 |           const orders = await getMyOrders(request, token!);
  70 |           expect(orders).toHaveLength(1);
> 71 |           expect(orders[0].total_amount).toBe(expectedTotal);
     |                                          ^ Error: expect(received).toBe(expected) // Object.is equality
  72 |         } else if (tc.entry === 'cart') {
  73 |           // guest stopped at the cart
  74 |           await expect.poll(() => checkout.dialogs).toContain(tc.expected_text);
  75 |           await expect(page).toHaveURL(/\/login$/);
  76 |         } else {
  77 |           // guest submits the checkout page directly
  78 |           const attempt = await checkout.confirm();
  79 |           expect(attempt.status).toBeGreaterThanOrEqual(400);
  80 |           await expect(checkout.successHeading).toBeHidden();
  81 |           await expect.poll(() => checkout.dialogs.length).toBeGreaterThan(0); // the user is told it failed (message is a spec gap)
  82 |         }
  83 | 
  84 |         if (tc.expected_outcome === 'no_order') {
  85 |           expect(await countOrdersWithoutUser(request)).toBe(guestOrdersBefore);
  86 |         }
  87 |       } finally {
  88 |         if (account) await deleteTestAccount(request, account.id);
  89 |       }
  90 |     });
  91 |   }
  92 | });
  93 | 
```