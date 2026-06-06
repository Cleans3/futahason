import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load local secrets / overrides from .env (see .env.example). Never commit .env.
dotenv.config();

export const BASE_URL = process.env.BASE_URL ?? 'https://futahason.com';

/**
 * Playwright configuration for the futahason.com E2E suite.
 *
 * Design notes (these matter for a *production* target — read CLAUDE.md):
 *  - The site under test is PRODUCTION. Tests are non-destructive by default:
 *    they never complete a real booking or payment (see ALLOW_REAL_BOOKING).
 *  - Login is OTP-based, so the suite separates "automatable" flows from flows
 *    that need a human-supplied OTP. Authenticated tests reuse a saved session
 *    (storageState) produced by the `setup` project.
 *  - The app is timezone/locale sensitive (Asia/Ho_Chi_Minh, dd/MM/yyyy dates,
 *    Vietnamese copy), so we pin locale + timezone for deterministic runs.
 */
export default defineConfig({
  testDir: './tests',
  /* Run files in parallel; tests inside a file run serially by default. */
  fullyParallel: true,
  /* Fail the build on CI if a `test.only` was left in the source. */
  forbidOnly: !!process.env.CI,
  /* The target is a single live production site whose booking funnel races under
     concurrent load (verified: tests are flaky at 2+ workers, deterministic at 1).
     Run serially by default; bump workers only against a staging environment.
     A retry still absorbs the occasional network/site hiccup. */
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  /* Rich, shareable reports. */
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  /* Shared settings for all projects. */
  use: {
    baseURL: BASE_URL,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    /* Capture artefacts only when something goes wrong — keeps runs fast. */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  /* Web-first assertions get 10s by default; the booking funnel can be slow. */
  expect: { timeout: 10_000 },

  projects: [
    /* One-off helper: performs OTP login and saves the session to auth/user.json.
       NOT part of the default run (it needs a human to type the OTP).
       Invoke explicitly:  npm run auth:setup                                    */
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    /* Main suite. Covers the login UI/validation, trip search, and the booking
       funnel up to the auth gate. The authenticated payment-information tests
       live in the same files but self-skip when auth/user.json is absent, so a
       plain `npm test` never hangs waiting for an OTP. Once you have run
       `npm run auth:setup`, those tests pick up the saved session automatically. */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
