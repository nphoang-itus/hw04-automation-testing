# FR-08 / P2 — Danh sách test case (bản nháp AI, chờ sinh viên duyệt)

## 1. Prompt đã dùng (ROLE / CONTEXT / TASK / FORMAT / CONSTRAINTS — [TC tr.21])
- **ROLE:** senior QA automation engineer (Playwright), thành thạo EP/BVA và kiểm thử trạng thái.
- **CONTEXT:** spec FR-08 (5 gạch đầu dòng, nguyên văn ở `p1-analysis.md` §0); kết quả P1 (locator, oracle `my-orders`/`admin/orders`, rủi ro F1–F10, giả thuyết H1–H9); quyết định của sinh viên: **không** test coupon (FR-09) và các lỗi FR-07; spec im lặng (giỏ trống, địa chỉ trên web, giới hạn số lượng) → spec gap, **không tạo TC**.
- **TASK:** ≥ 12 TC tự động hóa được cho FR-08 (Web), positive/negative/edge; kỳ vọng **chỉ theo spec**; mỗi TC một ý chính.
- **FORMAT:** bảng `ID | Loại | Tiêu đề | Bước | Dữ liệu | Kết quả mong đợi | Spec | ĐT`.
- **CONSTRAINTS:** tiêu đề Action + Function + Condition; mỗi test tự tạo user riêng, đăng nhập bằng token (trừ TC đăng nhập), chỉ điều hướng bằng click (giỏ hàng mất khi `goto`); không dùng locator không tồn tại; giá lấy từ `GET /api/products` lúc chạy, không hardcode; bắt `alert()`.

Quy ước: `P{n}` = sản phẩm thứ n trong `GET /api/products` (seed: 1 iPhone 15 Pro Max, 2 Galaxy S24 Ultra, 3 MacBook Pro M3, 4 AirPods Pro 2, 5 Keychron Q1); `T` = tổng đúng = Σ giá × số lượng tính từ giá lấy runtime; `{acct}` = user mới tạo qua API. **ĐT:** **S** trích trực tiếp spec · **D** suy ra hợp lý · **A** giả định.

## 2. Nhóm A — Luồng thanh toán (dữ liệu `data/fr08-checkout.csv`)
| ID | Loại | Tiêu đề | Bước | Dữ liệu | Kết quả mong đợi | Spec | ĐT |
|---|---|---|---|---|---|---|---|
| FR08-A01 | positive | Verify checkout succeeds for a logged-in user with one product | Đăng nhập (token) → Home: thêm P1 → Giỏ hàng → Tiến hành thanh toán → Xác Nhận Thanh Toán | `{acct}`, P1×1 | Thấy "Thanh toán thành công!"; `my-orders` có đúng 1 đơn của user, `total_amount = T`, `status = pending` | "Chỉ người dùng đã đăng nhập… thanh toán được"; tổng tính từ giỏ | S/D |
| FR08-A02 | positive | Verify checkout total equals the sum of two different products | Thêm P1 và P4 → checkout | P1×1, P4×1 | Đơn lưu `T = giá P1 + giá P4` | Tổng tính tự động từ giỏ | S |
| FR08-A03 | positive/edge | Verify checkout total is correct when the same product is added twice | Bấm "Thêm vào giỏ" của P2 hai lần → checkout | P2×2 (2 lần bấm) | Đơn lưu `T = 2 × giá P2` | Tổng tính từ giỏ | S |
| FR08-A04 | positive/edge | Verify checkout total uses the quantity chosen on the product detail page | Trang chi tiết P3, số lượng 3, bấm "Thêm vào giỏ hàng" 2 lần (lần đầu không tác dụng) → checkout | P3×3 qua trang chi tiết | Đơn lưu `T = 3 × giá P3` | Tổng tính từ giỏ | S |
| FR08-A05 | negative | Verify a guest cannot proceed to checkout from the cart | Không đăng nhập: thêm P1 → Giỏ hàng → Tiến hành thanh toán | guest, P1×1 | Dialog "Bạn cần đăng nhập để thanh toán!"; URL `/login`; số đơn trong DB không đổi | "Chỉ người dùng đã đăng nhập" | S |
| FR08-A06 | negative | Verify a guest cannot create an order by submitting `/checkout` directly | Không đăng nhập: mở `/checkout` → Xác Nhận Thanh Toán | guest | Không có đơn mới (số đơn không đổi); người dùng thấy lỗi (alert), không thấy "Thanh toán thành công!" | "Chỉ người dùng đã đăng nhập" | S |
| FR08-A07 | negative/security | Verify backend ignores a client total lower than the real total | Giỏ P1×1; sửa ô tổng thành 1 (nếu sửa được) → checkout | tampered 1 | Đơn lưu `T` (không phải 1) | "Backend phải tự tính lại tổng tiền; không chấp nhận `total_amount` do client gửi" | S |
| FR08-A08 | negative/security | Verify backend ignores a client total of zero | như A07 | tampered 0 | Đơn lưu `T` | như A07 | S |
| FR08-A09 | negative/security | Verify backend ignores a negative client total | như A07 | tampered −1000 | Đơn lưu `T` | như A07 | S |
| FR08-A10 | negative/security | Verify backend ignores a client total higher than the real total | như A07 | tampered 10 × T | Đơn lưu `T` | như A07 | S |

## 3. Nhóm B — Cấu trúc / hậu quả (dữ liệu `data/fr08-checkout-checks.json`)
| ID | Loại | Tiêu đề | Bước | Kết quả mong đợi | Spec | ĐT |
|---|---|---|---|---|---|---|
| FR08-B01 | thuộc tính | Verify the total input on the checkout page is not user-editable | Đến `/checkout` với P1×1; đọc `readonly`/`disabled` | Ô tổng tiền `readonly` hoặc `disabled` (`isEditable() = false`) | "không cho phép người dùng chỉnh sửa trực tiếp" | S |
| FR08-B02 | UI | Verify the checkout page lists every ordered product with name, quantity and line amount | Thêm P1, P3, P5 (mỗi cái 1) → checkout | Đúng 3 dòng `li`; mỗi dòng chứa tên, `x 1`, thành tiền đúng | "hiển thị đầy đủ danh sách sản phẩm đặt mua" | S |
| FR08-B03 | UI/state | Verify the displayed total, the request total and the stored total agree | P1×1, P4×1 → checkout; đọc input, dòng "Tổng thanh toán", `request.postDataJSON().total_amount`, đơn lưu | Cả 4 giá trị bằng `T` | "Tổng tiền… tính tự động từ giỏ hàng" | D |
| FR08-B04 | state | Verify the cart is empty after a successful checkout | Checkout thành công → bấm link "Giỏ hàng" (không `goto`) | Giỏ trống: thấy "Giỏ hàng của bạn đang trống", không có dòng sản phẩm | "Sau thanh toán thành công, giỏ hàng được xóa" | S |
| FR08-B05 | security/API | Verify the checkout API rejects a request without a token | `POST /api/checkout` không `Authorization` | HTTP 401/403; không có đơn mới | "Chỉ người dùng đã đăng nhập" | S |

Tổng: **15 TC** (A01–A10, B01–B05). Phân loại: positive 4 · negative 6 (gồm 4 security) · edge 2 (A03, A04 vừa positive vừa edge) · cấu trúc/state/API 5.

## 4. Đối chiếu kỳ vọng với spec (soát "kỳ vọng bịa")
| Mục | Nhận xét | Quyết định đề xuất |
|---|---|---|
| A01 `status = pending` | Spec FR-08 không nêu; "pending" là trạng thái đầu của FR-10 (State Machine) — hơi ngoài FR-08 | Chỉ ghi nhận, **không dùng làm tiêu chí Fail**; assertion chỉ cho `total_amount` và đơn thuộc về user |
| A06 hành vi UI | Spec chỉ nói "chỉ đã đăng nhập mới thanh toán được"; UI có thể hiện `alert` lỗi. Kỳ vọng chỉ là *không tạo đơn* + *không hiện thành công* | Giữ (S về hậu quả); thông báo cụ thể là spec gap |
| A07–A10 | 4 giá trị tampered cùng kiểm một yêu cầu (backend tự tính lại): là EP với 4 lớp *total sai* (thấp, 0, âm, cao). Nếu SUT sửa ô thành không sửa được, fill bị bỏ qua và test vẫn đúng | Giữ; dự kiến cùng một gốc lỗi → gom 1 bug |
| A04 qua trang chi tiết | Cần 2 lần bấm (quy tắc ẩn của UI, F8); số lượng nhập là dữ liệu hợp lệ | Giữ |
| B03 | Gộp 4 nguồn giá trị; nếu một bên sai (ví dụ đơn lưu giá client) test Fail đúng chỗ | Giữ |
| B04 | Dùng click link vì `goto` làm trống giỏ (F1) | Giữ |
| Không tạo TC | Giỏ trống khi thanh toán · địa chỉ giao hàng trên web (web không có ô, request không gửi) · giới hạn/số lượng 0, âm, thập phân · coupon (FR-09) · nhãn/dialog xóa của giỏ (FR-07) · `status` đơn (FR-10) | Spec gap/ngoài phạm vi, theo quyết định của sinh viên |

## 5. Dự đoán kết quả khi chạy (giả thuyết từ P1, **không** dùng để viết kỳ vọng)
Dự kiến **Fail**: A07–A10 (H2: backend lưu tổng của client), B01 (H1: ô sửa được), B04 (H3: giỏ không bị xóa), có thể B03 nếu tampered. Dự kiến **Pass**: A01–A06, B02, B05 (A06 qua API 401 và `alert`). Bug gốc dự kiến: 3 (H1, H2, H3).

## 6. Quyết định của sinh viên (14/11/2026)
1. Phạm vi: **loại FR-09 (coupon) và FR-07** khỏi FR-08 — đồng ý.
2. Spec im lặng (giỏ trống, địa chỉ trên web, giới hạn số lượng): ghi **spec gap**, không tạo TC — đồng ý.
