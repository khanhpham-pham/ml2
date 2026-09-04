# ml2 — danh mục đầu tư

Repo theo dõi danh mục cổ phiếu Việt Nam, làm việc cùng Claude Code.

Khởi tạo từ `khanhpham-pham/ML` (4/9/2026): mang sang **phương pháp + công cụ**, bỏ toàn bộ dữ liệu danh mục cũ.

## File chính
| File | Vai trò |
|---|---|
| `CLAUDE.md` | **Bộ nhớ hành vi** — phương pháp phân tích, sổ lỗi #1–#16, khung săn kèo, quy trình rây tin |
| `positions.json` | Sổ vị thế (skeleton rỗng — điền khi có giao dịch đầu tiên) |
| `ro_du_phong.md` | Bảng xoay: ĐẠN bán / ĐÍCH mua / re-entry watch |
| `macro.md` | Chain log vĩ mô |
| `rui_ro_danh_muc.md` | Rủi ro cấp danh mục |
| `extract_ticker.js` | Công cụ đọc FireAnt |
| `universe.json` | Danh sách mã theo dõi |

## Cần làm để chạy được
1. **Secret `FIREANT_TOKEN`** → Settings → Secrets and variables → Actions.
2. Sửa `universe.json` cho đúng mã muốn theo dõi.
3. Điền `positions.json` khi có giao dịch đầu tiên.
4. Điền mục **TRẠNG THÁI DANH MỤC** trong `CLAUDE.md`.
5. (Tuỳ chọn) dựng lại routine báo cáo 17:00.

## Tự động
`.github/workflows/fireant.yml` — holdings 3×/ngày (8:30/12:00/15:30 VN) → `analysis/latest.md`; universe + divcal/discover/prune/rodp 16:30 → `analysis/*`.
