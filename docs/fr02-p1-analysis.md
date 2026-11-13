# FR-02 / P1 — Locator, trạng thái ẩn, rủi ro flaky

Nguồn: `frontend-web/src/pages/Login.jsx`, `context/AuthContext.jsx`, `App.jsx`, `backend/server.js` (`/api/login`, `/api/register`, `/api/users/me`, `/api/admin/users`). Mọi mục là **đọc từ code**; locator chưa được chạy thử trên DOM thật (xác nhận ở P4/P5).

## 1. Locator khả dụng (`/login`)
| Phần tử | Locator đề xuất | Ghi chú |
|---|---|---|
| Ô email | `page.locator('form input').nth(0)` (hoặc `getByRole('textbox').first()`) | `getByLabel('Username')` **không dùng được**: `<label>` không có `for`/không bọc input. Không có `name`, `id`, `data-testid`. `type="text"` nên không có role `email` |
| Ô mật khẩu | `page.locator('form input').nth(1)` | `type="text"` → role `textbox`, không phải `password` |
| Nút gửi | `getByRole('button', { name: 'Sign In' })` | Nhãn tiếng Anh; nếu SUT sửa thành tiếng Việt thì vỡ → đặt trong POM |
| Thông báo lỗi | `locator('div.bg-red-100')` | Chỉ có class Tailwind, không `role="alert"`. Chỉ một chuỗi chung: "Đăng nhập thất bại. Vui lòng kiểm tra lại." — UI **không phân biệt 401/403** |
| Link quên mật khẩu / đăng ký | `getByRole('link', { name: 'Quên mật khẩu?' })`, `{ name: 'Đăng ký ngay' }` | Không cần cho FR-02 |
| Dấu hiệu đã đăng nhập | `getByRole('button', { name: 'Thoát' })` (navbar) và text `Chào, <tên>` | Navbar chỉ hiện sau khi `GET /api/users/me` hoặc login set `user` |
| Dấu hiệu chưa đăng nhập | `getByRole('link', { name: 'Đăng nhập' })` | Có cả trong navbar lẫn có thể trùng tên: dùng `exact: true` |
| Token | `page.evaluate(() => localStorage.getItem('token'))` | Key `token` |
| Tiêu đề trang | `getByRole('heading')` | Hiện là `<h2>` "Đăng Ký" (không có `<h1>`) |
| Thuộc tính cần kiểm | `toHaveAttribute('type', 'email' \| 'password')` | Cả hai đang `text` (H3, H4) |

## 2. Trạng thái ẩn (không nhìn thấy trên UI)
| Biến | Nơi lưu | Cách quan sát (oracle) |
|---|---|---|
| `login_attempts` | bảng `users` | `GET /api/admin/users` (JWT admin) |
| `locked_until` (ISO) | bảng `users` | như trên; mốc khóa = `now + 180000ms` khi `attempts >= 3` |
| JWT | `localStorage['token']` + header `axios.defaults` | `GET /api/users/me` với Bearer |
| `user` trong context | React state | hiển thị `Chào, …`; phản hồi login/`me` trả cả `password` thô |
| Mã HTTP phân biệt | 401 (sai / không tồn tại), 403 (đang khóa) | chỉ thấy qua Network/API, UI gộp chung thông báo |
Quan hệ cần nhớ: tài khoản khóa chỉ kiểm khi **email tồn tại**; email không tồn tại luôn 401 → so sánh 401 và 403 có thể lộ sự tồn tại tài khoản (H6). Bộ đếm **không reset khi hết khóa** (chỉ reset khi đăng nhập đúng).

## 3. Rủi ro flaky / thiết kế test
| # | Rủi ro | Loại [AR tr.15] | Đối sách |
|---|---|---|---|
| F1 | Bộ đếm/khóa là state dùng chung theo tài khoản | Ordering | Mỗi test tạo tài khoản riêng (`POST /api/register` → trả `id`), xóa ở teardown bằng `DELETE /api/admin/users/:id` |
| F2 | Chạy 3 browser song song cùng email | Environment | Email chứa tên project + id test + timestamp |
| F3 | Chờ hết khóa 30 s (180 s theo code) | Timing | `expect(...).toPass({ timeout })`/`expect.poll`, `test.slow()`, không `waitForTimeout` |
| F4 | Nhiều lần submit liên tiếp: UI `await` axios, URL đổi bất đồng bộ | Timing | Sau mỗi submit chờ thông báo lỗi hiện hoặc `toHaveURL`, không đếm thời gian |
| F5 | `GET /api/users/me` sau khi lưu token có thể `logout()` nếu lỗi | Timing | Assert `Chào,`/nút Thoát bằng web-first assertion |
| F6 | `type="text"` nên trình duyệt **không** chặn email sai định dạng; mật khẩu hiển thị rõ | Hành vi SUT ≠ spec | Đây là bug (H3/H4), không phải flaky: assert thuộc tính, và test A08 dự kiến Fail |
| F7 | `form required` chặn submit: Chromium/Firefox/WebKit hiển thị bubble khác nhau | Cross-browser | Kiểm bằng `locator.evaluate(el => el.validity.valueMissing)`, không đọc text bubble |
| F8 | `register` dùng `INSERT`: email trùng không lỗi (HW02) | Dữ liệu | Email luôn duy nhất theo test |
| F9 | Reset DB mỗi lần restart backend | Environment | Test không phụ thuộc dữ liệu seed, chỉ dùng admin để oracle/dọn |
| F10 | Server dùng `Date.now()` phía backend, test không điều khiển được thời gian | Timing | Không dùng `page.clock`; đo bằng `locked_until` thật từ admin API |
| F11 | Mật khẩu/tài khoản test là dữ liệu cục bộ | — | Không đưa mật khẩu thật vào prompt/log |

## 4. Điều AI-draft dễ sai ở bước này (để đối chiếu ở B7/§4 báo cáo)
- Dùng `getByLabel('Email'|'Mật khẩu')`, `getByRole('alert')`, `input[type=email]`/`[type=password]`, `getByTestId` → đều **không tồn tại** trong DOM hiện tại (invented UI).
- Tin rằng thông báo khóa hiển thị riêng → UI chỉ có một chuỗi lỗi.
- Kỳ vọng "khóa 30 s" cho phép đợi 30 s thật → thực tế 180 s; kỳ vọng phải theo **spec**, kết quả Fail là bug.
