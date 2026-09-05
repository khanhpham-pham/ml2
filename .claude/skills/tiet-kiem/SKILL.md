---
name: tiet-kiem
description: Quy tắc làm việc TIẾT KIỆM (token + quota FireAnt + thời gian chờ) trong repo danh mục ml2. Dùng skill này TRƯỚC khi đọc file lớn (analysis/universe-latest.md, CLAUDE.md), trước khi trigger GitHub Action fireant.yml, hoặc trước khi WebSearch — tức gần như mọi phiên soi danh mục, rây tin, báo cáo DM, kiểm cổ tức. Kể cả khi chủ DM không nói chữ "tiết kiệm".
---

# Tiết kiệm — làm việc rẻ trong ml2

Repo này được thiết kế để **dữ liệu đắt tiền được nấu sẵn rồi commit vào git**
(comment trong `fireant.yml`: *"đọc lại bằng get_file_contents — rẻ token"*).
Mỗi lần bỏ qua cái đã nấu sẵn để gọi lại từ đầu là đốt tiền hai lần.

## Bậc thang chi phí — luôn leo từ dưới lên

| Bậc | Hành động | Giá |
|---|---|---|
| 1 | `grep` / `sed` / `awk` trên file local | gần như 0 |
| 2 | Đọc nguyên một file `analysis/*` | vài nghìn → **~90k token** (xem bảng dưới) |
| 3 | `git fetch origin main` rồi đọc lại | rẻ, ~vài giây |
| 4 | WebSearch | trung bình, có độ trễ |
| 5 | Trigger `fireant.yml` + chờ ~90s | đắt nhất: quota FireAnt + thời gian chủ DM ngồi đợi |

**Không bao giờ nhảy thẳng bậc 5 khi chưa làm bậc 1–3.**

## Kích thước thật (đo 5/9/2026) — biết trước khi mở

| File | Bytes | Cách đọc đúng |
|---|--:|---|
| `analysis/universe-latest.md` | **272.748** (~90k token) | **CẤM `cat`.** Chỉ trích mã cần: `grep -n '^## MA' -A 25` |
| `CLAUDE.md` | 28.330 | `grep -n '^#\{1,3\} '` lấy mục lục → `sed -n 'X,Yp'` đúng mục |
| `analysis/latest.md` | 9.817 | đọc cả được (27 mã holdings) |
| `analysis/cafef_tin.md` | 7.572 | đọc cả được |
| `analysis/ro_du_phong_auto.md` | 2.504 | đọc cả được |
| `analysis/co_tuc_lich.md` | 2.107 | đọc cả được |

Mục lục `CLAUDE.md` (dòng bắt đầu, dùng cho `sed -n`):
`9` cổ tức · `19` quỹ · `29` nguyên tắc đầu tư · `37` rổ dự phòng · `45` trạng thái DM ·
`56` phương pháp phân tích · `78` **sổ lỗi** · `130` nhãn tier · `133` bối cảnh hệ thống · `138` nguyên tắc làm việc.

## Kiểm ĐỘ TƯƠI trước khi trigger workflow

Lịch cron đã chạy sẵn (giờ VN), **không cần trigger tay nếu file còn trong nhịp**:

- `analysis/latest.md` — holdings, **8:30 / 12:00 / 15:30** mỗi ngày
- `analysis/universe-latest.md` + `co_tuc_lich.md` + `ro_du_phong_auto.md` — universe, **16:30**
- `daily-brief.md` — **20:00** T2–T6

Quy trình: `git fetch origin main` → đọc **header timestamp** của file →
nếu đã có bản của nhịp gần nhất thì **dùng luôn, không trigger**.
Chỉ trigger khi thật sự cần dữ liệu mới hơn nhịp gần nhất (vd cổ tức trong ngày, theo rule CỔ TỨC).

Trigger thì trigger **hẹp**: `tickers:"MA1 MA2"` thay vì để trống (chạy cả 27/131 mã);
`--fast` khi chỉ cần giá; `--news` chỉ cho mã đang soi, không cho cả universe.

## Không chạy được ở local — đừng phí lượt thử

`FIREANT_TOKEN` **chỉ nằm ở GitHub Secrets**. Chạy `node extract_ticker.js` trong session
này sẽ luôn fail. Đường duy nhất để có dữ liệu FireAnt mới là qua GitHub Action.

## Thói quen rẻ

- Gom các lệnh độc lập vào **một** lượt (nhiều tool call song song), đừng đi từng cái một.
- **Không đọc lại** file vừa đọc hoặc vừa sửa trong cùng phiên.
- Dùng `git show origin/<branch>:<file>` thay vì checkout cả branch để xem một file.
- Trả lời bằng bảng/gạch đầu dòng ngắn — chủ DM đọc trên phone, không đọc văn dài.
- Không WebSearch lại thứ vừa search trong cùng phiên.

## 🚫 KHÔNG được tiết kiệm ở những chỗ này

Tiết kiệm token **không bao giờ** được đổi bằng một báo cáo sai. Các chỗ bắt buộc tốn:

1. **Câu phủ định** ("chưa công bố", "vẫn im lặng", "không có tin") → **bắt buộc WebSearch**
   bằng đúng mã trái phiếu / số nghị quyết / tên sự kiện trước khi phát biểu.
   Không search được thì viết **"tôi chưa tìm thấy"**, không viết "chưa có". (Sổ lỗi #15)
2. **Hỏi về cổ tức / GDKHQ** → luôn fetch mới theo rule ở `CLAUDE.md:9`, không trả lời từ trí nhớ.
3. **Hỏi về quỹ ngoại** → luôn WebSearch mới, dữ liệu quỹ đổi nhanh (`CLAUDE.md:19`).
4. **Mọi con số vị thế / tỷ trọng** → đọc `positions.json`, không nhớ, không chép số cứng
   từ `CLAUDE.md` (số sống chỉ nằm ở `positions.json`).
5. **Trước khi phán về một mã** → đọc sổ lỗi (`CLAUDE.md:78`) nếu ca đó dính nhãn/số tĩnh/chiều giao dịch.

Nguyên tắc chốt: **rẻ ở khâu LẤY dữ liệu, không rẻ ở khâu KIỂM chứng.**
