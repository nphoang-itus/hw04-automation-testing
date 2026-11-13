# Kỹ thuật automation trích từ bài giảng (dùng cho HW04)

Nguồn (thư mục Slides của môn): `EN.Automation & Regression Testing AI-First (Redesigned).pdf` (**[AR]**), `S12_Automation testing.pdf` (**[S12]**), `EN.Test_Cases_AI_First.pdf` (**[TC]**). Chỉ giữ phần liên quan tới HW04 (web, Playwright, data-driven, multi-browser, AI-first). Bỏ qua: mobile/desktop, codeless, CI/CD, metrics, cloud farm.

## 1. Chọn test case nào để automate — [S12 tr.12–13], [AR tr.4]
- **Nên automate:** lặp đi lặp lại/dễ sai do người; **nhiều bộ dữ liệu**; rủi ro cao/nghiệp vụ quan trọng (login, checkout); cần chạy trên nhiều nền tảng (nhiều browser); tính năng ổn định.
- **Không nên (chưa):** yêu cầu hay đổi; chạy ad-hoc; cần phán đoán của người (đẹp/xấu, UX lần đầu); một lần.
- **Áp dụng HW04:** FR-02/FR-08/FR-16 đều có nhiều bộ dữ liệu + rủi ro cao → automate. Test cần mắt người (bố cục, màu nút) → ghi vào mục "không automate" của báo cáo (đề yêu cầu nêu lý do).
- Kim tự tháp [AR tr.7]: nhiều unit/API, ít UI. Vì đề bắt buộc UI, **dùng API chỉ để chuẩn bị/kiểm hậu quả (arrange/oracle)**, UI cho phần chính; tránh "ice-cream cone".

## 2. Cấu trúc một test = 3A — [AR tr.12]
**Arrange** (định vị phần tử + dựng trạng thái đã biết) → **Act** (đúng *một* hành vi cần test) → **Assert** (một kiểm tra rõ nghĩa). Giữ đúng thứ tự; không xen nhiều hành vi.

## 3. Framework pattern — [AR tr.13–14]
| Pattern | Dùng cho HW04 |
|---|---|
| **Data-driven** (một script, nhiều dòng dữ liệu) | **Bắt buộc**: dữ liệu ở `data/*.csv|json`, không hardcode |
| Modular + **Page Object Model + DRY** | Mỗi trang một class (`LoginPage`): locator và hành động nằm một chỗ → đổi UI chỉ sửa một nơi |
| Hybrid | Kết quả thực tế = data-driven + POM |
- Test đọc như ý định người dùng (`login.signIn(email, pw)`), không lộ CSS.

## 4. Locator & assertion ổn định — [AR tr.29–30]
- Ưu tiên **role / label / test-id** thay CSS/XPath giòn; nếu app không có label/test-id chuẩn, dùng locator ổn định nhất có thể và **ghi chú** (đây là chỗ AI hay sai → đưa vào báo cáo review).
- **Web-first assertion** `expect(locator).toHaveText/toBeVisible/...` tự retry; **không dùng sleep cố định** (nguồn flaky số 1).
- Đa dạng assertion (đề: ≥ 3 loại): URL (`toHaveURL`), text (`toContainText`), hiển thị (`toBeVisible/toBeHidden`), thuộc tính (`toHaveAttribute('type','email')`), số lượng (`toHaveCount`), trạng thái lưu (localStorage token, response API).

## 5. Chống flaky & độc lập — [AR tr.15, 34], [TC tr.12]
- Nguyên nhân: **timing**, **thứ tự** (test dùng chung state), **môi trường/dữ liệu**. Cách xử: auto-wait, **test độc lập và tự đủ**, reset state, retry chỉ là tín hiệu chứ không phải thuốc chữa.
- 7 đặc tính test case tốt [TC tr.12]: Accurate, Economical, Repeatable, **Traceable** (gắn FR/dòng đặc tả), Appropriate, **Self-standing** (không dựa dữ liệu của test trước), **Self-cleaning** (trả môi trường về sạch). → mỗi test tự tạo tài khoản riêng và dọn sau.
- Do/Don't [AR tr.34]: không xâu chuỗi test; không dùng sleep/XPath giòn; không bỏ qua đỏ ("chạy lại là xong").

## 6. Multi-browser — [S12 tr.9], [AR tr.17,19]
Một bộ script chạy trên nhiều browser/OS là lợi ích cốt lõi; Playwright có sẵn song song miễn phí và 3 engine (Chromium/Firefox/WebKit). Thách thức chính của web: **cross-browser** → mỗi lỗi riêng một engine là phát hiện đáng báo.

## 7. Quy trình AI-first — [AR tr.27–28,36], [TC tr.21–23]
- **Mẫu prompt:** ROLE → CONTEXT (dán *spec thật*, không để AI đoán) → TASK → FORMAT (bảng/cấu trúc ép buộc) → CONSTRAINTS; sau đó **iterate** ("còn thiếu input nào?") thường tăng gấp đôi độ phủ.
- **4 kiểu AI sai** cần soi: (1) kỳ vọng bịa (hallucinated expected), (2) trùng lặp trá hình (plausible redundancy), (3) thiếu biên miền (missing domain edges), (4) UI/field bịa (invented UI & fields).
- **Luật nhà:** không test nào vào suite khi chưa có người **đối chiếu expected với spec**. "AI drafts, you engineer"; AI chỉ nháp/heal, **người sở hữu assertion**; accept locator mới của AI chứ không tin mù quáng.
- Vòng làm việc: AI nháp từ story/UI → người review ý định & assertion → chạy → AI phân loại lỗi, người quyết định sửa.

## 8. Vì sao automation thất bại → đối sách — [S12 tr.18–25], [AR tr.31–32]
| Vấn đề | Đối sách áp dụng |
|---|---|
| Thiếu kế hoạch | Xác định phạm vi, chọn tool, **chuẩn bị test data**, thiết kế, chạy, bảo trì, báo cáo |
| Hiểu SUT chưa đủ | Đọc spec + **exploratory** trước khi viết script |
| Flaky / dynamic element | auto-wait, locator theo role, reset state |
| Chọn sai tool | Playwright: tương thích TS, auto-wait, đa browser, HTML reporter, trace |
| Bảo trì | POM + DRY |
| 100% automation là ngộ nhận | Ghi test không automate được + lý do |

## 9. Regression — [AR tr.8–10]
Retest (xác nhận *một bug đã sửa*, đúng dữ liệu cũ) ≠ regression (xác nhận *không vỡ chỗ khác*, dữ liệu đa dạng). Suite này chính là regression suite: giữ test cho bug đã tìm để chạy lại khi SUT được sửa.
