# futahason.com — Playwright E2E

> 🇻🇳 Bản tiếng Việt đầy đủ: [`README.vi.md`](./README.vi.md)

End-to-end tests for **[futahason.com](https://futahason.com)** (FUTA Hà Sơn) covering
three journeys:

- **Đăng nhập** — login (OTP)
- **Tìm kiếm chuyến xe** — search for a trip
- **Điền thông tin thanh toán** — fill payment information

> 📖 **Read [`CLAUDE.md`](./CLAUDE.md) first** — it is the source of truth for how the app
> behaves, the architecture, and every quirk the tests work around.

## Quickstart

```bash
npm install
npx playwright install chromium
npm test            # 17 passed, 3 skipped (the skips need an OTP phone/session)
```

| Command | What it does |
|---|---|
| `npm test` | Run the whole suite (serial, Chromium) |
| `npm run test:login` / `test:search` / `test:payment` | Run one feature |
| `npm run test:headed` / `test:ui` | Watch the run / UI mode |
| `npm run report` | Open the last HTML report |
| `npm run testcases:xlsx` | Regenerate the Excel test-case catalogue |
| `npm run auth:setup` | One-off OTP login → saves `auth/user.json` |

## Test cases

The full catalogue (31 cases, 3 sheets) is **`test-cases/TestCases_Futahason.xlsx`**,
generated from a single source of truth — see `CLAUDE.md` §7.

## Production safety

futahason.com is **production**. The suite is non-destructive: it never completes a real
payment, login requires a human-entered OTP, and tests that need credentials self-skip.
See `CLAUDE.md` §2.

## Layout

```
pages/        Page Object Model        fixtures/   test data + injected page objects
tests/        the three spec files     scripts/    xlsx generator (no deps)
test-cases/   generated .xlsx          auth/       saved session (git-ignored)
```
