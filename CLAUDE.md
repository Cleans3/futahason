# futahason.com E2E Test Suite — Source of Truth

Playwright end-to-end tests for **[futahason.com](https://futahason.com)** (FUTA Hà Sơn —
a Vietnamese intercity bus operator). This document is the single reference for how the
site behaves, how the suite is built, why each decision was made, and how to run and
extend it. Read this before touching the tests.

> Everything here was **verified live** against the production site while building the
> suite (selectors, flows, validation messages, and quirks). Where the live site forced
> a design compromise, the reason is documented inline.

---

## 1. Scope — what is tested

Three user journeys, in Vietnamese as the product team names them:

| # | Feature (VI)                 | Meaning                  | Spec file                     |
|---|------------------------------|--------------------------|-------------------------------|
| 1 | **Đăng nhập**                | Login (OTP)              | `tests/login.spec.ts`         |
| 2 | **Tìm kiếm chuyến xe**       | Search for a trip        | `tests/search-trip.spec.ts`   |
| 3 | **Điền thông tin thanh toán**| Fill payment information | `tests/payment-info.spec.ts`  |

The full, human-readable test-case catalogue (31 cases incl. manual/negative/policy ones)
lives in **`test-cases/TestCases_Futahason.xlsx`** — see §7.

---

## 2. Golden rule — production safety

futahason.com is a **live production system**. There is no public staging environment.
The suite is therefore **non-destructive by default** and obeys these rules:

1. **Never complete a real booking or payment.** Payment tests stop at *filling in* the
   form; they do not submit. The `ALLOW_REAL_BOOKING` flag (default `false`) exists only
   to unlock submission against a future sandbox — never flip it on production.
2. **Login is OTP-only.** A one-time code is sent by SMS/Zalo, so the login can only be
   *completed* by a human with the test handset. Automated tests cover everything up to
   the OTP request; completion is a manual/operator step (`npm run auth:setup`).
3. **Don't hammer the site.** It races under parallel load (see §6), so the suite runs
   **serially** by default.

If any of these rules block a test, the test **self-skips** rather than faking success.

---

## 3. How the app actually works (verified flows)

### 3.1 Đăng nhập (Login) — OTP, passwordless

```
Header "Đăng nhập" → modal opens
  ├─ country-code <select>  (default option value "84", shown as "+84")
  ├─ phone <input placeholder="Số điện thoại">   ← NO input mask: accepts any chars
  └─ "Đăng nhập" → requests an OTP by SMS/Zalo → code-entry step
```

- Submitting an **empty** phone does **not** advance and shows no message — the modal
  simply stays on the phone step (TC-LOGIN-03 asserts *"did not advance"*).
- The phone must be **the right length and start with `0`** (Vietnamese mobile format).
  Two distinct rejections were verified live:
  - **Right length but no leading `0`** (e.g. `9012345678`) → an **inline hint** appears
    in the modal: *"Nhập số điện thoại bắt đầu bằng 0/A phone number start with 0"*
    (TC-LOGIN-10 asserts this; `MESSAGES.login.mustStartWithZero`).
  - **Starts with `0` but malformed/too short** (e.g. `0901`) → an **alert popup**
    *"Số điện thoại không hợp lệ"* (TC-LOGIN-05 asserts this via `expectAlert`;
    `MESSAGES.login.invalidPhone`).
  In all cases the modal stays on the phone step and no OTP is sent.
- Completing login (entering the OTP) needs the real code → out of scope for the default
  run; handled by `tests/auth.setup.ts`.

### 3.2 Tìm kiếm chuyến xe (Trip search)

```
Home search widget
  ├─ tabs: "Xe Liên Tỉnh" (active) | "Xe hợp đồng" | "Hàng hóa"
  ├─ checkbox "Khứ hồi" (round trip) → reveals a return-date field
  ├─ "Chọn điểm đi"  → dialog: province → expand → station leaf
  ├─ "Chọn điểm đến" → same two-level dialog
  ├─ date "Ngày khởi hành" (DevExpress date edit, dd/MM/yyyy, defaults to today)
  └─ "Tìm chuyến" → /datve/<base64 route> results page
```

- **Provinces available:** Bắc Giang, Bắc Ninh, Đà Nẵng, Hà Nam, Hà Nội, Hà Tĩnh, Lào Cai,
  Nghệ An, Ninh Bình, Phú Thọ, Quảng Bình, Quảng Trị, Thái Nguyên, Thanh Hóa,
  Thừa Thiên Huế, Vĩnh Phúc, Yên Bái.
- **Reference route used by the suite:** `Lào Cai (TP Lào Cai, Bến Đền, Xuân Giao, Phố Lu)`
  → `Hà Nội` (verified to return trips daily).
- **Results cards** expose: bus product (`ECONOMY 34 CABIN` / `VIP 34 CABIN` /
  `ROYAL 24 CABIN`), `Từ <price>đ`, departure/arrival time + station, seats left, and a
  yellow **"Chọn chỗ"** button.
- **Validation:** searching with no departure shows the alert
  *"Bạn chưa chọn điểm xuất phát"*; with no destination, *"Bạn chưa chọn điểm đến"*. The
  page does **not** navigate.

### 3.3 Điền thông tin thanh toán (Payment information) — the booking funnel

The payment form is the **end of a multi-step funnel**, and the final step is **gated by
login**:

```
results → "Chọn chỗ"            → seat map (Tầng 1/2; seats C1-1…; legend Ghế trống/Đang chọn/Đã đặt)
        → pick a seat
        → tick "Tôi đồng ý với điều khoản"   (opens a Terms modal; must agree)
        → "Tiếp tục"
        → choose "Điểm đón" (pickup) + "Điểm trả" (drop-off)
        → "Xác nhận"
        → ⛔ OTP LOGIN REQUIRED  ← the passenger/payment form is behind this gate
        → (after login) passenger info: Họ tên, SĐT, Email + payment method
```

**Validation gates discovered (all asserted by the suite):**

| Action                                   | Blocking alert                              |
|------------------------------------------|---------------------------------------------|
| "Tiếp tục" without accepting terms       | `Bạn chưa đồng ý với điều khoản…`           |
| "Xác nhận" without a pickup/drop-off     | `Bạn vui lòng chọn điểm đón/trả`            |
| "Xác nhận" while logged out              | OTP login modal appears (payment is gated)  |

Because the form lives behind OTP login, the suite splits the payment feature into:
- **Unauthenticated** tests — drive the funnel and assert every gate above (run always).
- **Authenticated** tests — with a saved session, reach and fill the form (self-skip
  without `auth/user.json`; never submit).

---

## 4. Architecture

```
KTPMN/
├─ CLAUDE.md                     ← you are here (source of truth)
├─ README.md                     ← quickstart
├─ playwright.config.ts          ← projects, serial run, vi-VN / Asia-HCMC, reports
├─ package.json                  ← scripts + pinned @playwright/test ^1.58.2
├─ .env.example                  ← copy to .env (BASE_URL, TEST_PHONE, flags)
├─ pages/                        ← Page Object Model
│  ├─ BasePage.ts                  shared: alert handling, safeClick, forceClick
│  ├─ HomePage.ts                  nav + search widget + province/station pickers
│  ├─ LoginModal.ts               OTP modal
│  ├─ SearchResultsPage.ts        /datve trip cards
│  └─ BookingPage.ts              seat → terms → pickup/drop-off → gate → payment form
├─ fixtures/
│  ├─ test-data.ts                SINGLE SOURCE: routes, phones, labels, messages
│  └─ fixtures.ts                 injects page objects; exposes `hasSavedAuth`
├─ tests/
│  ├─ login.spec.ts               TC-LOGIN-*
│  ├─ search-trip.spec.ts         TC-SEARCH-*
│  ├─ payment-info.spec.ts        TC-PAY-*
│  └─ auth.setup.ts               one-off OTP login → saves auth/user.json
├─ scripts/
│  └─ generate-testcases-xlsx.mjs dependency-free xlsx writer (zlib only)
├─ test-cases/
│  └─ TestCases_Futahason.xlsx    generated test-case catalogue (3 sheets)
└─ auth/                          saved storageState (git-ignored)
```

**Conventions**
- **Page Object Model.** Test bodies read as business actions; all selectors live in
  page objects. No selectors in specs.
- **Single source of truth.** Routes, phone fixtures, UI labels, and exact validation
  strings live in `fixtures/test-data.ts`. The Excel catalogue mirrors the same IDs and
  messages, so when the site's copy changes there is one place (plus the xlsx data array)
  to update.
- **Test IDs are stable.** `TC-LOGIN-01`, `TC-SEARCH-04`, `TC-PAY-06`… appear in the test
  titles, the spec, and the Excel. Use them in bug reports and traceability.

---

## 5. Running the suite

```bash
npm install                 # installs @playwright/test + dotenv
npx playwright install chromium

npm test                    # whole suite, serial (Chromium)
npm run test:login          # one feature
npm run test:search
npm run test:payment
npm run test:headed         # watch it run
npm run test:ui             # Playwright UI mode
npm run report              # open the last HTML report
```

Optional configuration — copy `.env.example` to `.env`:
- `BASE_URL` — point at a staging mirror if one ever exists.
- `TEST_PHONE` — a real test handset; unlocks `TC-LOGIN-06` (OTP request).
- `STORAGE_STATE` — defaults to `auth/user.json`.
- `ALLOW_REAL_BOOKING` — keep `false` on production.

### Authenticated payment tests
```bash
npm run auth:setup          # headed; you type the OTP once → saves auth/user.json
npm run test:payment        # TC-PAY-08/09 now run (still never submit a payment)
```
Without `auth/user.json`, the authenticated tests **skip** automatically, so `npm test`
is always green out of the box.

### Expected default result
`npm test` → **18 passed, 3 skipped**. The 3 skips are by design:
- `TC-LOGIN-06` — needs `TEST_PHONE`.
- `TC-PAY-08`, `TC-PAY-09` — need a saved OTP session.

---

## 6. Quirks & gotchas (why the code looks the way it does)

These are real behaviours of the production app. Don't "simplify" them away.

1. **Serial execution (`workers: 1`).** The booking funnel races under concurrency — tests
   are flaky at 2+ workers and deterministic at 1 (verified). Increase workers only
   against a staging environment. One retry is kept to absorb transient network blips.

2. **The results page animates continuously.** "Tuyến phổ biến" / "Tin tức" carousels
   auto-rotate, so elements never settle to Playwright's "stable" state. Seat and button
   clicks therefore use **`force: true`** (`BasePage.forceClick`).

3. **…but Syncfusion checkboxes ignore force clicks.** The pickup/drop-off checkboxes
   (`.e-checkbox-wrapper`) do **not** toggle under a force click — they need a *normal*
   click on their `.e-frame`. The pickup step is stable enough for it. `checkSyncfusion`
   does this and then asserts `aria-checked="true"` so a missed click fails loudly.

4. **Province name == station name.** Selecting destination "Hà Nội" is ambiguous: the
   province header and the station leaf share the text "Hà Nội". `HomePage.pickLocation`
   waits for the leaf to render (count becomes 2) before clicking the last match.

5. **Country code value is `"84"`, label is `"+84"`.** The `<select>` stores `84`; assert
   on `COUNTRY_CODE_VALUE`, not the display label.

6. **Round-trip "Khứ hồi" matches two elements.** A styled wrapper and the real `<input>`
   both expose the accessible name. Toggle via the wrapper (`roundTripToggle`); assert
   checked state on the real input (`roundTripCheckbox = …and(locator('input'))`).

7. **Two responsive copies of the "Đăng nhập" button** (desktop + mobile) exist; act on
   the visible one (`.filter({ visible: true })`).

8. **Date field is DevExpress** with a hidden return-date twin; target the visible
   `input.dxbs-date-edit-input`.

9. **Terms checkbox vs Terms link.** Clicking the checkbox *input* toggles agreement;
   clicking the adjacent text opens the Terms modal (whose "Đồng ý" closes it). The page
   object checks the input directly.

10. **System dialogs come in two flavours** — custom alert popups (`[role=dialog]` with a
    single "Đồng ý") for validation, and Syncfusion `.e-dlg-container` for the Terms
    content. `BasePage.alert` / `expectAlert` cope with both.

---

## 7. Test-case catalogue (Excel)

`test-cases/TestCases_Futahason.xlsx` is generated, not hand-edited:

```bash
npm run testcases:xlsx
```

- Built by `scripts/generate-testcases-xlsx.mjs` — a **dependency-free** OOXML/zip writer
  (Node `zlib` only; no `npm install` of office libs). Output is a real `.xlsx`
  (verified: "Microsoft Excel 2007+", valid zip).
- **3 sheets:** `Test Cases` (31 cases × 12 columns, styled header + freeze + autofilter),
  `Summary` (coverage by feature / priority), `Traceability` (TC ID ↔ spec/test).
- **To add or change a case:** edit the `TESTS` array at the top of the script (and the
  matching spec), then re-run `npm run testcases:xlsx`. Keep IDs in sync with the specs.

Columns: `Mã TC · Tính năng · Tiêu đề · Điều kiện tiên quyết · Các bước · Dữ liệu test ·
Kết quả mong đợi · Độ ưu tiên · Loại · Tự động hóa · Spec/Test · Trạng thái`.

---

## 8. Maintenance checklist

- **Site copy changed?** Update `fixtures/test-data.ts` (`MESSAGES`, `LABELS`, `ROUTE`)
  and the `TESTS` array in the xlsx script, then regenerate the workbook.
- **New flow to cover?** Add a page object (or method), a `TC-…` test, and a row in the
  xlsx `TESTS` array with the same ID.
- **Selectors drifted?** Prefer role/text/label locators (as used here) over CSS/XPath;
  re-verify against the live site with `npm run codegen`.
- **Flake appears?** First confirm it isn't concurrency — run `--workers=1`. The booking
  funnel is the usual suspect (§6.1–6.3).
- **CI:** run on Chromium, `workers` stays 1, `retries: 2`. Provide `TEST_PHONE` and a
  refreshed `auth/user.json` as secrets to also exercise the OTP/authenticated cases.
