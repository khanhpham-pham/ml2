# RỔ DỰ PHÒNG — bảng xoay vòng (flywheel)

> **Nhìn phát là biết:** bán mã nào (ĐẠN) → dồn mã nào (ĐÍCH). Phục vụ nguyên tắc xoay vòng compound của chủ DM.
> 🌱 _File khởi tạo — khung giữ nguyên từ danh mục cũ, dữ liệu đã dọn sạch._

## ⚙️ CƠ CHẾ VÀO/RA TỰ ĐỘNG (chống rác)
> **Đích mua tự lọc** — file `analysis/ro_du_phong_auto.md` do GitHub Action `fireant.yml` **tái tạo mỗi lần universe refresh (16:30 VN)** qua `extract_ticker.js --rodp`.
- **IN (tự vào rổ):** ROE ≥ 15% · 0 < PE ≤ 15 · PB ≤ 2,5 · No/VCSH ≤ 2,0x · **ngoài danh mục**. Xếp hạng theo score = ROE/PE.
- **OUT (tự ra rổ):** (a) **đã mua** → graduated, biến khỏi rổ; (b) **tụt chuẩn** (ROE rớt / PE vọt / nợ tăng) → tự loại. Không tích rác vì rổ **tái tạo từ số sống mỗi lần**, không cộng dồn tay.
- Bảng ĐÍCH bên dưới = **ảnh chụp 20/8**; số auto luôn tươi ở `analysis/ro_du_phong_auto.md`.

---

## 🔴 NGUỒN ĐẠN (bán để lấy tiền xoay)

| Mã | %/CP | P&L | % | Trạng thái |
|---|---:|---:|---:|---|
| _(chưa có vị thế)_ | | | | |

**Đạn chín = winner ≥ +8%.** Không có đạn chín → muốn mở rổ phải là quyết định TRIM, không phải chờ.

---

## 🟢 ĐÍCH (mua vào — đã vetted, sẵn deploy)

| Đích | Mốc vào | Giá hiện tại | Khoảng cách | Trạng thái |
|---|---|---:|---:|---|
| _(chưa có)_ | | | | |

> Đích tự lọc qua `extract_ticker.js --rodp` → `analysis/ro_du_phong_auto.md` (tái tạo mỗi lần refresh universe).
> Tiêu chí IN: **ROE≥15% · 0<PE≤15 · PB≤2,5 · Nợ/VCSH≤2,0x · ngoài danh mục.**

---

## 🔄 RE-ENTRY WATCH (mã ĐÃ BÁN, canh mua lại)

| Mã | Giá đã bán | Mốc vào lại | Điều kiện phải thoả | Trạng thái |
|---|---:|---:|---|---|
| _(chưa có)_ | | | | |

---

## 📋 WATCHLIST TÍCH LŨY (pipeline săn kèo — chạy liên tục, tích lũy dần)
> **Quy trình chuẩn** (KHÔNG soi thủ công từng con — chạy như dây chuyền):
> 1. **Tin POPUP** — mã xuất hiện feed FireAnt (`--discover`) / có sự kiện (KQKD, cổ tức, cổ đông lớn, phát hành...).
> 2. **LỘI SOI** — kéo `--news`/snapshot, lọc qua chuẩn: **rẻ (PE/PB) + CFO thật (dương) + ROE≥15 + không bẫy** (đầu cơ/pump/nợ vọt).
> 3. **THƠM → VÀO WATCHLIST + PLAN GIÁ VÀO** — thêm vào bảng dưới, **kèm giá vào dự kiến + trigger** (như NVL 13.5 / HPG 20.4).
> 4. **THEO DÕI → MUA** khi chạm giá plan. Không chạm → nằm chờ, không mua đuổi.

| Mã | Ngày soi | Vì sao thơm | 🎯 PLAN GIÁ VÀO | Ghi chú / rủi ro |
|---|---|---|---|---|
| **POW** | 21/8 | Điện **rẻ** (PE 6,9 · PB 1,01) · **CFO thật +2,46k tỷ** · ROE 15% · **room ngoại rộng** (4,4%) · Nhơn Trạch 3&4 sắp phát điện | **≤ 13.000** (gần đáy 52w 12,4k) · HOẶC **swap REE→POW** | Q2 phồng vì **2.500 tỷ hồi tố (one-off)** — lãi core ~1,2k. PVN 79,9% → float mỏng. Phòng thủ, chạy chậm (không swing nhanh). |
| **HAH** | 25/8 | Vận tải biển. Biên gộp dãn **37→41%**, LNST **+33% QoQ**, LNST<lãi gộp mọi quý (sạch one-off). CFO ttm 1.720 tỷ tự nuôi CFI −936. ROE 23,5 · PE 7,25 · PB 1,82 · nợ 0,7x · **yield 4,1%**. Giá **−32% so đỉnh 52w**. | **≤ 46.500** (về MA20) · vào 2 nhịp · nhịp 2 nếu về ≤44.000 (sát đáy 52w 43,9k) | Driver = **giá thuê định hạn 1.000–3.000 TEU neo cao tới 2026–27** (cước spot thì đang hạ nhiệt — đừng nhầm 2 thứ). Rủi ro: ngoại bán −137 tỷ/20 phiên; cyclical cao; cap 9,2 nghìn tỷ (vừa). |
| **BSR** | 25/8 | Lọc dầu. ROE 30% · PE 6,96 · PB 1,84 · nợ 0,4x. **CFO ttm 9.080 tỷ**, tự nuôi. DT 35k→59k tỷ, LNST 909→7.460, sạch one-off. Lãi 7T/2026 ~19.000 tỷ. | **≤ 25.500** (về MA50 25,4k) · KHÔNG mua đuổi ở 27,4k | ⚠️ **Biên Q2 NÉN 21→15%** dù DT tăng mạnh → đạo hàm chậm lại, có thể qua đỉnh crack spread. Mua vì rẻ + dòng tiền, KHÔNG vì kỳ vọng biên dãn tiếp. Catalyst: Luật Dầu khí sửa đổi. |
| **IDC** | 25/8 | KCN — **sạch hơn KBC đang cầm**. ROE 26,7 · PE 6,29 · PB 2,02 · **yield 4,6%**. Q2 bật **338→663 tỷ**, biên 26→37%. Giá **−11% dưới MA50**, sát đáy 52w. | **≤ 31.500** (đáy 52w 31,5k) · hoặc mua thẳng 1/3 vị thế ở 32,7k | Soi thêm: CFO quý **−203 tỷ** (ttm vẫn +2.510) và **CFI dương +481** — cần biết có phải bán tài sản không. Nếu swap KBC→IDC thì giải quyết luôn mã yếu đang cầm. |
| **FMC** | 25/8 | Thuỷ sản. PE 4,9 · PB 0,95 · **yield 5,9%** rất rẻ. Q2 hồi 51→174 tỷ. Nắm ~2.000 tỷ tiền gửi. | **≤ 32.000** (dưới đáy 52w 33,6k) — chỉ mua nếu rẻ hẳn | Hạ ưu tiên: **CFO quý −359 tỷ** + **trùng ngành ANV đang cầm** + cap chỉ 2,2 nghìn tỷ. |
| **CTG** | 25/8 | Bank. ROE 22,1 · PE 6,16 · PB 1,24 · CFO 22.850 tỷ · ngoại **+509 tỷ** · TAKE LONG. Khớp chuỗi "định giá bank thấp nhất nhiều năm". | **≤ 30.500** · và **chỉ khi đã giảm bank khác** | ⚠️ DM đã có 4 bank ~20,7% (VCB/MBB/HDB/ACB). Thêm CTG = **tăng tỷ trọng ngành, không phải đa dạng hoá**. |

*(Con nào popup + soi thơm sẽ tự cộng vào đây kèm plan giá. Con nào tụt chuẩn / mua rồi → dọn ra. Đây là "kho đạn chờ", tích lũy dần.)*
