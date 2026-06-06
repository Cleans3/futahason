import { test, expect } from '../fixtures/fixtures';
import { ROUTE, MESSAGES } from '../fixtures/test-data';

/**
 * Feature: Tìm kiếm chuyến xe (Trip search)
 *
 * Searching is fully non-destructive, so these run end-to-end against the live
 * site: pick a province → station for both endpoints, then "Tìm chuyến".
 */
test.describe('Tìm kiếm chuyến xe (Trip search)', () => {
  test.beforeEach(async ({ home }) => {
    await home.goto();
  });

  test('TC-SEARCH-01: finds trips for a valid route (Lào Cai → Hà Nội)', async ({
    home,
    results,
  }) => {
    await home.searchTrip(ROUTE.from, ROUTE.to);
    await results.expectLoaded();
    await results.expectHasTrips();
  });

  test('TC-SEARCH-02: reflects the chosen departure and destination in the form', async ({
    home,
  }) => {
    await home.selectDeparture(ROUTE.from);
    await home.selectDestination(ROUTE.to);
    await expect(home.departureInput).toHaveValue(ROUTE.from.station);
    await expect(home.destinationInput).toHaveValue(ROUTE.to.station);
  });

  test('TC-SEARCH-04: rejects a search with no departure point', async ({ home, page }) => {
    await home.search();
    await expect(page.getByText(MESSAGES.search.missingDeparture)).toBeVisible();
    // Still on the home page — no navigation to results.
    await expect(page).not.toHaveURL(/\/datve\//);
  });

  test('TC-SEARCH-05: rejects a search with a departure but no destination', async ({
    home,
    page,
  }) => {
    await home.selectDeparture(ROUTE.from);
    await home.search();
    await expect(page.getByText(MESSAGES.search.missingDestination)).toBeVisible();
    await expect(page).not.toHaveURL(/\/datve\//);
  });

  test('TC-SEARCH-06: defaults the departure date to a dd/MM/yyyy value', async ({ home }) => {
    await expect(home.departureDateInput).toHaveValue(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  test('TC-SEARCH-07: result cards expose price and a known bus product', async ({
    home,
    results,
  }) => {
    await home.searchTrip(ROUTE.from, ROUTE.to);
    await results.expectLoaded();
    await results.expectCardsWellFormed();
  });

  test('TC-SEARCH-08: toggles the round-trip (Khứ hồi) option', async ({ home }) => {
    await expect(home.roundTripCheckbox).not.toBeChecked();
    await home.toggleRoundTrip();
    await expect(home.roundTripCheckbox).toBeChecked();
  });
});
