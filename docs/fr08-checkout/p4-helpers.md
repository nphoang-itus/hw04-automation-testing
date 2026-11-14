# FR-08 / P4 — Helpers and smoke check on the live SUT

Files: `pages/CheckoutPage.ts`, `utils/api.ts` (extended), `utils/cart.ts` (new), `playwright.config.ts` (`locale: 'en-US'`, fallback `baseURL` fixed to :5173). Smoke test `tests/_smoke8.spec.ts` is **not committed** (temporary, Chromium only).

## Helper API
| Helper | Purpose |
|---|---|
| `getProducts`, `parseItems("1:1\|4:1")`, `computeTotal` | Expected total from the **spec** (price × quantity, prices read at run time) |
| `getToken` + `CheckoutPage.loginWithToken(token)` | Log in without the UI (token injected into `localStorage` through an init script) |
| `getMyOrders(token)` | Hidden state: the user's saved orders (`total_amount`, `status`, `shipping_address`) |
| `countOrdersWithoutUser` | Oracle for "guest cannot create an order" (orders with `user_id` null; parallel tests cannot disturb it) |
| `checkoutApi(token \| null, body)` | Direct API call for the guest/API case |
| `CheckoutPage.fillCart(items, 'home'\|'detail')` | Adds items using clicks only (cart is lost on `goto`); the detail path clicks twice and returns to Home through the `EShop` link |
| `openCheckout`, `setTotal` (returns `false` if not editable), `inputTotal`, `summaryTotal`, `confirm()` | Checkout page actions; `confirm()` waits for the `/api/checkout` response and returns status and request body |
| `dialogs` | Every `alert()` message is recorded and accepted |

## Smoke results (real run, Chromium, 2026-11-14)
| Check | Observed |
|---|---|
| Products | 5 seeded products, prices 30 M / 28 M / 45 M / 6 M / 4 M |
| Two-product cart | 2 lines (`iPhone 15 Pro Max x 1 — 30,000,000 ₫`); input total, summary and expected all 36 000 000 |
| Total input | `isEditable() = true` (H1); set to 1 → summary shows 1 |
| Checkout request | `POST /api/checkout`, keys `items, total_amount, coupon_id` (no `shipping_address`), `total_amount = 1`, HTTP 200 |
| Saved order | `my-orders` → one order, `total_amount = 1`, `status = pending`, `shipping_address = null` (H2, H4) |
| Cart after success | `Giỏ hàng` page still shows 2 rows, no empty message (H3) |
| Detail page path | `MacBook Pro M3 x 3 — 135,000,000 ₫`, summary 135 000 000 = expected |
| Guest via cart button | dialog `Bạn cần đăng nhập để thanh toán!`, URL `/login` |
| Guest API | `POST /api/checkout` without token → 401 `{"error":"Unauthorized"}`; orders without user 0 → 0 |
These are smoke observations that confirm helper behaviour and match hypotheses H1–H4; they are **not** test results (the real tests come from the spec at P5/P7).

## Issues found while building the helpers (script, not SUT)
1. `isVisible()` / `count()` do not wait: a first check read "empty cart message not visible, 0 rows" while the page was still Home. Use `expect(...)`/`waitFor`.
2. An extra `getByRole('heading', { level: 2 })` check violated strict mode (5 headings on Home) — it also exposed the race above.
3. Created orders cannot be deleted through the API, so every run leaves orders in the DB (accounts are deleted; the SUT reseeds on restart). Tests must find their order through the test user's own token.
