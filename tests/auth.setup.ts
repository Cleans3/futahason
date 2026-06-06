import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { PHONES, AUTH_FILE } from '../fixtures/test-data';

/**
 * One-off authentication setup.
 *
 * Run headed so a human can type the OTP delivered by SMS/Zalo:
 *     npm run auth:setup
 * On success it writes the session to auth/user.json, which the authenticated
 * payment-information tests then reuse. Requires TEST_PHONE in .env.
 */
test('authenticate via OTP and save the session', async ({ page }) => {
  test.skip(!process.env.TEST_PHONE, 'Set TEST_PHONE in .env before running auth:setup');
  test.setTimeout(180_000); // allow time to read and enter the OTP by hand

  const home = new HomePage(page);
  await home.goto();

  const login = await home.openLogin();
  await login.fillPhone(PHONES.valid);
  await login.requestOtp();

  // ── MANUAL STEP ────────────────────────────────────────────────────────────
  // Enter the OTP in the opened browser. The test waits until login succeeds,
  // detected by the header's "Đăng nhập" button disappearing.
  await expect(home.loginTrigger.first()).toBeHidden({ timeout: 150_000 });

  await page.context().storageState({ path: AUTH_FILE });
  console.log(`✓ Saved authenticated session to ${AUTH_FILE}`);
});
