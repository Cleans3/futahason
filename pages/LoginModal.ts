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
 *
 * (VI) Modal đăng nhập bằng OTP (Đăng nhập).
 * Hành vi đã kiểm chứng trên futahason.com:
 *  - Chỉ đăng nhập bằng OTP. Bước 1 nhập mã quốc gia (mặc định +84) và số điện
 *    thoại; bấm "Đăng nhập" sẽ gửi mã một lần qua SMS/Zalo. Bước 2 (nhập mã)
 *    cần điện thoại thật nên nằm ngoài phạm vi bộ test không-đăng-nhập, và được
 *    xử lý riêng bởi tests/auth.setup.ts.
 *  - Ô số điện thoại KHÔNG có mask — nhận mọi ký tự — nên việc kiểm tra phía
 *    client là "không chuyển sang bước nhập mã", chứ không phải "chặn gõ phím".
 */
export class LoginModal extends BasePage {
  readonly dialog: Locator;
  readonly countryCode: Locator;
  readonly phoneInput: Locator;
  readonly submitButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    super(page);
    // (VI) Lọc đúng modal đăng nhập bằng dòng gợi ý OTP để khỏi nhầm với dialog khác.
    this.dialog = page.getByRole('dialog').filter({ hasText: MESSAGES.login.otpHint });
    this.countryCode = this.dialog.getByRole('combobox'); // (VI) Ô chọn mã quốc gia
    this.phoneInput = this.dialog.getByPlaceholder('Số điện thoại');
    this.submitButton = this.dialog.getByRole('button', { name: LABELS.loginButton });
    this.closeButton = this.dialog.getByRole('button', { name: 'Close' });
  }

  // (VI) Kiểm tra modal đã mở và ô số điện thoại đã hiển thị.
  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
    await expect(this.phoneInput).toBeVisible();
  }

  // (VI) Kiểm tra mã quốc gia mặc định (lưu ý: select lưu "84", không phải "+84").
  async expectDefaultCountryCode(code: string): Promise<void> {
    await expect(this.countryCode).toHaveValue(code);
  }

  // (VI) Nhập số điện thoại vào ô.
  async fillPhone(phone: string): Promise<void> {
    await this.phoneInput.fill(phone);
  }

  /** Press "Đăng nhập" to request an OTP. */
  // (VI) Bấm "Đăng nhập" để yêu cầu gửi mã OTP.
  async requestOtp(): Promise<void> {
    await this.submitButton.click();
  }

  /** True once the modal has advanced to the OTP code-entry step. */
  // (VI) Định vị các ô nhập OTP — chỉ xuất hiện khi modal đã sang bước nhập mã.
  private get otpInputs(): Locator {
    // The code step renders single-character inputs once an OTP is sent.
    // (VI) Bước nhập mã render các ô 1 ký tự (maxlength="1") sau khi OTP được gửi.
    return this.page.locator('input[maxlength="1"]');
  }

  /** Assert the modal is still on the phone step (i.e., submission was blocked). */
  // (VI) Khẳng định modal vẫn ở bước nhập SĐT (tức là việc gửi đã bị chặn).
  async expectStillOnPhoneStep(): Promise<void> {
    await expect(this.dialog).toBeVisible();
    await expect(this.phoneInput).toBeVisible();
    await expect(this.otpInputs).toHaveCount(0); // (VI) Chưa có ô OTP nào
  }

  /** Assert the modal advanced to the OTP step (only after a real phone). */
  // (VI) Khẳng định modal đã sang bước nhập OTP (chỉ xảy ra với số thật).
  async expectOtpStep(): Promise<void> {
    await expect(this.otpInputs.first()).toBeVisible({ timeout: 15_000 });
  }

  /**
   * Assert no OTP was sent (the code-entry step never rendered). Use this when a
   * validation alert takes over and hides the login modal, so the
   * "still on phone step" check no longer applies.
   */
  // (VI) Khẳng định OTP chưa được gửi (chưa render bước nhập mã). Dùng khi popup
  // cảnh báo che/đóng modal đăng nhập, nên không thể kiểm tra "vẫn ở bước SĐT".
  async expectOtpNotSent(): Promise<void> {
    await expect(this.otpInputs).toHaveCount(0);
  }

  /**
   * Assert an inline validation hint is shown inside the login modal (e.g. the
   * "must start with 0" message), and that submission was blocked.
   */
  // (VI) Khẳng định gợi ý lỗi hiện ngay trong modal (vd: "bắt đầu bằng 0") và
  // việc gửi đã bị chặn.
  async expectPhoneHint(text: string): Promise<void> {
    await expect(this.dialog).toContainText(text);
    await expect(this.otpInputs).toHaveCount(0); // (VI) Chưa sang bước OTP
  }

  // (VI) Đóng modal bằng nút Close và chờ nó biến mất.
  async close(): Promise<void> {
    await this.closeButton.click();
    await expect(this.dialog).toBeHidden();
  }
}
