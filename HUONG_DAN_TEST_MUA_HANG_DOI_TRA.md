# Hướng dẫn kiểm thử mua hàng và đổi trả — PC TECH STORE

> Tài liệu này hướng dẫn kiểm thử thủ công luồng mua hàng và đổi trả bằng giao diện hiện tại. Website là bản mô phỏng frontend; đơn hàng, tồn kho, tài khoản và yêu cầu được lưu trên trình duyệt, không gửi tới máy chủ bán hàng thật.

## A. Chuẩn bị kiểm thử

1. Mở thư mục `D:\TMDT\Frontend` bằng VS Code.
2. Mở Terminal tại thư mục dự án. Nếu đây là lần đầu chạy dự án hoặc thiếu thư viện, chạy:

   ```powershell
   npm install
   ```

3. Khởi động website:

   ```powershell
   npm run dev
   ```

4. Mở đúng địa chỉ Vite in trong Terminal (thường là `http://localhost:5173`). Giữ nguyên địa chỉ này trong suốt lần kiểm thử.
5. Dùng cùng một trình duyệt, cùng profile và cùng tab để lần lượt đăng nhập khách hàng và Admin. LocalStorage/IndexedDB được phân tách theo origin và profile; phiên Admin dùng SessionStorage. Không xóa dữ liệu website, không mở một địa chỉ khác như `127.0.0.1`, và không đóng tab trong lúc đổi vai trò.

**Kết quả mong đợi:** Trang chủ mở được. Terminal vẫn chạy Vite. Dữ liệu kiểm thử giữ nguyên khi tải lại trang trong cùng profile và origin.

> **Lưu ý:** Đây là dữ liệu demo trên thiết bị hiện tại. Không dùng thông tin cá nhân, không nhập thông tin thanh toán thật và không xóa dữ liệu trình duyệt trước khi hoàn tất.

## B. Chuẩn bị tài khoản kiểm thử

### Tài khoản khách hàng A

Không thấy tài khoản khách hàng có sẵn được xác định trong source. Hãy tự đăng ký một tài khoản kiểm thử tại `/dang-ky`:

1. Nhập tên kiểm thử, email chưa được dùng (có thể dùng địa chỉ giả lập thuộc miền `.test`), số điện thoại kiểm thử.
2. Tạo mật khẩu dài ít nhất 8 ký tự và nhập lại để xác nhận.
3. Đồng ý điều khoản rồi nhấn **Đăng ký**.
4. Tài khoản đăng ký sẽ tự đăng nhập. Ghi lại email/số điện thoại đã nhập để đăng nhập lại sau khi thoát Admin.

Không dùng email hay số điện thoại của người khác. Nếu email đã tồn tại, dùng một email kiểm thử khác.

### Tài khoản Admin demo

Trang đăng nhập Admin là `http://localhost:5173/admin/dang-nhap`. Source hiện cung cấp tài khoản demo sau:

| Trường | Giá trị |
| --- | --- |
| Email | `admin@pctechstore.demo` |
| Mật khẩu | `Admin@PC2026` |

Đây là thông tin đăng nhập demo trong mã nguồn, không phải tài khoản quản trị bảo mật. Phiên Admin được giữ trong SessionStorage của tab.

**Kết quả mong đợi:** Đăng ký tạo được khách hàng A và đăng nhập tự động. Tài khoản Admin vào được khu vực quản trị ở cùng tab.

## C. Admin kiểm tra và cấu hình tồn kho

1. Truy cập `/admin/dang-nhap`, nhập thông tin Admin demo ở trên và nhấn **Đăng nhập**.
2. Mở **Kho hàng** trong thanh điều hướng Admin hoặc truy cập `/admin/kho-hang`.
3. Tìm một sản phẩm muốn dùng cho lần kiểm thử. Chọn sản phẩm có trong danh sách; không giả định sản phẩm nào đã có tồn kho ban đầu.
4. Nếu chưa cấu hình tồn kho hoặc số lượng khả dụng chưa đủ, nhập số lượng nguyên dương vào trường `onHand` và nhập lý do vào trường `reason`, sau đó lưu theo nút trên giao diện.
5. Ghi lại tên sản phẩm, giá đang hiển thị và số lượng tồn ban đầu. Chọn số lượng mua thấp hơn hoặc bằng tồn kho khả dụng.
6. Mở `/admin/don-hang` để biết vị trí quản lý đơn hàng. Sau khi khách đặt hàng, có thể tìm đơn bằng mã đơn, tên, email hoặc số điện thoại khách hàng.
7. Trên thanh điều hướng Admin, nhấn **Đăng xuất** trước khi chuyển sang khách hàng.

**Kết quả mong đợi:** Sản phẩm được cấu hình tồn kho và xuất hiện là có thể mua khi tồn kho khả dụng lớn hơn 0. Việc lưu kho có ghi nhận biến động kho. Sau khi đăng xuất, trang quản trị yêu cầu đăng nhập lại.

## D. Khách hàng A đặt hàng

1. Mở `/dang-nhap` và đăng nhập bằng email hoặc số điện thoại cùng mật khẩu khách hàng A.
2. Mở danh sách sản phẩm `/san-pham`, tìm sản phẩm đã được cấu hình tồn kho ở phần C, rồi mở trang chi tiết sản phẩm.
3. Chọn số lượng không vượt quá khả dụng và nhấn **Thêm vào giỏ hàng**.
4. Mở `/gio-hang`. Kiểm tra tên sản phẩm, số lượng, đơn giá và thành tiền. Nếu cần, tăng hoặc giảm số lượng trong giới hạn tồn kho.
5. Nhấn **Tiến hành thanh toán** để mở `/thanh-toan`.
6. Điền các trường bắt buộc theo biểu mẫu đang hiển thị: họ tên, số điện thoại, email và địa chỉ nhận hàng. Dùng dữ liệu kiểm thử.
7. Chọn một phương thức đang có trên biểu mẫu: **Thanh toán khi nhận hàng (COD)** hoặc **Chuyển khoản ngân hàng** (mô phỏng).
8. Kiểm tra tổng tiền rồi nhấn **Xác nhận đặt hàng** một lần. Đợi hoàn tất; không nhấn liên tục khi nút đang lưu.
9. Ghi mã đơn hàng xuất hiện ở trang xác nhận. Mở liên kết theo dõi đơn hoặc `/don-hang`, rồi mở chi tiết đơn vừa tạo tại `/don-hang/:id`.

**Kết quả mong đợi:** Có mã đơn mới; đơn thuộc email/tài khoản khách hàng A, trạng thái ban đầu **Chờ xác nhận**, phương thức thanh toán được lưu và giỏ hàng được làm trống. Đơn có các dòng hàng/số lượng/giá và tổng tiền khớp với giỏ. Tồn kho được giữ chỗ theo số lượng đặt; việc trừ tồn thực tế được xử lý ở bước giao hàng theo logic hiện tại. Đơn phải xuất hiện ở danh sách Admin.

Phí giao hàng trong source là 0 đồng khi tạm tính từ 2.000.000 đồng trở lên; dưới mức đó là 30.000 đồng. Không thực hiện thanh toán hoặc chuyển khoản thật.

## E. Admin cập nhật đơn hàng đến trạng thái đã giao

1. Mở `/admin/dang-nhap` trong cùng tab và đăng nhập Admin demo.
2. Mở **Đơn hàng** (`/admin/don-hang`). Tìm bằng mã đơn đã ghi ở phần D.
3. Mở chi tiết đơn. Kiểm tra tên/email/số điện thoại khách, mặt hàng, số lượng, tổng tiền và trạng thái.
4. Trong trường **Chuyển trạng thái**, chọn bước kế tiếp rồi nhấn **Xác nhận cập nhật**. Mỗi lần chỉ cập nhật một bước; xác nhận thao tác nếu hộp thoại yêu cầu, rồi kiểm tra lịch sử trạng thái:

   | Thứ tự | Trạng thái |
   | --- | --- |
   | 1 | Chờ xác nhận |
   | 2 | Đã xác nhận |
   | 3 | Đang xử lý |
   | 4 | Đang vận chuyển |
   | 5 | Đã giao hàng |

5. Không bỏ qua bước. Sau mỗi lần cập nhật, xác nhận trạng thái mới và sự kiện tương ứng được thêm vào lịch sử.
6. Nhấn **Đăng xuất** trên thanh điều hướng Admin.

**Kết quả mong đợi:** Đơn đi tuần tự từ **Chờ xác nhận** tới **Đã giao hàng**. Trạng thái và lịch sử vẫn còn sau khi tải lại. Khi đánh dấu đã giao, hệ thống ghi nhận thời điểm giao để kiểm tra điều kiện đổi trả.

## F. Khách hàng A gửi yêu cầu đổi trả

1. Đăng nhập lại khách hàng A tại `/dang-nhap`.
2. Mở **Đơn hàng của tôi** tại `/don-hang`, rồi mở chi tiết đơn vừa giao.
3. Trong mục **Yêu cầu đổi trả**, kiểm tra điều kiện và thời hạn hiển thị. Thời hạn 7 ngày là cấu hình demo tính từ ngày giao thực tế, không phải cam kết chính sách chính thức.
4. Nhấn **Yêu cầu đổi trả**. Chọn sản phẩm, số lượng còn được yêu cầu và một lý do trong danh sách.
5. Nhập mô tả chi tiết tối thiểu 8 ký tự. Có thể đính kèm minh chứng nếu cần. Hỗ trợ JPEG/PNG/WebP tối đa 3 MB mỗi ảnh, MP4/WebM tối đa 12 MB mỗi video, tối đa 5 tệp và tổng cộng tối đa 20 MB.
6. Nhấn **Kiểm tra và gửi**. Đọc hộp thoại **Xác nhận gửi yêu cầu**, sau đó nhấn **Xác nhận gửi** để gửi thật trong dữ liệu demo.
7. Ghi mã yêu cầu và mở `/yeu-cau-doi-tra` để xem hồ sơ vừa tạo.

**Kết quả mong đợi:** Yêu cầu mới có trạng thái **Chờ duyệt**, gắn đúng mã đơn, sản phẩm, số lượng và lý do. Tải lại trang theo dõi; yêu cầu vẫn còn. Nếu gửi minh chứng hợp lệ, xem lại được tệp trên trang Admin.

Yêu cầu đổi trả chỉ khả thi khi đơn được ghi nhận giao thực tế còn trong cửa sổ demo, sản phẩm còn số lượng có thể yêu cầu và không có yêu cầu đang hoạt động trùng cho cùng sản phẩm/đơn. Đơn chưa giao hoặc thiếu thời điểm giao không đủ điều kiện.

## G. Admin xử lý yêu cầu đổi trả

1. Mở `/admin/dang-nhap` và đăng nhập Admin demo.
2. Mở **Yêu cầu đổi trả** (`/admin/doi-tra`). Tìm bằng mã yêu cầu hoặc mã đơn; mở chi tiết bằng liên kết **Xem**.
3. Kiểm tra khách hàng, đơn hàng, sản phẩm/số lượng, lý do, mô tả và minh chứng.
4. Để kiểm thử luồng chấp thuận và hoàn tiền mô phỏng, tiến hành lần lượt các trạng thái sau; sau mỗi bước dùng nút hành động đang được hiển thị và xác nhận trong hộp thoại nếu có:

   | Thứ tự | Trạng thái |
   | --- | --- |
   | 1 | Chờ duyệt |
   | 2 | Đã duyệt |
   | 3 | Đang nhận hàng |
   | 4 | Đang kiểm tra |
   | 5 | Đang xử lý hoàn tiền |
   | 6 | Đã hoàn tiền |

5. Ở bước hoàn tiền, nhập số tiền không vượt quá giá trị các sản phẩm/số lượng được yêu cầu, chọn phương thức hoàn tiền mô phỏng, và điền các trường bắt buộc trong hộp thoại.
6. Kiểm tra lịch sử xử lý, thời gian, người thực hiện và ghi chú ở trang chi tiết yêu cầu.
7. Nhấn **Đăng xuất** Admin.

Nếu muốn kiểm thử nhánh từ chối thay vì hoàn tiền, tạo một yêu cầu kiểm thử riêng và chọn **Từ chối** khi trạng thái còn **Chờ duyệt**; nhập lý do từ chối. Đây là nhánh kết thúc, không thể tiếp tục luồng nhận hàng/hoàn tiền. Nhánh đổi hàng cũng kết thúc ở **Đã đổi hàng**; quá trình đổi hàng chỉ là mô phỏng, không tạo vận đơn thật.

**Kết quả mong đợi:** Chỉ các bước hợp lệ kế tiếp được cho phép. Trạng thái cuối của luồng hoàn tiền là **Đã hoàn tiền**. Lịch sử thể hiện các bước và Admin thực hiện. Hoàn tiền không dịch chuyển tiền thật.

## H. Khách hàng kiểm tra kết quả và thông báo

1. Đăng nhập lại khách hàng A.
2. Mở `/yeu-cau-doi-tra`, kiểm tra trạng thái mới nhất và lịch sử xử lý.
3. Mở lại chi tiết đơn tại `/don-hang/:id`; xác nhận đơn gốc vẫn hiện trong lịch sử và liên kết tới hồ sơ đổi trả còn dùng được.
4. Tải lại cả hai trang và kiểm tra dữ liệu còn được lưu.
5. Kiểm tra khu vực thông báo khách hàng nếu giao diện hiện tại có hiển thị. Source có tạo bản ghi trong Store `pct-notifications` khi Admin cập nhật đơn/yêu cầu, nhưng trong các route/component hiện tại chưa xác định được trang hoặc bảng thông báo để khách mở xem. Vì vậy, không đánh dấu “khách đã xem thông báo” nếu giao diện không hiển thị; cần kiểm tra trực tiếp trên website.

**Kết quả mong đợi:** Khách hàng A thấy trạng thái mới nhất và lịch sử yêu cầu sau khi tải lại. Đơn hàng gốc vẫn tồn tại. Bản ghi thông báo được tạo là dữ liệu nội bộ frontend; việc thông báo có hiển thị cho khách hay không cần kiểm tra trực tiếp.

## I. Checklist tổng hợp

- [ ] Website khởi động bằng `npm run dev` và mở đúng origin.
- [ ] Đăng ký và đăng nhập khách hàng A thành công.
- [ ] Đăng nhập Admin bằng thông tin demo đã xác minh.
- [ ] Cấu hình tồn kho và ghi lại sản phẩm, giá, số lượng ban đầu.
- [ ] Khách hàng A thêm sản phẩm vào giỏ và kiểm tra số lượng.
- [ ] Thanh toán tạo một đơn hàng mới, ghi lại mã đơn.
- [ ] Đơn xuất hiện trong danh sách Admin.
- [ ] Admin chuyển đơn lần lượt đến **Đã giao hàng**.
- [ ] Khách hàng gửi yêu cầu đổi trả hợp lệ, trạng thái ban đầu là **Chờ duyệt**.
- [ ] Yêu cầu xuất hiện trong khu vực Admin.
- [ ] Admin xử lý yêu cầu qua các bước hợp lệ đến trạng thái cuối.
- [ ] Khách hàng thấy trạng thái/lịch sử mới sau khi tải lại.
- [ ] Đơn hàng gốc vẫn xuất hiện trong lịch sử khách hàng.
- [ ] Đã kiểm tra trực tiếp việc hiển thị thông báo; nếu không có giao diện, ghi nhận là chưa xác minh hiển thị.
- [ ] Không xóa dữ liệu LocalStorage/IndexedDB trước khi hoàn tất.

## J. Xử lý tình huống thường gặp và giới hạn

| Tình huống | Cách xử lý |
| --- | --- |
| Không đăng nhập được khách hàng | Đăng ký tại `/dang-ky`, dùng đúng email/số điện thoại và mật khẩu đã tạo. Tài khoản mới đăng ký tự đăng nhập. Nếu email trùng, đăng ký bằng email kiểm thử khác. |
| Admin không đăng nhập được | Kiểm tra `/admin/dang-nhap`, nhập đúng `admin@pctechstore.demo` và `Admin@PC2026`. Đây là đăng nhập demo ở frontend. |
| Admin không thấy đơn | Kiểm tra đúng origin, cùng profile/trình duyệt, và tìm bằng mã đơn chính xác trong `/admin/don-hang`. Đơn đặt trước khi đăng nhập không tự động gắn vào tài khoản. |
| Không mua được sản phẩm | Mở `/admin/kho-hang`, cấu hình số lượng `onHand` lớn hơn số lượng muốn mua; đơn khác có thể đang giữ chỗ một phần tồn kho. |
| Không thấy nút yêu cầu đổi trả | Xác nhận đơn ở trạng thái **Đã giao hàng** và có ngày giao thực tế; kiểm tra cửa sổ 7 ngày demo, số lượng còn được yêu cầu và yêu cầu đang hoạt động trùng. |
| Không gửi được minh chứng | Dùng JPEG/PNG/WebP hoặc MP4/WebM, tuân thủ giới hạn dung lượng, số lượng và tổng dung lượng ở phần F. Thử lại không có tệp để tách lỗi tải tệp khỏi lỗi gửi yêu cầu. |
| Admin không thấy yêu cầu | Kiểm tra mã yêu cầu ở `/yeu-cau-doi-tra`, rồi tìm mã đó hoặc mã đơn tại `/admin/doi-tra` trên cùng origin/profile. |
| Không chuyển được trạng thái | Chỉ chuyển theo đúng thứ tự trong phần E hoặc G. Các trạng thái kết thúc như **Đã giao hàng**, **Từ chối**, **Đã hoàn tiền**, **Đã đổi hàng** không có bước tiếp theo tương ứng. |
| Dữ liệu không còn sau khi đổi thiết bị/trình duyệt | Store là dữ liệu cục bộ, không đồng bộ giữa thiết bị/profile. LocalStorage và IndexedDB có thể bị mất khi xóa dữ liệu trình duyệt. Minh chứng đổi trả được lưu trong IndexedDB cùng origin. |
| Phiên Admin mất | Phiên Admin dùng SessionStorage. Đăng nhập Admin lại trong cùng tab. Không đóng tab giữa các bước kiểm thử. |
| Dữ liệu ở hai tab không giống nhau ngay lập tức | Thực hiện luồng trong cùng tab và tải lại trang khi cần. Không đổi origin hoặc profile. |

Website hiện không kết nối backend: không có xác thực/ủy quyền máy chủ, thanh toán thật, chuyển tiền hoàn, email/SMS hoặc vận chuyển thật. Tài khoản Admin demo không bảo vệ dữ liệu như hệ thống thực tế. Không sửa LocalStorage thủ công để làm cho luồng kiểm thử thành công.
