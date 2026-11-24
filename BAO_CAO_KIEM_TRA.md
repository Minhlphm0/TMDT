# Báo cáo kiểm tra PC TECH STORE

**Ngày kiểm tra:** 24-11-2026  
**Thư mục:** `D:\TMDT\Frontend`

## Tóm tắt kết quả

| Kiểm tra | Kết quả |
|---|---|
| Cài dependencies bằng `npm install --ignore-scripts --no-audit --no-fund` | Thành công; npm báo `up to date`. |
| `npm ls --depth=0` | Thành công; các dependency chính đều hiện diện theo lockfile. |
| `npm test` | Thành công: 3 test, 3 đạt, 0 thất bại. |
| `npm run lint` | Thành công; Oxlint không báo lỗi/cảnh báo. |
| `npm run build` | Thành công; Vite tạo `dist/`. |
| Smoke test URL bằng Vite dev server | 16 URL route trả HTTP 200; 3 module source trả HTTP 200. |
| Tương tác UI trên trình duyệt | Chưa thực hiện trong lần kiểm tra này. |

Phiên bản môi trường: Node `v24.20.0`, npm `11.19.0`. Lockfile dùng `lockfileVersion: 3`; Vite khóa `8.3.8` và khai báo Node engine `^20.19.0 || >=22.12.0`.

## Những gì đã được chạy

### Cài đặt và công cụ

Đã chạy `npm install --ignore-scripts --no-audit --no-fund`, kết quả `up to date`; sau đó `npm ls --depth=0` liệt kê đủ React, React DOM, React Router DOM, Lucide React, Vite, React plugin, Oxlint và các package khai báo trong devDependencies.

### Test tự động tài khoản

`npm test` sử dụng `node:test`. Ba test hiện có xác nhận:

1. Đăng ký lưu hash/salt, chuẩn hóa email, chặn email trùng; đăng nhập đúng bằng email hoặc số điện thoại; từ chối mật khẩu sai và tài khoản chưa đăng ký.
2. Tài khoản demo cũ có mật khẩu dạng thô được chuyển sang hash sau khi xác thực đúng.
3. Chọn ghi nhớ lưu phiên ở LocalStorage; bỏ chọn dùng SessionStorage; khôi phục sau reload thông qua hàm session; đăng xuất xóa cả hai key.

Các test dùng Web Crypto của Node và storage giả lập trong bộ nhớ. Chúng **không** render React form hoặc thao tác DOM/header.

### Lint và build

- `npm run lint`: hoàn tất, không có output lỗi/cảnh báo.
- `npm run build`: hoàn tất, Vite chuyển đổi 2.144 module và tạo bundle production trong `dist/`.

### Smoke test route

Khởi chạy `npm run dev -- --host 127.0.0.1`, gửi HTTP GET và nhận 200 cho:

`/`, `/san-pham`, `/san-pham?category=Laptop`, `/san-pham/1`, `/gio-hang`, `/thanh-toan`, `/dang-nhap`, `/dang-ky`, `/tai-khoan`, `/don-hang`, `/yeu-thich`, `/so-sanh`, `/dich-vu`, `/dat-lich`, `/theo-doi`, `/gioi-thieu`.

Các URL route trên gồm 16 đường dẫn (trang chủ và 15 route khác). Ba module `/src/App.jsx`, `/src/components/AccountPages.jsx`, `/src/utils/account.js` cũng được Vite phục vụ với 200. HTTP 200 xác nhận dev server trả ứng dụng/module, **không xác nhận React đã render đúng hoặc nút/form đã hoạt động trong trình duyệt**.

## Kiểm tra source tĩnh

Đã đối chiếu `package.json`, lockfile, cấu trúc source, routes, các key storage và các component. Source hiện có 22 sản phẩm mẫu, 8 dịch vụ; không thấy backend, API server hay kết nối MySQL.

Các luồng có mã nguồn tương ứng: tìm/lọc/sắp xếp sản phẩm; chi tiết; giỏ và tính phí ship; tạo đơn mô phỏng; đăng ký/đăng nhập; đặt lịch và tra cứu; yêu thích/so sánh. Đây là xác nhận qua code, chưa phải thao tác UI end-to-end.

## Hạn chế/phát hiện cần lưu ý

1. Component `Field` trong `src/App.jsx` không gán `name` cho input. Các trường tên/email/điện thoại/ngày ở form đặt lịch và người nhận ở checkout vì vậy không được đọc qua `FormData`/lưu vào đơn. Form vẫn có thể submit nhưng dữ liệu khách bị thiếu.
2. Đơn được lưu trong `pct-orders` gồm mã, items, total và date; checkout không lưu địa chỉ nhận hàng, ghi chú hoặc phương thức thanh toán đã chọn.
3. Phiếu sửa chữa bắt đầu với `status: 0`. Không có thao tác/backend cập nhật tiến độ, nên timeline không tự chuyển sang các bước sau.
4. “Quên mật khẩu” chỉ báo cần backend. Form liên hệ hiển thị thành công nhưng không gửi hoặc lưu tin nhắn.
5. Tài khoản và giao dịch là mô phỏng phía trình duyệt. PBKDF2 có salt giảm việc lưu mật khẩu dạng thô nhưng không thay thế hệ thống xác thực server; dữ liệu LocalStorage có thể bị người dùng sửa/xóa.
6. Ảnh sản phẩm và font Be Vietnam Pro cần mạng vì đang tải từ dịch vụ bên ngoài; project không chứa toàn bộ các ảnh này dưới dạng asset cục bộ.
7. Không có browser automation/browser runner trong môi trường kiểm tra, nên chưa xác nhận layout trực quan ở 1920, 1366, 768, 390px; chưa click thử các luồng mua hàng/sửa chữa, form header, validation native hoặc reload trình duyệt thật.

## Kiểm thử thủ công nên làm tiếp

- Mở `/dang-ky`, tạo tài khoản thử; xác nhận email trùng, password mismatch, checkbox terms, hiện/ẩn password và toast.
- Đăng nhập bằng email rồi bằng phone; thử sai mật khẩu và tài khoản chưa đăng ký.
- Thử hai trạng thái “Ghi nhớ đăng nhập”; reload trang và đóng/mở tab; mở menu header, xem hồ sơ, đơn hàng và đăng xuất.
- Dùng DevTools kiểm tra `pct-users` không chứa mật khẩu thô mới, đồng thời xem `pct-user` hoặc `pct-session-user` thay đổi như mong đợi.
- Mở form đặt lịch và checkout, kiểm tra lại dữ liệu nhận được; hiện source có vấn đề `name` đã nêu trên.
- Dùng browser responsive mode ở 1920px, 1366px, 768px và 390px; kiểm tra cuộn ngang, menu, input, dropdown và card.
