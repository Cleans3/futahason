# futahason.com — Bộ kiểm thử tự động Playwright (E2E)

> 🇬🇧 English version: [`README.md`](./README.md) · 📖 Tài liệu gốc chi tiết: [`CLAUDE.md`](./CLAUDE.md)

Bộ kiểm thử đầu-cuối (end-to-end) cho **[futahason.com](https://futahason.com)**
(FUTA Hà Sơn — nhà xe khách liên tỉnh), viết bằng **Playwright + TypeScript** theo mô hình
**Page Object Model (POM)**.

Bộ test bao phủ **3 luồng nghiệp vụ** theo đúng tên sản phẩm:

| # | Tính năng                             | Ý nghĩa                     | File spec                      |
| - | --------------------------------------- | ----------------------------- | ------------------------------ |
| 1 | **Đăng nhập**                  | Đăng nhập bằng OTP        | `tests/login.spec.ts`        |
| 2 | **Tìm kiếm chuyến xe**         | Tìm chuyến xe               | `tests/search-trip.spec.ts`  |
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
5. [Cài đặt &amp; chạy test](#5-cài-đặt--chạy-test)
6. [Những điểm đặc biệt cần lưu ý (quirks)](#6-những-điểm-đặc-biệt-cần-lưu-ý-quirks)
7. [Bộ test case (Excel)](#7-bộ-test-case-excel)
8. [Bảo trì &amp; mở rộng](#8-bảo-trì--mở-rộng)
9. [Giải thích chuyên sâu code (Deep Dive)](#9-giải-thích-chuyên-sâu-code-deep-dive)
   - [9.1 Bức tranh tổng thể: dữ liệu chảy qua các tầng](#91-bức-tranh-tổng-thể-dữ-liệu-chảy-qua-các-tầng)
   - [9.2 Tầng dữ liệu — `fixtures/test-data.ts`](#92-tầng-dữ-liệu--fixturestest-datats)
   - [9.3 Tầng tiêm phụ thuộc — `fixtures/fixtures.ts`](#93-tầng-tiêm-phụ-thuộc--fixturesfixturests)
   - [9.4 `BasePage.ts` — vũ khí dùng chung](#94-basepagets--vũ-khí-dùng-chung)
   - [9.5 `HomePage.ts` và mổ xẻ `pickLocation` từng dòng](#95-homepagets-và-mổ-xẻ-picklocation-từng-dòng)
   - [9.6 `LoginModal.ts` — vì sao không kiểm tra thông báo lỗi](#96-loginmodalts--vì-sao-không-kiểm-tra-thông-báo-lỗi)
   - [9.7 `SearchResultsPage.ts`](#97-searchresultspagets)
   - [9.8 `BookingPage.ts` — phễu đặt vé và 2 loại click](#98-bookingpagets--phễu-đặt-vé-và-2-loại-click)
   - [9.9 Ba file spec đọc thế nào](#99-ba-file-spec-đọc-thế-nào)
   - [9.10 `auth.setup.ts` — cầu nối thủ công ↔ tự động](#910-authsetupts--cầu-nối-thủ-công--tự-động)
   - [9.11 Script Excel: tự sinh `.xlsx` không cần thư viện](#911-script-excel-tự-sinh-xlsx-không-cần-thư-viện)

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

| Thao tác                                      | Thông báo chặn                                    |
| ---------------------------------------------- | ---------------------------------------------------- |
| "Tiếp tục" khi chưa đồng ý điều khoản | `Bạn chưa đồng ý với điều khoản…`        |
| "Xác nhận" khi chưa chọn điểm đón/trả | `Bạn vui lòng chọn điểm đón/trả`           |
| "Xác nhận" khi chưa đăng nhập            | Hiện popup đăng nhập OTP (thanh toán bị chặn) |

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

| Biến                  | Ý nghĩa                                             |
| ---------------------- | ----------------------------------------------------- |
| `BASE_URL`           | Đổi sang môi trường staging nếu có             |
| `TEST_PHONE`         | SĐT test thật; mở khoá `TC-LOGIN-06` (gửi OTP) |
| `STORAGE_STATE`      | Mặc định `auth/user.json`                        |
| `ALLOW_REAL_BOOKING` | **Giữ `false`** trên production             |

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

Các cột: `Mã TC · Tính năng · Tiêu đề · Điều kiện tiên quyết · Các bước · Dữ liệu test · Kết quả mong đợi · Độ ưu tiên · Loại · Tự động hóa · Spec/Test · Trạng thái`.

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

## 9. Giải thích chuyên sâu code (Deep Dive)

Chương này giải thích **bên trong từng file** — dành cho người cần hiểu/bảo trì/mở rộng
code, không chỉ chạy nó. Đọc xong chương này bạn sẽ hiểu *vì sao* mỗi dòng tồn tại.

### 9.1 Bức tranh tổng thể: dữ liệu chảy qua các tầng

Bộ test có **4 tầng**, mỗi tầng chỉ biết tầng ngay dưới nó:

```
  tests/*.spec.ts          ← Tầng 4: KỊCH BẢN — "kiểm tra cái gì" (đọc như tiếng người)
        │  gọi xuống
        ▼
  pages/*.ts (POM)         ← Tầng 3: HÀNH ĐỘNG — "làm thế nào để click/điền" (chứa selector)
        │  dùng
        ▼
  fixtures/test-data.ts    ← Tầng 2: DỮ LIỆU — tuyến, SĐT, nhãn, thông báo (1 nguồn duy nhất)
        │  bọc bởi
        ▼
  fixtures/fixtures.ts     ← Tầng 1: KHUNG — tiêm sẵn page object vào mỗi test
```

**Nguyên tắc xuyên suốt:** selector chỉ tồn tại ở Tầng 3; chuỗi văn bản (nhãn, thông báo)
chỉ tồn tại ở Tầng 2. Khi site đổi → sửa đúng một tầng, các tầng khác không động tới.

**Một vòng đời test điển hình** (ví dụ `TC-SEARCH-01`):

```ts
test('TC-SEARCH-01...', async ({ home, results }) => {  // (1) fixtures tiêm home + results
  await home.searchTrip(ROUTE.from, ROUTE.to);          // (2) page object thao tác bằng dữ liệu từ test-data
  await results.expectLoaded();                          // (3) page object kiểm tra URL + nút "Chọn chỗ"
  await results.expectHasTrips();                        // (4) assertion nghiệp vụ: có ≥ 1 chuyến
});
```

Test không hề biết selector nào được dùng — đó là điểm mạnh.

---

### 9.2 Tầng dữ liệu — `fixtures/test-data.ts`

File này là **"hợp đồng"** giữa code tự động và file Excel: cùng một mã TC, cùng một câu
thông báo. Các nhóm hằng số:

| Hằng số                     | Vai trò                                      | Bẫy đã xử lý                                                        |
| ----------------------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| `ROUTE`                     | Tuyến chuẩn Lào Cai → Hà Nội            | Lưu**cả** `province` lẫn `station` vì bộ chọn có 2 cấp |
| `BUS_TYPES`                 | 3 loại xe để kiểm thẻ kết quả          | —                                                                       |
| `PHONES`                    | SĐT mẫu (hợp lệ/ngắn/chữ/lẫn)          | `valid` lấy từ `.env`, không hardcode số thật                   |
| `COUNTRY_CODE_VALUE = '84'` | Giá trị thật của dropdown                 | **Hiển thị "+84" nhưng giá trị là "84"**                     |
| `MESSAGES`                  | Câu báo lỗi**nguyên văn** từ site | Test so khớp*substring* các chuỗi này                              |
| `LABELS`                    | Nhãn nút/ô                                 | Page object dùng để định vị theo `role`/`name`                 |
| `AUTH_FILE`                 | Nơi đọc phiên đăng nhập                | Mặc định `auth/user.json`, ghi đè qua `.env`                    |

> **Vì sao quan trọng:** khi đội sản phẩm đổi câu *"Bạn chưa chọn điểm xuất phát"* thành câu
> khác, bạn chỉ sửa **một dòng** ở đây — cả 20 test tự động lẫn file Excel đều cập nhật theo.

---

### 9.3 Tầng tiêm phụ thuộc — `fixtures/fixtures.ts`

Đây là cơ chế **fixture** của Playwright. Thay vì mỗi test tự viết `const home = new HomePage(page)`, ta mở rộng `test` gốc để **tự động** cấp sẵn 3 page object:

```ts
export const test = base.extend<Fixtures>({
  home:    async ({ page }, use) => { await use(new HomePage(page)); },
  results: async ({ page }, use) => { await use(new SearchResultsPage(page)); },
  booking: async ({ page }, use) => { await use(new BookingPage(page)); },
});
```

- `base.extend(...)` tạo một phiên bản `test` "giàu" hơn. Mỗi key (`home`/`results`/`booking`)
  là một fixture; Playwright gọi nó trước mỗi test, đưa kết quả vào tham số destructuring
  `async ({ home }) => ...`.
- `use(value)` là cách fixture "trả" giá trị cho test (mọi thứ sau `use` là dọn dẹp — ở đây
  không cần).
- `hasSavedAuth = fs.existsSync(AUTH_FILE)` — đọc *một lần* khi nạp file, dùng làm "công tắc"
  cho `test.skip(...)` ở nhóm thanh toán cần đăng nhập.

Nhờ vậy mọi spec chỉ cần `import { test, expect } from '../fixtures/fixtures'` (không phải
từ `@playwright/test`) là có ngay page object.

---

### 9.4 `BasePage.ts` — vũ khí dùng chung

Lớp cha trừu tượng (`abstract class`) mọi page object kế thừa. Chứa 5 thành viên, mỗi cái
giải một vấn đề thật của site Blazor + Syncfusion:

| Thành viên         | Làm gì                                               | Vì sao cần                                                                  |
| -------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `alert` (getter)   | Định vị popup có nút "Đồng ý"                  | Site báo lỗi bằng popup giữa màn, không phải lỗi inline               |
| `expectAlert(msg)` | Khẳng định popup chứa `msg` hiện ra             | Dùng trong mọi test "âm" của phễu đặt vé                              |
| `dismissAlert()`   | Bấm "Đồng ý" để đóng popup (nếu có)          | Dọn dẹp giữa các bước                                                   |
| `safeClick(t)`     | `scrollIntoView` rồi click **thường**       | Tránh widget hotline/footer che mất nút                                    |
| `forceClick(t)`    | `scrollIntoView` rồi click **`force:true`** | Trang có carousel xoay liên tục → phần tử không bao giờ "đứng yên" |

**Mấu chốt `safeClick` vs `forceClick`** — đây là sự phân biệt sống còn của cả dự án:

- Playwright mặc định *chờ phần tử ổn định* trước khi click (chống click trượt). Nhưng trang
  kết quả có carousel tự chạy → layout **không bao giờ ổn định** → click thường bị **treo tới
  timeout**. Vì thế ghế/nút trên trang đó phải dùng `forceClick` (bỏ qua kiểm tra ổn định).
- *Nhưng* checkbox Syncfusion (điểm đón/trả) lại **không nhận force click** — xem 9.8. Đó là
  lý do tồn tại song song cả hai hàm.

---

### 9.5 `HomePage.ts` và mổ xẻ `pickLocation` từng dòng

`HomePage` là page object phức tạp nhất vì widget tìm kiếm đầy "bẫy". Các locator trong
constructor đều giải một quirk (xem bảng Mục 6). Phần khó nhất là `pickLocation` — hàm dùng
chung cho cả chọn điểm đi lẫn điểm đến. Mổ xẻ từng đoạn:

```ts
private async pickLocation(trigger: Locator, place: Place): Promise<void> {
  const dialog = this.page.getByRole('dialog');
```

> Tham chiếu tới dialog chọn địa điểm. `trigger` là ô "Chọn điểm đi" **hoặc** "Chọn điểm đến"
> — nhờ tham số hoá nên một hàm phục vụ cả hai.

```ts
  await expect(async () => {
    await trigger.click();
    await expect(dialog).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
```

> **Bẫy #1 — click bị "nuốt" lúc trang hydrate.** Khi Blazor chưa gắn xong sự kiện, cú click
> đầu tiên có thể không mở dialog. `expect(async () => {...}).toPass()` **thử lại cả khối**
> (click + kiểm tra dialog) cho tới khi thành công, tối đa 15 giây. Đây là *retry có chủ đích*
> ở mức thao tác, khác với retry toàn bộ test.

```ts
  const provinceOption = dialog.getByText(place.province, { exact: true }).first();
  await expect(provinceOption).toBeVisible();
  await provinceOption.click();
```

> Mở nhóm tỉnh: tìm đúng chữ tên tỉnh (vd "Lào Cai"), chờ nó hiện (dialog có hiệu ứng trượt
> vào), rồi bấm để bung danh sách bến con.

```ts
  const leaf = dialog.getByText(place.station, { exact: true });
  await expect(leaf).toHaveCount(place.province === place.station ? 2 : 1);
  await leaf.last().click();
```

> **Bẫy #2 — tên tỉnh trùng tên bến.** Với "Hà Nội", *header tỉnh* và *bến con* cùng chữ
> "Hà Nội" → có **2** phần tử cùng text. Với "Lào Cai", bến tên dài khác tỉnh → chỉ **1**.
> Dòng `toHaveCount(... ? 2 : 1)` vừa **chờ** bến con render xong, vừa **khẳng định** đúng số
> lượng. Sau đó `.last()` luôn chọn *bến con* (phần tử cuối), không bao giờ nhầm header tỉnh.

```ts
  await expect(trigger).toHaveValue(place.station);
}
```

> **Chốt hạ:** xác nhận ô input giờ hiển thị đúng tên bến đã chọn → đảm bảo thao tác thực sự
> có hiệu lực trước khi hàm trả về (không "click rồi đi luôn" mà chưa biết kết quả).

Hai hàm `selectDeparture` / `selectDestination` chỉ là vỏ bọc gọi `pickLocation` với ô tương
ứng; `searchTrip(from, to)` ghép chọn-đi + chọn-đến + bấm tìm thành một "happy path".

---

### 9.6 `LoginModal.ts` — vì sao không kiểm tra thông báo lỗi

Đặc thù quan trọng nhất của modal đăng nhập: **ô SĐT không có input mask** (gõ gì cũng nhận)
và khi nhập sai, site **không hiện lỗi inline** — nó chỉ *đứng yên ở bước nhập SĐT*. Do đó
chiến lược kiểm tra không thể là "tìm câu báo lỗi" mà phải là **"chứng minh modal chưa
chuyển bước"**:

```ts
async expectStillOnPhoneStep(): Promise<void> {
  await expect(this.dialog).toBeVisible();      // modal vẫn mở
  await expect(this.phoneInput).toBeVisible();  // vẫn thấy ô SĐT
  await expect(this.otpInputs).toHaveCount(0);  // CHƯA có ô nhập mã OTP nào
}
```

> `otpInputs` = `input[maxlength="1"]` — các ô 1-ký-tự chỉ render *sau khi* OTP được gửi.
> Đếm chúng = 0 nghĩa là "chưa gửi OTP" = "đã chặn thành công". Đây là cách kiểm thử *gián
> tiếp qua trạng thái UI* khi không có thông báo trực tiếp để bám vào.

Modal được định vị bằng cách lọc theo dòng gợi ý OTP (`hasText: MESSAGES.login.otpHint`) để
không nhầm với dialog khác trên trang.

---

### 9.7 `SearchResultsPage.ts`

Page object nhỏ nhất nhưng có một bẫy tinh tế:

```ts
this.selectSeatButtons = page
  .locator('button.cyber-button-yellow')      // chỉ nút VÀNG
  .filter({ hasText: LABELS.selectSeat });    // và có chữ "Chọn chỗ"
```

> Trên trang có **hai** nút chứa chữ "Chọn chỗ": nút vàng (chọn ghế thật) và nút mở chi tiết
> xe (`btnChiTietXe`). Lọc theo class `cyber-button-yellow` để chỉ nhắm đúng nút chọn ghế.

- `expectLoaded()` kiểm tra **2 điều kiện**: URL khớp `/datve/` *và* có ít nhất một nút chọn
  chỗ hiện ra → chắc chắn đã sang trang kết quả thật.
- `expectCardsWellFormed()` kiểm tra mỗi thẻ có **giá** (regex `/Từ\s?[\d.]+/`) và **loại xe**
  (regex ghép từ `BUS_TYPES`) — xác nhận dữ liệu thẻ hợp lệ, không chỉ là khung rỗng.

---

### 9.8 `BookingPage.ts` — phễu đặt vé và 2 loại click

Đây là nơi hội tụ nhiều quirk nhất. Phễu đi theo đúng thứ tự thật:
**chọn ghế → điều khoản → Tiếp tục → đón/trả → Xác nhận → cổng OTP**.

**Quirk A — checkbox điều khoản nằm "ẩn" sau cái nhãn:**

```ts
private get termsCheckbox(): Locator {
  const span = this.page.locator('span.cyber-hover', { hasText: 'điều khoản' })
    .filter({ visible: true });
  return span.locator('xpath=preceding-sibling::input[@type="checkbox"]');
}
```

> Bấm vào *chữ* "điều khoản" sẽ **mở popup điều khoản** (không phải tick). Ô tick thật là
> `<input type=checkbox>` đứng *ngay trước* nhãn đó → dùng XPath `preceding-sibling` để nhắm
> đúng nó, rồi `.check({ force: true })`.

**Quirk B — hai loại click cho hai loại phần tử (điểm cốt lõi):**

| Phần tử                        | Hàm dùng                      | Vì sao                                                                                 |
| -------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------- |
| Ghế, nút Tiếp tục/Xác nhận | `forceClick` (`force:true`) | Trang có carousel xoay → phần tử không "ổn định"                                |
| Checkbox đón/trả (Syncfusion) | `safeClick` (click thường)  | Loại checkbox này**bỏ qua** force click — phải click thật vào `.e-frame` |

```ts
private async checkSyncfusion(wrapper: Locator): Promise<void> {
  await expect(wrapper).toBeVisible();
  await this.safeClick(wrapper.locator('.e-frame'));        // click THƯỜNG vào khung
  await expect(wrapper).toHaveAttribute('aria-checked', 'true'); // và kiểm tra ĐÃ tick
}
```

> Dòng `toHaveAttribute('aria-checked','true')` rất quan trọng: nếu click trượt (không tick
> được), test **báo lỗi rõ ràng tại đây** thay vì âm thầm đi tiếp rồi fail mơ hồ ở bước sau.

**Quirk C — định vị "điểm trả" bằng vị trí tương đối:**

```ts
'xpath=//*[normalize-space(text())="Điểm trả"]/following::*[contains(@class,"e-checkbox-wrapper")][1]'
```

> Các checkbox đón và trả giống hệt nhau về class. Để lấy đúng checkbox *đầu tiên nằm SAU*
> tiêu đề "Điểm trả", ta dùng trục XPath `following::` — phân biệt đón/trả bằng *vị trí trong
> trang*, không bằng class.

**Ranh giới `expectLoginGate()`** — sau khi xác nhận hợp lệ mà chưa đăng nhập, site hiện
modal OTP. Đây là điểm dừng của bộ test không-đăng-nhập (form thanh toán nằm *sau* cổng này).

---

### 9.9 Ba file spec đọc thế nào

Vì logic nằm hết trong page object, các spec đọc gần như tiếng Việt thuần. Mẫu chung:
`beforeEach` đưa về trạng thái xuất phát → thân test gọi vài hành động → `expect` kiểm tra.

- **`login.spec.ts` (TC-LOGIN-01→07):** mỗi test `beforeEach` mở trang chủ. Các test "âm"
  (03/04/05) đều kết bằng `expectStillOnPhoneStep()`. TC-LOGIN-06 mở đầu bằng
  `test.skip(!process.env.TEST_PHONE, ...)` → **tự bỏ qua** khi không có số thật.
- **`search-trip.spec.ts` (TC-SEARCH-01→08):** chạy thật end-to-end. Các test "âm" (04/05)
  kiểm tra **2 điều**: câu báo lỗi hiện ra *và* URL **không** đổi sang `/datve/` (không cho
  qua trang). TC-SEARCH-06 kiểm định dạng ngày bằng regex `/^\d{2}\/\d{2}\/\d{4}$/`.
- **`payment-info.spec.ts`:** chia **2 nhóm `describe`**:
  - *Chưa đăng nhập* — `beforeEach` tìm sẵn chuyến, rồi mỗi test đẩy phễu sâu thêm một nấc và
    kiểm cổng tương ứng (TC-PAY-01/03/05/06).
  - *Đã đăng nhập* — mở đầu bằng `test.skip(!hasSavedAuth, ...)` + `test.use({ storageState })`
    để tải phiên. `beforeEach` đi *hết* phễu; TC-PAY-08/09 điền form và **cố ý dừng**, kèm
    comment cấm submit trên production.

---

### 9.10 `auth.setup.ts` — cầu nối thủ công ↔ tự động

Đây là lời giải cho bài toán "OTP không tự động hoá được". Nó là một *test đặc biệt* (chạy
qua project `setup`, không nằm trong `npm test`):

1. `test.skip(!process.env.TEST_PHONE, ...)` — không có số thật thì bỏ qua.
2. `test.setTimeout(180_000)` — chừa 3 phút để người gõ OTP tay.
3. Mở trang → mở modal → điền SĐT → bấm gửi OTP.
4. **Bước thủ công:** người thật gõ OTP vào trình duyệt (chạy `--headed`).
5. `await expect(home.loginTrigger.first()).toBeHidden({ timeout: 150_000 })` — chờ tới khi
   nút "Đăng nhập" *biến mất* (dấu hiệu đăng nhập thành công).
6. `page.context().storageState({ path: AUTH_FILE })` — **lưu cookie/localStorage** vào
   `auth/user.json`.

Sau đó các test thanh toán authenticated *tải lại* file này qua `storageState` và bỏ hẳn
bước đăng nhập. Một lần làm tay → nhiều lần chạy tự động.

---

### 9.11 Script Excel: tự sinh `.xlsx` không cần thư viện

`scripts/generate-testcases-xlsx.mjs` tạo file Excel **chỉ bằng `zlib` của Node** — không
`npm install` thư viện office nào. Điều này khả thi vì: **một file `.xlsx` thực chất là một
file ZIP chứa nhiều file XML** theo chuẩn OOXML. Script làm 3 việc lớn:

**(1) Sinh XML cho từng sheet.** Các hàm trợ giúp:

- `esc(s)` — thoát ký tự đặc biệt của XML (`& < > "`).
- `colLetter(i)` — đổi chỉ số cột `0,1,2…` → chữ Excel `A,B,…,Z,AA,…` (hệ cơ số 26 lệch).
- `cell(col,row,text,style)` — dựng một ô `<c>` dạng *inline string* kèm chỉ số style.
- `sheetXml(rows, widths, freezeRows, autoFilterRef, merges)` — ráp các dòng thành một
  worksheet hoàn chỉnh, hỗ trợ: độ rộng cột, **đóng băng** dòng tiêu đề (`<pane>`), **bộ lọc**
  (`<autoFilter>`), và **gộp ô** (`<mergeCells>`).
- `STYLES` — bảng style viết tay (font, màu nền header xanh `FF1F4E78`, viền, canh chữ).
  5 style: mặc định / tiêu đề / header / thân-wrap / thân-canh-giữa.

Ba sheet được dựng từ cùng mảng `TESTS`:

- **Test Cases** — 31 ca × 12 cột, có tiêu đề gộp, header tô màu, freeze + autofilter.
- **Summary** — đếm độ bao phủ theo tính năng và theo độ ưu tiên (tính bằng `countBy`).
- **Traceability** — đối chiếu Mã TC ↔ spec/test.

**(2) Khai báo các "phần" của gói OOXML** (`parts`): `[Content_Types].xml` (khai kiểu nội
dung), `_rels/.rels` + `xl/_rels/workbook.xml.rels` (quan hệ giữa các phần), `xl/workbook.xml`
(danh sách sheet), `xl/styles.xml`, và 3 file `xl/worksheets/sheetN.xml`.

**(3) Tự đóng gói ZIP bằng tay** (vì không dùng thư viện). Hàm `zip(files)` ghi đúng định
dạng ZIP nhị phân:

- `crc32(buf)` — tính checksum CRC32 cho mỗi file (ZIP bắt buộc). Bảng tra `CRC_TABLE` dựng
  sẵn 256 phần tử.
- Mỗi file: ghi **local header** (30 byte, chữ ký `0x04034b50`) + tên + dữ liệu đã nén bằng
  `deflateRawSync` (method 8).
- Cuối file: **central directory** (mỗi mục 46 byte, chữ ký `0x02014b50` — như "mục lục") +
  bản ghi **EOCD** (22 byte, chữ ký `0x06054b50` — báo số file và vị trí mục lục).
- Mọi số ghi dạng **little-endian** (`writeUInt32LE/16LE`) đúng đặc tả ZIP.

> Kết quả: chạy `npm run testcases:xlsx` in ra `✓ Wrote 31 test cases across 3 sheets` và tạo
> một file `.xlsx` mở được bằng Excel thật (đã kiểm chứng: nhận diện "Microsoft Excel 2007+",
> zip hợp lệ). **Để sửa nội dung:** chỉ chỉnh mảng `TESTS` ở đầu file rồi chạy lại — toàn bộ
> phần XML/ZIP tự lo.

---

📖 **Cần chi tiết sâu hơn?** Xem [`CLAUDE.md`](./CLAUDE.md) — tài liệu gốc đầy đủ (tiếng Anh).
