# FR-02 — Kết quả chạy 3 browser (lần chạy chính thức đầu tiên)

Lệnh: `npm run test:all -- tests/fr02-login-lockout.spec.ts tests/fr02-checks.spec.ts` (script `scripts/run-all.sh` chạy lần lượt chromium → firefox → webkit, mỗi browser một report). Commit kiểm thử: `fd44c67`. Log đầy đủ: `docs/evidence/fr02-3browsers-run3.txt`. Report: `reports/chromium|firefox|webkit/index.html` — đã mở bằng trình duyệt để xác nhận tiêu đề hiển thị `Run by: 23120264 | <ISO timestamp>` ở cả 3.

| Browser | Test | Pass | Fail | Thời gian | Report |
|---|---|---|---|---|---|
| Chromium | 20 | 11 | 9 | 41,7 s | `reports/chromium/` (Run by: 23120264 \| 2026-11-13T19:40:10Z) |
| Firefox | 20 | 11 | 9 | 48,9 s | `reports/firefox/` (… 19:40:52Z) |
| WebKit | 20 | 11 | 9 | 48,3 s | `reports/webkit/` (… 19:41:42Z) |
| **Tổng** | **60 lượt chạy** | 33 | 27 | | **3 browser-run** |

**Test Fail giống hệt nhau ở cả 3 browser:** A03, A08, A12, A13, B01, B02, B03, B04, B05 → không có lỗi riêng một engine; nguyên nhân là 6 bug SUT đã phân tích ở `fr02-p6-iteration.md` (bộ đếm +2, khóa 180 s, email/mật khẩu `type=text`, lộ khóa qua API, lộ mật khẩu).
Test Pass ở cả 3: A01, A02, A04–A07, A09–A11, B06, B07.

Lưu ý:
- Chỉ chạy 2 file FR-02; các spec FR-08/FR-16 còn là khung TODO nên cố ý bỏ ra để không có kết quả pass giả.
- WebKit chạy qua Playwright WebKit trên macOS, không phải Safari thật.
- `validity.typeMismatch` (A08) cho cùng kết quả ở 3 engine vì ô là `type=text`; khi SUT sửa thành `type=email` cần chạy lại để xác nhận hành vi từng engine (F7 trong `fr02-p1-analysis.md`).
