/**
 * Central test data for the futahason.com suite.
 *
 * Everything the specs assert on lives here so that when the site's Vietnamese
 * copy changes, there is a single place to update. The same constants are also
 * consumed by scripts/generate-testcases-xlsx.mjs (mirrored there) so the Excel
 * test-case sheet and the automated specs stay in lock-step.
 *
 * (VI) Dữ liệu test tập trung cho bộ kiểm thử futahason.com.
 * Mọi giá trị mà các spec dùng để kiểm chứng (route, số điện thoại, nhãn UI,
 * thông báo lỗi) đều nằm ở đây — khi giao diện đổi chữ tiếng Việt thì chỉ cần
 * sửa một chỗ. File sinh Excel (generate-testcases-xlsx.mjs) cũng dùng lại các
 * hằng số này nên bảng test case và test tự động luôn khớp nhau.
 */

/** A known-good interprovincial route verified to return trips. */
// (VI) Tuyến liên tỉnh "chuẩn" đã kiểm chứng là luôn có chuyến để tìm.
export const ROUTE = {
  /** Province shown in the picker, then the specific station leaf to click. */
  // (VI) Tỉnh hiển thị trong hộp chọn, rồi tới bến/điểm con cụ thể cần bấm.
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
// (VI) Tên các loại xe/khoang mà trang kết quả phải hiển thị.
export const BUS_TYPES = ['ECONOMY 34 CABIN', 'VIP 34 CABIN', 'ROYAL 24 CABIN'] as const;

/** Phone-number fixtures for the OTP login modal. */
// (VI) Các số điện thoại mẫu dùng cho modal đăng nhập OTP.
export const PHONES = {
  /** Real test number is supplied via .env (TEST_PHONE); empty in CI. */
  // (VI) Số thật để test lấy từ .env (TEST_PHONE); trên CI thì để trống.
  valid: process.env.TEST_PHONE ?? '0901234567',
  tooShort: '0901', // (VI) Số quá ngắn — dùng để test validation
  nonNumeric: 'abcxyz', // (VI) Không phải chữ số — test ô nhập không chặn ký tự
  withLetters: '09012ab567', // (VI) Lẫn chữ cái trong số
} as const;

/** Display label shown in the dropdown ("+84"). */
// (VI) Nhãn hiển thị trong dropdown mã quốc gia ("+84").
export const COUNTRY_CODE_DEFAULT = '+84';
/** Underlying <option> value of the default country code (the select stores "84"). */
// (VI) Giá trị thật của <option> mặc định — thẻ select lưu "84", KHÔNG phải "+84".
export const COUNTRY_CODE_VALUE = '84';

/**
 * Exact validation / system messages observed live on futahason.com.
 * Specs match against these substrings.
 *
 * (VI) Các thông báo lỗi/hệ thống đúng nguyên văn quan sát được trên site thật.
 * Các test sẽ so khớp với những chuỗi này.
 */
export const MESSAGES = {
  search: {
    /** Shown when "Tìm chuyến" is clicked with no departure selected. */
    // (VI) Hiện khi bấm "Tìm chuyến" mà chưa chọn điểm đi.
    missingDeparture: 'Bạn chưa chọn điểm xuất phát',
    /** Shown when departure is set but destination is not. */
    // (VI) Hiện khi đã có điểm đi nhưng chưa chọn điểm đến.
    missingDestination: 'Bạn chưa chọn điểm đến',
  },
  booking: {
    /** "Tiếp tục" pressed without ticking the terms checkbox. */
    // (VI) Bấm "Tiếp tục" mà chưa tích ô đồng ý điều khoản.
    termsNotAccepted: 'Bạn chưa đồng ý với điều khoản',
    /** "Xác nhận" pressed without choosing a pickup/drop-off point. */
    // (VI) Bấm "Xác nhận" mà chưa chọn điểm đón/điểm trả.
    pickupDropoffMissing: 'Bạn vui lòng chọn điểm đón/trả',
  },
  login: {
    modalTitle: 'Đăng nhập',
    // (VI) Dòng gợi ý ở bước nhập OTP — cũng dùng để nhận diện đúng modal đăng nhập.
    otpHint: 'Nhập mã xác thực được gửi tới Số điện thoại hoặc Zalo',
  },
} as const;

/** UI labels reused across page objects (kept here to ease i18n upkeep). */
// (VI) Các nhãn trên giao diện được dùng lại ở nhiều page object — gom về đây cho dễ bảo trì.
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
// (VI) Nơi đọc phiên đăng nhập đã lưu (storageState) sau khi chạy auth:setup.
export const AUTH_FILE = process.env.STORAGE_STATE ?? 'auth/user.json';
