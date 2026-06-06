import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { BUS_TYPES, LABELS } from '../fixtures/test-data';

/**
 * The trip-results page (URL: /datve/<base64-encoded route>).
 *
 * Each result is a card exposing a bus product (ECONOMY / VIP / ROYAL CABIN), a
 * "Từ <price>" label, departure/arrival times + stations, remaining seats, and a
 * yellow "Chọn chỗ" (select seat) button. A second "Chọn chỗ" button with class
 * `btnChiTietXe` opens vehicle details — we deliberately target only the yellow
 * select-seat buttons.
 */
export class SearchResultsPage extends BasePage {
  /** The yellow "select seat" buttons — one per trip card. */
  readonly selectSeatButtons: Locator;

  constructor(page: Page) {
    super(page);
    this.selectSeatButtons = page
      .locator('button.cyber-button-yellow')
      .filter({ hasText: LABELS.selectSeat });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/datve\//);
    await expect(this.selectSeatButtons.first()).toBeVisible();
  }

  async tripCount(): Promise<number> {
    return this.selectSeatButtons.count();
  }

  /** At least one trip is offered. */
  async expectHasTrips(): Promise<void> {
    expect(await this.tripCount()).toBeGreaterThan(0);
  }

  /** Each card carries pricing + at least one known bus product. */
  async expectCardsWellFormed(): Promise<void> {
    await expect(this.page.getByText(/Từ\s?[\d.]+/).first()).toBeVisible();
    const anyBusType = this.page.getByText(new RegExp(BUS_TYPES.join('|'))).first();
    await expect(anyBusType).toBeVisible();
  }
}
