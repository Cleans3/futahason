import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load local secrets / overrides from .env (see .env.example). Never commit .env.
// (VI) Nạp bí mật/ghi đè cục bộ từ .env (xem .env.example). Tuyệt đối không commit .env.
dotenv.config();

export const BASE_URL = process.env.BASE_URL ?? 'https://futahason.com';

/**
 * Playwright configuration for the futahason.com E2E suite.
 *
 * Design notes (these matter for a *production* target — read CLAUDE.md):
 *  - The site under test is PRODUCTION. Tests are non-destructive by default:
 *    they never complete a real booking or payment (see ALLOW_REAL_BOOKING).
 *  - Login is OTP-based, so the suite separates "automatable" flows from flows
 *    that need a human-supplied OTP. Authenticated tests reuse a saved session
 *    (storageState) produced by the `setup` project.
 *  - The app is timezone/locale sensitive (Asia/Ho_Chi_Minh, dd/MM/yyyy dates,
 *    Vietnamese copy), so we pin locale + timezone for deterministic runs.
 *
 * (VI) Cấu hình Playwright cho bộ E2E futahason.com.
 * Lưu ý thiết kế (quan trọng vì đích là site *production* — đọc CLAUDE.md):
 *  - Site đang test là PRODUCTION. Mặc định test không gây thay đổi dữ liệu:
 *    không bao giờ hoàn tất đặt vé/thanh toán thật (xem ALLOW_REAL_BOOKING).
 *  - Đăng nhập bằng OTP, nên bộ test tách luồng "tự động hoá được" khỏi luồng
 *    cần người nhập OTP. Test cần đăng nhập dùng lại phiên đã lưu (storageState)
 *    do project `setup` tạo ra.
 *  - App nhạy với múi giờ/ngôn ngữ (Asia/Ho_Chi_Minh, ngày dd/MM/yyyy, chữ tiếng
 *    Việt), nên ghim locale + timezone để chạy ổn định, nhất quán.
 */
export default defineConfig({
  testDir: './tests',
  /* Run files in parallel; tests inside a file run serially by default. */
  // (VI) Chạy song song theo file; còn các test trong cùng một file thì tuần tự.
  fullyParallel: true,
  /* Fail the build on CI if a `test.only` was left in the source. */
  // (VI) Trên CI, báo lỗi build nếu lỡ để sót `test.only` trong mã nguồn.
  forbidOnly: !!process.env.CI,
  /* The target is a single live production site whose booking funnel races under
     concurrent load (verified: tests are flaky at 2+ workers, deterministic at 1).
     Run serially by default; bump workers only against a staging environment.
     A retry still absorbs the occasional network/site hiccup. */
  // (VI) Đích là một site production duy nhất, phễu đặt vé bị tranh chấp khi chạy
  // song song (đã kiểm chứng: flaky ở 2+ worker, ổn định ở 1). Mặc định chạy tuần
  // tự; chỉ tăng workers khi có môi trường staging. Một lần retry để hấp thụ trục
  // trặc mạng/site thoáng qua.
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  /* Rich, shareable reports. */
  // (VI) Báo cáo đầy đủ, dễ chia sẻ.
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  /* Shared settings for all projects. */
  // (VI) Thiết lập dùng chung cho mọi project.
  use: {
    baseURL: BASE_URL,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    /* Capture artefacts only when something goes wrong — keeps runs fast. */
    // (VI) Chỉ thu trace/ảnh/video khi có lỗi — giúp chạy nhanh.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  /* Web-first assertions get 10s by default; the booking funnel can be slow. */
  // (VI) Assertion mặc định chờ 10s; phễu đặt vé đôi khi chậm.
  expect: { timeout: 10_000 },

  projects: [
    /* One-off helper: performs OTP login and saves the session to auth/user.json.
       NOT part of the default run (it needs a human to type the OTP).
       Invoke explicitly:  npm run auth:setup                                    */
    // (VI) Tiện ích chạy một lần: đăng nhập OTP và lưu phiên vào auth/user.json.
    // (VI) KHÔNG nằm trong lần chạy mặc định (cần người gõ OTP). Gọi riêng bằng:
    // (VI)   npm run auth:setup
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    /* Main suite. Covers the login UI/validation, trip search, and the booking
       funnel up to the auth gate. The authenticated payment-information tests
       live in the same files but self-skip when auth/user.json is absent, so a
       plain `npm test` never hangs waiting for an OTP. Once you have run
       `npm run auth:setup`, those tests pick up the saved session automatically. */
    // (VI) Bộ test chính. Phủ giao diện/validation đăng nhập, tìm chuyến và phễu
    // (VI) đặt vé tới cổng đăng nhập. Các test thanh toán (cần đăng nhập) nằm
    // (VI) cùng file nhưng tự bỏ qua khi thiếu auth/user.json, nên `npm test`
    // (VI) không bao giờ treo chờ OTP. Sau khi chạy `npm run auth:setup`, các
    // (VI) test đó tự động dùng phiên đã lưu.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
