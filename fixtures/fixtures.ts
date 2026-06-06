import { test as base, expect } from '@playwright/test';
import fs from 'node:fs';
import { HomePage } from '../pages/HomePage';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { BookingPage } from '../pages/BookingPage';
import { AUTH_FILE } from './test-data';

type Fixtures = {
  home: HomePage;
  results: SearchResultsPage;
  booking: BookingPage;
};

/**
 * Project-wide test fixtures. Each spec gets ready-made page objects so the test
 * bodies read as a sequence of business actions, not selector plumbing.
 */
export const test = base.extend<Fixtures>({
  home: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  results: async ({ page }, use) => {
    await use(new SearchResultsPage(page));
  },
  booking: async ({ page }, use) => {
    await use(new BookingPage(page));
  },
});

/** True when a saved OTP session exists; gates the authenticated payment tests. */
export const hasSavedAuth = fs.existsSync(AUTH_FILE);

export { expect };
