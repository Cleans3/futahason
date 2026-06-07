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
 *
 * (VI) Phễu đặt vé dẫn tới bước điền thông tin thanh toán.
 * Thứ tự thao tác đã kiểm chứng trên futahason.com:
 *   1. "Chọn chỗ"  → mở sơ đồ ghế (Tầng 1/2, ghế dạng C1-1).
 *   2. chọn ghế → tích "Tôi đồng ý với điều khoản" → "Tiếp tục".
 *        · Bấm "Tiếp tục" mà chưa tích điều khoản → cảnh báo "Bạn chưa đồng ý…".
 *   3. chọn Điểm đón + Điểm trả → "Xác nhận".
 *        · Xác nhận khi chưa chọn → cảnh báo "Bạn vui lòng chọn điểm đón/trả".
 *   4. "Xác nhận" xong thì bắt buộc đăng nhập → modal OTP hiện ra.
 *        Form hành khách/thanh toán nằm SAU cổng đăng nhập này, nên bộ test
 *        không-đăng-nhập chỉ kiểm chứng cái cổng; còn form thanh toán chỉ được
 *        chạy khi có phiên đăng nhập đã lưu (xem tests/payment-info.spec.ts).
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
    this.seats = page.locator('label.cyberfontsmall').filter({ visible: true }); // (VI) Các ghế trên sơ đồ
    this.continueButton = page.getByRole('button', { name: LABELS.continue }).filter({ visible: true });
    this.confirmButton = page.getByRole('button', { name: LABELS.confirm }).filter({ visible: true });
  }

  /** The terms checkbox is the input immediately preceding the visible terms label. */
  // (VI) Checkbox điều khoản chính là <input> đứng ngay trước nhãn "điều khoản"
  // đang hiển thị. (Bấm vào chữ thì mở modal điều khoản, nên ta nhắm thẳng <input>.)
  private get termsCheckbox(): Locator {
    const span = this.page
      .locator('span.cyber-hover', { hasText: 'điều khoản' })
      .filter({ visible: true });
    return span.locator('xpath=preceding-sibling::input[@type="checkbox"]');
  }

  /** Expand the seat map for a trip (default: the first card). */
  // (VI) Mở sơ đồ ghế của một chuyến (mặc định: thẻ đầu tiên).
  async openSeatMap(tripIndex = 0): Promise<void> {
    await this.forceClick(this.selectSeatButtons.nth(tripIndex));
    await expect(this.seats.first()).toBeVisible();
  }

  // (VI) Kiểm tra sơ đồ ghế đang hiển thị (có ít nhất một ghế).
  async expectSeatMapVisible(): Promise<void> {
    expect(await this.seats.count()).toBeGreaterThan(0);
  }

  /** Select the first available seat in the open map. */
  // (VI) Chọn ghế trống đầu tiên trên sơ đồ đang mở.
  async selectFirstSeat(): Promise<void> {
    await this.forceClick(this.seats.first());
  }

  // (VI) Tích ô đồng ý điều khoản rồi xác nhận đã tích.
  async acceptTerms(): Promise<void> {
    await this.termsCheckbox.check({ force: true });
    await expect(this.termsCheckbox).toBeChecked();
  }

  // (VI) Bấm "Tiếp tục" sau khi chọn ghế.
  async continueAfterSeat(): Promise<void> {
    await this.forceClick(this.continueButton);
  }

  /** Continuing without ticking the terms box raises a blocking alert. */
  // (VI) Bấm "Tiếp tục" mà chưa tích điều khoản sẽ bật cảnh báo chặn lại.
  async expectTermsValidation(): Promise<void> {
    await this.expectAlert(MESSAGES.booking.termsNotAccepted);
  }

  /** Wait for the pickup/drop-off step to render after "Tiếp tục". */
  // (VI) Chờ bước chọn điểm đón/điểm trả render xong sau khi bấm "Tiếp tục".
  async waitForPickupStep(): Promise<void> {
    await expect(this.page.getByText(LABELS.pickupHeader).first()).toBeVisible();
    await expect(this.page.getByText(LABELS.dropoffHeader).first()).toBeVisible();
  }

  /**
   * Tick a Syncfusion checkbox via its frame and confirm it actually toggled.
   * NB: these checkboxes ignore force clicks (unlike the seats/buttons), so a
   * normal click is required — the pickup/drop-off step is stable enough for it.
   *
   * (VI) Tích một checkbox của Syncfusion thông qua phần `.e-frame` của nó rồi
   * xác nhận là đã thực sự đổi trạng thái. LƯU Ý: loại checkbox này KHÔNG nhận
   * click "force" (khác với ghế/nút), nên phải click thường — bước đón/trả đủ
   * ổn định để click thường hoạt động.
   */
  private async checkSyncfusion(wrapper: Locator): Promise<void> {
    await expect(wrapper).toBeVisible();
    await this.safeClick(wrapper.locator('.e-frame'));
    await expect(wrapper).toHaveAttribute('aria-checked', 'true');
  }

  // (VI) Chọn điểm đón đầu tiên.
  async selectFirstPickup(): Promise<void> {
    // Pickups precede the "Điểm trả" header, so the first visible wrapper is one.
    // (VI) Các điểm đón nằm trước tiêu đề "Điểm trả", nên ô đầu tiên đang hiện là một điểm đón.
    await this.checkSyncfusion(
      this.page.locator('.e-checkbox-wrapper').filter({ visible: true }).first(),
    );
  }

  // (VI) Chọn điểm trả đầu tiên (checkbox đầu tiên nằm SAU tiêu đề "Điểm trả").
  async selectFirstDropoff(): Promise<void> {
    await this.checkSyncfusion(
      this.page.locator(
        'xpath=//*[normalize-space(text())="Điểm trả"]/following::*[contains(@class,"e-checkbox-wrapper")][1]',
      ),
    );
  }

  // (VI) Bấm "Xác nhận".
  async confirm(): Promise<void> {
    await this.forceClick(this.confirmButton);
  }

  /** Confirming with no pickup/drop-off selected raises a blocking alert. */
  // (VI) Xác nhận khi chưa chọn điểm đón/trả sẽ bật cảnh báo chặn lại.
  async expectPickupDropoffValidation(): Promise<void> {
    await this.expectAlert(MESSAGES.booking.pickupDropoffMissing);
  }

  /** After a valid confirm, an unauthenticated user is forced to log in (OTP). */
  // (VI) Sau khi xác nhận hợp lệ, người dùng chưa đăng nhập bị buộc đăng nhập (OTP).
  async expectLoginGate(): Promise<void> {
    await expect(this.page.getByText(MESSAGES.login.otpHint)).toBeVisible();
  }

  // ── Authenticated-only: the real payment-information form ──────────────────
  // Selectors below are reached ONLY after OTP login. Confirm against a test
  // account, then wire the assertions in tests/payment-info.spec.ts.
  // (VI) ── Chỉ khi đã đăng nhập: form thông tin thanh toán thật ──
  // (VI) Các selector dưới đây chỉ tới được SAU khi đăng nhập OTP. Hãy kiểm chứng
  // bằng tài khoản test rồi mới gắn assertion trong tests/payment-info.spec.ts.
  get passengerName(): Locator { // (VI) Ô họ tên hành khách
    return this.page.getByPlaceholder(/Họ.*tên|Tên người đi/i);
  }
  get passengerPhone(): Locator { // (VI) Ô số điện thoại hành khách
    return this.page.getByPlaceholder(/Số điện thoại/i).filter({ visible: true });
  }
  get passengerEmail(): Locator { // (VI) Ô email hành khách
    return this.page.getByPlaceholder(/Email/i).filter({ visible: true });
  }
}
