# FR-02 / P2 — Danh sách test case (bản nháp AI, chờ sinh viên duyệt)

## 1. Prompt đã dùng (mẫu ROLE / CONTEXT / TASK / FORMAT / CONSTRAINTS — [TC tr.21])
- **ROLE:** senior QA automation engineer (Playwright), kỹ năng EP/BVA và kiểm thử trạng thái.
- **CONTEXT:** spec FR-02 (README SUT mục 2), FR-22 (type email/password), SEC-01, SEC-05; kết quả P1 `docs/fr02-p1-analysis.md` (locator, trạng thái ẩn); kế hoạch `docs/plan-FR02.md` (21 TC dự kiến).
- **TASK:** viết ≥ 12 TC tự động hóa được cho FR-02 gồm positive / negative / edge; kỳ vọng **chỉ theo spec**, không theo hành vi code hiện tại; mỗi TC chỉ kiểm một ý chính.
- **FORMAT:** bảng `ID | Loại | Tiêu đề | Bước | Dữ liệu | Kết quả mong đợi | Spec | Độ tin cậy kỳ vọng`.
- **CONSTRAINTS:** tiêu đề dạng *Action + Function + Condition*; test độc lập, tự tạo/xóa tài khoản; không dùng thông tin UI không có trong DOM; spec im lặng → ghi **Spec gap**, không bịa.

Quy ước dữ liệu: `{acct}` = tài khoản mới tạo qua API cho riêng test đó (`23120264_pw_<browser>_<id>@hcmus.edu.vn`); `{pw}` = mật khẩu đúng của `{acct}`; `{bad}` = `Wrong@1234`.
**Độ tin cậy kỳ vọng:** **S** = trích trực tiếp từ spec; **D** = suy ra hợp lý từ spec; **A** = giả định/chuẩn chung (spec im lặng) — chưa được coi là chuẩn chấm Fail cho đến khi sinh viên xác nhận.

## 2. Nhóm A — Luồng đăng nhập (dữ liệu `data/fr02-login-lockout.csv`)
| ID | Loại | Tiêu đề (Action + Function + Condition) | Bước | Dữ liệu | Kết quả mong đợi | Spec | ĐT |
|---|---|---|---|---|---|---|---|
| FR02-A01 | positive | Verify đăng nhập thành công với email và mật khẩu hợp lệ | Mở `/login` → nhập → Sign In | `{acct}`, `{pw}`; 0 lần sai | URL `/`; `localStorage.token` có giá trị; navbar có nút "Thoát"; không còn thông báo lỗi | "Đăng nhập thành công trả về JWT Token… lưu phía client" | S |
| FR02-A02 | positive | Verify đăng nhập thành công sau 1 lần sai (chưa đạt ngưỡng) | 1 lần sai (`{bad}`) → nhập đúng | 1 sai, rồi `{pw}` | Lần sai: ở `/login` + lỗi. Lần đúng: URL `/`, có token | "Sai **từ 3 lần** … mới khóa" | D |
| FR02-A03 | positive/BVA | Verify đăng nhập thành công sau 2 lần sai (ngay dưới ngưỡng 3) | 2 lần sai → nhập đúng | 2 sai, rồi `{pw}` | Không bị khóa: URL `/`, có token | "Sai từ **3** lần trở lên" ⇒ 2 lần chưa khóa | S |
| FR02-A04 | negative | Verify từ chối đăng nhập khi mật khẩu sai | Nhập `{acct}` + `{bad}` | `{acct}`, `{bad}` | Ở `/login`; lỗi hiển thị trong `div.bg-red-100`; không có token | "Hệ thống trả về thông báo lỗi" | S |
| FR02-A05 | negative | Verify từ chối đăng nhập khi email chưa đăng ký, thông báo giống trường hợp sai mật khẩu | Nhập email lạ + mật khẩu bất kỳ | `nobody_{ts}@hcmus.edu.vn`, `{bad}` | Ở `/login`; **cùng nội dung lỗi** như A04; không token | "không để lộ chi tiết nguyên nhân" | D |
| FR02-A06 | negative | Verify form chặn submit khi email rỗng | Để trống email, nhập mật khẩu, Sign In | ``, `{pw}` | Không gửi request `/api/login`; ô email `validity.valueMissing === true`; vẫn ở `/login` | "Trường email… validate HTML5"; ô `required` trong form | D |
| FR02-A07 | negative | Verify form chặn submit khi mật khẩu rỗng | Nhập email, để trống mật khẩu | `{acct}`, `` | Không gửi request; ô mật khẩu `valueMissing === true` | như trên | D |
| FR02-A08 | negative | Verify form chặn submit khi email sai định dạng (thiếu `@`) | Nhập email không có `@` + mật khẩu | `abc.hcmus.edu.vn`, `{pw}` | Không gửi request; ô email `validity.typeMismatch === true` | "Trường email phải dùng `type="email"`" (FR-02, FR-22) | S |
| FR02-A09 | negative/security | Verify email chứa chuỗi SQL không gây lỗi server hay đăng nhập trái phép | Nhập `' OR '1'='1` làm email | `' OR '1'='1`, `{bad}` | Từ chối: không token; response không phải 5xx | SEC-05 (parameterized query); kết quả quan sát: không bypass | D |
| FR02-A10 | BVA | Verify tài khoản bị khóa sau đúng 3 lần sai: mật khẩu đúng ở lần 4 vẫn bị từ chối | 3 lần sai → nhập đúng | 3 sai, rồi `{pw}` | Ở `/login`; lỗi; không token | "Sai từ 3 lần… tạm khóa 30 giây" | S |
| FR02-A11 | BVA | Verify sai thêm lần thứ 4 khi đang khóa vẫn giữ khóa (mật khẩu đúng sau đó vẫn bị từ chối) | 4 lần sai → nhập đúng | 4 sai, rồi `{pw}` | Ở `/login`; không token | "từ 3 lần trở lên" | D |
| FR02-A12 | edge/BVA | Verify hết khóa sau 30 giây: mật khẩu đúng đăng nhập được | 3 lần sai → đợi (poll) → nhập đúng | 3 sai; đợi 31 s; `{pw}` | Sau ≤ 31 s kể từ lúc khóa: URL `/`, có token | "tạm khóa **30 giây**" | S |
| FR02-A13 | edge | Verify email dài 10.000 ký tự được từ chối nhanh, không treo/5xx | Nhập local-part 10.000 `a` + `@hcmus.edu.vn` | email dài, `{pw}` | Có phản hồi lỗi < 10 s; không token; không 5xx | **Spec gap** (không nêu giới hạn độ dài); chuẩn chung | A |
| FR02-A14 | edge | Verify mật khẩu dài 10.000 ký tự được từ chối nhanh, không treo/5xx | Nhập `{acct}` + 10.000 `A` | `{acct}`, mật khẩu dài | như A13; bộ đếm tăng đúng như một lần sai | **Spec gap**; chuẩn chung | A |

## 3. Nhóm B — Kiểm tra cấu trúc / hậu quả (dữ liệu `data/fr02-checks.json`)
| ID | Loại | Tiêu đề | Bước | Kết quả mong đợi | Spec | ĐT |
|---|---|---|---|---|---|---|
| FR02-B01 | thuộc tính | Verify ô email của form đăng nhập có `type="email"` | Mở `/login`, đọc thuộc tính ô 1 | `type="email"` | FR-02; FR-22 | S |
| FR02-B02 | thuộc tính | Verify ô mật khẩu có `type="password"` (không hiển thị rõ) | đọc ô 2 | `type="password"` | FR-22 | S |
| FR02-B03 | state/oracle | Verify một lần sai làm `login_attempts` tăng đúng 1 | Tạo `{acct}` → 1 lần sai (UI) → `GET /api/admin/users` | `login_attempts == 1`; `locked_until` rỗng | "tăng bộ đếm lên **đúng 1 đơn vị**" | S |
| FR02-B04 | message | Verify thông báo khi tài khoản đang khóa không lộ nguyên nhân (giống khi sai mật khẩu) | Lấy lỗi sau 1 lần sai; khóa tài khoản khác; lấy lỗi khi khóa | Văn bản lỗi trên UI **giống nhau**; không chứa "khóa"/"lock" | "thông báo lỗi phù hợp; không để lộ chi tiết nguyên nhân" | **A** (hai vế của spec mâu thuẫn nhẹ → cần sinh viên chốt) |
| FR02-B05 | security | Verify phản hồi `POST /api/login` không chứa mật khẩu | Gọi API đúng thông tin | Body không có trường `password` | SEC-01 (không lưu/hiển thị plaintext) | D |
| FR02-B06 | token | Verify token lưu từ UI dùng được với `Authorization: Bearer` | Đăng nhập UI → đọc token → `GET /api/users/me` | HTTP 200, `email` đúng `{acct}` | "gửi kèm… header `Authorization: Bearer <token>`" | S |
| FR02-B07 | UI | Verify tiêu đề trang đăng nhập nói về đăng nhập và có đúng một `<h1>` | đếm heading | đúng 1 `<h1>`; chữ không phải "Đăng Ký" | FR-21 (ngoài lõi FR-02) | D |

Tổng: **21 TC** (14 + 7). Phân loại: positive 3 · negative 6 · BVA 3 · edge 3 · cấu trúc/state/security 6.

## 4. Đối chiếu kỳ vọng với spec (soát "kỳ vọng bịa")
| Mục | Nhận xét | Quyết định đề xuất |
|---|---|---|
| A13, A14 | Spec không nêu giới hạn độ dài; "4xx, < 10 s, không 5xx" là chuẩn chung, không phải yêu cầu | Giữ, ghi **Spec gap**; nếu fail chỉ báo "cần xác nhận", không phải bug chắc chắn |
| B04 | Spec vừa yêu cầu "thông báo phù hợp" vừa "không lộ nguyên nhân" → hiểu là *không nói rõ khóa/không lộ mật khẩu đúng*; HW02 đã ghi đây là điểm cần xác nhận | **Sinh viên chốt cách hiểu** trước khi chạy |
| A05 | Spec không nêu rõ so sánh với A04; suy ra từ "không lộ chi tiết nguyên nhân" (không lộ email tồn tại) | Giữ (D) |
| A06/A07 | Spec chỉ nói email `type="email"`; "không rỗng" suy từ thuộc tính `required` của form | Giữ (D) |
| A09 | Kỳ vọng chỉ là "không bypass, không 5xx"; spec liên quan là SEC-05 | Giữ (D) |
| A12 | Spec 30 s; **không** nói bộ đếm có reset khi hết khóa → không test bộ đếm sau hết khóa (HW02: BUG-FR02-12 còn là điểm xác nhận) | Chỉ kiểm đăng nhập được sau 30 s |
| Email hoa/thường, khoảng trắng đầu/cuối | Spec im lặng | **Không tạo TC** (tránh bịa kỳ vọng); ghi trong báo cáo là spec gap |
| B07 | Thuộc FR-21 chứ không phải FR-02 | Giữ nếu muốn; có thể bỏ nếu cần gọn |

## 5. Dự đoán kết quả khi chạy (từ đọc code, chỉ là giả thuyết H)
Dự kiến **Fail**: A03, A08, A10–A12 (do khóa sớm/lâu hơn: A03 fail vì +2 ⇒ khóa ở lần 2; A12 fail vì khóa 180 s), B01, B02, B03, B04, B05, B07. Dự kiến Pass: A01, A02(?), A04–A07, A09, A13–A14, B06. **Không dùng để viết kỳ vọng**; chỉ để so sánh sau khi chạy (A02: lần 1 sai ⇒ counter 2 < 3 nên vẫn Pass).

## 6. Việc cần sinh viên quyết trước P3
1. Duyệt/loại TC trong bảng (đặc biệt A13, A14, B07).
2. Chốt cách hiểu B04.
3. Đồng ý không có TC về email hoa/thường và bộ đếm sau hết khóa.

## 7. Quyết định của sinh viên (14/11/2026)
1. **B04:** đồng ý cách hiểu — UI khi khóa hiển thị lỗi giống khi sai mật khẩu, không nêu "khóa".
2. **Bỏ A13, A14, B07** (chỉ làm những gì liên quan tới FR đã chọn; B07 thuộc FR-21, A13/A14 spec im lặng). Còn **18 TC**: A01–A12 và B01–B06.
3. **Email hoa/thường, khoảng trắng, bộ đếm sau hết khóa:** không tạo TC, ghi là spec gap, làm đúng theo spec.
