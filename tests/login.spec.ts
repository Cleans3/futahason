import { test, expect } from '../fixtures/fixtures';
import { COUNTRY_CODE_VALUE, PHONES } from '../fixtures/test-data';

/**
 * Feature: Đăng nhập (Login)
 *
 * futahason.com uses passwordless OTP login. These tests cover everything that
 * can be verified without a live one-time code: opening the modal, its defaults,
 * and client-side gating of bad input. Completing the OTP (TC-LOGIN-06/08) needs
 * a real handset and is handled by tests/auth.setup.ts.
 */
test.describe('Đăng nhập (Login)', () => {
  test.beforeEach(async ({ home }) => {
    await home.goto();
  });

  test('TC-LOGIN-01: opens the login modal with phone field and submit', async ({ home }) => {
    const login = await home.openLogin();
    await login.expectOpen();
    await expect(login.phoneInput).toBeVisible();
    await expect(login.submitButton).toBeVisible();
  });

  test('TC-LOGIN-02: defaults the country code to +84', async ({ home }) => {
    const login = await home.openLogin();
    await login.expectDefaultCountryCode(COUNTRY_CODE_VALUE);
  });

  test('TC-LOGIN-03: blocks submission with an empty phone number', async ({ home }) => {
    const login = await home.openLogin();
    await login.requestOtp();
    // No OTP is requested; the modal stays on the phone-entry step.
    await login.expectStillOnPhoneStep();
  });

  test('TC-LOGIN-04: rejects a non-numeric phone number', async ({ home }) => {
    const login = await home.openLogin();
    await login.fillPhone(PHONES.nonNumeric);
    await login.requestOtp();
    await login.expectStillOnPhoneStep();
  });

  test('TC-LOGIN-05: rejects a too-short phone number', async ({ home }) => {
    const login = await home.openLogin();
    await login.fillPhone(PHONES.tooShort);
    await login.requestOtp();
    await login.expectStillOnPhoneStep();
  });

  test('TC-LOGIN-07: closes the modal with the Close button', async ({ home }) => {
    const login = await home.openLogin();
    await login.close();
    await expect(login.dialog).toBeHidden();
  });

  // TC-LOGIN-06: requesting an OTP for a valid number. Requires a real, reachable
  // test number (TEST_PHONE) because the code is delivered by SMS/Zalo.
  test('TC-LOGIN-06: requests an OTP for a valid phone number', async ({ home }) => {
    test.skip(!process.env.TEST_PHONE, 'Set TEST_PHONE in .env to run the OTP-request step');
    const login = await home.openLogin();
    await login.fillPhone(PHONES.valid);
    await login.requestOtp();
    await login.expectOtpStep();
  });
});
