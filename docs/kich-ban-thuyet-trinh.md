# Kịch bản thuyết trình — Bảo vệ đồ án

**Đề tài:** Kiểm thử tự động chức năng Website đặt vé xe trực tuyến **FUTA Hà Sơn** bằng công cụ **Playwright**
**Học phần:** Kiểm thử phần mềm nhúng — GVHD: ThS. Thái Thị Thanh Vân
**Nhóm:** Trần Mạnh Cường · Trần Hoàng Dũng · Đỗ Ngọc Huy
**Khoa CNTT — Học viện Kỹ thuật Mật mã**

> Tổng thời lượng đề xuất: **15–18 phút** + Hỏi đáp.
> Phân vai: **Cường** dẫn mở đầu + Chương 1 · **Dũng** Chương 2 · **Huy** Chương 3 + kết.
> Mẹo: mỗi slide nói 2–4 câu, nhìn khán giả, để bảng Test Case tự "nói" — chỉ giải thích cột *Kết quả mong đợi*.

---

## SLIDE 1 — Trang bìa *(Cường, ~45s)*

> Kính chào cô và các bạn. Em là Trần Mạnh Cường, đại diện nhóm gồm em, bạn Trần Hoàng Dũng và bạn Đỗ Ngọc Huy. Hôm nay nhóm em xin trình bày đồ án học phần Kiểm thử phần mềm nhúng với đề tài: **"Kiểm thử tự động chức năng website đặt vé xe trực tuyến FUTA Hà Sơn bằng công cụ Playwright"**, dưới sự hướng dẫn của cô Thái Thị Thanh Vân.
>
> Bài trình bày gồm ba chương: Cơ sở lý thuyết và giới thiệu hệ thống, Kế hoạch — thiết kế Test Case, và cuối cùng là Xây dựng Test Script cùng kết quả thực tế. Em xin phép bắt đầu.

---

## SLIDE 2 — Chương 1 (divider) *(Cường, ~10s)*

> Đầu tiên là Chương 1 — Cơ sở lý thuyết và giới thiệu hệ thống website.

---

## SLIDE 3 — 1.1 Lý thuyết kiểm thử & Quy trình STLC *(Cường, ~1ph30)*

> Trong bối cảnh chuyển đổi số, đặt vé xe trực tuyến trở thành dịch vụ thiết yếu. Với một hệ thống xử lý dữ liệu **thời gian thực** như FUTA Hà Sơn, việc đảm bảo các chức năng cốt lõi luôn chính xác và ổn định là cực kỳ quan trọng. Thay vì kiểm thử thủ công tốn thời gian, nhóm em chọn hướng **kiểm thử tự động** với công cụ hiện đại Playwright để tăng độ chính xác và rút ngắn tiến độ.
>
> Nhóm bám sát **Vòng đời kiểm thử phần mềm STLC** gồm 6 giai đoạn: *phân tích yêu cầu → lập kế hoạch → thiết kế Test Case → thiết lập môi trường → thực thi → báo cáo và nghiệm thu*. Toàn bộ đồ án được triển khai đúng theo quy trình này.

---

## SLIDE 4 — 1.1 Lỗi phần mềm & Nguyên nhân *(Cường, ~1ph30)*

> Để xử lý lỗi hiệu quả, cần phân biệt rõ ba khái niệm:
> - **Error (Sai sót)** — do con người gây ra khi thiết kế hoặc lập trình.
> - **Defect/Bug (Khiếm khuyết)** — sự không nhất quán tồn tại trong code, khiến phần mềm chạy lệch so với đặc tả.
> - **Failure (Thất bại)** — biểu hiện thực tế khi người dùng cuối nhận kết quả sai trên môi trường vận hành.
>
> Với một site **Blazor động** như FUTA Hà Sơn, lỗi thường đến từ ba nguồn: *đặc tả mơ hồ* (ví dụ định dạng số điện thoại, ngày khởi hành), *xử lý bất đồng bộ* khiến sơ đồ ghế tải chậm gây lỗi "trôi click", và *kiểm định chưa bao phủ* các ca biên như khứ hồi hay thanh toán lỗi. Đây chính là những điểm nhóm em tập trung kiểm thử.

---

## SLIDE 5 — 1.2 Giới thiệu hệ thống & phạm vi 3 chức năng *(Cường, ~1ph)*

> Nhóm khoanh vùng kiểm thử vào **ba luồng nghiệp vụ cốt lõi**:
> 1. **Đăng nhập xác thực** — đăng nhập *không mật khẩu*, qua mã OTP gửi về điện thoại thật.
> 2. **Tìm kiếm chuyến xe** — tra cứu hành trình đa bến, xử lý ngày khởi hành mặc định và tùy chọn khứ hồi.
> 3. **Điền thông tin đặt chỗ** — phễu nhập liệu hành khách, nằm **sau cổng đăng nhập OTP**.
>
> Em xin chuyển phần Chương 2 cho bạn Dũng.

---

## SLIDE 6 — Chương 2 (divider) *(Dũng, ~10s)*

> Cảm ơn Cường. Em là Trần Hoàng Dũng, trình bày Chương 2 — Kế hoạch kiểm thử và thiết kế Test Case.

---

## SLIDE 7 — 2.1 Định hướng kế hoạch *(Dũng, ~1ph30)*

> Nhóm chọn chiến lược **Kiểm thử End-to-End (E2E)** — kiểm tra trọn luồng từ giao diện đến xử lý logic — kết hợp phương pháp **Hộp đen**: kiểm định độc lập với mã nguồn, chỉ quan tâm đầu vào và đầu ra mong đợi. Cách này mô phỏng chính xác hành vi người dùng thật và phản ánh khách quan trải nghiệm khách hàng.
>
> Điểm mấu chốt: FUTA Hà Sơn là **hệ thống production đang chạy thật, không có môi trường staging**. Vì vậy nguyên tắc an toàn xuyên suốt là: **tuyệt đối không bấm nút kích hoạt thanh toán tài chính thật**, tránh sinh đơn ảo ảnh hưởng hệ thống.

---

## SLIDE 8 — 2.2 Công cụ Playwright *(Dũng, ~1ph30)*

> Nhóm chọn **Playwright của Microsoft** — thế hệ kiểm thử mới khắc phục nhược điểm của Selenium nhờ giao tiếp trực tiếp qua **Chrome DevTools Protocol**. Ba ưu điểm nổi bật:
> - **Auto-wait**: tự động chờ phần tử hiển thị và sẵn sàng click → giảm tối đa lỗi *flaky test* (trôi kịch bản).
> - **Multi-browser**: chạy trên Chromium, Firefox, WebKit với một API thống nhất.
> - **Codegen**: ghi lại thao tác người dùng và sinh thẳng code TypeScript — tăng tốc viết kịch bản.

---

## SLIDE 9 — Kỹ thuật thiết kế & ma trận Test Case *(Dũng, ~1ph)*

> Trên cơ sở đó, nhóm áp dụng các kỹ thuật thiết kế ca kiểm thử *hộp đen* — **phân vùng tương đương** và **phân tích giá trị biên** — để bao phủ cả luồng hợp lệ lẫn các ca lỗi/biên. Toàn bộ được lập thành **ma trận Test Case** đặt mã định danh ổn định theo từng chức năng: `TC-LOGIN-*`, `TC-SEARCH-*`, `TC-PAY-*`. Sau đây em đi vào từng nhóm.

---

## SLIDE 10–11 — Test Case Đăng nhập (TC-LOGIN-01 → 09) *(Dũng, ~2ph)*

> Chức năng đăng nhập có 9 ca. Em nêu vài ca tiêu biểu:
> - **TC-LOGIN-02** — mã quốc gia mặc định phải là **+84** của Việt Nam.
> - **TC-LOGIN-03** — bỏ trống số điện thoại: hệ thống **không gửi OTP**, giữ nguyên bước nhập số.
> - **TC-LOGIN-04** — số chứa chữ cái như `"abcxyz"`: chặn gửi, không sang form OTP.
> - **TC-LOGIN-05** — số bắt đầu bằng `0` nhưng sai như `"0901"`: hiện popup *"Số điện thoại không hợp lệ"*.
> - **TC-LOGIN-06** — số hợp lệ thật: gửi OTP thành công, chuyển sang form 6 ô mã. *(ca này cần số điện thoại thật)*
> - **TC-LOGIN-08 / 09** — nhập đúng OTP thì đăng nhập thành công, nút Header đổi thành tên tài khoản; nhập sai `"000000"` thì báo lỗi và không đăng nhập.
>
> Điểm hay là mỗi ca đều kiểm chứng đúng một **thông báo lỗi cụ thể** đã quan sát trực tiếp trên site thật.

---

## SLIDE 12 — Test Case Tìm kiếm (TC-SEARCH-01 → 10) *(Dũng, ~1ph30)*

> Chức năng tìm chuyến có 10 ca. Tuyến tham chiếu nhóm dùng là **Lào Cai → Hà Nội** vì có chuyến hằng ngày. Một số ca đáng chú ý:
> - **TC-SEARCH-01** — tuyến hợp lệ: chuyển sang trang kết quả `/datve/`, hiện danh sách chuyến.
> - **TC-SEARCH-03** — xử lý trường hợp tỉnh trùng tên bến như **"Hà Nội"**: phải chọn đúng bến con cuối cùng của cây thư mục.
> - **TC-SEARCH-04 / 05** — bỏ trống điểm đi/đến: cảnh báo *"Bạn chưa chọn điểm xuất phát/điểm đến"*, chặn chuyển trang.
> - **TC-SEARCH-07** — thẻ kết quả hiển thị đúng định dạng *"Từ …đ"* và loại xe (VIP, Cabin…).
> - **TC-SEARCH-10** — chặn chọn ngày khởi hành trong quá khứ: các ngày trước hôm nay bị vô hiệu hóa.

---

## SLIDE 13 + slide chính sách — Test Case Thanh toán (TC-PAY) *(Dũng, ~2ph)*

> Thanh toán là phễu phức tạp nhất vì **nằm sau cổng đăng nhập OTP**. Các ca tiêu biểu:
> - **TC-PAY-04** — tick điều khoản mới kích hoạt được nút *"Tiếp tục"*.
> - **TC-PAY-05** — chưa chọn điểm đón/trả: cảnh báo yêu cầu cấu hình điểm đón/trả.
> - **TC-PAY-06** — chưa đăng nhập: bị chặn, hiện popup yêu cầu đăng nhập OTP. Đây chính là **cổng bảo vệ** của luồng thanh toán.
> - **TC-PAY-07** — truy cập thẳng URL thanh toán (deep-link): hệ thống tự chuyển về trang chủ.
>
> Và đây là **nguyên tắc an toàn quan trọng nhất** của cả đồ án: tham số **`ALLOW_REAL_BOOKING = false`**. Kịch bản kiểm thử **dừng lại ở bước điền thông tin, tuyệt đối không bấm nút xác nhận mua vé tài chính thật**. Em xin chuyển phần Chương 3 cho bạn Huy.

---

## SLIDE 14 — Chương 3 (divider) *(Huy, ~10s)*

> Cảm ơn Dũng. Em là Đỗ Ngọc Huy, trình bày Chương 3 — Xây dựng Test Script và đánh giá kết quả thực tế.

---

## SLIDE 15 — 3.1 Cấu trúc mã nguồn: Page Object Model & An toàn *(Huy, ~2ph)*

> Để mã nguồn sạch và dễ bảo trì khi giao diện đổi, nhóm áp dụng mô hình **Page Object Model (POM)**, tách thành 2 lớp:
> - **Pages Layer** — các tệp `LoginModal.ts`, `HomePage.ts`, `BookingPage.ts` chứa toàn bộ *selector* và hành vi click/nhập liệu.
> - **Tests Layer** — các tệp `.spec.ts` gọi hàm từ Pages Layer để thực hiện *Assertion* tự động.
>
> Vì chạy trên production thật, nhóm bổ sung 2 cơ chế an toàn:
> - **Tái sử dụng phiên đăng nhập** — lưu trạng thái OTP vào tệp `auth/user.json` để **không spam SMS** tổng đài thật khi chạy lại.
> - **Conditional Testing** — dùng `test.skip` tự bỏ qua các ca cần OTP thật nếu CI/CD thiếu cấu hình, nên bộ test luôn "xanh" mặc định.

---

## SLIDE 16 — 3.1 Minh họa mã nguồn *(Huy, ~1ph30)*

> Đây là minh họa cụ thể: bên trái là **Page Object `LoginModal.ts`** — gói gọn selector và thao tác của modal đăng nhập; bên phải là **kịch bản `login.spec.ts`** — chỉ gọi các phương thức nghiệp vụ rồi *assert* kết quả.
>
> Nhờ tách lớp như vậy, thân bài test đọc như mô tả nghiệp vụ, **không có selector lẫn trong spec**. Khi site đổi giao diện, ta chỉ sửa một chỗ trong Page Object.

---

## SLIDE 17 — 3.2 Tổng hợp kết quả thực tế *(Huy, ~1ph30)*

> Đây là bảng tổng hợp kết quả chạy thật. Đa số ca **Pass**, chỉ còn **4 ca ở trạng thái "Skip" — và đây là chủ đích**, không phải lỗi.
>
> Lý do: 4 ca Skip đó nằm trong kịch bản **nhập mã OTP thật** gửi về điện thoại và **kích hoạt giao dịch thanh toán tài chính thật**. Nhóm cố ý bỏ qua để bảo đảm an toàn dữ liệu và **tránh phát sinh giao dịch ảo** trên hệ thống FUTA Hà Sơn đang vận hành thực tế. Đây chính là minh chứng cho nguyên tắc kiểm thử an toàn nhóm đặt ra từ đầu.

---

## SLIDE 18 — Hỏi & Đáp / Kết *(Huy, ~30s)*

> Phần trình bày của nhóm đến đây kết thúc. Nhóm đã xây dựng được bộ kiểm thử tự động bằng Playwright, bao phủ ba chức năng cốt lõi của FUTA Hà Sơn theo đúng quy trình STLC, với cơ chế an toàn tuyệt đối cho môi trường production.
>
> Nhóm em xin chân thành cảm ơn Hội đồng và các bạn đã lắng nghe, và rất mong nhận được câu hỏi cũng như góp ý ạ.

---

## Phụ lục — Chuẩn bị câu hỏi phản biện

| Câu hỏi có thể gặp | Hướng trả lời |
|---|---|
| Vì sao chọn Playwright thay vì Selenium/Cypress? | Auto-wait giảm flaky test; 1 API đa trình duyệt; Codegen sinh code nhanh; giao tiếp qua DevTools Protocol nhanh và ổn định hơn WebDriver. |
| Làm sao test mà không gây hại production? | `ALLOW_REAL_BOOKING=false`, dừng trước nút thanh toán; `test.skip` cho ca cần OTP thật; chạy **serial** (`workers:1`) để không "đập" tải lên site. |
| 4 ca Skip có phải là test thất bại không? | Không. Là *skip có điều kiện* và có chủ đích — cần OTP thật/giao dịch thật, bỏ qua để an toàn; bộ test vẫn xanh. |
| Xử lý site động/bất đồng bộ thế nào? | Auto-wait của Playwright; `force:true` cho phần tử trên trang có carousel tự chạy; click *normal* cho checkbox Syncfusion; chờ leaf render khi tỉnh trùng tên bến. |
| Có chạy CI/CD được không? | Có — Chromium, `workers:1`, `retries:2`; cấp `TEST_PHONE` và `auth/user.json` qua secrets để chạy thêm ca OTP/đã đăng nhập. |
| Bảo trì khi site đổi giao diện? | Nhờ POM, chỉ sửa selector trong Page Object; chuỗi text/validation tập trung ở `fixtures/test-data.ts` (single source of truth). |
