import { test, expect, hasSavedAuth } from '../fixtures/fixtures';
import { ROUTE } from '../fixtures/test-data';

/**
 * Feature: Điền thông tin thanh toán (Payment information)
 *
 * The payment-information form sits at the end of the booking funnel:
 *   search → select seat → accept terms → choose pickup/drop-off → confirm.
 * Confirming forces OTP login, so the funnel splits into two suites:
 *
 *   • Unauthenticated — drive the funnel to the auth gate and assert each
 *     validation along the way. Fully non-destructive; runs on every CI build.
 *   • Authenticated   — with a saved session, reach the form and fill passenger
 *     details. Self-skips without auth/user.json and NEVER submits a real
 *     payment (see ALLOW_REAL_BOOKING in .env / CLAUDE.md).
 *
 * (VI) Tính năng: Điền thông tin thanh toán.
 * Form thanh toán nằm ở cuối phễu đặt vé:
 *   tìm chuyến → chọn ghế → đồng ý điều khoản → chọn điểm đón/trả → xác nhận.
 * Bấm xác nhận sẽ buộc đăng nhập OTP, nên phễu được chia làm hai nhóm test:
 *
 *   • Chưa đăng nhập — đi hết phễu tới cổng đăng nhập và kiểm chứng từng bước
 *     validation dọc đường. Hoàn toàn không gây thay đổi dữ liệu; chạy ở mọi CI.
 *   • Đã đăng nhập   — dùng phiên đã lưu để tới form và điền thông tin hành
 *     khách. Tự bỏ qua khi không có auth/user.json và TUYỆT ĐỐI không gửi thanh
 *     toán thật (xem ALLOW_REAL_BOOKING trong .env / CLAUDE.md).
 */
test.describe('Booking funnel up to payment (unauthenticated)', () => {
  // (VI) Trước mỗi test: mở trang chủ, tìm chuyến và chờ trang kết quả.
  test.beforeEach(async ({ home, results }) => {
    await home.goto();
    await home.searchTrip(ROUTE.from, ROUTE.to);
    await results.expectLoaded();
  });

  // (VI) Mở được sơ đồ ghế của một chuyến.
  test('TC-PAY-01: opens the seat map for a trip', async ({ booking }) => {
    await booking.openSeatMap();
    await booking.expectSeatMapVisible();
  });

  // (VI) Chặn "Tiếp tục" cho tới khi đồng ý điều khoản.
  test('TC-PAY-03: blocks "Tiếp tục" until the terms are accepted', async ({ booking }) => {
    await booking.openSeatMap();
    await booking.selectFirstSeat();
    await booking.continueAfterSeat(); // terms not ticked — (VI) chưa tích điều khoản
    await booking.expectTermsValidation();
  });

  // (VI) Chặn "Xác nhận" cho tới khi chọn điểm đón/trả.
  test('TC-PAY-05: blocks "Xác nhận" until a pickup/drop-off is chosen', async ({ booking }) => {
    await booking.openSeatMap();
    await booking.selectFirstSeat();
    await booking.acceptTerms();
    await booking.continueAfterSeat();
    await booking.confirm(); // no pickup/drop-off selected — (VI) chưa chọn điểm đón/trả
    await booking.expectPickupDropoffValidation();
  });

  // (VI) Bắt buộc đăng nhập trước khi tới được form thanh toán.
  test('TC-PAY-06: requires login before reaching the payment form', async ({ booking }) => {
    await booking.openSeatMap();
    await booking.selectFirstSeat();
    await booking.acceptTerms();
    await booking.continueAfterSeat();
    await booking.waitForPickupStep();
    await booking.selectFirstPickup();
    await booking.selectFirstDropoff();
    await booking.confirm();
    // The payment-information step is gated — an OTP login modal is shown.
    // (VI) Bước thanh toán bị chặn — modal đăng nhập OTP hiện ra.
    await booking.expectLoginGate();
  });
});

test.describe('Payment information form (authenticated)', () => {
  // Reuse the saved OTP session. Both the project storageState and this guard are
  // needed: the guard keeps `npm test` green when no session has been captured.
  // (VI) Dùng lại phiên OTP đã lưu. Cần cả storageState của project lẫn guard này:
  // guard giúp `npm test` luôn xanh khi chưa có phiên đăng nhập nào được tạo.
  test.skip(!hasSavedAuth, 'Run `npm run auth:setup` to capture an OTP session first');
  test.use({ storageState: 'auth/user.json' });

  // (VI) Trước mỗi test: đi hết phễu đặt vé cho tới khi tới form thanh toán.
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

  // (VI) Người dùng đã đăng nhập thì thấy form hành khách/thanh toán.
  test('TC-PAY-08: shows the passenger/payment form to a logged-in user', async ({ booking }) => {
    // Once authenticated, confirming lands on the contact + payment step instead
    // of the login gate.
    // (VI) Khi đã đăng nhập, bấm xác nhận sẽ vào bước thông tin + thanh toán,
    // chứ không còn gặp cổng đăng nhập.
    await expect(booking.passengerName.or(booking.passengerPhone).first()).toBeVisible();
  });

  // (VI) Điền thông tin liên hệ của hành khách (KHÔNG thanh toán).
  test('TC-PAY-09: fills passenger contact details (without paying)', async ({ booking }) => {
    await booking.passengerName.fill('Nguyễn Văn Test');
    await booking.passengerPhone.fill(process.env.TEST_PHONE ?? '0901234567');
    await booking.passengerEmail.fill('qa.futahason@example.com');
    await expect(booking.passengerName).toHaveValue('Nguyễn Văn Test');
    // NOTE: the test deliberately stops here. Submitting payment on production is
    // forbidden — only proceed on a sandbox env with ALLOW_REAL_BOOKING=true.
    // (VI) LƯU Ý: test cố tình dừng tại đây. Cấm gửi thanh toán trên production —
    // chỉ tiếp tục trên môi trường sandbox với ALLOW_REAL_BOOKING=true.
  });
});
