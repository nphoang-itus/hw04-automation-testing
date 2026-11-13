# Plan — Task 1 / Feature A: FR-02 Đăng nhập & khóa tài khoản

Kỹ thuật áp dụng: xem `docs/techniques-from-slides.md` (ký hiệu [AR], [S12], [TC]).
Mục tiêu đề (§6 Task 1): ≥ 12 TC tự động hóa, dữ liệu ở CSV/JSON, ≥ 3 kiểu assertion, chạy 3 browser (3 HTML report "Run by: 23120264"), review & sửa lỗi AI, bug report + GitHub Issue + ảnh.

## 1. Đặc tả cần kiểm (trích nguyên văn README SUT, FR-02)
1. Nhập Email + Mật khẩu.
2. Mỗi lần đăng nhập sai tăng bộ đếm **đúng 1**.
3. Sai **từ 3 lần liên tiếp** → khóa **30 giây**; thông báo lỗi phù hợp, **không lộ chi tiết nguyên nhân**.
4. Thành công trả JWT; client lưu và gửi `Authorization: Bearer <token>`.
5. Trường email phải `type="email"` (HTML5 validate).

## 2. Hiểu SUT trước khi viết (bài học [S12 tr.19]: thiếu hiểu biết SUT → automation hỏng)
- UI: `http://localhost:5173/login` (`frontend-web/src/pages/Login.jsx`). Không có `data-testid`; hai ô nhập chỉ có `<label>` không gắn `for` → `getByLabel` **không dùng được**, phải dùng locator thay thế (`form input` theo thứ tự / `getByRole('textbox')`) và ghi chú. Nút: `getByRole('button',{name:'Sign In'})`. Lỗi hiển thị trong `div.bg-red-100`. Token lưu `localStorage['token']`.
- API: `POST /api/login` (401 sai thông tin, 403 đang khóa). Oracle trạng thái: `GET /api/admin/users` (JWT admin) trả `login_attempts`, `locked_until`; dọn dẹp: `DELETE /api/admin/users/:id`; tạo tài khoản: `POST /api/register`.
- **Giả thuyết đọc từ code (chưa phải bug, phải được test xác nhận):** H1 bộ đếm `+2` thay vì `+1`; H2 khóa 180 s thay vì 30 s; H3 ô email `type="text"`; H4 ô mật khẩu `type="text"`; H5 phản hồi login trả cả `password`; H6 thông báo khóa (403) khác thông báo sai (401) → lộ trạng thái; H7 tiêu đề trang ghi "Đăng Ký". HW02 đã tái hiện phần lớn (BUG-FR02-01…12) → HW04 dùng chúng làm **regression suite**, nhưng kỳ vọng vẫn lấy từ **spec**, không từ hành vi hiện tại.

## 3. Quyết định thiết kế
| Vấn đề | Quyết định | Căn cứ |
|---|---|---|
| Test dùng chung state (bộ đếm khóa) | **Mỗi test tự tạo tài khoản riêng** qua API (`23120264_pw_<browser>_<id>@hcmus.edu.vn`) và **xóa ở teardown** | Self-standing, self-cleaning [TC tr.12]; chống flaky do thứ tự [AR tr.15] |
| Chạy song song 3 browser | Email chứa tên project + id test → không đụng nhau | Repeatable |
| Cấu trúc | `pages/LoginPage.ts` (POM), `utils/api.ts` (tạo/xóa user, đọc `login_attempts`), spec đọc `data/fr02-*.csv|json` | POM + DRY, data-driven [AR tr.13–14] |
| Chờ hết khóa | `expect.poll` / `expect(...).toPass({timeout})` quanh lần đăng nhập, **không `waitForTimeout`**; test mở khóa gắn `test.slow()` | Không sleep cố định [AR tr.29,34] |
| Test cần mắt người (vị trí thông báo lỗi, dấu `*` bắt buộc, màu nút) | **Không automate**, ghi lý do | [S12 tr.13], [AR tr.4] |
| API vs UI | UI cho hành vi người dùng; API chỉ để arrange/oracle | Kim tự tháp [AR tr.7] |

## 4. Danh sách test case tự động hóa (20 TC sau P6, ≥ 12) — chi tiết ở `docs/fr02-p2-testcases.md`; đã bỏ A13, A14, B07 theo quyết định 14/11
Mỗi TC có ID, gắn dòng đặc tả (Traceable), kỳ vọng **theo spec**. Nguồn = ID tương ứng trong HW02 (dùng lại phân tích EP/BVA của chính sinh viên).

**Nhóm A — luồng đăng nhập (`data/fr02-login-lockout.csv`, một runner, nhiều dòng)**
Cột: `id,type,title,wrong_attempts,email,password,expected_outcome,expected_text,spec_ref,hw02_ref`

| ID | Loại | Mô tả | Kỳ vọng (spec) |
|---|---|---|---|
| FR02-A01 | positive | Đăng nhập hợp lệ | chuyển `/`, có token |
| FR02-A02 | positive | 1 lần sai rồi đúng | đăng nhập được, bộ đếm về 0 |
| FR02-A03 | positive/BVA | 2 lần sai (dưới ngưỡng) rồi đúng | **chưa khóa**, đăng nhập được (H1 → dự kiến Fail) |
| FR02-A04 | negative | Sai mật khẩu | ở `/login`, có thông báo lỗi, không token |
| FR02-A05 | negative | Email chưa đăng ký | cùng thông báo chung, không token |
| FR02-A06 | negative | Email rỗng | trình duyệt chặn submit, không gọi API |
| FR02-A07 | negative | Mật khẩu rỗng | trình duyệt chặn submit |
| FR02-A08 | negative | Email thiếu `@` | trình duyệt chặn (`type=email`; H3 → dự kiến Fail) |
| FR02-A09 | negative/security | Email dạng `' OR '1'='1` | từ chối, không 5xx, không token |
| FR02-A10 | BVA | 3 lần sai → lần 4 đúng mật khẩu | bị từ chối (đang khóa) |
| FR02-A11 | BVA | 4 lần sai (trên ngưỡng) | vẫn khóa, không mở |
| FR02-A12 | edge | Khóa rồi đợi hết 30 s → đúng mật khẩu | đăng nhập được (H2 → dự kiến Fail) |
| FR02-A13 | edge | Email 10.000 ký tự | 4xx nhanh, không treo/5xx |
| FR02-A14 | edge | Mật khẩu 10.000 ký tự | như trên |

**Nhóm B — kiểm tra cấu trúc / hậu quả (`data/fr02-checks.json`)**
| ID | Loại | Mô tả | Kỳ vọng (spec) |
|---|---|---|---|
| FR02-B01 | assertion thuộc tính | Ô email có `type="email"` | đúng (H3) |
| FR02-B02 | assertion thuộc tính | Ô mật khẩu `type="password"` | đúng (H4) |
| FR02-B03 | state/oracle | 1 lần sai → `login_attempts` | **đúng 1** (H1) |
| FR02-B04 | message | Thông báo khi bị khóa so với khi sai | **giống nhau**, không lộ nguyên nhân (H6) |
| FR02-B05 | security | Phản hồi login không chứa `password` | không có (H5) |
| FR02-B06 | token | Token của UI dùng được cho `GET /api/users/me` với `Bearer` | 200 |
| FR02-B07 | UI | `<h1>`/tiêu đề trang là về đăng nhập | không phải "Đăng Ký" (H7) |

**Không automate (nêu trong báo cáo):** vị trí thông báo lỗi nằm trên/dưới nút (BUG-FR02-06), ký hiệu `*` trường bắt buộc (BUG-FR02-07), màu nút (FR-21), thứ tự Tab — cần phán đoán hiển thị; sẽ để kiểm tay/visual.

**Assertion patterns (đề: ≥ 3 loại):** URL (`toHaveURL`), text (`toContainText`), hiển thị (`toBeVisible/toBeHidden`), thuộc tính (`toHaveAttribute`), lưu trữ (`localStorage` token), response/state (API `status`, `login_attempts`, body không chứa `password`).

## 5. Quy trình AI-first từng bước (đề §2: không dùng 1 prompt chung)
Mẫu prompt ROLE/CONTEXT/TASK/FORMAT/CONSTRAINTS [TC tr.21]; luôn dán **spec thật** và code `Login.jsx`; mỗi bước dừng để người review.
| Bước | Việc | Prompt chính | Review của người (kiểm 4 kiểu AI sai) |
|---|---|---|---|
| P1 | Phân tích spec + UI thật (exploratory), liệt kê rủi ro | "Đọc FR-02 và Login.jsx, liệt kê locator khả dụng, trạng thái ẩn, rủi ro flaky" | AI có bịa field/UI không |
| P2 | Danh sách TC dạng bảng | ROLE/CONTEXT/TASK/FORMAT, ≥ 12 TC, positive/negative/edge | đối chiếu expected với spec; xóa TC trùng |
| P3 | File dữ liệu CSV/JSON | "tách dữ liệu, không hardcode" | cột đủ, không lẫn kỳ vọng của hành vi hiện tại |
| P4 | POM + fixture tạo/xóa tài khoản | "LoginPage, api util, teardown" | locator có bám DOM thật; có self-cleaning |
| P5 | Spec Playwright data-driven + assertion đa dạng | "một runner đọc CSV; web-first assertion; không sleep" | **commit nguyên bản AI trước khi sửa** |
| P6 | Iterate: "thiếu input/biên nào?" | thêm TC thiếu | AI có bỏ sót biên/spec gap |
| P7 | Chạy 3 browser, phân loại fail (bug thật / script sai / flaky) | gửi log + trace | **người quyết định**; bug thật → Issue |
Mọi prompt/output được `scripts/ailog.py` ghi vào `docs/ai/prompt-log.md`; mỗi bước thêm một dòng ở `docs/ai-audit-report.md`.

## 6. Lịch commit (≥ 8, mỗi commit chạm file test — chiến lược nộp bài)
1. `test(FR02): add LoginPage POM and api helpers`
2. `test(FR02): add CSV/JSON test data`
3. `test(FR02): AI-generated draft spec (unreviewed)` ← bản nguyên văn của AI
4. `test(FR02): fix fragile locators (labels not bound)`
5. `test(FR02): replace fixed waits with web-first assertions / polling`
6. `test(FR02): add missing edge cases found in review`
7. `test(FR02): make accounts isolated per test and browser`
8. `test(FR02): final run config, HTML reports for 3 browsers`
(+ `docs:` commit cho bug report, không tính vào 8.)

## 7. Tiêu chí hoàn thành FR-02
- [ ] 20 TC trong `tests/fr02-login-lockout.spec.ts` (+ `fr02-checks.spec.ts`), data ở `data/`
- [ ] 3 report: `reports/chromium|firefox|webkit/index.html` hiển thị `Run by: 23120264` + ISO timestamp → 60 lượt chạy test, 3 browser-run
- [ ] Bảng "AI sai/thiếu gì và vì sao" (ít nhất locator, assertion yếu, edge thiếu, flaky) trong `docs/report.md` §4
- [ ] Bug thật (dự kiến H1–H7) → `docs/bug-report.md` + GitHub Issue kèm ảnh
- [ ] Danh sách TC không automate + lý do
- [ ] Cập nhật README (số TC/pass/fail/bug)

## 8. Rủi ro / việc cần bạn quyết
1. **Thời gian chạy:** FR02-A12 chờ ≥ 30 s (nếu bug 180 s thì lần đăng nhập đầu tiên sau 30 s đã fail nên không cần chờ 180 s) × 3 browser → chấp nhận được.
2. **Admin credentials** dùng cho oracle/cleanup (`admin@eshop.com` / `Admin123!` trong `.env`).
3. **Dữ liệu SUT bị reset mỗi lần backend khởi động** → không ảnh hưởng vì test tự tạo tài khoản.
4. **Spec im lặng:** phân biệt hoa/thường email, khoảng trắng đầu/cuối → ghi `spec gap`, **không** chấm Fail (đã nêu ở HW02 G2).
