/**
 * Central test data for the futahason.com suite.
 *
 * Everything the specs assert on lives here so that when the site's Vietnamese
 * copy changes, there is a single place to update. The same constants are also
 * consumed by scripts/generate-testcases-xlsx.mjs (mirrored there) so the Excel
 * test-case sheet and the automated specs stay in lock-step.
 */

/** A known-good interprovincial route verified to return trips. */
export const ROUTE = {
  /** Province shown in the picker, then the specific station leaf to click. */
  from: {
    province: 'Lào Cai',
    station: 'Lào Cai (TP Lào Cai, Bến Đền, Xuân Giao, Phố Lu)',
  },
  to: {
    province: 'Hà Nội',
    station: 'Hà Nội',
  },
} as const;

/** Bus product names the results page is expected to surface. */
export const BUS_TYPES = ['ECONOMY 34 CABIN', 'VIP 34 CABIN', 'ROYAL 24 CABIN'] as const;

/** Phone-number fixtures for the OTP login modal. */
export const PHONES = {
  /** Real test number is supplied via .env (TEST_PHONE); empty in CI. */
  valid: process.env.TEST_PHONE ?? '0901234567',
  tooShort: '0901',
  nonNumeric: 'abcxyz',
  withLetters: '09012ab567',
} as const;

/** Display label shown in the dropdown ("+84"). */
export const COUNTRY_CODE_DEFAULT = '+84';
/** Underlying <option> value of the default country code (the select stores "84"). */
export const COUNTRY_CODE_VALUE = '84';

/**
 * Exact validation / system messages observed live on futahason.com.
 * Specs match against these substrings.
 */
export const MESSAGES = {
  search: {
    /** Shown when "Tìm chuyến" is clicked with no departure selected. */
    missingDeparture: 'Bạn chưa chọn điểm xuất phát',
    /** Shown when departure is set but destination is not. */
    missingDestination: 'Bạn chưa chọn điểm đến',
  },
  booking: {
    /** "Tiếp tục" pressed without ticking the terms checkbox. */
    termsNotAccepted: 'Bạn chưa đồng ý với điều khoản',
    /** "Xác nhận" pressed without choosing a pickup/drop-off point. */
    pickupDropoffMissing: 'Bạn vui lòng chọn điểm đón/trả',
  },
  login: {
    modalTitle: 'Đăng nhập',
    otpHint: 'Nhập mã xác thực được gửi tới Số điện thoại hoặc Zalo',
  },
} as const;

/** UI labels reused across page objects (kept here to ease i18n upkeep). */
export const LABELS = {
  loginButton: 'Đăng nhập',
  searchButton: 'Tìm chuyến',
  roundTrip: 'Khứ hồi',
  pickDeparture: 'Chọn điểm đi',
  pickDestination: 'Chọn điểm đến',
  selectSeat: 'Chọn chỗ',
  continue: 'Tiếp tục',
  confirm: 'Xác nhận',
  agree: 'Đồng ý',
  termsCheckbox: 'Tôi đồng ý với điều khoản',
  pickupHeader: 'Điểm đón',
  dropoffHeader: 'Điểm trả',
} as const;

/** Where a saved authenticated session is read from. */
export const AUTH_FILE = process.env.STORAGE_STATE ?? 'auth/user.json';
