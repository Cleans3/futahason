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
 */
test.describe('Booking funnel up to payment (unauthenticated)', () => {
  test.beforeEach(async ({ home, results }) => {
    await home.goto();
    await home.searchTrip(ROUTE.from, ROUTE.to);
    await results.expectLoaded();
  });

  test('TC-PAY-01: opens the seat map for a trip', async ({ booking }) => {
    await booking.openSeatMap();
    await booking.expectSeatMapVisible();
  });

  test('TC-PAY-03: blocks "Tiếp tục" until the terms are accepted', async ({ booking }) => {
    await booking.openSeatMap();
    await booking.selectFirstSeat();
    await booking.continueAfterSeat(); // terms not ticked
    await booking.expectTermsValidation();
  });

  test('TC-PAY-05: blocks "Xác nhận" until a pickup/drop-off is chosen', async ({ booking }) => {
    await booking.openSeatMap();
    await booking.selectFirstSeat();
    await booking.acceptTerms();
    await booking.continueAfterSeat();
    await booking.confirm(); // no pickup/drop-off selected
    await booking.expectPickupDropoffValidation();
  });

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
    await booking.expectLoginGate();
  });
});

test.describe('Payment information form (authenticated)', () => {
  // Reuse the saved OTP session. Both the project storageState and this guard are
  // needed: the guard keeps `npm test` green when no session has been captured.
  test.skip(!hasSavedAuth, 'Run `npm run auth:setup` to capture an OTP session first');
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

  test('TC-PAY-08: shows the passenger/payment form to a logged-in user', async ({ booking }) => {
    // Once authenticated, confirming lands on the contact + payment step instead
    // of the login gate.
    await expect(booking.passengerName.or(booking.passengerPhone).first()).toBeVisible();
  });

  test('TC-PAY-09: fills passenger contact details (without paying)', async ({ booking }) => {
    await booking.passengerName.fill('Nguyễn Văn Test');
    await booking.passengerPhone.fill(process.env.TEST_PHONE ?? '0901234567');
    await booking.passengerEmail.fill('qa.futahason@example.com');
    await expect(booking.passengerName).toHaveValue('Nguyễn Văn Test');
    // NOTE: the test deliberately stops here. Submitting payment on production is
    // forbidden — only proceed on a sandbox env with ALLOW_REAL_BOOKING=true.
  });
});
