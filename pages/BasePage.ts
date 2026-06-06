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
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** The site's generic alert/confirm popup (validation + system messages). */
  protected get alert(): Locator {
    return this.page.locator('.e-dlg-container, [role="dialog"]').filter({
      has: this.page.getByRole('button', { name: 'Đồng ý' }),
    });
  }

  /** Assert that an alert popup containing `message` is shown. */
  async expectAlert(message: string): Promise<void> {
    await expect(
      this.page.getByText(message, { exact: false }),
      `Expected the site to show the alert: "${message}"`,
    ).toBeVisible();
  }

  /** Dismiss the alert popup by clicking its "Đồng ý" button, if present. */
  async dismissAlert(): Promise<void> {
    const ok = this.page.getByRole('button', { name: 'Đồng ý', exact: true });
    if (await ok.first().isVisible().catch(() => false)) {
      await ok.first().click();
    }
  }

  /** Click that tolerates the overlapping hotline/newsletter widgets. */
  protected async safeClick(target: Locator): Promise<void> {
    await target.scrollIntoViewIfNeeded();
    await target.click();
  }

  /**
   * Force a click after scrolling into view, bypassing the actionability
   * stability check. Needed on the results/booking pages where auto-rotating
   * carousels keep the layout in perpetual motion, so elements never settle to
   * "stable" even though they are fully interactive.
   */
  protected async forceClick(target: Locator): Promise<void> {
    await target.scrollIntoViewIfNeeded();
    await target.click({ force: true });
  }
}
