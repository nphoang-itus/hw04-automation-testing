# FR-08 / P7 — Lần chạy đầu của bản nháp AI (Chromium, chưa sửa script)

Commit chạy: `6efb6b9`. Lệnh: `npx playwright test tests/fr08-checkout.spec.ts tests/fr08-checks.spec.ts --project=chromium`. Kết quả thật: **15 test: 9 pass, 6 fail** (13,5 s). Log: `docs/evidence/fr08-draft-chromium-run1.txt`. Chỉ Chromium. Nhận định "bug" dựa trên spec và quan sát thực; chưa phải bug report chính thức.

## 1. Phân loại 6 test Fail
| Test | Quan sát | Kết luận | Căn cứ spec | Bằng chứng ngoài test |
|---|---|---|---|---|
| FR08-A07 | tampered 1 → đơn lưu `total_amount = 1` (kỳ vọng 30 000 000) | **Bug SUT** (BUG-A) | "Backend phải tự tính lại tổng tiền; không chấp nhận `total_amount` do client gửi" | probe API: `POST /api/checkout {items:[iPhone 30 000 000], total_amount:1}` → 200, `my-orders` có `total_amount = 1` |
| FR08-A08 | tampered 0 → lưu 0 | Bug SUT (cùng gốc BUG-A) | như trên | như trên |
| FR08-A09 | tampered −1000 → lưu −1000 | Bug SUT (BUG-A) | như trên | như trên |
| FR08-A10 | tampered 10×T → lưu 300 000 000 | Bug SUT (BUG-A) | như trên | như trên |
| FR08-B01 | `not.toBeEditable()` fail: ô tổng tiền sửa được | **Bug SUT** (BUG-B) | "không cho phép người dùng chỉnh sửa trực tiếp" | smoke P4: `isEditable() = true`; `Checkout.jsx` có `onChange` trên `type="number"` |
| FR08-B04 | giỏ không trống sau thanh toán (không thấy "Giỏ hàng của bạn đang trống") | **Bug SUT** (BUG-C) | "Sau thanh toán thành công, giỏ hàng được xóa" | smoke P4: giỏ vẫn 2 dòng; `clearCart` không được gọi |
**Lỗi script gây Fail: 0.** Bug gốc phân biệt: **3** (backend tin tổng của client; ô tổng sửa được; giỏ không bị xóa).
Thêm phát hiện khi probe: `POST /api/checkout` với body rỗng `{}` vẫn trả 200 và tạo đơn với `total_amount = null` (cùng gốc BUG-A: không kiểm tra/không tính lại tổng).

## 2. Test Pass: có đúng lý do không?
| Test | Đánh giá |
|---|---|
| A01–A04 | Pass đúng spec: đơn lưu `T` đúng cho 1 sản phẩm, 2 sản phẩm, cùng sản phẩm 2 lần, số lượng 3 qua trang chi tiết (khi **không** sửa tổng) |
| A05 | Pass đúng: dialog "Bạn cần đăng nhập để thanh toán!" + `/login` + không có đơn mồ côi |
| A06 | Pass nhưng assertion yếu: chỉ kiểm status ≥ 400 và không hiện thành công; không kiểm nội dung lỗi (spec gap) |
| B02 | Pass: số dòng, tên, `x qty`, thành tiền đúng |
| B03 | Pass, nhưng chỉ chứng minh 4 giá trị khớp khi **không** sửa tổng; không phân biệt được "backend tính lại" |
| B05 | Pass: API không token → 401, không có đơn không chủ |

## 3. Điểm yếu của script (chưa gây Fail, xử lý ở P6)
1. **Thiếu test cấp API** cho "backend tự tính lại": A07–A10 sửa tổng qua UI; nếu SUT sửa ô thành read-only thì `setTotal` âm thầm bỏ qua và A07–A10 vẫn có thể pass mà không kiểm backend. Cần B06: gọi API trực tiếp với `items` + `total_amount` sai.
2. `setTotal` trả `false` khi không sửa được nhưng spec **bỏ qua giá trị trả về** → test "tampered" có thể không tampered (nên assert kết quả của `setTotal` hoặc tách luồng UI/API).
3. A06 chỉ kiểm mã ≥ 400; B03 không có biến thể tampered; A01 gộp nhiều assertion (đơn thuộc user, tổng, tiêu đề).
4. Chưa có TC về `total_amount` thiếu/rỗng (body `{}` tạo đơn NULL) — spec có "không chấp nhận total_amount do client gửi", nhưng body thiếu `items` là spec gap về định dạng request; cân nhắc 1 TC (độ tin cậy A).
5. Đơn không xóa được qua API: mỗi lần chạy để lại đơn (SUT reseed khi restart).
6. Mới chạy Chromium.

## 4. Thống kê tạm (Chromium, bản nháp)
| Chỉ số | Giá trị |
|---|---|
| Test tự động hóa | 15 |
| Thực thi / Pass / Fail | 15 / 9 / 6 |
| Bug SUT (gốc phân biệt) | 3 (A07–A10 → BUG-A; B01 → BUG-B; B04 → BUG-C) |
| Lỗi script gây Fail | 0 |
| Browser-run hoàn tất | 0 / 3 |
