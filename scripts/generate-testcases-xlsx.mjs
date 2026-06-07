// Generates test-cases/TestCases_Futahason.xlsx from the single source-of-truth
// list below — no third-party packages, just Node's zlib. The test-case IDs here
// mirror the IDs in tests/*.spec.ts so the workbook and the automation stay in sync.
//
//   Usage:  npm run testcases:xlsx     (or)  node scripts/generate-testcases-xlsx.mjs
//
// (VI) Sinh file test-cases/TestCases_Futahason.xlsx từ mảng nguồn-sự-thật-duy-nhất
// (VI) bên dưới — không dùng thư viện ngoài, chỉ dùng zlib của Node. Mã test case ở
// (VI) đây trùng với mã trong tests/*.spec.ts để workbook và phần tự động luôn khớp.
// (VI)   Cách chạy:  npm run testcases:xlsx   (hoặc)  node scripts/generate-testcases-xlsx.mjs
//
import { deflateRawSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../test-cases/TestCases_Futahason.xlsx');

// ─── Single source of truth: the test cases ──────────────────────────────────
// columns: id, feature, title, pre, steps[], data, expected, priority, type,
//          automated, ref, status
// (VI) ─── Nguồn sự thật duy nhất: danh sách test case ───
// (VI) các cột: id (mã), feature (tính năng), title (tiêu đề), pre (điều kiện),
// (VI) steps[] (các bước), data (dữ liệu), expected (kết quả mong đợi),
// (VI) priority (độ ưu tiên), type (loại), automated (tự động hoá), ref (spec/test),
// (VI) status (trạng thái).
const TESTS = [
  // ── Đăng nhập (Login) ──────────────────────────────────────────────────────
  {
    id: 'TC-LOGIN-01', feature: 'Đăng nhập', title: 'Mở popup đăng nhập từ header',
    pre: 'Ở trang chủ futahason.com',
    steps: ['Nhấn nút "Đăng nhập" trên thanh điều hướng'],
    data: '—',
    expected: 'Popup đăng nhập hiển thị: ô nhập SĐT (placeholder "Số điện thoại"), mã quốc gia, nút "Đăng nhập", nút Close.',
    priority: 'P1 - Cao', type: 'Positive', automated: 'Automated',
    ref: 'login.spec.ts › TC-LOGIN-01', status: 'Tự động ✓',
  },
  {
    id: 'TC-LOGIN-02', feature: 'Đăng nhập', title: 'Mã quốc gia mặc định +84',
    pre: 'Popup đăng nhập đang mở',
    steps: ['Quan sát combobox mã quốc gia'],
    data: '—',
    expected: 'Giá trị mặc định của mã quốc gia là +84.',
    priority: 'P3 - Thấp', type: 'Positive', automated: 'Automated',
    ref: 'login.spec.ts › TC-LOGIN-02', status: 'Tự động ✓',
  },
  {
    id: 'TC-LOGIN-03', feature: 'Đăng nhập', title: 'Chặn đăng nhập khi bỏ trống SĐT',
    pre: 'Popup đăng nhập đang mở',
    steps: ['Để trống ô SĐT', 'Nhấn "Đăng nhập"'],
    data: 'SĐT = (rỗng)',
    expected: 'Không gửi OTP; popup vẫn ở bước nhập SĐT (không xuất hiện ô nhập mã OTP).',
    priority: 'P1 - Cao', type: 'Negative', automated: 'Automated',
    ref: 'login.spec.ts › TC-LOGIN-03', status: 'Tự động ✓',
  },
  {
    id: 'TC-LOGIN-04', feature: 'Đăng nhập', title: 'Từ chối SĐT chứa ký tự chữ',
    pre: 'Popup đăng nhập đang mở',
    steps: ['Nhập SĐT không hợp lệ', 'Nhấn "Đăng nhập"'],
    data: 'SĐT = "abcxyz"',
    expected: 'Không gửi OTP; popup vẫn ở bước nhập SĐT.',
    priority: 'P2 - Trung bình', type: 'Negative', automated: 'Automated',
    ref: 'login.spec.ts › TC-LOGIN-04', status: 'Tự động ✓',
  },
  {
    id: 'TC-LOGIN-05', feature: 'Đăng nhập', title: 'Từ chối SĐT quá ngắn',
    pre: 'Popup đăng nhập đang mở',
    steps: ['Nhập SĐT quá ngắn', 'Nhấn "Đăng nhập"'],
    data: 'SĐT = "0901"',
    expected: 'Không gửi OTP; popup vẫn ở bước nhập SĐT.',
    priority: 'P2 - Trung bình', type: 'Negative', automated: 'Automated',
    ref: 'login.spec.ts › TC-LOGIN-05', status: 'Tự động ✓',
  },
  {
    id: 'TC-LOGIN-06', feature: 'Đăng nhập', title: 'Gửi OTP cho SĐT hợp lệ',
    pre: 'Popup đăng nhập đang mở; có số test thật (TEST_PHONE)',
    steps: ['Nhập SĐT hợp lệ', 'Nhấn "Đăng nhập"'],
    data: 'SĐT = TEST_PHONE',
    expected: 'Hệ thống gửi mã OTP qua SMS/Zalo và chuyển sang bước nhập mã.',
    priority: 'P1 - Cao', type: 'Positive', automated: 'Partial (cần TEST_PHONE)',
    ref: 'login.spec.ts › TC-LOGIN-06', status: 'Chặn: cần SĐT test',
  },
  {
    id: 'TC-LOGIN-07', feature: 'Đăng nhập', title: 'Đóng popup đăng nhập',
    pre: 'Popup đăng nhập đang mở',
    steps: ['Nhấn nút Close (X)'],
    data: '—',
    expected: 'Popup đóng lại, trở về trang chủ.',
    priority: 'P3 - Thấp', type: 'Positive', automated: 'Automated',
    ref: 'login.spec.ts › TC-LOGIN-07', status: 'Tự động ✓',
  },
  {
    id: 'TC-LOGIN-08', feature: 'Đăng nhập', title: 'Đăng nhập thành công với OTP đúng',
    pre: 'Đã nhận OTP trên điện thoại test',
    steps: ['Nhập đúng mã OTP', 'Xác nhận'],
    data: 'OTP đúng',
    expected: 'Đăng nhập thành công; header hiển thị tài khoản thay cho nút "Đăng nhập".',
    priority: 'P1 - Cao', type: 'Positive', automated: 'Manual (cần OTP thật)',
    ref: 'auth.setup.ts', status: 'Thủ công',
  },
  {
    id: 'TC-LOGIN-09', feature: 'Đăng nhập', title: 'Từ chối OTP sai',
    pre: 'Đã ở bước nhập OTP',
    steps: ['Nhập mã OTP sai', 'Xác nhận'],
    data: 'OTP = "000000" (sai)',
    expected: 'Hiển thị lỗi mã không đúng; không đăng nhập.',
    priority: 'P2 - Trung bình', type: 'Negative', automated: 'Manual (cần OTP thật)',
    ref: '—', status: 'Thủ công',
  },

  // ── Tìm kiếm chuyến xe (Search) ────────────────────────────────────────────
  {
    id: 'TC-SEARCH-01', feature: 'Tìm kiếm chuyến xe', title: 'Tìm tuyến hợp lệ trả về chuyến',
    pre: 'Ở trang chủ',
    steps: ['Chọn điểm đi: Lào Cai (TP Lào Cai...)', 'Chọn điểm đến: Hà Nội', 'Giữ ngày mặc định', 'Nhấn "Tìm chuyến"'],
    data: 'Lào Cai → Hà Nội, ngày hôm nay',
    expected: 'Chuyển sang trang /datve/...; hiển thị ≥ 1 chuyến với nút "Chọn chỗ".',
    priority: 'P1 - Cao', type: 'Positive', automated: 'Automated',
    ref: 'search-trip.spec.ts › TC-SEARCH-01', status: 'Tự động ✓',
  },
  {
    id: 'TC-SEARCH-02', feature: 'Tìm kiếm chuyến xe', title: 'Form phản ánh điểm đi/đến đã chọn',
    pre: 'Ở trang chủ',
    steps: ['Chọn điểm đi qua dialog tỉnh → bến', 'Chọn điểm đến qua dialog tỉnh → bến'],
    data: 'Lào Cai → Hà Nội',
    expected: 'Ô "Chọn điểm đi"/"Chọn điểm đến" hiển thị đúng tên bến đã chọn.',
    priority: 'P2 - Trung bình', type: 'Positive', automated: 'Automated',
    ref: 'search-trip.spec.ts › TC-SEARCH-02', status: 'Tự động ✓',
  },
  {
    id: 'TC-SEARCH-03', feature: 'Tìm kiếm chuyến xe', title: 'Chọn bến khi tỉnh trùng tên bến (Hà Nội)',
    pre: 'Ở trang chủ',
    steps: ['Mở dialog điểm đến', 'Mở rộng tỉnh "Hà Nội"', 'Chọn bến con "Hà Nội"'],
    data: 'Điểm đến: Hà Nội',
    expected: 'Chọn đúng bến con (không nhầm với header tỉnh); giá trị ô = "Hà Nội".',
    priority: 'P2 - Trung bình', type: 'Positive', automated: 'Automated',
    ref: 'search-trip.spec.ts › TC-SEARCH-01/02', status: 'Tự động ✓',
  },
  {
    id: 'TC-SEARCH-04', feature: 'Tìm kiếm chuyến xe', title: 'Chặn tìm khi thiếu điểm đi',
    pre: 'Ở trang chủ, chưa chọn điểm đi',
    steps: ['Nhấn "Tìm chuyến"'],
    data: 'Điểm đi = (rỗng)',
    expected: 'Hiển thị thông báo "Bạn chưa chọn điểm xuất phát"; không chuyển trang.',
    priority: 'P1 - Cao', type: 'Negative', automated: 'Automated',
    ref: 'search-trip.spec.ts › TC-SEARCH-04', status: 'Tự động ✓',
  },
  {
    id: 'TC-SEARCH-05', feature: 'Tìm kiếm chuyến xe', title: 'Chặn tìm khi thiếu điểm đến',
    pre: 'Đã chọn điểm đi, chưa chọn điểm đến',
    steps: ['Chọn điểm đi', 'Nhấn "Tìm chuyến"'],
    data: 'Điểm đến = (rỗng)',
    expected: 'Hiển thị thông báo "Bạn chưa chọn điểm đến"; không chuyển trang.',
    priority: 'P1 - Cao', type: 'Negative', automated: 'Automated',
    ref: 'search-trip.spec.ts › TC-SEARCH-05', status: 'Tự động ✓',
  },
  {
    id: 'TC-SEARCH-06', feature: 'Tìm kiếm chuyến xe', title: 'Ngày khởi hành mặc định đúng định dạng',
    pre: 'Ở trang chủ',
    steps: ['Quan sát ô "Ngày khởi hành"'],
    data: '—',
    expected: 'Ngày mặc định theo định dạng dd/MM/yyyy (ví dụ 06/06/2026).',
    priority: 'P3 - Thấp', type: 'Positive', automated: 'Automated',
    ref: 'search-trip.spec.ts › TC-SEARCH-06', status: 'Tự động ✓',
  },
  {
    id: 'TC-SEARCH-07', feature: 'Tìm kiếm chuyến xe', title: 'Thẻ chuyến hiển thị giá và loại xe',
    pre: 'Đã có kết quả tìm kiếm',
    steps: ['Quan sát các thẻ chuyến'],
    data: 'Lào Cai → Hà Nội',
    expected: 'Mỗi thẻ có giá "Từ ...đ" và loại xe (ECONOMY/VIP/ROYAL CABIN).',
    priority: 'P2 - Trung bình', type: 'Positive', automated: 'Automated',
    ref: 'search-trip.spec.ts › TC-SEARCH-07', status: 'Tự động ✓',
  },
  {
    id: 'TC-SEARCH-08', feature: 'Tìm kiếm chuyến xe', title: 'Bật/tắt tùy chọn Khứ hồi',
    pre: 'Ở trang chủ',
    steps: ['Nhấn checkbox "Khứ hồi"'],
    data: '—',
    expected: 'Checkbox chuyển sang trạng thái đã chọn (bật ô ngày về).',
    priority: 'P2 - Trung bình', type: 'Positive', automated: 'Automated',
    ref: 'search-trip.spec.ts › TC-SEARCH-08', status: 'Tự động ✓',
  },
  {
    id: 'TC-SEARCH-09', feature: 'Tìm kiếm chuyến xe', title: 'Tuyến không có chuyến → trạng thái rỗng',
    pre: 'Ở trang chủ',
    steps: ['Chọn tuyến/ngày không có chuyến', 'Nhấn "Tìm chuyến"'],
    data: 'Tuyến hiếm / ngày xa',
    expected: 'Hiển thị thông báo không có chuyến phù hợp (cần xác nhận nội dung thực tế).',
    priority: 'P2 - Trung bình', type: 'Negative', automated: 'Manual (cần xác nhận hành vi)',
    ref: '—', status: 'Thủ công',
  },
  {
    id: 'TC-SEARCH-10', feature: 'Tìm kiếm chuyến xe', title: 'Không cho chọn ngày trong quá khứ',
    pre: 'Ở trang chủ',
    steps: ['Mở lịch chọn ngày', 'Thử chọn ngày quá khứ'],
    data: 'Ngày < hôm nay',
    expected: 'Ngày quá khứ bị vô hiệu hóa / không chọn được.',
    priority: 'P3 - Thấp', type: 'Negative', automated: 'Manual (date picker)',
    ref: '—', status: 'Thủ công',
  },

  // ── Điền thông tin thanh toán (Payment information) ─────────────────────────
  {
    id: 'TC-PAY-01', feature: 'Điền thông tin thanh toán', title: 'Mở sơ đồ chọn ghế',
    pre: 'Đang ở trang kết quả /datve/...',
    steps: ['Nhấn "Chọn chỗ" trên một chuyến'],
    data: 'Chuyến đầu tiên',
    expected: 'Mở sơ đồ ghế (Tầng 1/2; ghế C1-1...) kèm chú thích Ghế trống/Đang chọn/Đã đặt.',
    priority: 'P1 - Cao', type: 'Positive', automated: 'Automated',
    ref: 'payment-info.spec.ts › TC-PAY-01', status: 'Tự động ✓',
  },
  {
    id: 'TC-PAY-02', feature: 'Điền thông tin thanh toán', title: 'Chọn một ghế còn trống',
    pre: 'Sơ đồ ghế đang mở',
    steps: ['Nhấn một ghế còn trống'],
    data: 'Ghế C1-1',
    expected: 'Ghế chuyển trạng thái "Đang chọn"; cho phép bước tiếp theo.',
    priority: 'P1 - Cao', type: 'Positive', automated: 'Automated (qua luồng)',
    ref: 'payment-info.spec.ts › TC-PAY-03/05/06', status: 'Tự động ✓',
  },
  {
    id: 'TC-PAY-03', feature: 'Điền thông tin thanh toán', title: 'Bắt buộc đồng ý điều khoản trước khi tiếp tục',
    pre: 'Đã chọn ghế, chưa tick điều khoản',
    steps: ['Nhấn "Tiếp tục" khi chưa tick "Tôi đồng ý với điều khoản"'],
    data: '—',
    expected: 'Hiển thị thông báo "Bạn chưa đồng ý với điều khoản..."; không qua bước sau.',
    priority: 'P1 - Cao', type: 'Negative', automated: 'Automated',
    ref: 'payment-info.spec.ts › TC-PAY-03', status: 'Tự động ✓',
  },
  {
    id: 'TC-PAY-04', feature: 'Điền thông tin thanh toán', title: 'Đồng ý điều khoản qua popup',
    pre: 'Đã chọn ghế',
    steps: ['Tick checkbox điều khoản', 'Đồng ý ở popup điều khoản (nếu mở)'],
    data: '—',
    expected: 'Checkbox điều khoản ở trạng thái đã chọn; cho phép "Tiếp tục".',
    priority: 'P2 - Trung bình', type: 'Positive', automated: 'Automated (qua luồng)',
    ref: 'payment-info.spec.ts › TC-PAY-05/06', status: 'Tự động ✓',
  },
  {
    id: 'TC-PAY-05', feature: 'Điền thông tin thanh toán', title: 'Bắt buộc chọn điểm đón/trả trước khi xác nhận',
    pre: 'Đã chọn ghế + đồng ý điều khoản + nhấn Tiếp tục',
    steps: ['Nhấn "Xác nhận" khi chưa chọn điểm đón và điểm trả'],
    data: '—',
    expected: 'Hiển thị thông báo "Bạn vui lòng chọn điểm đón/trả".',
    priority: 'P1 - Cao', type: 'Negative', automated: 'Automated',
    ref: 'payment-info.spec.ts › TC-PAY-05', status: 'Tự động ✓',
  },
  {
    id: 'TC-PAY-06', feature: 'Điền thông tin thanh toán', title: 'Yêu cầu đăng nhập trước khi tới trang thanh toán',
    pre: 'Đã chọn ghế + điều khoản + điểm đón + điểm trả',
    steps: ['Nhấn "Xác nhận"'],
    data: 'Người dùng CHƯA đăng nhập',
    expected: 'Hiển thị popup đăng nhập OTP (trang điền thông tin thanh toán bị chặn sau đăng nhập).',
    priority: 'P1 - Cao', type: 'Security/Positive', automated: 'Automated',
    ref: 'payment-info.spec.ts › TC-PAY-06', status: 'Tự động ✓',
  },
  {
    id: 'TC-PAY-07', feature: 'Điền thông tin thanh toán', title: 'Không truy cập trang thanh toán khi chưa đăng nhập (deep-link)',
    pre: 'Chưa đăng nhập',
    steps: ['Mở trực tiếp URL bước thanh toán (nếu có)'],
    data: 'URL bước thanh toán',
    expected: 'Bị chuyển hướng/yêu cầu đăng nhập, không lộ thông tin thanh toán.',
    priority: 'P2 - Trung bình', type: 'Security', automated: 'Manual (cần xác nhận URL)',
    ref: '—', status: 'Thủ công',
  },
  {
    id: 'TC-PAY-08', feature: 'Điền thông tin thanh toán', title: 'Hiển thị form thông tin hành khách/thanh toán (đã đăng nhập)',
    pre: 'Đã đăng nhập (auth/user.json) + hoàn tất bước chọn ghế/điểm đón trả',
    steps: ['Nhấn "Xác nhận"'],
    data: 'Phiên đăng nhập hợp lệ',
    expected: 'Hiển thị form điền thông tin: Họ tên, SĐT, Email và lựa chọn phương thức thanh toán.',
    priority: 'P1 - Cao', type: 'Positive', automated: 'Partial (cần auth)',
    ref: 'payment-info.spec.ts › TC-PAY-08', status: 'Chặn: cần tài khoản test',
  },
  {
    id: 'TC-PAY-09', feature: 'Điền thông tin thanh toán', title: 'Điền thông tin liên hệ hành khách (không thanh toán)',
    pre: 'Đang ở form thông tin thanh toán',
    steps: ['Nhập Họ tên', 'Nhập SĐT', 'Nhập Email', 'KHÔNG nhấn thanh toán'],
    data: 'Nguyễn Văn Test / 0901234567 / qa@example.com',
    expected: 'Các trường nhận đúng giá trị; tổng tiền hiển thị đúng (không hoàn tất thanh toán).',
    priority: 'P1 - Cao', type: 'Positive', automated: 'Partial (cần auth)',
    ref: 'payment-info.spec.ts › TC-PAY-09', status: 'Chặn: cần tài khoản test',
  },
  {
    id: 'TC-PAY-10', feature: 'Điền thông tin thanh toán', title: 'Validate các trường bắt buộc trên form thanh toán',
    pre: 'Đang ở form thông tin thanh toán',
    steps: ['Bỏ trống Họ tên/SĐT/Email', 'Thử tiếp tục/thanh toán'],
    data: 'Trường bắt buộc rỗng / email sai định dạng',
    expected: 'Hiển thị lỗi bắt buộc tương ứng; chặn tiếp tục (cần xác nhận selector thực tế).',
    priority: 'P2 - Trung bình', type: 'Negative', automated: 'Manual (cần auth + xác nhận form)',
    ref: '—', status: 'Thủ công',
  },
  {
    id: 'TC-PAY-11', feature: 'Điền thông tin thanh toán', title: 'Tổng tiền = giá ghế × số ghế',
    pre: 'Đang ở form thông tin thanh toán',
    steps: ['Chọn N ghế', 'Quan sát tổng tiền'],
    data: 'Ví dụ 2 ghế × 290.000đ',
    expected: 'Tổng tiền hiển thị đúng = đơn giá × số ghế (+ phụ phí nếu có).',
    priority: 'P2 - Trung bình', type: 'Positive', automated: 'Manual (cần auth)',
    ref: '—', status: 'Thủ công',
  },
  {
    id: 'TC-PAY-12', feature: 'Điền thông tin thanh toán', title: 'CHÍNH SÁCH: không hoàn tất thanh toán thật trên production',
    pre: 'Mọi test thanh toán',
    steps: ['Chỉ điền thông tin', 'KHÔNG bấm nút thanh toán cuối trên môi trường thật'],
    data: 'ALLOW_REAL_BOOKING=false',
    expected: 'Bộ test không bao giờ tạo đơn/thanh toán thật trên production. Chỉ chạy đầy đủ trên môi trường staging/sandbox.',
    priority: 'P1 - Cao', type: 'Policy', automated: 'Policy',
    ref: 'CLAUDE.md › An toàn production', status: 'Bắt buộc',
  },
];

const HEADERS = [
  'Mã TC', 'Tính năng', 'Tiêu đề', 'Điều kiện tiên quyết', 'Các bước thực hiện',
  'Dữ liệu test', 'Kết quả mong đợi', 'Độ ưu tiên', 'Loại', 'Tự động hóa',
  'Spec / Test', 'Trạng thái',
];
const WIDTHS = [13, 18, 28, 24, 40, 22, 42, 14, 14, 20, 26, 20];

// ─── Minimal XLSX (OOXML + zip) writer — no external deps ─────────────────────
// (VI) ─── Bộ ghi XLSX tối giản (OOXML + zip) — không phụ thuộc thư viện ngoài ───
// (VI) esc: thoát các ký tự đặc biệt của XML (& < > " và bỏ \r).
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/\r/g, '');

// (VI) Đổi chỉ số cột (0,1,2...) sang chữ cái cột của Excel (A,B,...,Z,AA,...).
const colLetter = (i) => {
  let s = '', n = i;
  do { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } while (n >= 0);
  return s;
};

/** Build a <c> cell with an inline string and a style index. */
// (VI) Tạo một ô <c> dạng chuỗi nội tuyến (inlineStr) kèm chỉ số style.
const cell = (col, row, text, style) =>
  `<c r="${colLetter(col)}${row}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${esc(text)}</t></is></c>`;

/** rows: array of { cells: [{text, style}] } → worksheet xml. */
// (VI) Dựng XML cho một worksheet từ mảng dòng. Hỗ trợ: độ rộng cột (widths),
// (VI) đóng băng N dòng đầu (freezeRows), bộ lọc tự động (autoFilterRef), gộp ô (merges).
function sheetXml(rows, widths, freezeRows, autoFilterRef, merges = []) {
  const cols = widths
    ? `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    : '';
  const data = rows
    .map((r, ri) => {
      const cells = r.cells.map((c, ci) => cell(ci, ri + 1, c.text, c.style)).join('');
      return `<row r="${ri + 1}">${cells}</row>`;
    })
    .join('');
  const pane = freezeRows
    ? `<sheetView workbookViewId="0"><pane ySplit="${freezeRows}" topLeftCell="A${freezeRows + 1}" activePane="bottomLeft" state="frozen"/></sheetView>`
    : `<sheetView workbookViewId="0"/>`;
  const filter = autoFilterRef ? `<autoFilter ref="${autoFilterRef}"/>` : '';
  const mc = merges.length
    ? `<mergeCells count="${merges.length}">${merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`
    : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews>${pane}</sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
${cols}<sheetData>${data}</sheetData>${filter}${mc}</worksheet>`;
}

// styles: 0 default · 1 title · 2 header · 3 body(wrap,top) · 4 body(center,top)
// (VI) các style: 0 mặc định · 1 tiêu đề · 2 dòng header · 3 thân (xuống dòng, canh trên) · 4 thân (canh giữa, canh trên)
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="3">
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="14"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
</fonts>
<fills count="4">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF1F4E78"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF2E75B6"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFBFBFBF"/></left><right style="thin"><color rgb="FFBFBFBF"/></right><top style="thin"><color rgb="FFBFBFBF"/></top><bottom style="thin"><color rgb="FFBFBFBF"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="5">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top" wrapText="1"/></xf>
</cellXfs>
</styleSheet>`;

// ── Sheet 1: Test Cases ──────────────────────────────────────────────────────
// (VI) ── Sheet 1: Danh sách Test Case ──
const centerCols = new Set([0, 7, 9]); // Mã TC, Độ ưu tiên, Tự động hóa — (VI) các cột canh giữa
const tcRows = [];
tcRows.push({ cells: HEADERS.map((_, i) => ({ text: i === 0 ? 'BỘ TEST CASE — futahason.com (FUTA Hà Sơn)' : '', style: 1 })) });
tcRows.push({ cells: HEADERS.map((h) => ({ text: h, style: 2 })) });
for (const t of TESTS) {
  const row = [
    t.id, t.feature, t.title, t.pre, t.steps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
    t.data, t.expected, t.priority, t.type, t.automated, t.ref, t.status,
  ];
  tcRows.push({ cells: row.map((v, i) => ({ text: v, style: centerCols.has(i) ? 4 : 3 })) });
}
const sheet1 = sheetXml(tcRows, WIDTHS, 2, `A2:${colLetter(HEADERS.length - 1)}2`, [`A1:${colLetter(HEADERS.length - 1)}1`]);

// ── Sheet 2: Summary ─────────────────────────────────────────────────────────
// (VI) ── Sheet 2: Tổng quan (thống kê độ bao phủ theo tính năng & độ ưu tiên) ──
const features = [...new Set(TESTS.map((t) => t.feature))];
const countBy = (pred) => TESTS.filter(pred).length;
const sumRows = [];
sumRows.push({ cells: [{ text: 'TỔNG QUAN ĐỘ BAO PHỦ', style: 1 }, { text: '', style: 1 }, { text: '', style: 1 }, { text: '', style: 1 }] });
sumRows.push({ cells: ['Tính năng', 'Tổng số', 'Tự động', 'Thủ công/Chặn'].map((h) => ({ text: h, style: 2 })) });
for (const f of features) {
  const total = countBy((t) => t.feature === f);
  const auto = countBy((t) => t.feature === f && t.automated.startsWith('Automated'));
  sumRows.push({
    cells: [
      { text: f, style: 3 }, { text: String(total), style: 4 },
      { text: String(auto), style: 4 }, { text: String(total - auto), style: 4 },
    ],
  });
}
sumRows.push({
  cells: [
    { text: 'TỔNG CỘNG', style: 2 }, { text: String(TESTS.length), style: 2 },
    { text: String(countBy((t) => t.automated.startsWith('Automated'))), style: 2 },
    { text: String(countBy((t) => !t.automated.startsWith('Automated'))), style: 2 },
  ],
});
sumRows.push({ cells: [{ text: '', style: 0 }, { text: '', style: 0 }, { text: '', style: 0 }, { text: '', style: 0 }] });
sumRows.push({ cells: [{ text: 'Theo độ ưu tiên', style: 2 }, { text: 'Số lượng', style: 2 }, { text: '', style: 0 }, { text: '', style: 0 }] });
for (const p of ['P1 - Cao', 'P2 - Trung bình', 'P3 - Thấp']) {
  sumRows.push({ cells: [{ text: p, style: 3 }, { text: String(countBy((t) => t.priority === p)), style: 4 }, { text: '', style: 0 }, { text: '', style: 0 }] });
}
const sheet2 = sheetXml(sumRows, [26, 12, 12, 16], 2, null, [`A1:D1`]);

// ── Sheet 3: Traceability ────────────────────────────────────────────────────
// (VI) ── Sheet 3: Ma trận truy vết (đối chiếu test case ↔ test tự động) ──
const trRows = [];
trRows.push({ cells: ['MA TRẬN TRUY VẾT (Test case ↔ Automation)', '', '', ''].map((t) => ({ text: t, style: 1 })) });
trRows.push({ cells: ['Mã TC', 'Tính năng', 'Spec / Test', 'Tự động hóa'].map((h) => ({ text: h, style: 2 })) });
for (const t of TESTS) {
  trRows.push({
    cells: [
      { text: t.id, style: 4 }, { text: t.feature, style: 3 },
      { text: t.ref, style: 3 }, { text: t.automated, style: 4 },
    ],
  });
}
const sheet3 = sheetXml(trRows, [13, 22, 34, 22], 2, `A2:D2`, [`A1:D1`]);

// ── Package parts ────────────────────────────────────────────────────────────
// (VI) ── Các thành phần trong gói .xlsx (file .xlsx thực chất là một file zip
// (VI) chứa các phần XML chuẩn OOXML: content types, quan hệ, workbook, sheet, style) ──
const parts = {
  '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
  '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
  'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>
<sheet name="Test Cases" sheetId="1" r:id="rId1"/>
<sheet name="Summary" sheetId="2" r:id="rId2"/>
<sheet name="Traceability" sheetId="3" r:id="rId3"/>
</sheets>
</workbook>`,
  'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
  'xl/styles.xml': STYLES,
  'xl/worksheets/sheet1.xml': sheet1,
  'xl/worksheets/sheet2.xml': sheet2,
  'xl/worksheets/sheet3.xml': sheet3,
};

// ─── CRC32 + ZIP container ────────────────────────────────────────────────────
// (VI) ─── CRC32 + đóng gói ZIP (tự cài đặt vì không dùng thư viện ngoài) ───
// (VI) Bảng tra CRC32 dựng sẵn để tính checksum cho từng file trong zip.
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// (VI) Tự đóng gói nhiều file thành một buffer định dạng ZIP:
// (VI) mỗi file gồm "local header" + tên + dữ liệu nén; sau đó là "central directory"
// (VI) và cuối cùng là bản ghi EOCD (End Of Central Directory).
function zip(files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const nameBuf = Buffer.from(name, 'utf8');
    const data = Buffer.from(content, 'utf8');
    const comp = deflateRawSync(data); // (VI) nén raw deflate (method 8)
    const crc = crc32(data);

    // (VI) Local file header (30 byte) — mô tả file ngay trước phần dữ liệu nén.
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);          // version needed
    local.writeUInt16LE(0, 6);           // flags
    local.writeUInt16LE(8, 8);           // method: deflate
    local.writeUInt16LE(0, 10);          // mod time
    local.writeUInt16LE(0x21, 12);       // mod date (1980-01-01)
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);          // extra length
    chunks.push(local, nameBuf, comp);

    // (VI) Central directory entry (46 byte) — mục lục mô tả lại file ở cuối zip.
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);             // version made by
    cd.writeUInt16LE(20, 6);             // version needed
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(8, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0x21, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(comp.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);             // extra
    cd.writeUInt16LE(0, 32);             // comment
    cd.writeUInt16LE(0, 34);             // disk #
    cd.writeUInt16LE(0, 36);             // internal attrs
    cd.writeUInt32LE(0, 38);             // external attrs
    cd.writeUInt32LE(offset, 42);        // local header offset
    central.push(Buffer.concat([cd, nameBuf]));

    offset += local.length + nameBuf.length + comp.length;
  }
  const cdBuf = Buffer.concat(central);
  const cdOffset = offset;
  // (VI) EOCD (22 byte) — bản ghi kết thúc, cho biết số file và vị trí central directory.
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(central.length, 8);
  eocd.writeUInt16LE(central.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...chunks, cdBuf, eocd]);
}

// (VI) Tạo thư mục đích nếu chưa có, rồi ghi file .xlsx ra đĩa.
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, zip(parts));
console.log(`✓ Wrote ${TESTS.length} test cases across 3 sheets → ${OUT}`);
