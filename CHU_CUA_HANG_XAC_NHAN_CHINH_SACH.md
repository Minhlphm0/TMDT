# PC TECH STORE — thông tin chủ cửa hàng cần xác nhận

Các trang `/chinh-sach/return`, `/chinh-sach/warranty`, `/chinh-sach/shipping`, `/chinh-sach/payment` và `/chinh-sach/privacy` hiện được gắn nhãn **bản dự thảo, chưa được phê duyệt**. Không công bố như điều khoản đang có hiệu lực cho đến khi hoàn tất các mục dưới đây và được rà soát phù hợp với hoạt động thực tế.

## Thông tin cửa hàng và phê duyệt

- [ ] Tên pháp lý, mã số doanh nghiệp/hộ kinh doanh, địa chỉ đăng ký và tên chủ thể chịu trách nhiệm.
- [ ] Địa chỉ cửa hàng/kho thực tế, email, số điện thoại và kênh nhận yêu cầu chính thức. Thông tin `28 Nguyễn Thị Minh Khai, Q.1, TP.HCM`, `1900 2828`, `hello@pctechstore.vn` trong website hiện là dữ liệu mẫu của đồ án.
- [ ] Người có thẩm quyền phê duyệt, phiên bản nội dung và ngày hiệu lực.
- [ ] Rà soát nghĩa vụ thông báo/đăng ký website thương mại điện tử và các nghĩa vụ pháp lý áp dụng cho đúng mô hình kinh doanh.

## Đổi trả và hoàn tiền

- [ ] Thời hạn yêu cầu theo từng nhóm hàng; thời điểm bắt đầu tính và cách tiếp nhận yêu cầu.
- [ ] Điều kiện tình trạng sản phẩm, phụ kiện, hộp/tem, hóa đơn; ngoại lệ áp dụng và cách xử lý hàng lỗi/giao sai.
- [ ] Quy trình kiểm tra, đầu mối vận chuyển và bên chịu phí gửi/đổi trả trong từng tình huống.
- [ ] Hình thức hoàn tiền, thông tin cần đối soát, thời hạn xử lý thực tế và cách thông báo kết quả.
- [ ] Xác nhận hoặc sửa mọi nội dung đang tạo kỳ vọng về đổi trả. Source cũ hiển thị “Trong 7 ngày đầu tiên”; con số này **chưa được xác nhận** và không được coi là cam kết.

## Bảo hành

- [ ] Thời hạn và phạm vi theo SKU/nhà sản xuất; thời điểm bắt đầu; tra cứu bằng chứng mua hàng.
- [ ] Trung tâm tiếp nhận/ủy quyền, địa chỉ, giờ làm việc, quy trình gửi hàng và thời gian cập nhật dự kiến.
- [ ] Điều kiện loại trừ, xử lý hư hỏng do vận chuyển, sửa chữa/thay thế/đổi sản phẩm và phương án khi hết linh kiện.
- [ ] Xác nhận dữ liệu demo trong source (ví dụ bảo hành 36 tháng) không bị hiểu là bảo hành đồng loạt cho hàng thật.

## Vận chuyển

- [ ] Khu vực phục vụ, hãng vận chuyển, hình thức giao, phí theo khu vực/khối lượng và thời gian dự kiến.
- [ ] Quy định phí phát sinh, giao nhiều kiện, giao thất bại, kiểm tra hàng, thiếu/hỏng/mất trong vận chuyển và đầu mối khiếu nại.
- [ ] Xác nhận ngưỡng miễn phí vận chuyển. Giao diện demo có nội dung “Miễn phí đơn từ 2 triệu”; checkout demo có mức phí 30.000 đồng dưới 2 triệu và miễn phí từ 2 triệu. Đây là dữ liệu giao diện, chưa phải biểu phí đã được chủ cửa hàng xác nhận.

## Thanh toán

- [ ] Phương thức thực sự được chấp nhận, điều kiện COD, các loại phí và thời điểm xác nhận đơn.
- [ ] Nếu chuyển khoản: tên chủ tài khoản, ngân hàng, số tài khoản, nội dung chuyển khoản, cách đối soát và cách xử lý chuyển thiếu/thừa. Không điền/chia sẻ thông tin tài khoản ngân hàng thật trong tài liệu này.
- [ ] Nếu có cổng thanh toán: đơn vị cung cấp, dữ liệu được chuyển, trạng thái giao dịch, xử lý lỗi và hoàn tiền.
- [ ] Source hiện chỉ có giao diện minh họa COD/chuyển khoản; không tích hợp gateway, không xử lý giao dịch và không có thông tin tài khoản ngân hàng.

## Bảo vệ dữ liệu cá nhân

- [ ] Xác định chính xác bên kiểm soát/xử lý dữ liệu, loại dữ liệu, mục đích, căn cứ xử lý và cơ chế lấy/ghi nhận sự đồng ý nếu cần.
- [ ] Nhà cung cấp/đơn vị nhận dữ liệu (hosting, vận chuyển, thanh toán, phân tích, CSKH); dữ liệu nào được chuyển cho từng bên và có chuyển ra nước ngoài không.
- [ ] Thời hạn lưu cho từng loại dữ liệu; quyền truy cập; bảo mật; xử lý sự cố; xóa/ẩn danh và quy trình tiếp nhận yêu cầu của chủ thể dữ liệu.
- [ ] Rà soát cookie, analytics, log máy chủ, nội dung biểu mẫu, môi trường production và các thư viện/tài nguyên bên thứ ba. Source đã kiểm tra sử dụng LocalStorage/SessionStorage cho dữ liệu mô phỏng, tải font từ Google Fonts và ảnh từ Unsplash; hành vi triển khai thật có thể khác.
- [ ] Lưu ý bản demo không có backend. Mật khẩu tài khoản demo được băm PBKDF2 ở phía trình duyệt nhưng điều đó không tạo thành hệ thống xác thực/bảo mật production.

## Giới hạn chức năng đã thấy trong source

- Một số trường checkout/đặt lịch không có thuộc tính `name`, nên dữ liệu nhập không được ghi đầy đủ vào bản ghi mô phỏng.
- Mã theo dõi sửa chữa mô phỏng không có tiến trình cập nhật trạng thái thật.
- Biểu mẫu liên hệ chưa gửi/lưu yêu cầu đến cửa hàng.
- Giỏ hàng, đơn hàng và tài khoản demo được lưu trên trình duyệt; không đồng bộ với hệ thống bán hàng.

Không mô tả các chức năng trên như dịch vụ đang vận hành nếu chưa triển khai backend tương ứng.

## Tài liệu pháp lý để rà soát

Đây là các điểm bắt đầu tra cứu văn bản chính thức, không thay thế tư vấn pháp lý. Kiểm tra lại văn bản hợp nhất, hướng dẫn và quy định có hiệu lực tại thời điểm cửa hàng vận hành:

- [Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 — Cổng văn bản Chính phủ](https://vanban.chinhphu.vn/?docid=214590&pageid=27160&typegroupid=3) (ban hành năm 2025, hiệu lực từ 01/01/2026).
- [Văn bản hợp nhất Luật Bảo vệ quyền lợi người tiêu dùng số 47/VBHN-VPQH — Cổng văn bản Chính phủ](https://vanban.chinhphu.vn/?classid=0&docid=217232&pageid=27160) (đăng ngày 17/03/2026).
- [Nghị định 85/2021/NĐ-CP về thương mại điện tử — Cổng văn bản Chính phủ](https://vanban.chinhphu.vn/?docid=204191&pageid=27160).
