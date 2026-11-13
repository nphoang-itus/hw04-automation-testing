# FR-02 / P7 — Lần chạy đầu của bản nháp AI (Chromium, chưa sửa script)

Commit chạy: `68dd2e5`. Lệnh: `npx playwright test tests/fr02-*.spec.ts --project=chromium`. Kết quả thật: **18 test: 11 pass, 7 fail** (44,3 s). Log: `docs/evidence/fr02-draft-chromium-run1.txt`. Chỉ Chromium; Firefox/WebKit chưa chạy. Mọi nhận định "bug" dưới đây dựa trên spec và quan sát thực; đây chưa phải bug report chính thức.

## 1. Phân loại 7 test Fail
| Test | Quan sát | Kết luận | Căn cứ spec | Bằng chứng ngoài test |
|---|---|---|---|---|
| FR02-B01 | `type` ô email = `text` | **Bug SUT** | FR-02/FR-22 `type="email"` | locator `form input` đúng (smoke + A01 pass) |
| FR02-B02 | `type` ô mật khẩu = `text` | **Bug SUT** | FR-22 `type="password"` | như trên |
| FR02-A08 | email thiếu `@` không bị trình duyệt chặn (`typeMismatch=false`) | **Bug SUT** (cùng gốc B01) | FR-02 `type="email"` | A06/A07 (required) pass → cơ chế `validity` đúng |
| FR02-B03 | 1 lần sai → `login_attempts = 2` | **Bug SUT** | "tăng đúng 1" | admin API |
| FR02-A03 | sau 2 lần sai, đăng nhập đúng vẫn ở `/login` | **Bug SUT** (hệ quả của bộ đếm +2: khóa ở lần sai thứ 2) | "khóa từ 3 lần" | probe: lần sai #3 trả 403 |
| FR02-B05 | phản hồi login chứa `user.password` = mật khẩu thô | **Bug SUT** | SEC-01 | `/api/users/me` cũng trả (smoke) |
| FR02-A12 | 403 liên tục suốt 35 s | **Bug SUT** (khóa 180 s thay vì 30 s) | "khóa 30 giây" | probe API: `locked_until` còn **180 s** ngay sau khi khóa |
**Lỗi script (bắt buộc sửa) quan sát được: không có test Fail nào do script.** Nhưng 11 test Pass chưa đồng nghĩa script tốt, xem mục 2.

## 2. Test Pass cần nghi ngờ (pass sai lý do / assertion yếu)
| Test | Vấn đề | Loại | Hành động ở P6/P7 |
|---|---|---|---|
| FR02-A10 | Do bộ đếm +2, tài khoản đã khóa từ lần sai thứ **2**; test "đúng 3 lần" vẫn pass nhưng **không chứng minh** ngưỡng đúng là 3 | Test không phân biệt được biên | Thêm kiểm `locked_until` hoặc kiểm tra ở lần sai thứ 2 (A03 đã bắt được) — ghi nhận là BVA yếu do lỗi chung |
| FR02-A11 | Cùng lý do; thêm: không kiểm bộ đếm không bị reset | BVA yếu | Thêm assertion trạng thái (`locked_until` không rỗng) |
| FR02-B04 | So sánh text UI: UI chỉ có **một chuỗi lỗi cố định** (`Login.jsx`), nên test **luôn pass**; không bắt được việc API trả 403 khác 401 (HW02: BUG-FR02-11) | Assertion yếu (AI sai) | Bổ sung so sánh `status`/`body.error` của API `loginApi` giữa "sai mật khẩu" và "đang khóa"; cần sinh viên xác nhận diễn giải (đã đồng ý UI; mở rộng API là đề xuất mới) |
| FR02-A05 | Chỉ kiểm text UI; API trả cùng 401 cho email lạ và sai mật khẩu nên đúng, nhưng 403 khi khóa mới lộ | Có thể bổ sung | Tùy |
| FR02-A09 | Kỳ vọng "không 5xx/không bypass" — chưa có mã HTTP khác ngoài `<500` | Chấp nhận | — |
| FR02-A01/A02/A04/A06/A07/B06 | Pass đúng như spec | OK | — |

## 3. Rủi ro script (chưa gây Fail, cần xử lý)
1. `tests/_smoke.spec.ts` (untracked) vẫn nằm trong `testDir`.
2. A12 chạy ~35 s và dùng `toPass` thử đăng nhập mỗi giây: khi tài khoản đang khóa, các lần thử này đều 403 và **không** làm tăng bộ đếm (theo code), nhưng nếu SUT được sửa để tăng bộ đếm khi đang khóa thì polling có thể gia hạn khóa → cần thay bằng poll `locked_until` qua admin API rồi đăng nhập một lần.
3. `blocked_client`: chọn ô kiểm tra bằng `email_kind === 'valid'` — mong manh; nên đưa `field` vào CSV.
4. Chỉ mới có Chromium: `validity` và thứ tự input chưa kiểm trên Firefox/WebKit.

## 4. Thống kê tạm (Chromium, bản nháp)
| Chỉ số | Giá trị |
|---|---|
| Test tự động hóa | 18 |
| Thực thi / Pass / Fail | 18 / 11 / 7 |
| Bug SUT (gốc phân biệt) | 5: bộ đếm +2 (B03, A03); khóa 180 s (A12); email `type=text` (B01, A08); mật khẩu `type=text` (B02); lộ mật khẩu (B05) |
| Lỗi script gây Fail | 0 |
| Browser-run hoàn tất | 0 / 3 (mới chạy thử Chromium, chưa tạo report chính thức) |
