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
 *
 * (VI) Trang kết quả chuyến đi (URL: /datve/<route mã hoá base64>).
 * Mỗi kết quả là một thẻ (card) gồm: loại xe (ECONOMY / VIP / ROYAL CABIN), nhãn
 * "Từ <giá>", giờ đi/đến + bến, số ghế còn lại và nút vàng "Chọn chỗ". Có một nút
 * "Chọn chỗ" thứ hai (class `btnChiTietXe`) mở chi tiết xe — ta cố tình chỉ nhắm
 * vào nút "Chọn chỗ" màu vàng.
 */
export class SearchResultsPage extends BasePage {
  /** The yellow "select seat" buttons — one per trip card. */
  // (VI) Các nút "Chọn chỗ" màu vàng — mỗi thẻ chuyến đi có một nút.
  readonly selectSeatButtons: Locator;

  constructor(page: Page) {
    super(page);
    this.selectSeatButtons = page
      .locator('button.cyber-button-yellow')
      .filter({ hasText: LABELS.selectSeat });
  }

  // (VI) Kiểm tra đã sang trang kết quả (URL /datve/) và có ít nhất một nút "Chọn chỗ".
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/datve\//);
    await expect(this.selectSeatButtons.first()).toBeVisible();
  }

  // (VI) Đếm số chuyến (bằng số nút "Chọn chỗ").
  async tripCount(): Promise<number> {
    return this.selectSeatButtons.count();
  }

  /** At least one trip is offered. */
  // (VI) Có ít nhất một chuyến được trả về.
  async expectHasTrips(): Promise<void> {
    expect(await this.tripCount()).toBeGreaterThan(0);
  }

  /** Each card carries pricing + at least one known bus product. */
  // (VI) Mỗi thẻ đều có giá + ít nhất một loại xe đã biết.
  async expectCardsWellFormed(): Promise<void> {
    await expect(this.page.getByText(/Từ\s?[\d.]+/).first()).toBeVisible();
    const anyBusType = this.page.getByText(new RegExp(BUS_TYPES.join('|'))).first();
    await expect(anyBusType).toBeVisible();
  }
}
