# Bug Report — HW04 (EShop SUT)

SUT: `eshop-sut-fithcmus` (backend :3000, web :5173). Reproduced on Chromium, Firefox, WebKit (Playwright), report `reports/<browser>/index.html`. Expected results are taken from the SUT spec (README SRS v2.0). Evidence images are real captures from the live SUT (`scripts/capture-bug-evidence.mjs`, captured 2026-11-13T19:45Z); the two UI images carry a yellow DOM annotation overlay added by the script.
GitHub Issues: created on the team repo `tkob-team/eshop-sut` (#275–#280, titles prefixed `[HW04][FR-02]`, label `bug`, evidence images linked from this repo).

## Summary — FR-02 (Feature A)
| ID | Title | Severity | Failing tests (9) | Spec | Evidence | HW02 ref | Issue |
|---|---|---|---|---|---|---|---|
| BUG-FR02-01 | Wrong-attempt counter increases by 2 (account locks at the 2nd wrong attempt) | Major | A03, A13, B03 | FR-02 | `evidence/bugs/BUG-FR02-01.png` | BUG-FR02-01, 02 | [#280](https://github.com/tkob-team/eshop-sut/issues/280) |
| BUG-FR02-02 | Lock lasts 180 s instead of 30 s | Major | A12 | FR-02 | `evidence/bugs/BUG-FR02-02.png` | BUG-FR02-03 | [#275](https://github.com/tkob-team/eshop-sut/issues/275) |
| BUG-FR02-03 | Email input is `type="text"`: no HTML5 format validation | Major | A08, B01 | FR-02, FR-22 | `evidence/bugs/BUG-FR02-03.png` | BUG-FR02-04 | [#276](https://github.com/tkob-team/eshop-sut/issues/276) |
| BUG-FR02-04 | Password input is `type="text"`: password shown in clear | Major | B02 | FR-22 | `evidence/bugs/BUG-FR02-04.png` | BUG-FR02-05 | [#277](https://github.com/tkob-team/eshop-sut/issues/277) |
| BUG-FR02-05 | Locked-account response reveals the lock (differs from wrong-password response) | Major (needs spec confirmation) | B04 | FR-02 "no cause details" | `evidence/bugs/BUG-FR02-05.png` | BUG-FR02-11 | [#278](https://github.com/tkob-team/eshop-sut/issues/278) |
| BUG-FR02-06 | Login response returns the password in plain text | Critical | B05 | SEC-01 | `evidence/bugs/BUG-FR02-06.png` | BUG-FR02-08 | [#279](https://github.com/tkob-team/eshop-sut/issues/279) |

Test → bug mapping: A03, A13, B03 → 01 · A12 → 02 · A08, B01 → 03 · B02 → 04 · B04 → 05 · B05 → 06 (9 failing tests = 6 distinct defects; 11 tests pass on every browser).

---

### BUG-FR02-01 — Wrong-attempt counter increases by 2
- **Severity:** Major · **Browsers:** all 3 · **Component:** `backend/server.js` `/api/login` (`login_attempts + 2`, read from code — hypothesis confirmed by behaviour)
- **Spec:** "Sau mỗi lần đăng nhập sai, hệ thống tăng bộ đếm lên **đúng 1 đơn vị**. Nếu đăng nhập sai từ **3 lần** trở lên liên tiếp, tài khoản bị tạm khóa."
- **Steps:** 1) Create a user. 2) `POST /api/login` with a wrong password. 3) `GET /api/admin/users` (admin token) and read `login_attempts`. 4) Repeat the wrong attempt.
- **Expected:** 1 after the first wrong attempt; 2 after the second (not locked); lock at the third.
- **Actual:** 2 after the first; 4 and `locked_until` set after the second; the third returns 403.
- **Consequences seen by tests:** after 2 wrong attempts a correct login fails (A03); wrong, wrong, correct, wrong, wrong ends locked (A13).
- **Evidence:** `docs/evidence/bugs/BUG-FR02-01.png`; automated: FR02-B03 (Expected 1, Received 2), A03, A13.

### BUG-FR02-02 — Lock lasts 180 seconds
- **Severity:** Major · **Browsers:** all 3 · **Component:** `/api/login` (`Date.now() + 180000`)
- **Spec:** "tài khoản bị tạm khóa **30 giây**".
- **Steps:** 1) Create a user. 2) Send 3 wrong passwords. 3) Read `locked_until`. 4) Wait 31 s and log in with the correct password.
- **Expected:** lock ends after 30 s; login succeeds at 31 s.
- **Actual:** `locked_until` ≈ now + 180 s; login at 31 s still returns 403.
- **Evidence:** `docs/evidence/bugs/BUG-FR02-02.png`; automated: FR02-A12.

### BUG-FR02-03 — Email input is `type="text"`
- **Severity:** Major · **Browsers:** all 3 · **Component:** `frontend-web/src/pages/Login.jsx`
- **Spec:** "Trường email phải dùng `type="email"` (có validate HTML5 format)" (FR-02, FR-22).
- **Steps:** 1) Open `/login`. 2) Enter `abc.hcmus.edu.vn` (no `@`) and any password. 3) Click Sign In.
- **Expected:** the browser blocks submission with an email-format message (`validity.typeMismatch = true`).
- **Actual:** the form is submitted and the app shows the server error banner; the input is `type="text"`.
- **Evidence:** `docs/evidence/bugs/BUG-FR02-03.png`; automated: FR02-B01, FR02-A08.

### BUG-FR02-04 — Password input is `type="text"`
- **Severity:** Major · **Browsers:** all 3 · **Component:** `Login.jsx`
- **Spec:** FR-22 "Trường Mật khẩu phải dùng `type="password"` (không hiển thị rõ)".
- **Steps:** open `/login`, type any password.
- **Expected:** characters are masked. **Actual:** the password is shown in clear text.
- **Evidence:** `docs/evidence/bugs/BUG-FR02-04.png`; automated: FR02-B02.

### BUG-FR02-05 — Locked-account response differs from wrong-password response
- **Severity:** Major · **Needs confirmation:** the spec says both "thông báo lỗi phù hợp" and "không để lộ chi tiết nguyên nhân"; the interpretation used is that the error must not reveal that the account is locked (agreed by the student for the UI on 2026-11-14; extension to the API message is the AI's proposal).
- **Steps:** 1) Wrong password on account X → note response. 2) Lock account Y with 3 wrong attempts. 3) Log in to Y with the correct password → compare.
- **Expected:** same error text/outcome as a wrong password. **Actual:** wrong password → `401 {"error":"Invalid email or password"}`; locked → `403 {"error":"Tài khoản đã bị khóa. Vui lòng thử lại sau."}`. (The UI hides the difference with one constant message.)
- **Evidence:** `docs/evidence/bugs/BUG-FR02-05.png`; automated: FR02-B04 (UI text equal, API text differs).

### BUG-FR02-06 — Password returned in plain text
- **Severity:** Critical · **Component:** `/api/login` returns the whole `user` row (also `GET /api/users/me`)
- **Spec:** SEC-01 "Mật khẩu không được lưu dưới dạng plaintext."
- **Steps:** `POST /api/login` with valid credentials; inspect `user`.
- **Expected:** no password field. **Actual:** `user.password` holds the clear password.
- **Evidence:** `docs/evidence/bugs/BUG-FR02-06.png`; automated: FR02-B05.

## Not reported as bugs (spec gaps / out of scope)
Email case sensitivity, leading/trailing spaces, input length limits, whether the counter resets after a lock expires: the spec is silent (no test was created). Cosmetic findings from HW02 (page title "Đăng Ký", error message position, missing `*`) are outside the automated scope and not re-reported here.

## Issues
Created 2026-11-14 on https://github.com/tkob-team/eshop-sut with the student's approval (existing team issues BUG-FR02-10/11/12 are from HW02; these are new, separate HW04 issues even where the defect overlaps — BUG-FR02-05 ≈ #63).
| Bug | Issue |
|---|---|
| BUG-FR02-01 | #280 |
| BUG-FR02-02 | #275 |
| BUG-FR02-03 | #276 |
| BUG-FR02-04 | #277 |
| BUG-FR02-05 | #278 |
| BUG-FR02-06 | #279 |

Note: the first creation attempt used a shifted title array, so #275–#279 were first created with titles of the neighbouring bugs and then corrected with `gh issue edit`; #280 was created last. Titles and bodies were re-checked after the fix.

---

# FR-08 (Feature B — Checkout)

Reproduced on Chromium, Firefox, WebKit: 17 tests per browser, **9 pass, 8 fail on each** (`docs/evidence/fr08-3browsers-run3.txt`, `reports/<browser>/index.html`). 8 failing tests = 3 distinct defects. Expected results from the SUT spec FR-08. GitHub Issues: not created yet (pending the student's approval).

| ID | Title | Severity | Failing tests | Spec | Evidence | HW02 ref |
|---|---|---|---|---|---|---|
| BUG-FR08-01 | Backend stores the client `total_amount` instead of recomputing it | Critical | A07, A08, A09, A10, B06 | FR-08 bullet 4 | `evidence/bugs/BUG-FR08-01.png` | editable total / trust of `total_amount` |
| BUG-FR08-02 | Total field on the checkout page is editable | Major | B01, B07 | FR-08 bullet 2 | `evidence/bugs/BUG-FR08-02.png` | editable total |
| BUG-FR08-03 | Cart is not cleared after a successful checkout | Major | B04 | FR-08 bullet 5 | `evidence/bugs/BUG-FR08-03.png` | cart not cleared |

Test → bug mapping: A07–A10, B06 → 01 · B01, B07 → 02 · B04 → 03 (A01–A06, B02, B03, B05 pass on every browser).

### BUG-FR08-01 — Backend stores the client total
- **Severity:** Critical · **Browsers:** all 3 · **Component:** backend `POST /api/checkout`
- **Spec:** "Backend phải tự tính lại tổng tiền; không chấp nhận giá trị `total_amount` do client gửi lên."
- **Steps:** 1) Create a user and log in. 2) `POST /api/checkout` with one iPhone 15 Pro Max (30,000,000) and `total_amount: 1`. 3) `GET /api/orders/my-orders`.
- **Expected:** stored total 30,000,000 (or the request is rejected).
- **Actual:** HTTP 200, stored `total_amount = 1`. A UI-level tamper gives the same (A07 → 1, A08 → 0, A09 → -1000, A10 → ×10). A `{}` body also returns 200 and stores `total_amount = null`.
- **Evidence:** `docs/evidence/bugs/BUG-FR08-01.png`; automated: FR08-A07–A10, FR08-B06 (Expected 36000000, Received 1).

### BUG-FR08-02 — Total field is editable
- **Severity:** Major · **Browsers:** all 3 · **Component:** `frontend-web/src/pages/Checkout.jsx` (`input type="number"` with `onChange`)
- **Spec:** "Tổng tiền thanh toán được tính tự động từ giỏ hàng và không cho phép người dùng chỉnh sửa trực tiếp."
- **Steps:** 1) Log in, add a product, open the cart and click "Tiến hành thanh toán". 2) Type 1 into the total field.
- **Expected:** the field is read-only/disabled; the total stays 30,000,000.
- **Actual:** the field accepts the value and the page summary shows 1.
- **Evidence:** `docs/evidence/bugs/BUG-FR08-02.png`; automated: FR08-B01 (`not.toBeEditable()` fails), FR08-B07 (Expected 30000000, Received 1).

### BUG-FR08-03 — Cart not cleared after success
- **Severity:** Major · **Browsers:** all 3 · **Component:** `Checkout.jsx` / `CartContext.jsx` (cart is not cleared after the success response)
- **Spec:** "Sau thanh toán thành công, giỏ hàng được xóa."
- **Steps:** 1) Log in, add a product, check out successfully. 2) Click "Quay lại trang chủ". 3) Open the cart.
- **Expected:** "Giỏ hàng của bạn đang trống".
- **Actual:** the cart still lists the purchased line (1 line, 30,000,000 ₫).
- **Evidence:** `docs/evidence/bugs/BUG-FR08-03.png`; automated: FR08-B04.

Evidence script: `scripts/capture-fr08-evidence.mjs` (API screenshot renders real responses; UI screenshots are real pages with a DOM annotation overlay).
