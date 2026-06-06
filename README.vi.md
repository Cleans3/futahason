# futahason.com — Bộ kiểm thử tự động Playwright (E2E)

> 🇬🇧 English version: [`README.md`](./README.md) · 📖 Tài liệu gốc chi tiết: [`CLAUDE.md`](./CLAUDE.md)

Bộ kiểm thử đầu-cuối (end-to-end) cho **[futahason.com](https://futahason.com)**
(FUTA Hà Sơn — nhà xe khách liên tỉnh), viết bằng **Playwright + TypeScript** theo mô hình
**Page Object Model (POM)**.

Bộ test bao phủ **3 luồng nghiệp vụ** theo đúng tên sản phẩm:

| # | Tính năng | Ý nghĩa | File spec |
|---|-----------|---------|-----------|
| 1 | **Đăng nhập** | Đăng nhập bằng OTP | `tests/login.spec.ts` |
| 2 | **Tìm kiếm chuyến xe** | Tìm chuyến xe | `tests/search-trip.spec.ts` |
| 3 | **Điền thông tin thanh toán** | Điền thông tin thanh toán | `tests/payment-info.spec.ts` |

Toàn bộ danh sách test case (31 ca, có cả ca thủ công/âm tính/chính sách) nằm trong file
Excel **`test-cases/TestCases_Futahason.xlsx`** — xem **Mục 7**.

> ✅ Mọi selector, luồng và thông báo trong tài liệu này đều được **kiểm chứng trực tiếp**
> trên website production khi xây dựng bộ test — không phải phỏng đoán.

---

## Mục lục

1. [Phạm vi kiểm thử](#1-phạm-vi-kiểm-thử)
2. [Nguyên tắc vàng — an toàn với production](#2-nguyên-tắc-vàng--an-toàn-với-production)
3. [Cách hoạt động thực tế của ứng dụng](#3-cách-hoạt-động-thực-tế-của-ứng-dụng)
4. [Kiến trúc dự án](#4-kiến-trúc-dự-án)
5. [Cài đặt & chạy test](#5-cài-đặt--chạy-test)
6. [Những điểm đặc biệt cần lưu ý (quirks)](#6-những-điểm-đặc-biệt-cần-lưu-ý-quirks)
7. [Bộ test case (Excel)](#7-bộ-test-case-excel)
8. [Bảo trì & mở rộng](#8-bảo-trì--mở-rộng)

---

## 1. Phạm vi kiểm thử

Ba hành trình người dùng được tự động hoá. Mỗi ca test có **mã định danh ổn định**
(`TC-LOGIN-01`, `TC-SEARCH-04`, `TC-PAY-06`…) xuất hiện đồng nhất ở: tiêu đề test, file
spec, và file Excel — dùng mã này khi báo lỗi và truy vết.

Kết quả mặc định của `npm test`: **17 ca pass, 3 ca skip** (3 ca skip là cố ý — cần số điện
thoại OTP thật hoặc phiên đăng nhập đã lưu, xem Mục 5).

---

## 2. Nguyên tắc vàng — an toàn với production

futahason.com là **hệ thống production thật**, không có môi trường staging công khai. Vì
vậy bộ test **không gây tác động phá huỷ** và tuân thủ các nguyên tắc sau:

1. **Không bao giờ hoàn tất đặt vé / thanh toán thật.** Các test thanh toán chỉ *điền*
   thông tin, **không bấm nút thanh toán cuối**. Cờ `ALLOW_REAL_BOOKING` (mặc định `false`)
   chỉ để mở khoá việc gửi đơn trên môi trường sandbox trong tương lai — **tuyệt đối không
   bật trên production**.
2. **Đăng nhập chỉ bằng OTP.** Mã xác thực gửi qua SMS/Zalo nên chỉ con người có điện thoại
   test mới *hoàn tất* đăng nhập được. Test tự động phủ tới bước *yêu cầu OTP*; bước hoàn
   tất là thao tác thủ công (`npm run auth:setup`).
3. **Không "dội bom" website.** Trang bị lỗi đua (race) khi chạy song song nặng (xem Mục 6),
   nên bộ test **chạy tuần tự** theo mặc định.

Nếu một nguyên tắc nào đó chặn test, test sẽ **tự bỏ qua (skip)** thay vì giả vờ thành công.

---

## 3. Cách hoạt động thực tế của ứng dụng

### 3.1 Đăng nhập — không mật khẩu, dùng OTP

```
Nút "Đăng nhập" trên header  →  mở popup
  ├─ <select> mã quốc gia   (giá trị option mặc định là "84", hiển thị "+84")
  ├─ <input> SĐT (placeholder "Số điện thoại")  ← KHÔNG chặn ký tự: nhập gì cũng được
  └─ nút "Đăng nhập"  →  gửi OTP qua SMS/Zalo  →  bước nhập mã
```

- Bấm "Đăng nhập" khi SĐT **rỗng hoặc sai** thì **không qua bước sau** và **không hiện lỗi
  inline** — popup chỉ đứng yên ở bước nhập SĐT. Do đó test khẳng định *"không chuyển bước"*
  thay vì kiểm tra một thông báo (vì không có thông báo ổn định để kiểm tra).
- Hoàn tất đăng nhập (nhập OTP) cần mã thật → ngoài phạm vi chạy mặc định; do
  `tests/auth.setup.ts` đảm nhiệm.

### 3.2 Tìm kiếm chuyến xe

```
Widget tìm kiếm ở trang chủ
  ├─ tab: "Xe Liên Tỉnh" (đang chọn) | "Xe hợp đồng" | "Hàng hóa"
  ├─ checkbox "Khứ hồi"  →  hiện thêm ô ngày về
  ├─ "Chọn điểm đi"   →  dialog: tỉnh → mở rộng → chọn bến
  ├─ "Chọn điểm đến"  →  dialog 2 cấp tương tự
  ├─ ô "Ngày khởi hành" (DevExpress, định dạng dd/MM/yyyy, mặc định hôm nay)
  └─ nút "Tìm chuyến"  →  trang kết quả /datve/<route base64>
```

- **Các tỉnh hiện có:** Bắc Giang, Bắc Ninh, Đà Nẵng, Hà Nam, Hà Nội, Hà Tĩnh, Lào Cai,
  Nghệ An, Ninh Bình, Phú Thọ, Quảng Bình, Quảng Trị, Thái Nguyên, Thanh Hóa,
  Thừa Thiên Huế, Vĩnh Phúc, Yên Bái.
- **Tuyến chuẩn dùng trong bộ test:** `Lào Cai (TP Lào Cai, Bến Đền, Xuân Giao, Phố Lu)`
  → `Hà Nội` (đã kiểm chứng có chuyến mỗi ngày).
- **Thẻ kết quả** hiển thị: loại xe (`ECONOMY 34 CABIN` / `VIP 34 CABIN` / `ROYAL 24 CABIN`),
  `Từ <giá>đ`, giờ đi/đến + bến, số ghế trống, và nút vàng **"Chọn chỗ"**.
- **Kiểm tra ràng buộc:** tìm khi chưa chọn điểm đi → thông báo
  *"Bạn chưa chọn điểm xuất phát"*; chưa chọn điểm đến → *"Bạn chưa chọn điểm đến"*. Trang
  **không** chuyển sang kết quả.

### 3.3 Điền thông tin thanh toán — phễu đặt vé

Form thanh toán nằm ở **cuối một phễu nhiều bước**, và bước cuối **bị chặn bởi đăng nhập**:

```
kết quả → "Chọn chỗ"          → sơ đồ ghế (Tầng 1/2; ghế C1-1…; chú thích Ghế trống/Đang chọn/Đã đặt)
        → chọn ghế
        → tick "Tôi đồng ý với điều khoản"   (mở popup Điều khoản; phải Đồng ý)
        → "Tiếp tục"
        → chọn "Điểm đón" + "Điểm trả"
        → "Xác nhận"
        → ⛔ BẮT BUỘC ĐĂNG NHẬP OTP  ← form thông tin/thanh toán nằm SAU cổng này
        → (sau khi đăng nhập) thông tin: Họ tên, SĐT, Email + phương thức thanh toán
```

**Các "cổng" ràng buộc đã phát hiện (bộ test đều kiểm tra):**

| Thao tác | Thông báo chặn |
|----------|----------------|
| "Tiếp tục" khi chưa đồng ý điều khoản | `Bạn chưa đồng ý với điều khoản…` |
| "Xác nhận" khi chưa chọn điểm đón/trả | `Bạn vui lòng chọn điểm đón/trả` |
| "Xác nhận" khi chưa đăng nhập | Hiện popup đăng nhập OTP (thanh toán bị chặn) |

Vì form nằm sau cổng OTP, tính năng thanh toán được tách làm 2 nhóm:
- **Chưa đăng nhập** — đi hết phễu và kiểm tra mọi cổng ràng buộc ở trên (luôn chạy).
- **Đã đăng nhập** — dùng phiên đã lưu để tới và điền form (tự skip nếu thiếu
  `auth/user.json`; **không bao giờ** gửi đơn).

---

## 4. Kiến trúc dự án

```
KTPMN/
├─ CLAUDE.md                     ← tài liệu gốc chi tiết (tiếng Anh)
├─ README.md / README.vi.md      ← hướng dẫn nhanh (Anh / Việt)
├─ playwright.config.ts          ← cấu hình: chạy tuần tự, vi-VN / Asia-HCMC, báo cáo
├─ package.json                  ← scripts + ghim @playwright/test ^1.58.2
├─ .env.example                  ← copy thành .env (BASE_URL, TEST_PHONE, cờ)
├─ pages/                        ← Page Object Model
│  ├─ BasePage.ts                  dùng chung: xử lý popup, safeClick, forceClick
│  ├─ HomePage.ts                  header + widget tìm kiếm + bộ chọn tỉnh/bến
│  ├─ LoginModal.ts               popup OTP
│  ├─ SearchResultsPage.ts        thẻ chuyến /datve
│  └─ BookingPage.ts              ghế → điều khoản → điểm đón/trả → cổng → form thanh toán
├─ fixtures/
│  ├─ test-data.ts                NGUỒN DỮ LIỆU DUY NHẤT: tuyến, SĐT, nhãn, thông báo
│  └─ fixtures.ts                 tiêm sẵn page object; cờ `hasSavedAuth`
├─ tests/
│  ├─ login.spec.ts               TC-LOGIN-*
│  ├─ search-trip.spec.ts         TC-SEARCH-*
│  ├─ payment-info.spec.ts        TC-PAY-*
│  └─ auth.setup.ts               đăng nhập OTP một lần → lưu auth/user.json
├─ scripts/
│  └─ generate-testcases-xlsx.mjs trình tạo .xlsx không cần thư viện ngoài (chỉ zlib)
├─ test-cases/
│  └─ TestCases_Futahason.xlsx    bộ test case (3 sheet)
└─ auth/                          phiên đăng nhập đã lưu (đã .gitignore)
```

**Quy ước:**
- **Page Object Model.** Thân test đọc như chuỗi hành động nghiệp vụ; mọi selector nằm
  trong page object — **không** để selector trong file spec.
- **Một nguồn dữ liệu duy nhất.** Tuyến đường, SĐT mẫu, nhãn UI và thông báo lỗi nằm trong
  `fixtures/test-data.ts`. File Excel dùng cùng mã ID và thông báo, nên khi nội dung site
  đổi chỉ cần sửa một nơi.

---

## 5. Cài đặt & chạy test

```bash
npm install                 # cài @playwright/test + dotenv
npx playwright install chromium

npm test                    # chạy toàn bộ, tuần tự (Chromium)
npm run test:login          # chạy theo từng tính năng
npm run test:search
npm run test:payment
npm run test:headed         # xem trình duyệt chạy
npm run test:ui             # chế độ UI của Playwright
npm run report              # mở báo cáo HTML gần nhất
```

Cấu hình tuỳ chọn — copy `.env.example` thành `.env`:

| Biến | Ý nghĩa |
|------|---------|
| `BASE_URL` | Đổi sang môi trường staging nếu có |
| `TEST_PHONE` | SĐT test thật; mở khoá `TC-LOGIN-06` (gửi OTP) |
| `STORAGE_STATE` | Mặc định `auth/user.json` |
| `ALLOW_REAL_BOOKING` | **Giữ `false`** trên production |

### Chạy nhóm test thanh toán cần đăng nhập

```bash
npm run auth:setup          # mở trình duyệt; bạn tự nhập OTP một lần → lưu auth/user.json
npm run test:payment        # TC-PAY-08/09 sẽ chạy (vẫn KHÔNG gửi thanh toán)
```

Nếu chưa có `auth/user.json`, các test cần đăng nhập **tự skip**, nên `npm test` luôn xanh
ngay từ đầu.

### Kết quả mặc định mong đợi

`npm test` → **17 pass, 3 skip**. Ba ca skip là cố ý:
- `TC-LOGIN-06` — cần `TEST_PHONE`.
- `TC-PAY-08`, `TC-PAY-09` — cần phiên OTP đã lưu.

---

## 6. Những điểm đặc biệt cần lưu ý (quirks)

Đây là **hành vi thật** của ứng dụng production. **Đừng "đơn giản hoá"** chúng đi.

1. **Chạy tuần tự (`workers: 1`).** Phễu đặt vé bị lỗi đua khi chạy song song — test
   *flaky* ở 2+ worker và *ổn định* ở 1 (đã kiểm chứng). Chỉ tăng worker khi chạy với
   staging. Vẫn giữ 1 lần *retry* để hấp thụ trục trặc mạng thoáng qua.

2. **Trang kết quả động liên tục.** Các carousel "Tuyến phổ biến" / "Tin tức" tự chạy nên
   phần tử không bao giờ "ổn định" theo chuẩn của Playwright. Vì vậy click ghế và nút dùng
   **`force: true`** (`BasePage.forceClick`).

3. **…nhưng checkbox Syncfusion lại bỏ qua force click.** Checkbox điểm đón/trả
   (`.e-checkbox-wrapper`) **không** toggle khi force click — phải dùng click *thường* lên
   `.e-frame`. Hàm `checkSyncfusion` làm việc này rồi khẳng định `aria-checked="true"` để
   nếu click trượt thì test báo lỗi rõ ràng.

4. **Tên tỉnh trùng tên bến.** Chọn điểm đến "Hà Nội" gây nhập nhằng: header tỉnh và bến con
   cùng chữ "Hà Nội". `HomePage.pickLocation` chờ bến con render (số phần tử thành 2) rồi
   mới click phần tử cuối.

5. **Mã quốc gia có giá trị `"84"`, nhãn `"+84"`.** Thẻ `<select>` lưu `84`; hãy kiểm tra
   theo `COUNTRY_CODE_VALUE`, không phải nhãn hiển thị.

6. **Checkbox "Khứ hồi" khớp 2 phần tử.** Một wrapper được tô kiểu và một `<input>` thật
   đều có tên truy cập. Toggle qua wrapper (`roundTripToggle`); kiểm tra trạng thái trên
   input thật (`roundTripCheckbox = …and(locator('input'))`).

7. **Có 2 nút "Đăng nhập" theo responsive** (desktop + mobile); thao tác trên nút đang hiển
   thị (`.filter({ visible: true })`).

8. **Ô ngày là DevExpress** kèm một ô ngày-về ẩn; nhắm tới `input.dxbs-date-edit-input`
   đang hiển thị.

9. **Checkbox điều khoản khác với link điều khoản.** Click vào *ô checkbox* để đồng ý;
   click vào *chữ* bên cạnh sẽ mở popup Điều khoản (bấm "Đồng ý" để đóng). Page object
   click thẳng vào ô input.

10. **Popup hệ thống có 2 loại** — popup cảnh báo tuỳ biến (`[role=dialog]` với 1 nút
    "Đồng ý") cho phần kiểm tra ràng buộc, và Syncfusion `.e-dlg-container` cho nội dung
    Điều khoản. `BasePage.alert` / `expectAlert` xử lý được cả hai.

---

## 7. Bộ test case (Excel)

`test-cases/TestCases_Futahason.xlsx` được **sinh tự động**, không sửa tay:

```bash
npm run testcases:xlsx
```

- Tạo bởi `scripts/generate-testcases-xlsx.mjs` — trình ghi OOXML/zip **không cần thư viện
  ngoài** (chỉ dùng `zlib` của Node; không phải `npm install` thư viện office). File xuất ra
  là `.xlsx` chuẩn (đã kiểm chứng: "Microsoft Excel 2007+", zip hợp lệ).
- **3 sheet:** `Test Cases` (31 ca × 12 cột, có header tô màu, đóng băng dòng tiêu đề,
  bộ lọc), `Summary` (thống kê độ bao phủ theo tính năng / độ ưu tiên), `Traceability`
  (truy vết Mã TC ↔ spec/test).
- **Để thêm/sửa ca test:** sửa mảng `TESTS` ở đầu script (và sửa spec tương ứng), rồi chạy
  lại `npm run testcases:xlsx`. Giữ mã ID đồng bộ với spec.

Các cột: `Mã TC · Tính năng · Tiêu đề · Điều kiện tiên quyết · Các bước · Dữ liệu test ·
Kết quả mong đợi · Độ ưu tiên · Loại · Tự động hóa · Spec/Test · Trạng thái`.

---

## 8. Bảo trì & mở rộng

- **Nội dung site thay đổi?** Cập nhật `fixtures/test-data.ts` (`MESSAGES`, `LABELS`,
  `ROUTE`) và mảng `TESTS` trong script Excel, rồi tạo lại file workbook.
- **Thêm luồng mới?** Thêm page object (hoặc method), thêm test `TC-…`, và thêm một dòng
  vào mảng `TESTS` của Excel với cùng mã ID.
- **Selector bị "trôi"?** Ưu tiên locator theo role/text/label (như đang dùng) hơn CSS/XPath;
  kiểm chứng lại với `npm run codegen`.
- **Gặp flaky?** Trước tiên xác nhận không phải do chạy song song — chạy `--workers=1`.
  Phễu đặt vé thường là thủ phạm (Mục 6.1–6.3).
- **CI:** chạy trên Chromium, giữ `workers` = 1, `retries: 2`. Cấp `TEST_PHONE` và
  `auth/user.json` mới như secret để chạy luôn các ca OTP/đăng nhập.

---

📖 **Cần chi tiết sâu hơn?** Xem [`CLAUDE.md`](./CLAUDE.md) — tài liệu gốc đầy đủ (tiếng Anh).
