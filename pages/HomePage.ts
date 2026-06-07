import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { LoginModal } from './LoginModal';
import { LABELS } from '../fixtures/test-data';

type Place = { province: string; station: string };

/**
 * The home page (https://futahason.com/) and its interprovincial search widget.
 *
 * The location pickers are two-level modals: click the field → a dialog lists
 * provinces → click a province to expand its stations → click the station leaf.
 * Some province names equal a station name (e.g. "Hà Nội"), so the station leaf
 * is selected with `.last()` to disambiguate from the province header.
 *
 * (VI) Trang chủ (https://futahason.com/) và widget tìm chuyến xe liên tỉnh.
 * Hộp chọn địa điểm là modal hai cấp: bấm vào ô → dialog liệt kê các tỉnh →
 * bấm một tỉnh để mở danh sách bến → bấm vào bến (mục con). Có tỉnh trùng tên
 * với bến (vd "Hà Nội"), nên mục con được chọn bằng `.last()` để phân biệt với
 * tiêu đề tỉnh.
 */
export class HomePage extends BasePage {
  readonly loginTrigger: Locator;
  readonly departureInput: Locator;
  readonly destinationInput: Locator;
  /** The real <input> for round trip — use for asserting checked state. */
  // (VI) Thẻ <input> thật của "Khứ hồi" — dùng để kiểm tra trạng thái tích/chưa tích.
  readonly roundTripCheckbox: Locator;
  /** The styled, clickable round-trip control — use for toggling. */
  // (VI) Phần điều khiển "Khứ hồi" có style, bấm được — dùng để bật/tắt.
  readonly roundTripToggle: Locator;
  readonly searchButton: Locator;
  readonly departureDateInput: Locator;

  constructor(page: Page) {
    super(page);
    // Two responsive copies of the login button exist; act on the visible one.
    // (VI) Có 2 bản nút đăng nhập (desktop + mobile); chỉ thao tác trên bản đang hiện.
    this.loginTrigger = page
      .getByRole('button', { name: LABELS.loginButton })
      .filter({ visible: true });
    this.departureInput = page.getByRole('textbox', { name: LABELS.pickDeparture }); // (VI) Ô "Chọn điểm đi"
    this.destinationInput = page.getByRole('textbox', { name: LABELS.pickDestination }); // (VI) Ô "Chọn điểm đến"
    // The "Khứ hồi" accessible name matches both a styled wrapper and the real
    // input; intersect with `input` to single out the real checkbox for state.
    // (VI) Tên "Khứ hồi" khớp cả lớp bọc có style lẫn <input> thật; giao với
    // `input` để chỉ lấy đúng checkbox thật khi kiểm tra trạng thái.
    this.roundTripCheckbox = page
      .getByRole('checkbox', { name: LABELS.roundTrip })
      .and(page.locator('input'));
    this.roundTripToggle = page.getByRole('checkbox', { name: LABELS.roundTrip }).first();
    this.searchButton = page.getByRole('button', { name: LABELS.searchButton });
    // Departure date is a DevExpress date edit; the return-date twin is hidden
    // until round trip is on, so the visible one is the departure date.
    // (VI) Ngày đi là control date của DevExpress; ô ngày về (sinh đôi) bị ẩn cho
    // tới khi bật "Khứ hồi", nên ô đang hiển thị chính là ô ngày đi.
    this.departureDateInput = page
      .locator('input.dxbs-date-edit-input')
      .filter({ visible: true })
      .first();
  }

  // (VI) Mở trang chủ và chờ nút "Tìm chuyến" hiển thị.
  async goto(): Promise<void> {
    await this.page.goto('/');
    await expect(this.searchButton).toBeVisible();
  }

  /** Open the OTP login modal and return its page object. */
  // (VI) Mở modal đăng nhập OTP và trả về page object của nó.
  async openLogin(): Promise<LoginModal> {
    await this.loginTrigger.first().click();
    const modal = new LoginModal(this.page);
    await modal.expectOpen();
    return modal;
  }

  // (VI) Chọn điểm đi.
  async selectDeparture(place: Place): Promise<void> {
    await this.pickLocation(this.departureInput, place);
  }

  // (VI) Chọn điểm đến.
  async selectDestination(place: Place): Promise<void> {
    await this.pickLocation(this.destinationInput, place);
  }

  // (VI) Hàm dùng chung cho cả chọn điểm đi/đến: mở dialog → chọn tỉnh → chọn bến.
  private async pickLocation(trigger: Locator, place: Place): Promise<void> {
    const dialog = this.page.getByRole('dialog');
    // The picker occasionally swallows the first click while hydrating; retry
    // opening it until the dialog is actually shown.
    // (VI) Lúc trang đang "hydrate", cú click đầu đôi khi bị nuốt; thử bấm lại
    // cho tới khi dialog thực sự hiện ra.
    await expect(async () => {
      await trigger.click();
      await expect(dialog).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    // Expand the province group (wait for actionability — the dialog animates in).
    // (VI) Mở nhóm tỉnh (chờ phần tử bấm được — dialog có hiệu ứng trượt vào).
    const provinceOption = dialog.getByText(place.province, { exact: true }).first();
    await expect(provinceOption).toBeVisible();
    await provinceOption.click();
    // Pick the station leaf. When the station name equals the province name
    // (e.g. "Hà Nội"), the header and the leaf share text, so wait for the leaf
    // to render (count becomes 2) before clicking the last match.
    // (VI) Chọn bến (mục con). Khi tên bến trùng tên tỉnh (vd "Hà Nội"), tiêu đề
    // và mục con cùng chữ, nên chờ mục con render (số lượng thành 2) rồi mới bấm
    // vào kết quả cuối cùng.
    const leaf = dialog.getByText(place.station, { exact: true });
    await expect(leaf).toHaveCount(place.province === place.station ? 2 : 1);
    await leaf.last().click();
    await expect(trigger).toHaveValue(place.station);
  }

  // (VI) Bật/tắt tuỳ chọn khứ hồi.
  async toggleRoundTrip(): Promise<void> {
    await this.roundTripToggle.click();
  }

  // (VI) Bấm nút "Tìm chuyến".
  async search(): Promise<void> {
    await this.safeClick(this.searchButton);
  }

  /** Full happy-path: choose both endpoints (default = today) and search. */
  // (VI) Luồng happy-path đầy đủ: chọn cả điểm đi/đến (ngày mặc định = hôm nay) rồi tìm.
  async searchTrip(from: Place, to: Place): Promise<void> {
    await this.selectDeparture(from);
    await this.selectDestination(to);
    await this.search();
  }
}
