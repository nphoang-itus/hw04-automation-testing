# FR-08 / P1 — Locators, hidden state, flaky risks (Checkout, Web)

Feature: **FR-08 Thanh toán (Checkout)**, Pool B, Web `http://localhost:5173`. Coupon (FR-09) is **out of scope** (the coupon box on the page is ignored). Sources read: `Checkout.jsx`, `Cart.jsx`, `Home.jsx`, `ProductDetail.jsx`, `CartContext.jsx`, `AuthContext.jsx`, `App.jsx`, backend `/api/checkout`, `authenticateToken`, `orders` schema, `/api/admin/orders`, `/api/orders/my-orders`. Everything below comes from **reading code**; no locator has been run on the live DOM yet (P4 smoke check).

## 0. Spec (README SUT, FR-08, verbatim)
- Chỉ người dùng **đã đăng nhập** mới tiến hành thanh toán được.
- **Tổng tiền thanh toán** được tính tự động từ giỏ hàng và không cho phép người dùng chỉnh sửa trực tiếp.
- Giao diện hiển thị đầy đủ danh sách sản phẩm đặt mua.
- Backend phải tự tính lại tổng tiền; không chấp nhận giá trị `total_amount` do client gửi lên.
- Sau thanh toán thành công, giỏ hàng được xóa.

Spec is silent on: empty-cart checkout, shipping address on the web form (README FR-04 gives a default address; the checkout API takes `shipping_address`), quantity limits, price changes between cart and checkout, order contents persistence. → record as spec gaps, no verdict.

## 1. How a user reaches checkout (the cart lives only in React state)
Login (token in `localStorage['token']`) → Home: click **Thêm vào giỏ** on a product card (adds quantity 1, a second click adds a second row) → client-side link **Giỏ hàng** → **Tiến hành thanh toán** → `/checkout`. `CartProvider` keeps the cart in `useState`: **a full page load (`page.goto`, reload) empties it**, while login survives (token is re-read and `/api/users/me` restores the user). So after adding items, navigate only by clicking links.

## 2. Usable locators
| Element | Locator | Notes |
|---|---|---|
| Add to cart (Home) | `page.getByRole('button', { name: 'Thêm vào giỏ' }).nth(i)` | 5 seeded products (iPhone 15 Pro Max 30 000 000; Galaxy S24 Ultra 28 000 000; MacBook Pro M3 45 000 000; AirPods Pro 2 6 000 000; Keychron Q1 4 000 000). Read names/prices from `GET /api/products` at run time, do not hardcode |
| Product name/price on card | `h2` inside the card, `p.text-red-500` ("30,000,000 VND") | text depends on browser locale → see F3 |
| Add to cart (detail page) | `getByRole('button', { name: /Thêm vào giỏ hàng|Đã thêm/ })` + quantity `input[type="number"]` | First click does nothing (needs 2 clicks, known from HW02); `parseInt(quantity)` can give NaN |
| Cart link | `getByRole('link', { name: 'Giỏ hàng' })` | |
| Cart rows | `locator('tbody tr')` (cells: name, price, quantity, subtotal, `Xóa`) | quantity is plain text (no +/− buttons) |
| Cart total | text `Tổng tạm tính` (spec says "Tổng cộng" — FR-07, out of scope) | |
| Go to checkout | `getByRole('button', { name: 'Tiến hành thanh toán' })` | guest → `alert("Bạn cần đăng nhập để thanh toán!")` then `/login` |
| Checkout title | `getByRole('heading', { name: 'Xác Nhận Đơn Hàng' })` (`h2`, no `h1`) | |
| Order lines | `locator('ul li')` text `<name> x <qty> — <subtotal> ₫` | |
| Total input | `locator('input[type="number"]')` | **editable**; its `<label>` is not bound → `getByLabel` unusable |
| Total summary | `getByText(/Tổng thanh toán:/)` | |
| Confirm | `getByRole('button', { name: 'Xác Nhận Thanh Toán' })` | text becomes `Đang xử lý...` while loading |
| Success | `getByRole('heading', { name: 'Thanh toán thành công!' })` | |
| Failure | **`window.alert`**: "Lỗi khi thanh toán: …" | must be caught with `page.on('dialog')`; Playwright auto-dismisses silently otherwise |
| Not usable | `getByLabel(...)`, `data-testid`, `role="alert"` | none exist |

## 3. Hidden state and oracles
| Variable | Where | How to observe |
|---|---|---|
| Orders (saved total, status, user, address) | SQLite `orders(id,user_id,total_amount,status,shipping_address,created_at)` | `GET /api/orders/my-orders` with the test user's token (own orders only); `GET /api/admin/orders` (admin token, note: any token passes, SEC-03 is out of scope) |
| Order lines | **not stored** (no items table) | only the request body carries them |
| Request actually sent | `POST /api/checkout` body `{items, total_amount, coupon_id}` — **no `shipping_address`** | `page.waitForRequest` / `request.postDataJSON()` |
| Cart after success | React state; `Checkout.jsx` never calls `clearCart()` | click **Giỏ hàng** (client nav) and read the table; server `userCarts` is unused by the web |
| Auth | `localStorage['token']`; API: missing token 401, invalid 403 | `loginApi` helper; API call without header |
| Total shown vs sent | `editableTotal` state initialised from `cartTotal` | compare input value, summary text, request body, saved order |

## 4. Flaky / design risks
| # | Risk | Type [AR tr.15] | Mitigation |
|---|---|---|---|
| F1 | Cart is lost on `page.goto`/reload | Ordering/state | Arrange by clicking only; helper `addToCartFromHome(i)` + client-side navigation; never `goto('/cart')` after adding |
| F2 | Errors surface as `alert()` | Timing/hidden | Register `page.once('dialog')` before the click and assert its message; do not rely on auto-dismiss |
| F3 | `toLocaleString()` output differs by browser locale (`30,000,000` vs `30.000.000`) | Cross-browser | Set `locale: 'en-US'` for all projects in `playwright.config.ts`; compare numbers parsed from text, not raw strings |
| F4 | Shared `orders` table across tests/browsers | Environment | One account per test (`createTestAccount`), read only that user's orders via its own token |
| F5 | Logging in through the UI for every test is slow and not the behaviour under test | Economy | Arrange via API token injected into `localStorage` (init script); one test keeps the full UI login path |
| F6 | Backend restart reseeds DB (product ids/prices fixed but not guaranteed) | Environment | Read products from `GET /api/products` at run time |
| F7 | `Đang xử lý...` state and request race | Timing | Wait for the `/api/checkout` response (`waitForResponse`) before asserting on UI/orders |
| F8 | Product detail needs two clicks to add | Hidden UI rule | Use Home buttons; use the detail page only for quantity cases and click twice, noted in the page object |
| F9 | Parallel workers writing the same sqlite DB | Environment | Writes are small; keep `workers` ≤ 2 as before |
| F10 | `localStorage` token persists between tests in a reused context | Ordering | New context per test (Playwright default); verify with a guest test |

## 5. Hypotheses from reading code (not bugs until a test confirms)
- **H1** total input is editable (`type="number"`, `onChange`) — spec: not editable.
- **H2** backend inserts whatever `total_amount` the client sends — spec: backend recomputes and ignores it.
- **H3** cart is not cleared after a successful checkout (`clearCart` unused).
- **H4** the web form never sends `shipping_address` and has no address field → orders saved with `NULL` address (spec silent on the web field: gap).
- **H5** `/checkout` has no login guard in the UI; the API rejects guests (401), shown only as an `alert`. Spec "only logged-in users" is enforced at API level, UI guard exists only on the Cart button.
- **H6** negative, zero or non-numeric totals are accepted by the backend (no validation).
- **H7** empty-cart checkout creates a 0-VND order (spec gap).
- **H8** order lines/prices from the client are never verified or stored.
- **H9** `Tổng tạm tính` label on the cart page and the missing `Xóa` confirmation belong to FR-07 → out of scope.
HW02 already reported related defects for FR-08 (editable total / trust of `total_amount` / cart not cleared / missing address); HW04 re-detects them as regression, with expected results re-derived from the spec.

## 6. Where an AI draft is likely to go wrong (for the P6 gap table)
1. `getByLabel('Tổng tiền…')`, `data-testid`, `getByRole('alert')` → do not exist (invented UI).
2. `page.goto('/cart')` after adding items → empty cart (misses F1).
3. Assuming guests are blocked on `/checkout` in the UI, or that the cart is cleared, or that the total input is read-only → copying the spec instead of testing the SUT; or the opposite, asserting current behaviour.
4. Ignoring the `alert()` so a failed checkout still "passes".
5. Hardcoded prices/locale-formatted strings, and checking the UI total only (not the saved order).
6. Asserting that the order contains the items (not stored).
