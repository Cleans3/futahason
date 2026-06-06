import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { LABELS, MESSAGES } from '../fixtures/test-data';

/**
 * The OTP login modal (Đăng nhập).
 *
 * Verified behaviour on futahason.com:
 *  - Login is OTP-only. Step 1 collects a country code (+84 default) and a phone
 *    number; pressing "Đăng nhập" requests a one-time code by SMS/Zalo. Step 2
 *    (entering the code) requires a real handset, so it is out of scope for the
 *    unauthenticated suite and is driven by tests/auth.setup.ts instead.
 *  - The phone field has NO input mask — it accepts any characters — so client
 *    validation is "does not advance to the code step", not "rejects keystrokes".
 */
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

  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
    await expect(this.phoneInput).toBeVisible();
  }

  async expectDefaultCountryCode(code: string): Promise<void> {
    await expect(this.countryCode).toHaveValue(code);
  }

  async fillPhone(phone: string): Promise<void> {
    await this.phoneInput.fill(phone);
  }

  /** Press "Đăng nhập" to request an OTP. */
  async requestOtp(): Promise<void> {
    await this.submitButton.click();
  }

  /** True once the modal has advanced to the OTP code-entry step. */
  private get otpInputs(): Locator {
    // The code step renders single-character inputs once an OTP is sent.
    return this.page.locator('input[maxlength="1"]');
  }

  /** Assert the modal is still on the phone step (i.e., submission was blocked). */
  async expectStillOnPhoneStep(): Promise<void> {
    await expect(this.dialog).toBeVisible();
    await expect(this.phoneInput).toBeVisible();
    await expect(this.otpInputs).toHaveCount(0);
  }

  /** Assert the modal advanced to the OTP step (only after a real phone). */
  async expectOtpStep(): Promise<void> {
    await expect(this.otpInputs.first()).toBeVisible({ timeout: 15_000 });
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await expect(this.dialog).toBeHidden();
  }
}
