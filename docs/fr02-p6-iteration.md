# FR-02 / P6 — Iterate: "AI còn thiếu input / biên nào?" và sửa bản nháp

Bản nháp gốc: commit `68dd2e5`. Mỗi sửa là một commit riêng (diff dùng cho B7 / báo cáo §4). Kết quả chạy Chromium: trước sửa `docs/evidence/fr02-draft-chromium-run1.txt` (11/18 pass), sau sửa `docs/evidence/fr02-fixed-chromium-run2.txt` (**11/20 pass, 9 fail**). Chỉ Chromium.

## 1. Những gì AI thiếu / sai (và đã sửa)
| # | Vấn đề trong bản nháp | Loại [TC tr.22] | Vì sao AI bỏ sót | Sửa (commit) |
|---|---|---|---|---|
| 1 | `blocked_client` suy trường cần kiểm từ `email_kind === 'valid'`, kỳ vọng validity suy từ `malformed` → logic kỳ vọng nằm trong code chứ không ở CSV, dễ sai khi thêm dòng mới | Thiết kế dữ liệu kém (hardcode logic) | Prompt P5 yêu cầu data-driven nhưng không nói "mọi tham số kỳ vọng phải ở CSV"; AI tối ưu cho ít cột | `test(FR02): read blocked field and expected validity from CSV…` |
| 2 | A12 thử đăng nhập mỗi giây khi đang khóa (polling lặp) → có thể gia hạn khóa nếu SUT đổi; cách chờ khó lý giải | Flaky timing [AR tr.15] | AI chọn `toPass` quen thuộc; không mô hình hóa hành vi "đăng nhập khi đang khóa" của SUT | `test(FR02): wait on elapsed time since lock and log in once…` (poll thời gian trôi qua, rồi đúng **một** lần đăng nhập) |
| 3 | A10/A11 chỉ kiểm "đăng nhập đúng bị từ chối": với lỗi bộ đếm, test vẫn pass dù khóa sai ngưỡng → không phân biệt được biên 3 | Assertion yếu, thiếu oracle trạng thái | Prompt tập trung kết quả nhìn thấy trên UI; không buộc kiểm trạng thái ẩn (`locked_until`) dù P1 đã liệt kê | `test(FR02): assert lock state after wrong attempts…` (cột `locked_after_wrong`: A02/A03 = no; A10/A11/A12 = yes) |
| 4 | B04 chỉ so text UI; UI chỉ có **một** chuỗi lỗi nên luôn pass, bỏ lọt việc API lộ "đã khóa" | Plausible but vacuous test | AI đã ghi rủi ro này ở P5 nhưng vẫn viết (bám cách hiểu "UI" đã duyệt, không đề xuất mở rộng) | `test(FR02): compare API error message for locked vs wrong password…` |
| 5 | Thiếu ngữ nghĩa "**liên tiếp**" của spec (sai, sai, đúng, sai, sai không khóa) và "đăng nhập đúng reset bộ đếm" | Missing domain edge | Bước P2 chỉ dựa spec văn bản + biên số; HW02 EP-05 có case này nhưng không đưa vào prompt P2 (giới hạn context của AI) | `test(FR02): add consecutive-failure case A13 and counter-reset check B07…` |

## 2. Kết quả sau sửa (Chromium, 20 test)
| Test | Kết quả | Gốc lỗi |
|---|---|---|
| A01, A02, A04–A07, A09–A11, B06, B07 | Pass | — |
| A03 | Fail | Bộ đếm +2: đã khóa sau 2 lần sai (spec: từ lần 3) |
| A08, B01 | Fail | Ô email `type="text"` |
| B02 | Fail | Ô mật khẩu `type="text"` |
| B03 | Fail | 1 lần sai → `login_attempts = 2` |
| B04 | Fail | API khi khóa trả "Tài khoản đã bị khóa…" ≠ "Invalid email or password" (lộ trạng thái) |
| B05 | Fail | `user.password` trong phản hồi login |
| A12 | Fail | Sau 31 s vẫn bị khóa (khóa 180 s) |
| A13 | Fail | Khóa sau 2 lần sai nên chuỗi sai,sai,đúng,sai,sai kết thúc ở trạng thái khóa |
**Lỗi script gây Fail: 0.** Bug gốc phân biệt: **6** (bộ đếm +2 → A03, B03, A13; khóa 180 s → A12; email `type=text` → A08, B01; mật khẩu `type=text` → B02; lộ khóa qua API → B04; lộ mật khẩu → B05). B04 chuyển từ "pass rỗng" sang Fail nhờ sửa #4: cần sinh viên xác nhận diễn giải (spec "thông báo phù hợp" vs "không lộ nguyên nhân").

## 3. Chưa xong
- Chạy Firefox/WebKit và tạo 3 report HTML chính thức (`Run by: 23120264`).
- `tests/_smoke.spec.ts` (untracked) cần xóa trước khi chạy chính thức.
- Bug report + GitHub Issues + ảnh.
- Báo cáo §4 (bảng AI sai/thiếu) sẽ lấy từ mục 1 ở trên và diff `68dd2e5..HEAD`.
