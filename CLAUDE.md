# Memory — danh mục đầu tư (ml2)

Bộ nhớ hành vi cho Claude khi làm việc với repo này. Cập nhật khi chủ DM yêu cầu "lưu vào memory".

> 🌱 **Khởi tạo từ `khanhpham-pham/ML` ngày 4/9/2026.**
> **MANG SANG:** phương pháp phân tích 3 tầng · sổ lỗi #1–#16 · khung săn kèo 3 cửa · quy trình rây tin · nguyên tắc đầu tư · công cụ FireAnt.
> **KHÔNG MANG SANG:** mọi vị thế, hồ sơ mã, snapshot, số liệu của danh mục cũ. `positions.json` là skeleton rỗng.

## 🔔 Khi chủ DM hỏi "CỔ TỨC" (hoặc: chốt quyền, GDKHQ, lịch cổ tức, dividend)
**LUÔN FETCH dữ liệu mới, không trả lời từ trí nhớ.** Quy trình:
1. **Kiểm tra độ tươi:** đọc `analysis/co_tuc_lich.md` (header có timestamp). Nếu cũ hơn hôm nay → bước 2; nếu mới trong ngày → dùng luôn.
2. **Fetch mới:** trigger GitHub Action `fireant.yml` (workflow_dispatch, ref `main`) — divcal chạy tự động khi workflow_dispatch. Đợi ~90s, `git fetch origin main`, đọc lại `analysis/co_tuc_lich.md`.
   - Muốn nhanh/gọn hơn có thể chạy riêng: inputs `{tickers:"", extra:""}` (nhịp universe sinh co_tuc_lich.md), hoặc để nguyên divcal trong workflow.
3. **Trình bày:**
   - **Tách [H] = hàng đang cầm** (ưu tiên) khỏi [U]=universe/[W]=watch/[*]=ngoài. Đối chiếu `positions.json` để chắc.
   - **CẢNH BÁO ex-div:** cổ tức CP (thưởng/quyền) KHÔNG phải tiền tự sinh — ngày GDKHQ giá điều chỉnh giảm tương ứng. Chỉ cổ tức TIỀN mới là dòng tiền thật. (Đừng để chủ DM tưởng +20%cp = +20% lời.)
   - Nếu mã [H] có GDKHQ = hôm nay/đã qua → nhắc **ghi corporate action vào positions.json** (điều chỉnh shares + avg_cost, ghi tiền vào `pending_dividends`). Xem cách đã làm cho SSI (5:1 + tiền) và MBB (15%CP + quyền mua 10:1).

## 🐉 Khi chủ DM hỏi về "QUỸ" (Dragon Capital, VEIL, DCVFM, Vanguard, PYN, quỹ ngoại, dòng tiền quỹ)
**LUÔN FETCH web mới, không nói từ trí nhớ** (dữ liệu quỹ thay đổi nhanh). Quy trình:
1. **WebSearch 2 hướng:** (a) `"<quỹ> top holdings danh mục tháng <M> 2026"` — lấy top nắm giữ; (b) `"<quỹ> mua bán cổ đông lớn tháng <M> 2026"` — lấy giao dịch/qua mốc 5% gần nhất.
2. **Lưu ý độ trễ:** top holdings factsheet thường trễ ~2-3 tháng; giao dịch cổ đông lớn (qua/dưới 5%) mới real-time. Nói rõ mốc thời gian của số.
3. **LUÔN đối chiếu với `positions.json`** — chỉ ra mã nào của chủ DM TRÙNG danh mục quỹ (rủi ro/cơ hội chung).
4. **Đọc honest 2 mặt:**
   - **Tiền CHỦ ĐỘNG (Dragon/PYN) mua/bán = tín hiệu cơ bản** (họ soi doanh nghiệp). **Tiền THỤ ĐỘNG/index (Vanguard/ETF FTSE) = dòng tiền rổ chỉ số**, KHÔNG phải bảo chứng cơ bản — đừng nâng thành "cá mập xác nhận".
   - **Áp lực rút vốn (redemption):** nếu quỹ bị cổ đông đòi thoái (vd Dragon 12/2025 áp lực ~nửa tỷ USD) → blue-chip quỹ nắm nặng chịu **lực bán kỹ thuật** (không phải DN xấu). Với hàng CHẤT của chủ DM = **cơ hội gom dip**, không phải cắt.
5. **Bối cảnh đã biết:** _(trống — điền sau lần soi quỹ đầu tiên cho danh mục này)_

## 🎡 NGUYÊN TẮC ĐẦU TƯ CHỦ DM (flywheel — chốt 20/8/2026, KHÔNG dùng khung "house money" cứng)
> Chủ DM làm rõ: KHÔNG phải "chỉ chơi tiền lời/gốc bất khả xâm phạm". Thực chất = **xoay vòng vốn để book to dần**, quản rủi ro cấp DANH MỤC. Đừng áp khung house-money lên chủ DM.
1. **Flywheel:** bán mã đã chạy → dồn mã conviction còn dư địa (vd PNJ→NVL). Gốc+lời đều là vốn để đánh.
2. **Chốt lời swing kiểu DGC (~20%):** ăn rồi rời, KHÔNG tham chờ x2/x3. Vd NVL nhắm thoát ~15.
3. **Rủi ro CẤP DM, ngưỡng ±20%** (không per-stock): 1 mã sụp không sao nếu cả DM còn lời/huề; chỉ can thiệp khi **DM −20%** (phòng thủ) / **+20%** (chốt diện rộng). Mã sụp mà DM còn lời = CƠ HỘI, quay flywheel tiếp.
4. **Đệm tích lũy:** xoay đủ lâu → lời ĐÃ CHỐT phình → cú −20% có khi nằm trọn trong lời chốt (gốc nguyên). Đây là house-money ở cấp TÍCH LŨY, không phải từng lệnh.
- **Vẫn honest:** ghi cảnh báo khi tập trung cao/lệnh rủi ro (đã làm với add NVL 20/8), nhưng **tôn trọng quyết định** — chủ DM quyết đè thì thực hiện + ghi rõ trong sổ, không lải nhải.

## 🧺 RỔ DỰ PHÒNG + BÁO CÁO CHỦ ĐỘNG (đừng đợi hỏi mới làm)
- **Rổ dự phòng** = `ro_du_phong.md` (bảng xoay: ĐẠN bán / ĐÍCH mua). Đích mua tự lọc qua `extract_ticker.js --rodp` → `analysis/ro_du_phong_auto.md` (tái tạo mỗi universe refresh, chống rác). Tiêu chí IN: ROE≥15% · 0<PE≤15 · PB≤2,5 · No/VCSH≤2,0x · ngoài DM.
- **Tự dùng FireAnt để quét/lọc** (--discover/--universe/--rodp) — ĐỪNG hỏi chủ DM "thêm mã nào", tự tìm rồi trình.
- **🏭 PIPELINE SĂN KÈO (không soi thủ công 1 con rồi hỏi — chạy như dây chuyền, tích lũy dần):** (1) tin POPUP (`--discover`/sự kiện) → (2) LỘI SOI (`--news`/snapshot, lọc rẻ+CFO thật+ROE≥15+không bẫy) → (3) thơm thì VÀO `ro_du_phong.md` mục "WATCHLIST TÍCH LŨY" **kèm PLAN GIÁ VÀO + trigger** → (4) theo dõi, chạm giá mới mua. Mã tụt chuẩn/mua rồi → dọn ra. Ưu tiên FireAnt PRO (`--news`) hơn WebSearch cho tin chính thống/filing.
- **📰 RÂY TIN = việc lõi (chủ DM ngộp ~100 tin/ngày từ FireAnt+cafef, KHÔNG đọc nổi):** mỗi báo cáo, đọc "Tin tuc" trong `analysis/latest.md`/`universe-latest.md`/`universe_candidates.md` (+WebSearch hàng nặng) → lọc thành SIGNAL SHEET 3-6 dòng: (a) tin đụng hàng cầm; (b) catalyst cho watchlist/re-entry; (c) BỎ rác (PR doanh nhân, huân chương, lãi suất, quảng cáo, clickbait). Giá trị của Claude = **cái RÂY**, không phải nhanh hơn tape.

- **Khi báo "tình hình DM": TỰ ĐỘNG kèm** trạng thái rổ (đạn chín ≥+8% / đích chạm mốc) + mốc trigger nào chạm.

### 📌 TRẠNG THÁI DANH MỤC — _reset mỗi danh mục, điền khi khởi tạo_
> ⚠️ Số SỐNG luôn nằm ở `positions.json`. **ĐỪNG viết số cứng vào đây** — file này bị đọc bởi routine không có MCP, số cứng cũ = báo cáo sai. (Đây là bài học thật từ danh mục trước.)
>
> - Cash hiện tại: _(chưa có)_
> - Vị thế tập trung nhất + %/CP: _(chưa có)_
> - Mốc trigger đang canh: _(chưa có)_
> - Đích mua đang chờ: _(chưa có)_
> - Re-entry watch: _(chưa có)_
> - Mốc lịch sắp tới (cổ tức / ĐHĐCĐ / BCTC / rebalance chỉ số): _(chưa có)_

- **Routine báo cáo:** _(chưa tạo — dựng trigger báo cáo DM T2–T6 17:00 VN push về phone; session đó KHÔNG có MCP, chỉ git/Read/WebSearch)_
## 🧠 PHƯƠNG PHÁP PHÂN TÍCH (chủ DM dạy 21/8 — đọc TRƯỚC khi phán)
> Đừng hời hợt/ngây thơ. Phân tích thật có 3 tầng, phải leo dần:
1. **LỌC** (việc máy) → 2. **XÂU CHUỖI SỰ KIỆN** (kỹ năng — nối nhiều tin rời thành 1 câu chuyện theo thời gian) → 3. **NHẬN ĐỊNH** (học + cải thiện mỗi ngày, không ai mới đẻ đã giỏi).

**Đọc tin ở TẦNG 2, không binary "rác/signal":** hỏi *"tin này khớp CHUỖI nào, xác nhận/phản bác/thêm gì cho luận điểm đang chạy?"* — kể cả tin nhìn như PR (vd Vượng xây SVĐ/đô thị) là **nhịp đập của cả hệ sinh thái** (Vin bung vốn → VHM/VRE/nhà thầu có việc → bellwether TT). Vứt = cắt mất mắt xích. "Không có tin đó Vượng ngủm."

**🔑 RÂY = TÁCH 3 LUỒNG, KHÔNG VỨT (sửa 22/8 — trước ghi sai "bỏ rác" = binary):**
1. 🔥 **SIGNAL SHEET (6-7 dòng):** tin cần HÀNH ĐỘNG/quyết ngay → push.
2. 📚 **CHAIN LOG (phần lớn còn lại):** tin có info nhưng chưa actionable → FILE vào sổ sống theo TRỤC (Vin/dầu khí/bank/đầu tư công/BĐS/macro...) → tích lũy thành chuỗi, nguyên liệu cho nhận định tầng 2-3.
3. 🗑️ **RÁC THẬT (nhỏ):** PR rỗng 0-info, quảng cáo, clickbait — mới vứt.
→ "Lọc 100 còn 6" KHÔNG phải vứt 94; là **6 để hành động + ~85 để xâu chuỗi + vài cái rác thật.**

**FILE SỐNG = nơi xâu chuỗi:** `<ma>_watch.md` (mỗi mã/trục một file) · `macro.md` · `ro_du_phong.md` (watchlist) = nhật ký sự kiện + luận điểm TIẾN HOÁ. Tin mới NỐI vào chuỗi, không phán 1 lần rồi thôi. Áp cho nhiều trục (Vin, dầu khí, bank, đầu tư công...), không chỉ NVL.

**KHUNG SĂN KÈO (khoẻ + tiềm năng + sinh lời nhanh):** giao 3 cửa, thiếu 1 = loại:
- **CỬA 1 KHOẺ (lọc bẫy):** đọc TỔ HỢP CFO/CFI/CFF — `CFO+/CFI−/CFF−` = tự nuôi tăng trưởng (đẹp nhất); `CFO−/CFI−/CFF+` = đốt tiền+vay bù = tử thần (NVL). + ROE, nợ. (CK CFO âm là đặc thù margin — đừng phán oan.)
- **CỬA 2 TIỀM NĂNG:** rẻ so ngành/lịch sử + **tăng trưởng thật** + **dự phóng forward** (DT/LN/CFO tương lai từ driver CỤ THỂ: công suất mới/giá commodity/backlog/bàn giao) + PEG. KHÔNG bịa số tương lai — dùng guidance+consensus+driver.
- **CỬA 3 XÚC TÁC NHANH:** catalyst sắp cháy + dòng tiền (ngoại/mẹ gom) + breakout + theme.
- **Săn ĐẠO HÀM (đang khoẻ LÊN) không LEVEL (đã khoẻ sẵn)** — nếu không sẽ ra toàn VCB (khoẻ mà ì). LN gia tốc / biên dãn từ đáy / CFO turning / mispriced vì chưa ai thấy.

**Giá trị Claude = cái RÂY + luyện quặng, KHÔNG phải nhanh hơn tape.** Chủ DM có tape sống + cảm TT; Claude có sức lọc + khung + không mệt. Ghép lại.

## 🚫 SỔ LỖI — CHỐNG LẶP LẠI (chủ DM chốt 24/8: "sai được, LẶP LẠI thì không")
> Nguyên tắc: Claude SẼ sai — chấp nhận. Nhưng **phải học + cải tiến để KHÔNG mắc lại lỗi cũ.** Mỗi lần chủ DM sửa = ghi vào đây, lần sau đọc trước khi phán.

**🔑 LỖI GỐC (mẫu số chung mọi lần sai): ĂN NHÃN thay vì TRUY BẢN CHẤT.** Thấy 1 cái tên/nhãn là chép luôn thành kết luận, không hỏi tiếp 1 tầng. **Phản xạ bắt buộc: gặp bất kỳ nhãn nào → hỏi "ai thật sự cầm/trả/lợi, ở giá nào, tiền đi tầng nào, ngay hay rải, vì sao họ chịu?"**

**Các lỗi ĐÃ mắc (24/8, vụ NVL — đừng lặp):**
1. **"Trong FTSE = tốt"** → SAI. Phải hỏi RỔ NÀO: All-World (large+mid, $1,5 tỷ passive bám — chỉ VCB/VIC/VHM/BID/HPG/VPB) vs All-Cap (+small cap, KHÔNG có tiền) vs FTSE Vietnam Index (ETF Fubon/Xtrackers). NVL small-cap + bị loại ETF = bị bán + 0 tiền.
2. **"Miễn trừ = chỉ giãn"** → SAI. Thực tế CÓ xóa 1 phần gốc + hoán đổi cp. Đọc số thật, đừng dịch nhãn.
3. **"Hoán đổi @40k đẹp cho trái chủ"** → SAI. 40k > thị giá 13,3k = trái chủ LỖ, lợi CỔ ĐÔNG CŨ (ít pha loãng hơn).
4. **"Nợ UBS"** → SAI. UBS chỉ kế thừa Credit Suisse (ARRANGER 2021), KHÔNG phải chủ nợ. Chủ nợ = quỹ distressed ẩn danh.
5. **Báo số tĩnh (1.156 sổ hồng)** → thiếu. Phải NỐI với số cũ (752) ra ĐẠO HÀM (tốc độ).
6. **"PE 2,7 rẻ" (VCG)** → BẪY trailing one-off. Luôn tách core vs bất thường, xem forward + KH.
7. **Cảnh báo KHÔNG RĂNG (24/8, vụ SSI 40%):** để chủ DM dồn SSI lên ~40% DM qua 2 lệnh trong 1 ngày, mỗi lần chỉ "ghi 1 câu cảnh báo rồi ghi sổ như thường". Chủ DM sau đó tự thấy "sai sai — mày cũng không cản". Bài học: (a) khi lệnh mới đẩy 1 mã vượt ~25% vốn DM → **DỪNG, chỉ ra lỗ hổng bằng SỐ (kịch bản −10/−20% ăn bao nhiêu lời chốt), bắt xác nhận lần 2** rồi mới ghi — "tôn trọng quyết định" ≠ im re sau 1 câu; (b) rule ±20% cấp DM KHÔNG bảo vệ trước tập trung 1 mã (SSI phải −50% mới kích trigger DM) — phải nói rõ điều này NGAY LÚC lệnh vượt trần, không đợi hỏi.

8. **"VinMetal tới 2031 mới đè HPG"** → SAI/THIẾU (24/8, chủ DM sửa ngay trong ngày). Ăn nhãn "VinMetal = dự án Hà Tĩnh 2031" mà **không hỏi "tập đoàn đó còn CỬA NÀO vào ngành sớm hơn không?"**. Thực tế: VinMetal cho **Pomina vay lãi suất 0%** (11/2025) + ký hợp tác chiến lược + Vin ưu tiên Pomina làm nhà cung cấp thép cho hệ sinh thái → **có công suất + cảng Phú Mỹ + lò cao NGAY 2026**, không đợi 48 tháng xây. **Phản xạ mới: khi đánh giá đối thủ mới, luôn quét cả M&A/cho vay/liên minh với DN sẵn có trong ngành — không chỉ đọc dự án greenfield của họ.**

9. **Nhãn "% danh mục" đo theo MẪU SỐ NÀO (25/8, vụ plan trim SSI)** → plan 24/8 ghi "bán 55k cp về ~27% DM" nghe như đã xử lý xong tập trung. Chạy số lại: 27% đó là **/NAV**, mà NAV lúc đó đã phình vì gồm chính 1.375tr tiền vừa bán ra. Đo theo **giá trị cổ phiếu** thì vẫn **35,5%** — tập trung chỉ giảm 42,5→35,5, gần như không giải quyết gì. **Phản xạ mới: mỗi lần nói "X% danh mục", phải nói rõ /CP hay /NAV — và khi đánh giá tập trung thì dùng /CP, vì tiền mặt không chịu rủi ro giá.** Cùng họ với lỗi gốc: ăn nhãn "27%" thay vì truy mẫu số.

10. **Đặt 2 con số cạnh nhau mà không kiểm CÙNG RỔ hay không (25/8, vụ Aqua City)** → báo "1.156 sổ hồng" và ">1.000 căn đủ điều kiện kinh doanh" liền nhau như thể cùng một tập; chủ DM hỏi "156 căn không đủ điều kiện bán sao?" mới lộ ra đó là **hai rổ khác nhau** (sổ hồng = khách ĐÃ mua; đủ điều kiện kinh doanh = hàng CHƯA bán). Cùng họ lỗi #9 (mẫu số). **Phản xạ: mỗi khi trình 2 số gần nhau, hỏi "hai số này có cùng tập/cùng kỳ/cùng mẫu số không?" trước khi để chúng đứng cạnh nhau.** Và bài học kèm: câu hỏi tưởng như bắt bẻ vặt của chủ DM thường mở ra tầng dữ kiện lớn hơn — lần này truy tiếp ra **531/1.091 căn bị thế chấp VietinBank nên chưa ký được HĐ mua bán**.

11. **Ăn nhãn "LỖ" mà không truy nguyên nhân — và dán nhãn sai loại tiền (26/8, vụ PNJ, Claude TỰ phát hiện)** → hai sai trong một ca:
   (a) Gỡ PNJ khỏi re-entry watch vì *"Q2/2026 LỖ −283 tỷ"*. Thực tế lỗ do **trích dự phòng 865 tỷ vụ kim cương** — bỏ ra thì Q2 **lãi ~582 tỷ**, và **lãi gộp vẫn 1.560 tỷ** (kiểm chéo được ngay trong chính báo cáo). Đây là **one-off CHIỀU NGƯỢC**: lỗi #6 (VCG) dạy tách one-off làm ĐẸP số, tôi quên rằng one-off cũng làm XẤU số. **Phản xạ mới: gặp một quý lỗ/lãi đột biến, LUÔN so LNST với LÃI GỘP trước — lệch lớn = có khoản bất thường, phải truy ra tên khoản đó rồi mới kết luận.**
   (b) Viết *"ngoại mua PNJ = Vanguard thụ động bám FTSE, không phải conviction"*. Thực tế: **T. Rowe Price (quỹ CHỦ ĐỘNG) nâng 5,07%→6,02%, mua 4,9tr cp ngày 19/8 — TRƯỚC khi kết luận điều tra công bố**; và "Vanguard *International Value Fund*" là quỹ **active value**, không phải ETF chỉ số cùng tên. **Phản xạ mới: trước khi gọi tiền ngoại là "thụ động", phải ĐỌC TÊN QUỸ đầy đủ — cùng một nhà quản lý có cả quỹ index lẫn quỹ active; và kiểm NGÀY mua so với ngày tin ra (mua trước tin = chủ động, mua sau tin = có thể bám rổ).**
   Cùng mẫu số với lỗi gốc, chỉ là chiều ngược: lần trước ăn nhãn tốt thành tốt, lần này ăn nhãn xấu thành xấu. **Nhãn nào cũng phải truy một tầng.**

12. **Thấy nhãn "giao dịch quyền mua" → mặc định là BÁN, không truy chiều (27/8, vụ MBB, Claude tự phát hiện)** → ngày 26/8 tôi đọc 5 thông báo *"GD quyền mua của người nội bộ MBB"* thành *"quyền đang chạy ra thị trường → pha loãng chưa hấp thụ xong → giá bị đè kỹ thuật"*. Thực tế đó là **lãnh đạo ĐĂNG KÝ THỰC HIỆN quyền mua — tức bỏ tiền mua thêm**: 24 lãnh đạo cấp cao thực hiện 6,57 triệu cp (~65,7 tỷ @10.000đ), Chủ tịch Lưu Trung Thái đăng ký nhiều nhất ~1,07tr cp, TGĐ Phạm Như Ánh thực hiện TOÀN BỘ. Chiều tín hiệu ngược hẳn với cái tôi kết luận. **Phản xạ mới: mọi tin "giao dịch"/"thực hiện quyền"/"thay đổi sở hữu" đều PHẢI xác định CHIỀU (mua hay bán) và AI trước khi diễn giải — tiêu đề công bố hầu như không bao giờ nói chiều.** Cùng họ lỗi gốc và lỗi #11(b): ba ngày liền cùng một dạng — ăn nhãn thay vì truy một tầng.

13. **Xác định đúng CHIỀU rồi dừng — quên hỏi hành động đó có TỐN KÉM không (28/8, vụ MBB, Claude tự phát hiện, nối tiếp lỗi #12)** → 27/8 tôi sửa lỗi #12 xong thì ghi *"24 lãnh đạo thực hiện quyền mua 6,57tr cp = nội bộ MUA = tín hiệu tốt"*. Chiều ĐÚNG, nhưng **độ mạnh tôi đánh giá cao quá**: quyền mua @10.000 trong khi thị giá 20.950 là **lãi sẵn ~109%** — gần như không ai bỏ quyền, kể cả người KHÔNG tin vào doanh nghiệp. Bỏ quyền = tự vứt tiền. Vậy hành động này gần như **không mang thông tin** về niềm tin nội bộ, khác hẳn việc bỏ tiền tươi mua trên sàn ở thị giá. **Phản xạ mới: sau khi xác định CHIỀU (lỗi #12), hỏi thêm một tầng — "hành động này có TỐN KÉM/RỦI RO gì cho người làm không?" Hành động không tốn kém thì không phải conviction, chỉ là nhặt tiền rơi.** Áp cho cả: thực hiện quyền mua giá thấp, nhận cổ tức CP, ESOP giá ưu đãi, đăng ký mua nhưng "không thực hiện được do điều kiện thị trường".

14. **Xếp hai sự kiện cạnh nhau mà không kiểm CÙNG HẠNG — và coi "vay được" là "khoẻ" (4/9, vụ trái phiếu, chủ DM hỏi "bán được TP là tốt sao?")** → hai sai trong một ca:
   (a) Trong rây tin tôi xếp **"PDR thanh toán LÃI cho 3 lô TP 11.000 tỷ"** cạnh **"ACBS MUA LẠI TRƯỚC HẠN lô 200 tỷ"**, cùng một bên "TỐT". Hai việc **khác hạng hoàn toàn**: mua lại trước hạn = tất toán bằng tiền thật, **xoá nợ**; trả lãi = **nghĩa vụ tối thiểu để không bị coi là vỡ nợ** — trả được lãi ≠ trả được gốc. Và "11.000 tỷ" là **quy mô nợ đang lưu hành**, không phải thành tích. Đúng họ lỗi #10 (mẫu số), chỉ khác trục: lần này là **cùng hạng hay không**.
   (b) Ngầm coi **"huy động/bán được trái phiếu" = đã xử lý xong**. SAI. Bán được TP = **VAY được, không phải KIẾM được** — một nghĩa vụ mới thay nghĩa vụ cũ, làm **CFF dương** (đúng mẫu "đốt tiền + vay bù"). **Nợ chỉ giảm THẬT khi tiền đến từ CFO hoặc bán tài sản.** Phân biệt sống còn: NVL trả nợ bằng **vốn cổ phần** (rights 8.007 tỷ) → nợ **giảm thật**, giá là pha loãng 33,5%; KBC trả nợ bằng **TP mới 700 tỷ** → nợ **y nguyên**, chỉ dời hạn, và còn **thiếu 300 tỷ**.
   **PHẢN XẠ MỚI — gặp tin "bán được / huy động được trái phiếu", hỏi đủ 6 câu trước khi gọi là tốt:** (1) **lãi suất** bao nhiêu so với lô cũ — cao hơn = thị trường đòi đền bù rủi ro cao hơn = tin XẤU (KBC12401 cũ 10,5%; lô mới 700 tỷ CHƯA công bố lãi); (2) **ai mua** — bên liên quan/ngân hàng trong hệ sinh thái thì không phải thị trường định giá, chỉ là chuyển tiền trong nhà; (3) **thế chấp bằng gì** — mỗi lần phát hành có TSBĐ là đem thêm tài sản đi cầm, tài sản sạch cạn dần, đến lúc hết thì đã muộn (Greenwich: TP bảo đảm bằng **cổ phiếu NVL**, đã phải xử lý TSBĐ 560 tỷ); (4) **đủ không** (700 < 1.000); (5) **kỳ hạn** đổi thế nào — dài hơn là dời rủi ro, không xoá; (6) **đã bán được chưa** — KBC đến giờ vẫn chưa có filing xác nhận.
   **Câu chốt để nhớ:** *"bán được TP" là điều kiện CẦN để sống sót, KHÔNG phải bằng chứng khoẻ. Tin "KHÔNG bán được" mới là tín hiệu mạnh; tin "bán được" thì phải hỏi 6 câu rồi mới biết nó nói gì.*
   **Hệ quả kèm (đọc chi phí lãi vay):** KBC ghi nhận lãi vay 6T/2026 >550 tỷ trên nợ vay ~32.700 tỷ = chỉ ~3,4%/năm, trong khi TP của chính họ lãi 10,5%. Chênh đó là **lãi vay được VỐN HOÁ vào chi phí dự án dở dang** (đúng chuẩn mực, không phải làm đẹp sổ) — nhưng nghĩa là **LNST đã sau khi phần lớn gánh nặng lãi được đưa vào bảng cân đối**, lãi tiền mặt thật cao hơn nhiều so với P&L thể hiện. **Với DN thâm dụng vốn (BĐS/KCN/hạ tầng), luôn đọc thuyết minh "chi phí đi vay được vốn hoá" trước khi tin con số lợi nhuận.**


15. **LẶP LẠI: dùng feed FireAnt làm bằng chứng PHỦ ĐỊNH (4/9, vụ KBC) — lỗi tôi đã TỰ VIẾT CẢNH BÁO rồi vẫn mắc** → Tôi báo **nhiều lần liên tiếp** rằng *"KBC im lặng ngày thứ 5/6, chưa có filing nào về lô TP 1.000 tỷ"*, và còn nâng nó thành luận điểm rủi ro (*"im lặng kéo dài giữa lúc TP BĐS phân hoá = rủi ro tăng"*). **SAI.** KBC **đã công bố kết quả phát hành lên HNX từ cuối tháng 8**: mã KBCL12601, 700 tỷ, phát hành 20/8, **hoàn tất 25/8** — tức TRƯỚC ngày đáo hạn 28/8 ba ngày. Tôi kết luận "im lặng" chỉ vì **không thấy trong feed FireAnt**. Nặng hơn: trong chính hồ sơ NVL (2/9) tôi đã tự viết *"feed chỉ trả 8 tin và thiên về bài báo, nên KHÔNG được dùng làm bằng chứng PHỦ ĐỊNH"* — rồi vẫn lặp lại với KBC suốt nhiều báo cáo.
   **PHẢN XẠ MỚI (bắt buộc):** *"Không thấy trong feed" ≠ "không có".* Feed FireAnt/CafeF là mẫu, không phải toàn bộ. **Trước khi phát biểu bất kỳ câu PHỦ ĐỊNH nào ("chưa công bố", "vẫn im lặng", "không có tin"), phải WebSearch tối thiểu một vòng bằng ĐÚNG MÃ TRÁI PHIẾU / SỐ NGHỊ QUYẾT / TÊN SỰ KIỆN.** Nếu không search được thì phải viết là **"tôi chưa tìm thấy"**, KHÔNG viết **"chưa có"** — hai câu đó khác nhau về bản chất và cái sau là một khẳng định tôi không có quyền đưa ra.
   **Bài học kép:** một cảnh báo đã ghi vào sổ mà không có BƯỚC KIỂM CỤ THỂ đi kèm thì không ngăn được tái phạm. Nên lỗi này đi kèm một bước hành động, không chỉ một câu nhắc.


16. **Đọc một con số TĨNH thành một luận điểm về DÒNG CHẢY (4/9, vụ room ngoại, chủ DM chặn: "rộng hẹp chưa nói được gì cả")** → Tôi trình bảng room ngoại toàn rổ rồi kết luận: *"nếu vốn ngoại vào sau nâng hạng, nó bị chặn ở nhóm bank và phải chảy sang chỗ còn room — mà chỗ còn room rộng nhất là chứng khoán"*. **Luận điểm này sai ở ba tầng:**
   (a) **NHÂN QUẢ NGƯỢC.** Room rộng phần lớn là **HỆ QUẢ của việc ngoại KHÔNG muốn mua**, không phải cơ hội đang chờ. Mã ngoại thích thì **hết room** (MWG 49,0% kín tròn, PNJ 45,3%, TCB, VCB, MBB). Mã room trống là mã ngoại **không thèm** (VIX SH ngoại 7,5% · KBC 7,0% · ANV 2,5%). Tôi ăn nhãn "rộng = tốt" thay vì hỏi **VÌ SAO nó rộng**.
   (b) **KHÔNG CÓ CƠ CHẾ "TRÀN".** Quỹ thụ động phân bổ theo **trọng số trong rổ**; mã hết room bị cắt trọng số thì tiền chia lại cho **các mã khác trong rổ theo trọng số**, không chảy sang một ngành khác vì ngành đó "còn chỗ". Quỹ chủ động mua theo luận điểm. **Không ai bơm tiền vào một chỗ chỉ vì nó trống.**
   (c) **DỮ LIỆU CỦA CHÍNH TÔI PHẢN BÁC.** Cùng độ trống, hai chiều ngược nhau: VIX room 88,1% → ngoại **mua** mạnh nhất DM (+398,3 tỷ); VCI room 83,1%, ANV 46,3%, KBC 42,1% → ngoại **bán**. Room không dự báo được chiều, kể cả dấu.
   **PHẢN XẠ MỚI: room (và mọi số TĨNH: %sở hữu, tồn kho, số dư, land bank) không mang thông tin về chiều. Nó chỉ có nghĩa khi ghép với ĐẠO HÀM — tốc độ đang đầy lên hay vơi đi.** Phép biến đổi cụ thể: `số phiên để lấp đầy room = room ÷ (tốc độ ngoại mua ròng)`. Kết quả 4/9 trên toàn universe: **chỉ PNJ (36 phiên) và MBB (171 phiên)** là room sắp thành ràng buộc thật; cụm CK thì SSI **5.140 phiên (~20 năm)**, VIX 1.600 phiên — tức room của cụm CK **thực tế là vô hạn, nên nó KHÔNG phải ràng buộc mà là KHÔNG LIÊN QUAN**. Luận điểm (b) của tôi sập hoàn toàn khi đổi từ tĩnh sang đạo hàm.
   Cùng họ **lỗi #5** (báo số tĩnh 1.156 sổ hồng, quên nối ra tốc độ) — nhưng nặng hơn vì lần này tôi còn **xây một luận điểm đầu tư** trên số tĩnh đó.


**Cách cải tiến (tự áp mỗi lần):** (a) ưu tiên nguồn GỐC (FireAnt filing / English SGX cho quốc tế), không chép báo VN; (b) đọc TỔ HỢP số (LNST vs lãi gộp vs CFO) để bắt one-off; (c) khi chủ DM sửa → ghi vào sổ này NGAY, không để trôi.

## Nhãn tier (dùng trong divcal/tiers)
`[H]`=CẦM (hàng mình, từ positions.json) · `[W]`=watch (thử việc) · `[U]`=universe (theo dõi, chưa mua) · `[*]`=ngoài universe. **Chỉ [H] là hàng của mình.**

## Bối cảnh hệ thống (tham khảo nhanh)
- `extract_ticker.js` — công cụ đọc FireAnt. Mode: mặc định snapshot · `--all` (holdings) · `--universe` · `--cfo` · `--news` · `--divcal` · `--discover` · `--pruneuniverse` · `--tiers` · `--rodp` (lọc đích rổ dự phòng) · `--fast`.
- GitHub Action `fireant.yml`: holdings 3×/ngày (8:30/12:00/15:30 VN) → `analysis/latest.md`; universe + divcal/discover/prune/**rodp** 16:30 → `analysis/*` (gồm `ro_du_phong_auto.md`). Token `FIREANT_TOKEN` chỉ ở GitHub Secrets (không đọc FireAnt được ở local).
- **File sống** (tạo khi cần, mỗi trục/mã một file): `<ma>_watch.md` = nhật ký sự kiện + luận điểm TIẾN HOÁ · `macro.md` = chain log vĩ mô · `rui_ro_danh_muc.md`. Rổ xoay: `ro_du_phong.md`. Vị thế: `positions.json`.

## Nguyên tắc làm việc (chủ DM đã dặn)
- **Honest, đừng "ảo"** — phản biện thẳng, không tô hồng. Cảnh báo khi lệnh phá kế hoạch chủ DM tự đặt (vd bình quân NVL trước mốc −20%).
- Cập nhật `positions.json` khi có giao dịch → commit → merge main qua PR. Phát triển trên branch riêng rồi merge về `main` qua PR.
- Tin ngoài (cafef bị chặn bot) → dùng WebSearch định tuyến vòng.
