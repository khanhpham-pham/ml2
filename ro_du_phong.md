# RỔ DỰ PHÒNG — bảng xoay vòng (flywheel)

> **Nhìn phát là biết:** bán mã nào (ĐẠN) → dồn mã nào (ĐÍCH). Phục vụ nguyên tắc xoay vòng compound của chủ DM.
> 🧹 **Dọn rác kế thừa 4/9/2026** — watchlist trước đó còn 6 mã + plan giá từ 21–25/8 của DANH MỤC CŨ, kèm ghi chú tham chiếu vị thế không còn tồn tại ("KBC đang cầm", "ANV đang cầm", "DM đã có 4 bank ~20,7%", "swap REE→POW"). `positions.json` rỗng → mọi tham chiếu đó sai. Đã cập nhật toàn bộ bằng số sống ngày 4/9.

## ⚙️ CƠ CHẾ VÀO/RA TỰ ĐỘNG (chống rác)
> **Đích mua tự lọc** — `analysis/ro_du_phong_auto.md` do Action `fireant.yml` tái tạo mỗi lần universe refresh (16:30 VN) qua `extract_ticker.js --rodp`.
- **IN (tự vào rổ):** ROE ≥ 15% · 0 < PE ≤ 15 · PB ≤ 2,5 · No/VCSH ≤ 2,0x · **ngoài danh mục**. Xếp hạng score = ROE/PE.
- **OUT (tự ra rổ):** (a) **đã mua** → graduated; (b) **tụt chuẩn** → tự loại.
- ⚠️ **HẠN CHẾ ĐÃ BIẾT của bộ lọc (phát hiện 4/9):**
  1. **Ngưỡng ROE≥15% là TUYỆT ĐỐI, không phân ngành** → loại sạch 12/12 mã chứng khoán (ROE ngành CK chỉ 12,9%), chỉ để lọt VIX — đúng mã tệ nhất ngành. Ép ngành ROE thấp tự nhiên qua cùng ngưỡng với phân bón/hoá chất = lọc ra "ngành đang ở đỉnh chu kỳ", không phải "hàng tốt". **Đề xuất sửa sang ngưỡng TƯƠNG ĐỐI NGÀNH** (snapshot đã có sẵn số ngành mọi dòng).
  2. **Bank pass tiêu chí nợ tự động** vì không có chỉ tiêu No/VCSH — KHÔNG phải bank sạch nợ.
  3. **Lọc máy KHÔNG bắt được one-off**: 4/9 nó xếp VCG hạng 1 (PE 2,68) và HDC hạng 2 (PE 4,06) — cả hai là bẫy trailing (xem mục LOẠI).
  4. Lọc máy KHÔNG đọc tổ hợp CFO/CFI/CFF → phải soi tay tầng 2.

---

## 🔴 NGUỒN ĐẠN (bán để lấy tiền xoay)

| Mã | %/CP | P&L | % | Trạng thái |
|---|---:|---:|---:|---|
| _(chưa có vị thế — `positions.json` rỗng)_ | | | | |

**Đạn chín = winner ≥ +8%.** Chưa có vị thế → chưa có đạn. Mọi lệnh mua lúc này là **mở vị thế bằng tiền mới**, không phải xoay vòng.

---

## 🟢 ĐÍCH (mua vào — đã vetted, sẵn deploy)

Số sống ngày **4/9/2026** (đóng cửa). Sắp theo mức sẵn sàng.

| Đích | Mốc vào | Giá 4/9 | Khoảng cách | Trạng thái |
|---|---|---:|---:|---|
| **HAH** | ≤ 46.500 | 47,1k | **−1,3%** | 🟡 SÁT CHẠM |
| **IDC** | ≤ 31.500 | 31,9k | **−1,3%** | 🟡 SÁT CHẠM — nhưng còn nghi vấn chưa giải (xem dưới) |
| **BSR** | ≤ 25.500 | 26,8k | −4,9% | 🟢 chờ |
| **CTG** | ≤ 30.500 | 31,4k | −2,9% | 🟢 chờ |
| **SSI** | ≤ 20.000 *(gom dip)* hoặc breakout > 22.300 | 21,1k | — | 🟢 chờ trigger |
| ~~POW~~ | ~~≤ 13.000~~ | 12,8k | *đã chạm* | 🔴 **HUỶ PLAN — lý do mua đã sụp** |
| ~~FMC~~ | ~~≤ 32.000~~ | 33,6k | — | 🔴 **HUỶ PLAN — mẫu tử thần** |

---

## 📋 WATCHLIST TÍCH LŨY (pipeline săn kèo)
> 1. **Tin POPUP** → 2. **LỘI SOI** (rẻ + CFO thật + không bẫy) → 3. **THƠM → vào bảng kèm PLAN GIÁ + trigger** → 4. **chạm giá mới mua.** Không mua đuổi.

| Mã | Ngày soi | Vì sao thơm | 🎯 PLAN GIÁ VÀO | Ghi chú / rủi ro |
|---|---|---|---|---|
| **DPM** | 4/9 | **Hội tụ đủ 3 cửa — mã mạnh nhất đợt quét.** LNST 239→233→411→**916** (x3,8). Biên gộp bật 19-20-17→**24%**. CFO **+788**. ROE 15,3 · PE 8,76 · PB 1,37 · nợ 0,60x. Giá trên cả MA20 (22,1) lẫn MA50 (22,6), vol **x1,69**. | **≤ 22.100** (về MA20) · vào 2 nhịp · nhịp 2 nếu ≤ 21.000 | **Ngoại mua +1,45tr cp/20p nhưng +1,42tr dồn vào 5 phiên cuối** = đang tăng tốc. Rủi ro: đã chạy, mua đuổi ở 22,9k là trả giá đỉnh nhịp. |
| **DCM** | 4/9 | Cùng trục phân bón với DPM. LNST 328→389→789→**1.060**, **gia tốc 4 quý liền**. Biên gộp 22-28-25→**31%**. ROE 23,6 · PE 6,58 · PB 1,48 · nợ 0,90x. | **≤ 31.200** (MA20) | ⚠️ **CFO −276 tỷ trong khi LNST 1.060** → tiền chưa về, lợi nhuận nằm ở khoản phải thu/tồn kho. **CFF +992** = có huy động bù. Ngoại đã bán −8,34tr/20p, 5 phiên gần nhất mới chỉ *ngừng* bán (+0,05tr), chưa quay lại mua. |
| **BSR** | 25/8 · **soi lại 4/9** | **Tổ hợp dòng tiền đẹp nhất toàn universe: CFO +7.390 / CFI −6.730 / CFF −631** = `CFO+/CFI−/CFF−`, tự nuôi tăng trưởng. ROE 30,3 · PE 6,77 · PB 1,80 · nợ **0,42x**. LNST 909→7.670. | **≤ 25.500** (MA50 25,5k) · **KHÔNG mua đuổi** ở 26,8k | ⚠️ Cảnh báo cũ 25/8 vẫn đúng: **biên gộp Q2 nén 21→15%** dù DT tăng → có thể qua đỉnh crack spread. Mua vì rẻ + dòng tiền, KHÔNG vì kỳ vọng biên dãn tiếp. Ngoại 20p −2,12tr nhưng **5p +0,40tr → đã đảo sang mua**. |
| **VRE** | 4/9 | Biên gộp **tăng đều cả 4 quý: 51→52→55→59%**. Nợ **0,27x** — sạch nhất nhóm. CFO **+1.820** với CFI +106 / CFF −6 → gần như tự nuôi hoàn toàn. ROE 15,5 · PE 8,27 · PB 1,22. | **≤ 25.300** (MA20) | **Ngoại đảo chiều: 20p −4,55tr → 5p +2,37tr.** Giá trên cả 2 MA, vol x1,28. Máy chấm SKIP — tôi không theo, vì máy không đọc đạo hàm biên gộp. Đang ở watch tier universe từ 11/8. |
| **HAH** | 25/8 · **soi lại 4/9** | Vận tải biển. Biên gộp cao **và ổn định** 37-40-39-**41%** (hiếm). LNST bật 351→**467**. CFO +428, nợ 0,69x. ROE 23,5 · PE 7,04 · PB 1,77. Giá −32% so đỉnh 52w. | **≤ 46.500** (MA20 46,9k) · vào 2 nhịp · nhịp 2 nếu ≤ 44.000 | Driver = **giá thuê định hạn 1.000–3.000 TEU neo cao tới 2026–27** (cước spot hạ nhiệt — đừng nhầm 2 thứ). Rủi ro: ngoại vẫn bán (−3,79tr/20p), cyclical cao. |
| **TCB** | 4/9 | **Đảo chiều dòng tiền mạnh nhất toàn universe: ngoại 20p −12,54tr → 5p +18,96tr cp** (mua 5 phiên còn lớn hơn cả lượng bán 20 phiên). LNST bật 6.950→**7.730**. ROE 15,5 · PE 8,49 · PB 1,22. Giá vừa vượt MA20/MA50 (31,5). | **≤ 31.500** (về MA20/MA50) | Bank → **tiêu chí nợ của bộ lọc không áp dụng**, đừng đọc thành "sạch nợ". Ngoại đang xả bank diện rộng, TCB là ngoại lệ — cần xác nhận thêm 3–5 phiên xem có bền không. |
| **IDC** | 25/8 · **soi lại 4/9** | KCN. ROE 26,7 · PE 6,13 · PB 1,97. Q2 bật 338→**663 tỷ**, biên gộp 26→37%. Giá 31,9k dưới MA50 (35,7) 11%, sát đáy 52w. | **≤ 31.500** — **CHỜ giải đáp nghi vấn dưới trước khi mua** | ⚠️ **Nghi vấn từ 25/8 CHƯA giải:** CFO quý **−203 tỷ** mà **CFI DƯƠNG +481** → dòng tiền vào đến từ đâu, có phải **bán tài sản** không? Nợ 1,67x cao nhất nhóm đích. Ngoại bán đều cả 2 cửa sổ (−1,15tr / −1,28tr). **Không mua khi chưa đọc thuyết minh CFI.** |
| **SSI** | 4/9 | **Đầu ngành chứng khoán về chất.** LNST ổn định nhất ngành 1.480/820/1.280/1.230. Biên gộp 51→72→**73%**. PE 10,96 < ngành 14,63; PB 1,30 < 1,55. Nợ 1,37x thuộc nhóm thấp. **CFO −2.790 là đặc thù margin bơm ra, KHÔNG phải kiệt quệ** (Q4/25 +12.386 = thu hồi margin; Q1–Q2/26 âm = bơm lại). | **A. Breakout:** đóng cửa **> 22.300** (MA20) + vol ≥ median (~21,5tr cp) + ngoại mua ròng ≥3 phiên liên tiếp<br>**B. Gom dip:** **19.400–20.000** (đáy 52w) mà ngoại ngừng bán | ROE 13,9% **trượt bộ lọc máy** (<15%) — nhưng ROE ngành CK chỉ 12,9%, SSI vượt ngành. Đây là ca bộ lọc tuyệt đối đọc sai (xem HẠN CHẾ #1).<br>❌ **Mốc phủ định:** đóng cửa thủng **19.400** → gỡ khỏi watchlist.<br>📅 **Mốc canh:** **7/9** FTSE chốt danh sách chính thức · **18/9** ATC / **21/9** hiệu lực **đợt 1 chỉ 10%** · **sau 22/9** đọc filing kết quả GD ông Nguyễn Hồng Nam.<br>⚠️ SSI vào **FTSE All-Cap nhóm SMALL CAP**, **KHÔNG** vào All-World (chỉ 6 mã: VCB/VIC/VHM/BID/HPG/VPB) → rổ mỏng tiền hơn nhiều. Room ngoại 1,75 tỷ cp là **KHÔNG LIÊN QUAN** (cần ~9.900 phiên để lấp) — đừng dựng luận điểm trên room (lỗi #16). |
| **CTG** | 25/8 · **soi lại 4/9** | Bank. ROE 22,1 · PE 6,10 · PB 1,22. Khớp chuỗi "định giá bank thấp nhất nhiều năm". LNST 8.510/11.090/8.960/**11.780**. | **≤ 30.500** | ✏️ **Sửa ghi chú cũ:** bản 25/8 ghi *"DM đã có 4 bank ~20,7%"* — **SAI với danh mục mới**, `positions.json` rỗng, không có bank nào. Cảnh báo trùng ngành hiện **không áp dụng**.<br>⚠️ Ngoại đảo xấu: 20p **+2,17tr → 5p −4,81tr**. |
| **CSV** | 4/9 | LNST 45→**134** (x3), biên gộp 20→**33%**. Nợ **0,29x**. ROE 16,0 · PE 9,15 · PB 1,41. | **≤ 21.700** (MA20) · **cỡ lệnh nhỏ** | ⚠️ **Thanh khoản gần bằng 0** (vol x0,00) — vào được nhưng **khó ra**. Chỉ hợp lệnh nhỏ, không hợp swing. |

---

## 🔴 GỠ KHỎI RỔ — kèm lý do (để không ai nạp lại)

| Mã | Plan cũ | Vì sao gỡ |
|---|---|---|
| **POW** | *"≤13.000 · CFO thật +2,46k tỷ · ROE 15%"* (21/8) | 🚨 **Lý do mua đã sụp hoàn toàn.** CFO lật **+2.460 → −4.020 tỷ**; tổ hợp thành **`CFO−4.020 / CFI−1.970 / CFF+7.500`** = **mẫu tử thần** (đốt tiền + vay bù). ROE rớt còn **14,7%** (dưới chuẩn). Ngoại xả **−20,10tr cp/20p**, 70% dồn vào 5 phiên cuối. **Và giá đã về 12,8k tức ĐÃ CHẠM mốc mua cũ** — nếu không gỡ, plan này sẽ kích lệnh mua vào đúng lúc doanh nghiệp hỏng dòng tiền. |
| **FMC** | *"≤32.000 · yield 5,9% rất rẻ"* (25/8) | **`CFO −357 / CFI −687 / CFF +821`** = cùng mẫu tử thần. Rẻ (PE 4,72 · PB 0,93) nhưng rẻ vì dòng tiền hỏng. Ghi chú cũ *"trùng ngành ANV đang cầm"* cũng sai — DM không cầm ANV. |
| **VCG** | *(bộ lọc auto xếp **hạng 1**, ROE 34,8% · PE 2,68)* | **Bẫy trailing one-off — đúng lỗi #6 trong sổ, đúng mã đó.** LNST 4 quý `3.300/347/369/275`: quý đầu là one-off. Bỏ ra → PE thật ~**38**, không phải 2,68. |
| **HDC** | *(bộ lọc auto xếp hạng 2, PE 4,06)* | Cùng bẫy: LNST `539/31/58/43`. |
| **VIX** | *(máy chấm `TAKE LONG`)* | Biên gộp **98→85→19→14%**, LNST **2.450→1.290→138→76** (sụp 97%). ROE 15,7% là trailing sắp bốc hơi. Ngoại 20p +25,26tr nhưng **5p −7,41tr** đảo bán. |
| **ANV** | — | LNST giảm **4 quý liền** 283→252→195→135, biên gộp 24→16%. Đạo hàm âm. |

---

## ⚠️ THEO DÕI SÁT (chưa kết luận được — không xếp vào đích)

**PNJ** — máy chấm `TAKE LONG`, ngoại mua mạnh nhất bảng (**+6,50tr/20p, +2,70tr/5p — dương cả hai cửa sổ**), ROE 22,4 · PE 6,88.
- LNST quý gần nhất **−283 tỷ**, nhưng theo **lỗi #11** KHÔNG được loại vì con số đó — lỗ do dự phòng 865 tỷ vụ kim cương, bỏ ra vẫn lãi ~582 tỷ.
- **NHƯNG ba tin ngày 4/9 nối thành chuỗi:** giải trình chênh lệch **hàng nghìn tỷ** trong BCTC · **lợi nhuận giảm 38% sau soát xét** · **gia đình Chủ tịch đăng ký bán 25 triệu cp để lấy tiền CHO CÔNG TY VAY**.
- Truy một tầng: bán cổ phần để cho chính công ty mình vay ⇒ **công ty thiếu tiền mặt**. Khớp `CFO −1.570 / CFF +1.110`.
- ⇒ Ngoại đang mua vào một mã mà chủ doanh nghiệp phải bán cổ phần để bơm tiền cho nó. **Chưa biết bên nào đúng.** Không nạp đích cho tới khi rõ.

---

## 🔄 RE-ENTRY WATCH (mã ĐÃ BÁN, canh mua lại)

| Mã | Giá đã bán | Mốc vào lại | Điều kiện phải thoả | Trạng thái |
|---|---:|---:|---|---|
| _(chưa có — chưa bán mã nào)_ | | | | |

---

## 🔬 VIỆC CÒN NỢ (soi tiếp)
1. **Trục phân bón DPM + DCM** — hai mã đầu bảng nằm chung một ngành, LNST cùng bật mạnh. Đây là **một chuỗi ngành đang chuyển pha**, chưa truy ra động cơ (giá ure thế giới? thuế GTGT phân bón? công suất?). Phải soi như một câu chuyện, không phải hai mã lẻ.
2. **IDC** — đọc thuyết minh để biết CFI +481 tỷ đến từ đâu (bán tài sản?) trước khi cho phép mua.
3. **Sửa `--rodp` sang ngưỡng tương đối ngành** — sửa gốc cái rây, ảnh hưởng mọi báo cáo về sau.
