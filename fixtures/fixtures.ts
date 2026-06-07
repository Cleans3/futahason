import { test as base, expect } from '@playwright/test';
import fs from 'node:fs';
import { HomePage } from '../pages/HomePage';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { BookingPage } from '../pages/BookingPage';
import { AUTH_FILE } from './test-data';

type Fixtures = {
  home: HomePage;
  results: SearchResultsPage;
  booking: BookingPage;
};

/**
 * Project-wide test fixtures. Each spec gets ready-made page objects so the test
 * bodies read as a sequence of business actions, not selector plumbing.
 *
 * (VI) Fixture dùng chung cho cả dự án. Mỗi spec được "tiêm" sẵn các page object
 * (home/results/booking) để thân test đọc như một chuỗi thao tác nghiệp vụ,
 * thay vì lẫn lộn với chi tiết selector.
 */
export const test = base.extend<Fixtures>({
  // (VI) Trang chủ + widget tìm kiếm.
  home: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  // (VI) Trang kết quả chuyến đi (/datve/...).
  results: async ({ page }, use) => {
    await use(new SearchResultsPage(page));
  },
  // (VI) Phễu đặt vé: chọn chỗ → điều khoản → đón/trả → cổng đăng nhập → thanh toán.
  booking: async ({ page }, use) => {
    await use(new BookingPage(page));
  },
});

/** True when a saved OTP session exists; gates the authenticated payment tests. */
// (VI) True khi đã có phiên OTP lưu sẵn; dùng để bật/tắt nhóm test thanh toán cần đăng nhập.
export const hasSavedAuth = fs.existsSync(AUTH_FILE);

export { expect };
