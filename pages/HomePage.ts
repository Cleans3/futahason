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
 */
export class HomePage extends BasePage {
  readonly loginTrigger: Locator;
  readonly departureInput: Locator;
  readonly destinationInput: Locator;
  /** The real <input> for round trip — use for asserting checked state. */
  readonly roundTripCheckbox: Locator;
  /** The styled, clickable round-trip control — use for toggling. */
  readonly roundTripToggle: Locator;
  readonly searchButton: Locator;
  readonly departureDateInput: Locator;

  constructor(page: Page) {
    super(page);
    // Two responsive copies of the login button exist; act on the visible one.
    this.loginTrigger = page
      .getByRole('button', { name: LABELS.loginButton })
      .filter({ visible: true });
    this.departureInput = page.getByRole('textbox', { name: LABELS.pickDeparture });
    this.destinationInput = page.getByRole('textbox', { name: LABELS.pickDestination });
    // The "Khứ hồi" accessible name matches both a styled wrapper and the real
    // input; intersect with `input` to single out the real checkbox for state.
    this.roundTripCheckbox = page
      .getByRole('checkbox', { name: LABELS.roundTrip })
      .and(page.locator('input'));
    this.roundTripToggle = page.getByRole('checkbox', { name: LABELS.roundTrip }).first();
    this.searchButton = page.getByRole('button', { name: LABELS.searchButton });
    // Departure date is a DevExpress date edit; the return-date twin is hidden
    // until round trip is on, so the visible one is the departure date.
    this.departureDateInput = page
      .locator('input.dxbs-date-edit-input')
      .filter({ visible: true })
      .first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await expect(this.searchButton).toBeVisible();
  }

  /** Open the OTP login modal and return its page object. */
  async openLogin(): Promise<LoginModal> {
    await this.loginTrigger.first().click();
    const modal = new LoginModal(this.page);
    await modal.expectOpen();
    return modal;
  }

  async selectDeparture(place: Place): Promise<void> {
    await this.pickLocation(this.departureInput, place);
  }

  async selectDestination(place: Place): Promise<void> {
    await this.pickLocation(this.destinationInput, place);
  }

  private async pickLocation(trigger: Locator, place: Place): Promise<void> {
    const dialog = this.page.getByRole('dialog');
    // The picker occasionally swallows the first click while hydrating; retry
    // opening it until the dialog is actually shown.
    await expect(async () => {
      await trigger.click();
      await expect(dialog).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    // Expand the province group (wait for actionability — the dialog animates in).
    const provinceOption = dialog.getByText(place.province, { exact: true }).first();
    await expect(provinceOption).toBeVisible();
    await provinceOption.click();
    // Pick the station leaf. When the station name equals the province name
    // (e.g. "Hà Nội"), the header and the leaf share text, so wait for the leaf
    // to render (count becomes 2) before clicking the last match.
    const leaf = dialog.getByText(place.station, { exact: true });
    await expect(leaf).toHaveCount(place.province === place.station ? 2 : 1);
    await leaf.last().click();
    await expect(trigger).toHaveValue(place.station);
  }

  async toggleRoundTrip(): Promise<void> {
    await this.roundTripToggle.click();
  }

  async search(): Promise<void> {
    await this.safeClick(this.searchButton);
  }

  /** Full happy-path: choose both endpoints (default = today) and search. */
  async searchTrip(from: Place, to: Place): Promise<void> {
    await this.selectDeparture(from);
    await this.selectDestination(to);
    await this.search();
  }
}
