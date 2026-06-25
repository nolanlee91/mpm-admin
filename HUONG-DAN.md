# Hướng dẫn dùng KOL Console

Công cụ nội bộ để quản KOL của MicroPoker Master: tạo mã, theo dõi hoa hồng, trả tiền,
xử lý refund. **Không phải app khách.**

> ⚠️ Mọi thao tác ở đây là **THẬT** (Stripe live + database thật). Tạo KOL = tạo promo
> code thật; Mark paid = ghi sổ đã trả; Reverse = loại commission khỏi payout.

---

## 1. Mở & đăng nhập

- **Local (đang test):** chạy `npm run dev` → mở `http://localhost:5173`
- **Sau khi deploy:** `https://admin.micropokermaster.com`

Đăng nhập bằng **email + mật khẩu** của tài khoản nằm trong `ADMIN_EMAILS`. Email khác
→ màn "Not authorized" (đúng thiết kế — khách không vào được).

---

## 2. Tạo KOL mới

Mục **Create KOL** → điền form → bấm **Create KOL**:

| Ô | Ý nghĩa |
|---|---|
| **Name** *(bắt buộc)* | Tên KOL (hiện trong bảng + gắn vào promo code) |
| **Email** | Email liên hệ trả tiền + **chặn self-referral** (KOL tự mua bằng code của mình → không tính hoa hồng) |
| **Promo code** *(bắt buộc)* | Mã khách gõ ở Checkout, vd `NOLAN`. Chữ HOA, 3–20 ký tự, không dấu cách |
| **Commission %** | Hoa hồng KOL nhận, mặc định **20** |
| **Discount %** | Giảm giá cho khách, mặc định **10** |
| **Max uses** | Giới hạn số lần dùng mã (0 = không giới hạn) |

Thành công → hiện dòng xanh **✓ Created NOLAN — 10% off, you earn 20%…**. Copy mã đó
gửi KOL. Từ giờ ai mua bằng mã này sẽ tự được giảm 10% và tự ghi hoa hồng cho KOL.

> Thay cho việc chạy `node scripts/create-kol.mjs` trong terminal — giờ chỉ bấm nút.

---

## 3. Đọc dashboard

**4 thẻ trên cùng:**
- **Pay now (matured)** — tổng tiền **trả được ngay** lúc này (gộp mọi KOL)
- **Active KOLs** — số KOL
- **Revenue generated** — tổng doanh thu KOL mang về
- **Unpaid (all)** — tổng chưa trả, kể cả khoản chưa đủ 30 ngày

**Bảng "KOLs & payouts"** — mỗi dòng 1 KOL:
- **Pay now** — 🟢 **SỐ DUY NHẤT để trả** (đã mature >30 ngày, chưa trả, chưa bị refund)
- **Unpaid (incl. immature)** — gồm cả khoản chưa đủ 30 ngày (chưa nên trả)
- **Already paid** — đã trả rồi
- **Revenue** — doanh thu KOL đó tạo ra

**Bảng "Recent commissions"** — từng giao dịch có hoa hồng, trạng thái:
- 🟡 **unpaid** — đã ghi nhận, chưa trả
- 🟢 **paid** — đã trả
- 🔴 **reversed** — đã refund/chargeback, bị loại khỏi payout

---

## 4. Quy trình TRẢ TIỀN hằng tháng

> Console **không tự chuyển tiền**. Bạn trả KOL bằng PayPal/chuyển khoản… như thỏa thuận,
> rồi vào đây **ghi sổ** là đã trả.

1. Mở console, nhìn cột **Pay now** của từng KOL.
2. Nếu **Pay now ≥ ngưỡng tối thiểu** (gợi ý $25) → **chuyển tiền thật** cho KOL.
3. Sau khi **đã chuyển xong**, bấm **Mark paid** ở dòng KOL đó → xác nhận.
4. Pay now về $0, khoản đó dồn sang **Already paid**.

⚠️ Chỉ bấm **Mark paid** SAU KHI đã chuyển tiền thật. Nút này chỉ ghi sổ, không gửi tiền.
Nếu Pay now < ngưỡng → để tháng sau (khoản đó vẫn nằm trong Unpaid, không mất đi).

---

## 5. Xử lý REFUND / chargeback

Khi 1 khách đòi lại tiền (refund) hoặc chargeback:

1. Tìm giao dịch đó trong **Recent commissions** (theo mã + thời gian).
2. Bấm **Reverse** → xác nhận.
3. Commission đó bị loại khỏi payout (chuyển trạng thái **reversed**).

- Nếu khoản đó **chưa trả** → xong, không phải làm gì thêm.
- Nếu khoản đó **đã trả rồi** (refund muộn) → app cảnh báo *"was already paid"*. Lúc đó
  phải **thu hồi tay**: trừ số đó vào kỳ payout tới của KOL (ghi chú lại để khỏi trừ lặp).

> Console chưa tự phát hiện refund — bạn theo dõi refund/chargeback bên **Stripe**, rồi
> vào đây bấm Reverse. (Đỡ rủi ro vì mình chỉ trả khoản đã >30 ngày — qua hầu hết refund.)

---

## 6. Ghi nhớ nhanh

- Tạo KOL test? Dùng mã `TESTKOL`, xong **xóa**: promo code bên Stripe + `delete from kols where promo_code='TESTKOL'`.
- Tất cả là **dữ liệu thật** — không có chế độ giả lập.
- KOL **không** tự đăng nhập xem được; bạn báo số cho họ (xem README phần "what this does NOT do").
- Mã hết hạn năm đầu **tự động**: coupon hết sau 12 tháng → hết giảm → hết ghi hoa hồng.
