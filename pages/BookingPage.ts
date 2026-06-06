import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { LABELS, MESSAGES } from '../fixtures/test-data';

/**
 * The booking funnel that leads to the payment-information step.
 *
 * Verified order of operations on futahason.com:
 *   1. "Chọn chỗ"  → expands the seat map (floors "Tầng 1/2", seats like C1-1).
 *   2. pick a seat → tick "Tôi đồng ý với điều khoản" → "Tiếp tục".
 *        · Continuing without the terms box ticked → alert "Bạn chưa đồng ý…".
 *   3. choose a pickup (Điểm đón) + a drop-off (Điểm trả) → "Xác nhận".
 *        · Confirming with neither chosen → alert "Bạn vui lòng chọn điểm đón/trả".
 *   4. "Xác nhận" then requires authentication → the OTP login modal appears.
 *        The actual passenger/payment form lives BEHIND this gate, so the
 *        unauthenticated suite asserts the gate; the payment form itself is
 *        exercised only with a saved session (see tests/payment-info.spec.ts).
 */
export class BookingPage extends BasePage {
  readonly selectSeatButtons: Locator;
  readonly seats: Locator;
  readonly continueButton: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    super(page);
    this.selectSeatButtons = page
      .locator('button.cyber-button-yellow')
      .filter({ hasText: LABELS.selectSeat });
    this.seats = page.locator('label.cyberfontsmall').filter({ visible: true });
    this.continueButton = page.getByRole('button', { name: LABELS.continue }).filter({ visible: true });
    this.confirmButton = page.getByRole('button', { name: LABELS.confirm }).filter({ visible: true });
  }

  /** The terms checkbox is the input immediately preceding the visible terms label. */
  private get termsCheckbox(): Locator {
    const span = this.page
      .locator('span.cyber-hover', { hasText: 'điều khoản' })
      .filter({ visible: true });
    return span.locator('xpath=preceding-sibling::input[@type="checkbox"]');
  }

  /** Expand the seat map for a trip (default: the first card). */
  async openSeatMap(tripIndex = 0): Promise<void> {
    await this.forceClick(this.selectSeatButtons.nth(tripIndex));
    await expect(this.seats.first()).toBeVisible();
  }

  async expectSeatMapVisible(): Promise<void> {
    expect(await this.seats.count()).toBeGreaterThan(0);
  }

  /** Select the first available seat in the open map. */
  async selectFirstSeat(): Promise<void> {
    await this.forceClick(this.seats.first());
  }

  async acceptTerms(): Promise<void> {
    await this.termsCheckbox.check({ force: true });
    await expect(this.termsCheckbox).toBeChecked();
  }

  async continueAfterSeat(): Promise<void> {
    await this.forceClick(this.continueButton);
  }

  /** Continuing without ticking the terms box raises a blocking alert. */
  async expectTermsValidation(): Promise<void> {
    await this.expectAlert(MESSAGES.booking.termsNotAccepted);
  }

  /** Wait for the pickup/drop-off step to render after "Tiếp tục". */
  async waitForPickupStep(): Promise<void> {
    await expect(this.page.getByText(LABELS.pickupHeader).first()).toBeVisible();
    await expect(this.page.getByText(LABELS.dropoffHeader).first()).toBeVisible();
  }

  /**
   * Tick a Syncfusion checkbox via its frame and confirm it actually toggled.
   * NB: these checkboxes ignore force clicks (unlike the seats/buttons), so a
   * normal click is required — the pickup/drop-off step is stable enough for it.
   */
  private async checkSyncfusion(wrapper: Locator): Promise<void> {
    await expect(wrapper).toBeVisible();
    await this.safeClick(wrapper.locator('.e-frame'));
    await expect(wrapper).toHaveAttribute('aria-checked', 'true');
  }

  async selectFirstPickup(): Promise<void> {
    // Pickups precede the "Điểm trả" header, so the first visible wrapper is one.
    await this.checkSyncfusion(
      this.page.locator('.e-checkbox-wrapper').filter({ visible: true }).first(),
    );
  }

  async selectFirstDropoff(): Promise<void> {
    await this.checkSyncfusion(
      this.page.locator(
        'xpath=//*[normalize-space(text())="Điểm trả"]/following::*[contains(@class,"e-checkbox-wrapper")][1]',
      ),
    );
  }

  async confirm(): Promise<void> {
    await this.forceClick(this.confirmButton);
  }

  /** Confirming with no pickup/drop-off selected raises a blocking alert. */
  async expectPickupDropoffValidation(): Promise<void> {
    await this.expectAlert(MESSAGES.booking.pickupDropoffMissing);
  }

  /** After a valid confirm, an unauthenticated user is forced to log in (OTP). */
  async expectLoginGate(): Promise<void> {
    await expect(this.page.getByText(MESSAGES.login.otpHint)).toBeVisible();
  }

  // ── Authenticated-only: the real payment-information form ──────────────────
  // Selectors below are reached ONLY after OTP login. Confirm against a test
  // account, then wire the assertions in tests/payment-info.spec.ts.
  get passengerName(): Locator {
    return this.page.getByPlaceholder(/Họ.*tên|Tên người đi/i);
  }
  get passengerPhone(): Locator {
    return this.page.getByPlaceholder(/Số điện thoại/i).filter({ visible: true });
  }
  get passengerEmail(): Locator {
    return this.page.getByPlaceholder(/Email/i).filter({ visible: true });
  }
}
