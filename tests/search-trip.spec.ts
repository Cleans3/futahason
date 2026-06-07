import { test, expect } from '../fixtures/fixtures';
import { ROUTE, MESSAGES } from '../fixtures/test-data';

/**
 * Feature: Tìm kiếm chuyến xe (Trip search)
 *
 * Searching is fully non-destructive, so these run end-to-end against the live
 * site: pick a province → station for both endpoints, then "Tìm chuyến".
 *
 * (VI) Tính năng: Tìm kiếm chuyến xe.
 * Việc tìm kiếm hoàn toàn không gây thay đổi dữ liệu, nên các test chạy
 * end-to-end trực tiếp trên site thật: chọn tỉnh → bến cho cả điểm đi và điểm
 * đến, rồi bấm "Tìm chuyến".
 */
test.describe('Tìm kiếm chuyến xe (Trip search)', () => {
  // (VI) Trước mỗi test: mở trang chủ.
  test.beforeEach(async ({ home }) => {
    await home.goto();
  });

  // (VI) Tìm được chuyến cho tuyến hợp lệ (Lào Cai → Hà Nội).
  test('TC-SEARCH-01: finds trips for a valid route (Lào Cai → Hà Nội)', async ({
    home,
    results,
  }) => {
    await home.searchTrip(ROUTE.from, ROUTE.to);
    await results.expectLoaded();
    await results.expectHasTrips();
  });

  // (VI) Form hiển thị đúng điểm đi/điểm đến đã chọn.
  test('TC-SEARCH-02: reflects the chosen departure and destination in the form', async ({
    home,
  }) => {
    await home.selectDeparture(ROUTE.from);
    await home.selectDestination(ROUTE.to);
    await expect(home.departureInput).toHaveValue(ROUTE.from.station);
    await expect(home.destinationInput).toHaveValue(ROUTE.to.station);
  });

  // (VI) Từ chối tìm khi chưa chọn điểm đi.
  test('TC-SEARCH-04: rejects a search with no departure point', async ({ home, page }) => {
    await home.search();
    await expect(page.getByText(MESSAGES.search.missingDeparture)).toBeVisible();
    // Still on the home page — no navigation to results.
    // (VI) Vẫn ở trang chủ — không chuyển sang trang kết quả.
    await expect(page).not.toHaveURL(/\/datve\//);
  });

  // (VI) Từ chối tìm khi có điểm đi nhưng chưa chọn điểm đến.
  test('TC-SEARCH-05: rejects a search with a departure but no destination', async ({
    home,
    page,
  }) => {
    await home.selectDeparture(ROUTE.from);
    await home.search();
    await expect(page.getByText(MESSAGES.search.missingDestination)).toBeVisible();
    await expect(page).not.toHaveURL(/\/datve\//);
  });

  // (VI) Ngày khởi hành mặc định theo định dạng dd/MM/yyyy.
  test('TC-SEARCH-06: defaults the departure date to a dd/MM/yyyy value', async ({ home }) => {
    await expect(home.departureDateInput).toHaveValue(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  // (VI) Thẻ kết quả có giá và loại xe đã biết.
  test('TC-SEARCH-07: result cards expose price and a known bus product', async ({
    home,
    results,
  }) => {
    await home.searchTrip(ROUTE.from, ROUTE.to);
    await results.expectLoaded();
    await results.expectCardsWellFormed();
  });

  // (VI) Bật/tắt được tuỳ chọn khứ hồi (Khứ hồi).
  test('TC-SEARCH-08: toggles the round-trip (Khứ hồi) option', async ({ home }) => {
    await expect(home.roundTripCheckbox).not.toBeChecked();
    await home.toggleRoundTrip();
    await expect(home.roundTripCheckbox).toBeChecked();
  });
});
