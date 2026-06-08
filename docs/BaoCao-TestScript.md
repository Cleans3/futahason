# XÂY DỰNG TEST SCRIPT VÀ THỰC HIỆN KIỂM THỬ HỆ THỐNG WEBSITE ĐẶT VÉ XE TRỰC TUYẾN FUTA HÀ SƠN

Chương này trình bày quá trình xây dựng các kịch bản kiểm thử tự động (Test Script) và
thực hiện kiểm thử đối với Website Đặt vé xe trực tuyến FUTA Hà Sơn bằng công cụ
**Playwright**. Nội dung chương tập trung vào việc thiết kế các trường hợp kiểm thử (Test
Case), xây dựng các kịch bản kiểm thử tự động và thực hiện kiểm thử trên các chức năng nằm
trong phạm vi nghiên cứu của đề tài.

Các chức năng được lựa chọn để kiểm thử bao gồm **Đăng nhập**, **Tìm kiếm chuyến xe** và
**Điền thông tin thanh toán**. Đối với mỗi chức năng, nhóm tiến hành xây dựng các trường
hợp kiểm thử dựa trên yêu cầu nghiệp vụ và các tình huống sử dụng thực tế của người dùng.
Sau đó, các Test Case được triển khai thành các Test Script bằng Playwright để tự động hóa
quá trình kiểm thử.

> **Lưu ý quan trọng về phạm vi và môi trường kiểm thử:**
> - Website FUTA Hà Sơn là **hệ thống production (thật)**, không có môi trường staging công
>   khai. Do đó bộ kiểm thử được thiết kế **không gây thay đổi dữ liệu** (non-destructive):
>   không bao giờ hoàn tất một giao dịch đặt vé/thanh toán thật.
> - Chức năng **Đăng nhập sử dụng OTP (không mật khẩu)**: mã xác thực một lần được gửi qua
>   SMS/Zalo. Vì vậy các trường hợp kiểm thử đăng nhập được điều chỉnh theo đúng cơ chế thực
>   tế của hệ thống (kiểm tra số điện thoại, không có "tên đăng nhập/mật khẩu").

---

## 1. Tổng quan kiến trúc Test Script

Bộ kiểm thử được tổ chức theo mô hình **Page Object Model (POM)** — tách phần *định vị
phần tử trên giao diện* (selector) ra khỏi phần *kịch bản kiểm thử*. Nhờ vậy, kịch bản đọc
như các bước nghiệp vụ và dễ bảo trì khi giao diện thay đổi.

```
KTPMN/
├─ playwright.config.ts          # Cấu hình chạy test (locale vi-VN, chạy tuần tự...)
├─ fixtures/
│  ├─ test-data.ts               # Nguồn dữ liệu test duy nhất (tuyến, SĐT, nhãn, thông báo)
│  └─ fixtures.ts                # Tiêm sẵn các Page Object cho test
├─ pages/                        # Page Object Model
│  ├─ BasePage.ts                # Hàm dùng chung (xử lý popup, click an toàn)
│  ├─ HomePage.ts                # Trang chủ + widget tìm kiếm
│  ├─ LoginModal.ts              # Modal đăng nhập OTP
│  ├─ SearchResultsPage.ts       # Trang kết quả chuyến đi
│  └─ BookingPage.ts             # Phễu đặt vé tới bước thanh toán
└─ tests/                        # Các Test Script (kịch bản kiểm thử)
   ├─ login.spec.ts              # Kiểm thử Đăng nhập
   ├─ search-trip.spec.ts        # Kiểm thử Tìm kiếm chuyến xe
   ├─ payment-info.spec.ts       # Kiểm thử Điền thông tin thanh toán
   └─ auth.setup.ts              # Thiết lập đăng nhập OTP một lần (thủ công)
```

**Luồng phụ thuộc:** `Cấu hình → Dữ liệu test → Fixtures → Page Objects → Test Scripts`.

### 1.1. Cấu hình kiểm thử — `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

export const BASE_URL = process.env.BASE_URL ?? 'https://futahason.com';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 1,     // Tự chạy lại 1 lần khi lỗi mạng thoáng qua
  workers: 1,                          // Chạy TUẦN TỰ (site chập chờn khi chạy song song)
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL: BASE_URL,
    locale: 'vi-VN',                   // Ngôn ngữ tiếng Việt
    timezoneId: 'Asia/Ho_Chi_Minh',   // Múi giờ VN → ngày dd/MM/yyyy
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',          // Lưu trace để debug khi test fail
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  expect: { timeout: 10_000 },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/, use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

**Giải thích các thiết lập then chốt:**
- `workers: 1`: chạy tuần tự. Đã kiểm chứng phễu đặt vé bị tranh chấp khi chạy song song
  (chập chờn ở 2+ luồng, ổn định ở 1 luồng).
- `locale: 'vi-VN'` + `timezoneId`: ghim ngôn ngữ và múi giờ để kết quả nhất quán.
- `trace / screenshot / video`: chỉ thu thập khi test thất bại → chạy nhanh, vẫn đủ dữ liệu
  để phân tích lỗi.

### 1.2. Dữ liệu test — `fixtures/test-data.ts`

```typescript
// Tuyến liên tỉnh chuẩn đã kiểm chứng luôn có chuyến để tìm
export const ROUTE = {
  from: { province: 'Lào Cai', station: 'Lào Cai (TP Lào Cai, Bến Đền, Xuân Giao, Phố Lu)' },
  to:   { province: 'Hà Nội', station: 'Hà Nội' },
} as const;

export const BUS_TYPES = ['ECONOMY 34 CABIN', 'VIP 34 CABIN', 'ROYAL 24 CABIN'] as const;

// Các số điện thoại mẫu cho test đăng nhập OTP
export const PHONES = {
  valid: process.env.TEST_PHONE ?? '0901234567',
  tooShort: '0901',        // Số quá ngắn
  nonNumeric: 'abcxyz',    // Không phải chữ số
} as const;

export const COUNTRY_CODE_VALUE = '84';   // Thẻ select lưu "84" (không phải "+84")

// Các thông báo lỗi đúng nguyên văn quan sát trên hệ thống
export const MESSAGES = {
  search: {
    missingDeparture: 'Bạn chưa chọn điểm xuất phát',
    missingDestination: 'Bạn chưa chọn điểm đến',
  },
  booking: {
    termsNotAccepted: 'Bạn chưa đồng ý với điều khoản',
    pickupDropoffMissing: 'Bạn vui lòng chọn điểm đón/trả',
  },
  login: { otpHint: 'Nhập mã xác thực được gửi tới Số điện thoại hoặc Zalo' },
} as const;

export const LABELS = {
  loginButton: 'Đăng nhập', searchButton: 'Tìm chuyến', roundTrip: 'Khứ hồi',
  pickDeparture: 'Chọn điểm đi', pickDestination: 'Chọn điểm đến',
  selectSeat: 'Chọn chỗ', continue: 'Tiếp tục', confirm: 'Xác nhận',
  pickupHeader: 'Điểm đón', dropoffHeader: 'Điểm trả',
} as const;

export const AUTH_FILE = process.env.STORAGE_STATE ?? 'auth/user.json';
```

**Giải thích:** toàn bộ tuyến đường, số điện thoại, nhãn giao diện và thông báo lỗi được gom
về một file duy nhất. Khi hệ thống đổi nội dung, chỉ cần sửa một nơi và toàn bộ test cập nhật
theo.

### 1.3. Fixtures — `fixtures/fixtures.ts`

```typescript
import { test as base, expect } from '@playwright/test';
import fs from 'node:fs';
import { HomePage } from '../pages/HomePage';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { BookingPage } from '../pages/BookingPage';
import { AUTH_FILE } from './test-data';

export const test = base.extend({
  home:    async ({ page }, use) => { await use(new HomePage(page)); },
  results: async ({ page }, use) => { await use(new SearchResultsPage(page)); },
  booking: async ({ page }, use) => { await use(new BookingPage(page)); },
});

export const hasSavedAuth = fs.existsSync(AUTH_FILE);  // true nếu đã có phiên đăng nhập
export { expect };
```

**Giải thích:** fixture "tiêm" sẵn các đối tượng trang vào mỗi test, để thân test chỉ cần
viết `async ({ home, results }) => {...}` là có ngay đối tượng để thao tác.

---

## 2. Xây dựng Test Script

### 2.1. Test Script kiểm thử chức năng Đăng nhập

Chức năng Đăng nhập là một trong những chức năng quan trọng của Website Đặt vé xe trực tuyến
FUTA Hà Sơn, cho phép người dùng xác thực tài khoản trước khi hoàn tất đặt vé/thanh toán.

Hệ thống sử dụng cơ chế **đăng nhập bằng OTP (không mật khẩu)**: người dùng nhập **mã quốc
gia** và **số điện thoại**, hệ thống gửi **mã xác thực một lần (OTP)** qua SMS/Zalo. Vì việc
hoàn tất đăng nhập cần mã OTP gửi tới điện thoại thật, kịch bản tự động chỉ kiểm thử tới bước
**yêu cầu OTP**; bước nhập mã được thực hiện thủ công một lần (lưu phiên đăng nhập để tái sử
dụng).

Đối với chức năng này, nhóm xây dựng các kịch bản kiểm thử nhằm đánh giá khả năng xử lý của
hệ thống trong nhiều trường hợp khác nhau, bao gồm:

- Mở được popup đăng nhập từ giao diện.
- Kiểm tra giá trị mặc định của mã quốc gia (+84).
- Đăng nhập thất bại khi **bỏ trống** số điện thoại.
- Đăng nhập thất bại khi nhập số điện thoại **sai định dạng** (chứa ký tự chữ).
- Đăng nhập thất bại khi nhập số điện thoại **quá ngắn**.
- Yêu cầu OTP thành công với số điện thoại hợp lệ (cần số thật).
- Đóng popup đăng nhập.

#### Page Object hỗ trợ — `pages/LoginModal.ts`

```typescript
import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { LABELS, MESSAGES } from '../fixtures/test-data';

export class LoginModal extends BasePage {
  readonly dialog: Locator;
  readonly countryCode: Locator;
  readonly phoneInput: Locator;
  readonly submitButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.dialog = page.getByRole('dialog').filter({ hasText: MESSAGES.login.otpHint });
    this.countryCode = this.dialog.getByRole('combobox');
    this.phoneInput = this.dialog.getByPlaceholder('Số điện thoại');
    this.submitButton = this.dialog.getByRole('button', { name: LABELS.loginButton });
    this.closeButton = this.dialog.getByRole('button', { name: 'Close' });
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
    await expect(this.phoneInput).toBeVisible();
  }
  async expectDefaultCountryCode(code: string) { await expect(this.countryCode).toHaveValue(code); }
  async fillPhone(phone: string)               { await this.phoneInput.fill(phone); }
  async requestOtp()                           { await this.submitButton.click(); }

  private get otpInputs(): Locator { return this.page.locator('input[maxlength="1"]'); }

  // Khẳng định modal VẪN ở bước nhập SĐT (tức là việc gửi đã bị chặn)
  async expectStillOnPhoneStep() {
    await expect(this.dialog).toBeVisible();
    await expect(this.phoneInput).toBeVisible();
    await expect(this.otpInputs).toHaveCount(0);
  }
  // Khẳng định modal đã chuyển sang bước nhập OTP (chỉ xảy ra với số thật)
  async expectOtpStep() { await expect(this.otpInputs.first()).toBeVisible({ timeout: 15_000 }); }

  async close() {
    await this.closeButton.click();
    await expect(this.dialog).toBeHidden();
  }
}
```

#### Test Script — `tests/login.spec.ts`

```typescript
import { test, expect } from '../fixtures/fixtures';
import { COUNTRY_CODE_VALUE, PHONES } from '../fixtures/test-data';

test.describe('Đăng nhập (Login)', () => {
  test.beforeEach(async ({ home }) => { await home.goto(); });

  // TC-LOGIN-01: Mở popup đăng nhập
  test('TC-LOGIN-01: mở modal đăng nhập có ô SĐT và nút gửi', async ({ home }) => {
    const login = await home.openLogin();
    await login.expectOpen();
    await expect(login.phoneInput).toBeVisible();
    await expect(login.submitButton).toBeVisible();
  });

  // TC-LOGIN-02: Mã quốc gia mặc định +84
  test('TC-LOGIN-02: mã quốc gia mặc định +84', async ({ home }) => {
    const login = await home.openLogin();
    await login.expectDefaultCountryCode(COUNTRY_CODE_VALUE);
  });

  // TC-LOGIN-03: Bỏ trống số điện thoại
  test('TC-LOGIN-03: chặn gửi khi SĐT để trống', async ({ home }) => {
    const login = await home.openLogin();
    await login.requestOtp();
    await login.expectStillOnPhoneStep();   // Không gửi OTP, ở lại bước nhập SĐT
  });

  // TC-LOGIN-04: Số điện thoại sai định dạng (chứa chữ)
  test('TC-LOGIN-04: từ chối SĐT chứa ký tự chữ', async ({ home }) => {
    const login = await home.openLogin();
    await login.fillPhone(PHONES.nonNumeric);
    await login.requestOtp();
    await login.expectStillOnPhoneStep();
  });

  // TC-LOGIN-05: Số điện thoại quá ngắn
  test('TC-LOGIN-05: từ chối SĐT quá ngắn', async ({ home }) => {
    const login = await home.openLogin();
    await login.fillPhone(PHONES.tooShort);
    await login.requestOtp();
    await login.expectStillOnPhoneStep();
  });

  // TC-LOGIN-07: Đóng popup đăng nhập
  test('TC-LOGIN-07: đóng modal bằng nút Close', async ({ home }) => {
    const login = await home.openLogin();
    await login.close();
    await expect(login.dialog).toBeHidden();
  });

  // TC-LOGIN-06: Yêu cầu OTP với số hợp lệ (cần TEST_PHONE thật → tự bỏ qua nếu không có)
  test('TC-LOGIN-06: gửi OTP cho số điện thoại hợp lệ', async ({ home }) => {
    test.skip(!process.env.TEST_PHONE, 'Đặt TEST_PHONE trong .env để chạy bước này');
    const login = await home.openLogin();
    await login.fillPhone(PHONES.valid);
    await login.requestOtp();
    await login.expectOtpStep();
  });
});
```

> *Src… Bổ sung hình ảnh chụp màn hình đoạn mã `login.spec.ts` trong trình soạn thảo (VS Code)
> và hình ảnh kết quả chạy của nhóm test "Đăng nhập" tại đây.*

**Giải thích Test Script:** Mỗi `test(...)` là một trường hợp kiểm thử. Khối `beforeEach` mở
trang chủ trước mỗi test. Vì ô nhập số điện thoại không chặn ký tự khi gõ, tiêu chí kiểm tra
được thiết kế là **"hệ thống có chuyển sang bước nhập mã OTP hay không"** (`expectStillOnPhoneStep`
= bị chặn, `expectOtpStep` = thành công), thay vì kiểm tra thông báo lỗi nội tuyến.

**Kết quả mong đợi:** hệ thống xác thực chính xác đầu vào số điện thoại, chỉ gửi OTP và chuyển
bước khi số hợp lệ; với đầu vào rỗng/sai định dạng/quá ngắn thì giữ nguyên ở bước nhập số điện
thoại (không gửi OTP).

---

### 2.2. Test Script kiểm thử chức năng Tìm kiếm chuyến xe

Chức năng Tìm kiếm chuyến xe cho phép người dùng tra cứu các chuyến xe dựa trên **điểm đi**,
**điểm đến** và **ngày khởi hành**.

Để đánh giá chức năng này, nhóm xây dựng các kịch bản kiểm thử cho các trường hợp:

- Tìm kiếm với dữ liệu hợp lệ (tuyến Lào Cai → Hà Nội).
- Kiểm tra form hiển thị đúng điểm đi/điểm đến đã chọn.
- Tìm kiếm khi **bỏ trống điểm đi**.
- Tìm kiếm khi có điểm đi nhưng **bỏ trống điểm đến**.
- Kiểm tra ngày khởi hành mặc định đúng định dạng dd/MM/yyyy.
- Kiểm tra tính chính xác của danh sách chuyến xe hiển thị (giá vé, loại xe).
- Bật/tắt tùy chọn khứ hồi (Khứ hồi).

#### Page Object hỗ trợ — `pages/HomePage.ts` (rút gọn phần tìm kiếm)

```typescript
import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { LABELS } from '../fixtures/test-data';

type Place = { province: string; station: string };

export class HomePage extends BasePage {
  readonly departureInput: Locator;
  readonly destinationInput: Locator;
  readonly roundTripCheckbox: Locator;
  readonly roundTripToggle: Locator;
  readonly searchButton: Locator;
  readonly departureDateInput: Locator;

  constructor(page: Page) {
    super(page);
    this.departureInput = page.getByRole('textbox', { name: LABELS.pickDeparture });
    this.destinationInput = page.getByRole('textbox', { name: LABELS.pickDestination });
    this.roundTripCheckbox = page.getByRole('checkbox', { name: LABELS.roundTrip }).and(page.locator('input'));
    this.roundTripToggle = page.getByRole('checkbox', { name: LABELS.roundTrip }).first();
    this.searchButton = page.getByRole('button', { name: LABELS.searchButton });
    this.departureDateInput = page.locator('input.dxbs-date-edit-input').filter({ visible: true }).first();
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.searchButton).toBeVisible();
  }

  async selectDeparture(place: Place)   { await this.pickLocation(this.departureInput, place); }
  async selectDestination(place: Place) { await this.pickLocation(this.destinationInput, place); }

  // Chọn địa điểm trong dialog 2 cấp: chọn tỉnh → chọn bến
  private async pickLocation(trigger: Locator, place: Place) {
    const dialog = this.page.getByRole('dialog');
    await expect(async () => {                  // Thử lại nếu cú click đầu bị nuốt lúc trang đang tải
      await trigger.click();
      await expect(dialog).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    const provinceOption = dialog.getByText(place.province, { exact: true }).first();
    await expect(provinceOption).toBeVisible();
    await provinceOption.click();
    const leaf = dialog.getByText(place.station, { exact: true });
    // Khi tên bến trùng tên tỉnh (vd "Hà Nội"), chờ đủ phần tử rồi chọn phần tử cuối
    await expect(leaf).toHaveCount(place.province === place.station ? 2 : 1);
    await leaf.last().click();
    await expect(trigger).toHaveValue(place.station);
  }

  async toggleRoundTrip() { await this.roundTripToggle.click(); }
  async search()          { await this.safeClick(this.searchButton); }

  async searchTrip(from: Place, to: Place) {
    await this.selectDeparture(from);
    await this.selectDestination(to);
    await this.search();
  }
}
```

#### Page Object hỗ trợ — `pages/SearchResultsPage.ts`

```typescript
import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { BUS_TYPES, LABELS } from '../fixtures/test-data';

export class SearchResultsPage extends BasePage {
  readonly selectSeatButtons: Locator;

  constructor(page: Page) {
    super(page);
    this.selectSeatButtons = page.locator('button.cyber-button-yellow').filter({ hasText: LABELS.selectSeat });
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/datve\//);          // Đã chuyển sang trang kết quả
    await expect(this.selectSeatButtons.first()).toBeVisible();
  }
  async tripCount() { return this.selectSeatButtons.count(); }
  async expectHasTrips() { expect(await this.tripCount()).toBeGreaterThan(0); }

  // Mỗi thẻ kết quả có giá ("Từ ...") và một loại xe đã biết
  async expectCardsWellFormed() {
    await expect(this.page.getByText(/Từ\s?[\d.]+/).first()).toBeVisible();
    const anyBusType = this.page.getByText(new RegExp(BUS_TYPES.join('|'))).first();
    await expect(anyBusType).toBeVisible();
  }
}
```

#### Test Script — `tests/search-trip.spec.ts`

```typescript
import { test, expect } from '../fixtures/fixtures';
import { ROUTE, MESSAGES } from '../fixtures/test-data';

test.describe('Tìm kiếm chuyến xe (Trip search)', () => {
  test.beforeEach(async ({ home }) => { await home.goto(); });

  // TC-SEARCH-01: Tìm kiếm với dữ liệu hợp lệ
  test('TC-SEARCH-01: tìm được chuyến cho tuyến hợp lệ (Lào Cai → Hà Nội)', async ({ home, results }) => {
    await home.searchTrip(ROUTE.from, ROUTE.to);
    await results.expectLoaded();
    await results.expectHasTrips();
  });

  // TC-SEARCH-02: Form phản ánh đúng lựa chọn
  test('TC-SEARCH-02: form hiển thị đúng điểm đi/đến đã chọn', async ({ home }) => {
    await home.selectDeparture(ROUTE.from);
    await home.selectDestination(ROUTE.to);
    await expect(home.departureInput).toHaveValue(ROUTE.from.station);
    await expect(home.destinationInput).toHaveValue(ROUTE.to.station);
  });

  // TC-SEARCH-04: Bỏ trống điểm đi
  test('TC-SEARCH-04: từ chối tìm khi chưa chọn điểm đi', async ({ home, page }) => {
    await home.search();
    await expect(page.getByText(MESSAGES.search.missingDeparture)).toBeVisible();
    await expect(page).not.toHaveURL(/\/datve\//);   // Không chuyển trang
  });

  // TC-SEARCH-05: Có điểm đi nhưng bỏ trống điểm đến
  test('TC-SEARCH-05: từ chối khi thiếu điểm đến', async ({ home, page }) => {
    await home.selectDeparture(ROUTE.from);
    await home.search();
    await expect(page.getByText(MESSAGES.search.missingDestination)).toBeVisible();
    await expect(page).not.toHaveURL(/\/datve\//);
  });

  // TC-SEARCH-06: Ngày khởi hành mặc định đúng định dạng
  test('TC-SEARCH-06: ngày khởi hành mặc định dạng dd/MM/yyyy', async ({ home }) => {
    await expect(home.departureDateInput).toHaveValue(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  // TC-SEARCH-07: Tính chính xác của danh sách chuyến (giá + loại xe)
  test('TC-SEARCH-07: thẻ kết quả có giá và loại xe đã biết', async ({ home, results }) => {
    await home.searchTrip(ROUTE.from, ROUTE.to);
    await results.expectLoaded();
    await results.expectCardsWellFormed();
  });

  // TC-SEARCH-08: Tùy chọn khứ hồi
  test('TC-SEARCH-08: bật/tắt được tùy chọn Khứ hồi', async ({ home }) => {
    await expect(home.roundTripCheckbox).not.toBeChecked();
    await home.toggleRoundTrip();
    await expect(home.roundTripCheckbox).toBeChecked();
  });
});
```

> *Bổ sung hình ảnh chụp màn hình đoạn mã `search-trip.spec.ts` và hình ảnh trang kết quả tìm
> kiếm (danh sách chuyến xe) tại đây.*

**Giải thích Test Script:** Hộp chọn địa điểm là dialog hai cấp (tỉnh → bến); hàm
`pickLocation` xử lý việc mở dialog (có thử lại khi trang đang tải) và mẹo phân biệt khi tên
bến trùng tên tỉnh. Các test kiểm tra cả luồng hợp lệ (`expectHasTrips`, `expectCardsWellFormed`)
lẫn luồng lỗi (thiếu điểm đi/đến → hiển thị thông báo và **không chuyển trang**).

**Kết quả mong đợi:** với dữ liệu hợp lệ, hệ thống trả về danh sách chuyến xe kèm giá và loại
xe; với dữ liệu thiếu, hệ thống hiển thị thông báo lỗi tương ứng và giữ nguyên ở trang tìm
kiếm.

---

### 2.3. Test Script kiểm thử chức năng Điền thông tin thanh toán

Sau khi lựa chọn chuyến xe, người dùng cần thực hiện chuỗi thao tác: **chọn ghế → đồng ý điều
khoản → chọn điểm đón/điểm trả → xác nhận**, sau đó nhập thông tin cá nhân để hoàn tất đặt vé.

Trên hệ thống thực tế, **form điền thông tin thanh toán nằm sau bước đăng nhập OTP** (bắt buộc
đăng nhập mới tới được form). Do đó nhóm chia kịch bản kiểm thử thành hai nhóm:

- **Nhóm chưa đăng nhập:** đi hết phễu đặt vé tới cổng đăng nhập và kiểm chứng từng "chốt
  chặn" validation. Hoàn toàn không gây thay đổi dữ liệu, luôn chạy được.
- **Nhóm đã đăng nhập:** dùng phiên đăng nhập đã lưu để tới form và điền thông tin hành khách.
  Tự bỏ qua khi chưa có phiên, và **tuyệt đối không gửi thanh toán thật** (bảo đảm an toàn cho
  hệ thống production).

Các trường hợp kiểm thử bao gồm:

- Mở được sơ đồ ghế của chuyến xe.
- Bắt buộc **đồng ý điều khoản** trước khi tiếp tục.
- Bắt buộc **chọn điểm đón/điểm trả** trước khi xác nhận.
- **Yêu cầu đăng nhập** trước khi tới form thanh toán (kiểm thử bảo mật).
- Hiển thị form thông tin hành khách khi đã đăng nhập.
- Nhập đầy đủ thông tin hợp lệ (Họ tên, Số điện thoại, Email) — không thực hiện thanh toán.

#### Page Object hỗ trợ — `pages/BookingPage.ts`

```typescript
import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { LABELS, MESSAGES } from '../fixtures/test-data';

export class BookingPage extends BasePage {
  readonly selectSeatButtons: Locator;
  readonly seats: Locator;
  readonly continueButton: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    super(page);
    this.selectSeatButtons = page.locator('button.cyber-button-yellow').filter({ hasText: LABELS.selectSeat });
    this.seats = page.locator('label.cyberfontsmall').filter({ visible: true });
    this.continueButton = page.getByRole('button', { name: LABELS.continue }).filter({ visible: true });
    this.confirmButton = page.getByRole('button', { name: LABELS.confirm }).filter({ visible: true });
  }

  // Checkbox điều khoản = input đứng ngay trước nhãn "điều khoản"
  private get termsCheckbox(): Locator {
    const span = this.page.locator('span.cyber-hover', { hasText: 'điều khoản' }).filter({ visible: true });
    return span.locator('xpath=preceding-sibling::input[@type="checkbox"]');
  }

  async openSeatMap(tripIndex = 0) {                 // Mở sơ đồ ghế
    await this.forceClick(this.selectSeatButtons.nth(tripIndex));
    await expect(this.seats.first()).toBeVisible();
  }
  async expectSeatMapVisible() { expect(await this.seats.count()).toBeGreaterThan(0); }
  async selectFirstSeat()      { await this.forceClick(this.seats.first()); }   // Chọn ghế đầu tiên

  async acceptTerms() {                              // Tích ô đồng ý điều khoản
    await this.termsCheckbox.check({ force: true });
    await expect(this.termsCheckbox).toBeChecked();
  }
  async continueAfterSeat()      { await this.forceClick(this.continueButton); }
  async expectTermsValidation()  { await this.expectAlert(MESSAGES.booking.termsNotAccepted); }

  async waitForPickupStep() {                        // Chờ bước chọn điểm đón/trả
    await expect(this.page.getByText(LABELS.pickupHeader).first()).toBeVisible();
    await expect(this.page.getByText(LABELS.dropoffHeader).first()).toBeVisible();
  }

  // Checkbox Syncfusion KHÔNG nhận click "ép" → phải click thường vào phần .e-frame
  private async checkSyncfusion(wrapper: Locator) {
    await expect(wrapper).toBeVisible();
    await this.safeClick(wrapper.locator('.e-frame'));
    await expect(wrapper).toHaveAttribute('aria-checked', 'true');
  }
  async selectFirstPickup() {
    await this.checkSyncfusion(this.page.locator('.e-checkbox-wrapper').filter({ visible: true }).first());
  }
  async selectFirstDropoff() {
    await this.checkSyncfusion(this.page.locator(
      'xpath=//*[normalize-space(text())="Điểm trả"]/following::*[contains(@class,"e-checkbox-wrapper")][1]'));
  }

  async confirm() { await this.forceClick(this.confirmButton); }
  async expectPickupDropoffValidation() { await this.expectAlert(MESSAGES.booking.pickupDropoffMissing); }

  // Sau khi xác nhận hợp lệ mà chưa đăng nhập → hiện cổng OTP
  async expectLoginGate() { await expect(this.page.getByText(MESSAGES.login.otpHint)).toBeVisible(); }

  // Các trường form thanh toán (chỉ tới được sau khi đăng nhập)
  get passengerName()  { return this.page.getByPlaceholder(/Họ.*tên|Tên người đi/i); }
  get passengerPhone() { return this.page.getByPlaceholder(/Số điện thoại/i).filter({ visible: true }); }
  get passengerEmail() { return this.page.getByPlaceholder(/Email/i).filter({ visible: true }); }
}
```

#### Test Script — `tests/payment-info.spec.ts`

```typescript
import { test, expect, hasSavedAuth } from '../fixtures/fixtures';
import { ROUTE } from '../fixtures/test-data';

// NHÓM 1: Chưa đăng nhập — đi hết phễu tới cổng đăng nhập, kiểm chứng các chốt chặn
test.describe('Booking funnel up to payment (unauthenticated)', () => {
  test.beforeEach(async ({ home, results }) => {
    await home.goto();
    await home.searchTrip(ROUTE.from, ROUTE.to);
    await results.expectLoaded();
  });

  // TC-PAY-01: Mở sơ đồ ghế
  test('TC-PAY-01: mở được sơ đồ ghế của chuyến xe', async ({ booking }) => {
    await booking.openSeatMap();
    await booking.expectSeatMapVisible();
  });

  // TC-PAY-03: Bắt buộc đồng ý điều khoản
  test('TC-PAY-03: chặn "Tiếp tục" khi chưa đồng ý điều khoản', async ({ booking }) => {
    await booking.openSeatMap();
    await booking.selectFirstSeat();
    await booking.continueAfterSeat();          // Chưa tích điều khoản
    await booking.expectTermsValidation();
  });

  // TC-PAY-05: Bắt buộc chọn điểm đón/trả
  test('TC-PAY-05: chặn "Xác nhận" khi chưa chọn điểm đón/trả', async ({ booking }) => {
    await booking.openSeatMap();
    await booking.selectFirstSeat();
    await booking.acceptTerms();
    await booking.continueAfterSeat();
    await booking.confirm();                    // Chưa chọn điểm đón/trả
    await booking.expectPickupDropoffValidation();
  });

  // TC-PAY-06: Yêu cầu đăng nhập trước khi tới form thanh toán
  test('TC-PAY-06: yêu cầu đăng nhập trước khi tới form thanh toán', async ({ booking }) => {
    await booking.openSeatMap();
    await booking.selectFirstSeat();
    await booking.acceptTerms();
    await booking.continueAfterSeat();
    await booking.waitForPickupStep();
    await booking.selectFirstPickup();
    await booking.selectFirstDropoff();
    await booking.confirm();
    await booking.expectLoginGate();            // Hiển thị modal đăng nhập OTP
  });
});

// NHÓM 2: Đã đăng nhập — tự bỏ qua nếu chưa có phiên; KHÔNG bao giờ thanh toán thật
test.describe('Payment information form (authenticated)', () => {
  test.skip(!hasSavedAuth, 'Chạy `npm run auth:setup` để tạo phiên OTP trước');
  test.use({ storageState: 'auth/user.json' });

  test.beforeEach(async ({ home, results, booking }) => {
    await home.goto();
    await home.searchTrip(ROUTE.from, ROUTE.to);
    await results.expectLoaded();
    await booking.openSeatMap();
    await booking.selectFirstSeat();
    await booking.acceptTerms();
    await booking.continueAfterSeat();
    await booking.waitForPickupStep();
    await booking.selectFirstPickup();
    await booking.selectFirstDropoff();
    await booking.confirm();
  });

  // TC-PAY-08: Hiển thị form thông tin hành khách khi đã đăng nhập
  test('TC-PAY-08: hiển thị form thông tin hành khách (đã đăng nhập)', async ({ booking }) => {
    await expect(booking.passengerName.or(booking.passengerPhone).first()).toBeVisible();
  });

  // TC-PAY-09: Nhập đầy đủ thông tin hợp lệ (không thanh toán)
  test('TC-PAY-09: điền thông tin liên hệ hành khách (không thanh toán)', async ({ booking }) => {
    await booking.passengerName.fill('Nguyễn Văn Test');
    await booking.passengerPhone.fill(process.env.TEST_PHONE ?? '0901234567');
    await booking.passengerEmail.fill('qa.futahason@example.com');
    await expect(booking.passengerName).toHaveValue('Nguyễn Văn Test');
    // Cố tình dừng tại đây — CẤM gửi thanh toán trên hệ thống production.
  });
});
```

> *Bổ sung hình ảnh chụp màn hình đoạn mã `payment-info.spec.ts`, hình ảnh sơ đồ ghế, và hình
> ảnh form điền thông tin hành khách tại đây.*

**Giải thích Test Script:** Đây là luồng phức tạp nhất, mô phỏng đúng phễu đặt vé thật. Khối
`beforeEach` của mỗi nhóm thực hiện các bước chung tới đúng trạng thái cần kiểm thử. Các test
kiểm chứng đầy đủ các "chốt chặn" validation: chưa đồng ý điều khoản, chưa chọn điểm đón/trả,
và đặc biệt là **chốt bắt buộc đăng nhập** trước khi tới form thanh toán.

**Kết quả mong đợi:** hệ thống chấp nhận dữ liệu hợp lệ, từ chối khi thiếu các bước bắt buộc
(điều khoản, điểm đón/trả) và hiển thị thông báo lỗi tương ứng; đồng thời chặn truy cập form
thanh toán khi chưa đăng nhập để bảo đảm an toàn thông tin.

---

## 3. Thực hiện kiểm thử

### 3.1. Lệnh thực thi

```bash
# Cài đặt (chạy một lần)
npm install
npx playwright install chromium

# Thực thi kiểm thử
npm test                 # Chạy toàn bộ bộ test (Chromium, tuần tự)

# Hoặc chạy riêng từng chức năng:
npm run test:login       # Đăng nhập
npm run test:search      # Tìm kiếm chuyến xe
npm run test:payment     # Điền thông tin thanh toán
```

### 3.2. Phân tích kết quả

- **Báo cáo HTML** được tự động sinh tại thư mục `playwright-report/`; mở bằng lệnh
  `npm run report`. Báo cáo thể hiện danh sách test, trạng thái Đạt/Không đạt, thời gian chạy.
- **Trace Viewer** hỗ trợ gỡ lỗi khi test thất bại: Playwright tự lưu trace ở lần chạy lại đầu
  tiên (`trace: 'on-first-retry'`). Mở bằng:
  `npx playwright show-trace test-results/<tên-test>/trace.zip`. Trace Viewer hiển thị dòng
  thời gian các bước, ảnh chụp từng thao tác và DOM tại mỗi bước.

### 3.3. Kết quả mẫu trên terminal

```
Running 20 tests using 1 worker

  ✓  TC-LOGIN-01: mở modal đăng nhập có ô SĐT và nút gửi (1.8s)
  ✓  TC-SEARCH-01: tìm được chuyến cho tuyến hợp lệ (Lào Cai → Hà Nội) (4.2s)
  ✓  TC-PAY-06: yêu cầu đăng nhập trước khi tới form thanh toán (6.1s)
  -  TC-LOGIN-06 …  (bỏ qua — cần TEST_PHONE)
  -  TC-PAY-08 …    (bỏ qua — cần phiên đăng nhập)

  17 passed, 3 skipped (1.2m)
```

> *Bổ sung hình ảnh chụp màn hình terminal hiển thị kết quả, và hình ảnh giao diện Báo cáo HTML
> / Trace Viewer tại đây.*

---

## 4. Bảng tổng hợp các trường hợp kiểm thử

| Mã TC | Chức năng | Mục tiêu kiểm thử | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| TC-LOGIN-01 | Đăng nhập | Mở popup đăng nhập | Hiện ô SĐT + nút gửi | Đạt |
| TC-LOGIN-02 | Đăng nhập | Mã quốc gia mặc định | = +84 | Đạt |
| TC-LOGIN-03 | Đăng nhập | Bỏ trống SĐT | Không gửi OTP, ở lại bước nhập SĐT | Đạt |
| TC-LOGIN-04 | Đăng nhập | SĐT chứa ký tự chữ | Không gửi OTP | Đạt |
| TC-LOGIN-05 | Đăng nhập | SĐT quá ngắn | Không gửi OTP | Đạt |
| TC-LOGIN-06 | Đăng nhập | SĐT hợp lệ (cần số thật) | Chuyển sang bước nhập OTP | Bỏ qua* |
| TC-LOGIN-07 | Đăng nhập | Đóng popup | Modal biến mất | Đạt |
| TC-SEARCH-01 | Tìm chuyến | Tuyến hợp lệ | Có danh sách chuyến | Đạt |
| TC-SEARCH-02 | Tìm chuyến | Hiển thị điểm đã chọn | Đúng điểm đi/đến | Đạt |
| TC-SEARCH-04 | Tìm chuyến | Thiếu điểm đi | Báo "Bạn chưa chọn điểm xuất phát" | Đạt |
| TC-SEARCH-05 | Tìm chuyến | Thiếu điểm đến | Báo "Bạn chưa chọn điểm đến" | Đạt |
| TC-SEARCH-06 | Tìm chuyến | Ngày mặc định | Đúng định dạng dd/MM/yyyy | Đạt |
| TC-SEARCH-07 | Tìm chuyến | Thông tin thẻ kết quả | Có giá vé + loại xe | Đạt |
| TC-SEARCH-08 | Tìm chuyến | Tùy chọn khứ hồi | Bật/tắt được | Đạt |
| TC-PAY-01 | Thanh toán | Mở sơ đồ ghế | Hiện sơ đồ ghế | Đạt |
| TC-PAY-03 | Thanh toán | Chưa đồng ý điều khoản | Báo "Bạn chưa đồng ý với điều khoản" | Đạt |
| TC-PAY-05 | Thanh toán | Chưa chọn điểm đón/trả | Báo "Bạn vui lòng chọn điểm đón/trả" | Đạt |
| TC-PAY-06 | Thanh toán | Chưa đăng nhập | Hiện cổng đăng nhập OTP | Đạt |
| TC-PAY-08 | Thanh toán | Đã đăng nhập (cần phiên) | Hiện form hành khách | Bỏ qua* |
| TC-PAY-09 | Thanh toán | Điền thông tin (cần phiên) | Nhận đúng giá trị, không thanh toán | Bỏ qua* |

> *(\*) Các trường hợp **Bỏ qua** là do cần số điện thoại nhận OTP thật / phiên đăng nhập đã
> lưu — được thiết kế tự bỏ qua để bảo đảm bộ test luôn chạy thành công trong môi trường mặc
> định mà vẫn an toàn cho hệ thống production.*

---

## 5. Đánh giá

Kết quả kiểm thử cho thấy Website Đặt vé xe trực tuyến FUTA Hà Sơn xử lý đúng các yêu cầu
nghiệp vụ cốt lõi trong phạm vi nghiên cứu: xác thực đầu vào ở chức năng đăng nhập, kiểm tra
ràng buộc khi tìm kiếm chuyến xe, và kiểm soát chặt chẽ các bước trong quy trình đặt vé (điều
khoản, điểm đón/trả, bắt buộc đăng nhập trước khi thanh toán).

Việc áp dụng Playwright cho kiểm thử tự động mang lại hiệu quả rõ rệt: kịch bản kiểm thử có
tính tái sử dụng cao nhờ mô hình Page Object Model, kết quả ổn định và lặp lại được, đồng thời
hệ thống báo cáo HTML và Trace Viewer hỗ trợ tốt cho việc phân tích, gỡ lỗi. Bộ kiểm thử cũng
được thiết kế **an toàn cho hệ thống production**, không tạo ra giao dịch thật, phù hợp với đặc
thù của một website thương mại đang vận hành.
