import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Shared behaviour for every page object.
 *
 * futahason.com is a Blazor + Syncfusion app with a few cross-cutting UI quirks
 * that every flow has to cope with:
 *  - Validation feedback comes back as a centred modal containing the message and
 *    a single "Đồng ý" (OK) button. `expectAlert` / `dismissAlert` handle it.
 *  - A floating hotline widget + newsletter footer can overlap the bottom of the
 *    page and intercept clicks; page objects scroll their target into view first.
 *
 * (VI) Hành vi dùng chung cho mọi page object.
 * futahason.com là ứng dụng Blazor + Syncfusion, có vài đặc thù giao diện mà
 * luồng nào cũng phải xử lý:
 *  - Thông báo lỗi hiện dưới dạng popup ở giữa màn hình, kèm đúng một nút
 *    "Đồng ý". Hàm `expectAlert` / `dismissAlert` lo phần này.
 *  - Widget hotline nổi và footer đăng ký nhận tin có thể che mất đáy trang và
 *    "ăn" mất cú click; nên page object luôn cuộn phần tử vào tầm nhìn trước.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** The site's generic alert/confirm popup (validation + system messages). */
  // (VI) Popup cảnh báo/xác nhận chung của site (thông báo lỗi + hệ thống).
  protected get alert(): Locator {
    return this.page.locator('.e-dlg-container, [role="dialog"]').filter({
      has: this.page.getByRole('button', { name: 'Đồng ý' }),
    });
  }

  /** Assert that an alert popup containing `message` is shown. */
  // (VI) Kiểm tra rằng popup cảnh báo chứa `message` đang hiển thị.
  async expectAlert(message: string): Promise<void> {
    await expect(
      this.page.getByText(message, { exact: false }),
      `Expected the site to show the alert: "${message}"`,
    ).toBeVisible();
  }

  /** Dismiss the alert popup by clicking its "Đồng ý" button, if present. */
  // (VI) Đóng popup bằng cách bấm nút "Đồng ý" (nếu có).
  async dismissAlert(): Promise<void> {
    const ok = this.page.getByRole('button', { name: 'Đồng ý', exact: true });
    if (await ok.first().isVisible().catch(() => false)) {
      await ok.first().click();
    }
  }

  /** Click that tolerates the overlapping hotline/newsletter widgets. */
  // (VI) Click "an toàn": cuộn phần tử vào tầm nhìn trước để tránh bị widget che.
  protected async safeClick(target: Locator): Promise<void> {
    await target.scrollIntoViewIfNeeded();
    await target.click();
  }

  /**
   * Force a click after scrolling into view, bypassing the actionability
   * stability check. Needed on the results/booking pages where auto-rotating
   * carousels keep the layout in perpetual motion, so elements never settle to
   * "stable" even though they are fully interactive.
   *
   * (VI) Click "ép" (force) sau khi cuộn vào tầm nhìn, bỏ qua bước chờ phần tử
   * "đứng yên". Cần dùng ở trang kết quả/đặt vé vì các carousel tự xoay khiến bố
   * cục luôn chuyển động, phần tử không bao giờ "ổn định" dù thực tế vẫn bấm được.
   */
  protected async forceClick(target: Locator): Promise<void> {
    await target.scrollIntoViewIfNeeded();
    await target.click({ force: true });
  }
}
