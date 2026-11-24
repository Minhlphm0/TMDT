# Hướng dẫn cài đặt, sử dụng và phát triển PC TECH STORE

> Tài liệu này dựa trên source hiện có trong `D:\TMDT\Frontend`. Dự án đang là frontend học tập, không kết nối backend/MySQL và không xử lý giao dịch thật.

## 1. Tổng quan

- **Tên:** PC TECH STORE.
- **Mô hình:** website bán lẻ B2C mô phỏng linh kiện máy tính, laptop và dịch vụ sửa chữa.
- **Người dùng dự kiến:** khách xem/tìm sản phẩm, thêm giỏ và đặt hàng thử; khách đặt lịch sửa chữa; người học muốn xem cách dựng ứng dụng React.
- **Ngôn ngữ:** JavaScript với JSX; CSS thuần.
- **Thư viện giao diện:** React và Lucide React.
- **Build/dev server:** Vite.
- **Định tuyến:** React Router DOM.
- **Lưu dữ liệu:** LocalStorage cho dữ liệu dài hạn; SessionStorage cho phiên đăng nhập không chọn ghi nhớ.

### Frontend mô phỏng và phần cần backend

Frontend hiện tự hiển thị dữ liệu mẫu và lưu trạng thái trong trình duyệt. Việc đặt hàng chỉ tạo mã đơn giả; thanh toán chỉ chọn hình thức COD/chuyển khoản trên giao diện. Đăng nhập không xác minh trên server. Đặt lịch tạo mã phiếu và trạng thái ban đầu. Không có kho dùng chung giữa người dùng, thiết bị hoặc trình duyệt.

Để vận hành thực tế cần backend/API, cơ sở dữ liệu, xác minh danh tính phía server, quản lý tồn kho/giá, thanh toán, gửi email/SMS, quy trình cập nhật đơn và phiếu sửa chữa. Không dùng tài khoản hoặc thông tin thanh toán thật trong bản hiện tại.

## 2. Môi trường cần có

| Phần mềm | Công dụng | Phiên bản/cách kiểm tra |
|---|---|---|
| Node.js | Chạy Vite, công cụ test và các lệnh npm. | Vite đang khóa ở 8.3.8, yêu cầu engine `^20.19.0 || >=22.12.0`. Kiểm tra bằng `node -v`. |
| npm | Cài thư viện và chạy scripts. | Đi kèm Node.js; dự án không khóa riêng phiên bản npm. Kiểm tra `npm -v`. |
| VS Code | Mở và chỉnh sửa source. | Khuyến nghị, không bắt buộc để chạy. |
| Chrome/Edge | Xem website và DevTools. | Dùng phiên bản hiện đại có Web Crypto API; kiểm tra thủ công bằng cách mở trình duyệt. |
| Git | Quản lý lịch sử source khi làm việc nhóm. | Không cần để chạy; workspace hiện không có thư mục `.git`. Nếu đã cài, kiểm tra `git --version`. |

Mở PowerShell và kiểm tra:

```powershell
node -v
npm -v
git --version
```

Phiên bản tại môi trường đã kiểm tra khi biên soạn: Node `v24.20.0`, npm `11.19.0`. Đây là phiên bản của môi trường kiểm tra, không phải yêu cầu khóa cứng của dự án. Căn cứ tương thích Node là `engines` của Vite trong lockfile.

## 3. Thư viện dự án

Phiên bản bên dưới là bản chính xác trong `package-lock.json`. `package.json` sử dụng một số khoảng phiên bản có dấu `^`; `npm install` đọc lockfile để cài phiên bản đã khóa.

### Dependencies

| Thư viện | Phiên bản khóa | Công dụng trong dự án |
|---|---:|---|
| `react` | 19.3.1 | Component, state và giao diện. |
| `react-dom` | 19.3.1 | Render React vào phần tử `#root`. |
| `react-router-dom` | 7.18.6 | Route, Link, điều hướng, params và query sản phẩm. |
| `lucide-react` | 1.79.0 | Icon trong header, card, form và nút thao tác. |

### DevDependencies

| Thư viện | Phiên bản khóa | Công dụng |
|---|---:|---|
| `vite` | 8.3.8 | Dev server, build và preview. |
| `@vitejs/plugin-react` | 6.3.0 | Hỗ trợ React/JSX cho Vite. |
| `oxlint` | 1.95.0 | Lệnh `npm run lint`. |
| `@types/react` | 19.3.0 | Định nghĩa kiểu React cho công cụ hỗ trợ editor; source hiện viết JavaScript, không phải TypeScript. |
| `@types/react-dom` | 19.3.0 | Định nghĩa kiểu React DOM cho editor/tooling. |

Dự án không khai báo ESLint, Tailwind, Axios, thư viện test ngoài hoặc ORM. Test dùng `node:test` tích hợp trong Node.js.

Cài dependencies đã khai báo:

```powershell
cd D:\TMDT\Frontend
npm install
```

Thêm/gỡ thư viện khi thực sự cần:

```powershell
npm install ten-thu-vien
npm uninstall ten-thu-vien
```

Sau khi thay dependencies, kiểm tra cả `package.json` và `package-lock.json` rồi chạy build/lint/test.

## 4. Cài đặt và chạy lần đầu

1. Mở VS Code.
2. Chọn **File → Open Folder...**, mở `D:\TMDT\Frontend`.
3. Chọn **Terminal → New Terminal**. Kiểm tra terminal đang ở thư mục `Frontend`.
4. Cài thư viện:

   ```powershell
   npm install
   ```

   npm đọc `package.json`/`package-lock.json` và cài package vào `node_modules`.

5. Chạy website:

   ```powershell
   npm run dev
   ```

6. Mở địa chỉ Vite in ở terminal, thường là `http://localhost:5173/`. Nếu cổng bận, Vite có thể chọn cổng kế tiếp, ví dụ `5174`; hãy dùng đúng URL được in ra.
7. Dừng server bằng `Ctrl+C` tại terminal đang chạy Vite.

## 5. Các lệnh có trong `package.json`

| Lệnh | Ý nghĩa |
|---|---|
| `npm run dev` | Chạy máy chủ phát triển Vite có HMR (cập nhật trang khi sửa source). |
| `npm run build` | Tạo bản production trong `dist/`; lệnh sẽ báo lỗi cú pháp/import nếu có. |
| `npm run preview` | Phục vụ thử bản build cục bộ; cần chạy `npm run build` trước. |
| `npm run lint` | Chạy Oxlint trên source. |
| `npm test` | Chạy các file `*.test.js` bằng test runner tích hợp của Node. |

Ví dụ kiểm tra cả dự án:

```powershell
npm test
npm run lint
npm run build
```

## 6. Cấu trúc source thực tế

```text
Frontend/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── components/
│   │   └── AccountPages.jsx
│   ├── utils/
│   │   ├── account.js
│   │   └── account.test.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

- `src/main.jsx`: điểm khởi chạy; render `<App />` trong React `StrictMode`.
- `src/App.jsx`: cấu hình `BrowserRouter`/`Routes`, dữ liệu mẫu 22 sản phẩm và 8 dịch vụ, header/footer, các trang, giỏ hàng và một số thao tác LocalStorage. Dữ liệu sản phẩm hiện nằm ở đây, chưa tách thành `data/products.js`.
- `src/components/AccountPages.jsx`: form đăng nhập/đăng ký và trang thông tin tài khoản.
- `src/utils/account.js`: tạo/kiểm tra hash mật khẩu, đăng ký, xác thực và khôi phục/lưu/xóa phiên tài khoản.
- `src/utils/account.test.js`: test logic tài khoản và phiên bằng storage giả lập trong bộ nhớ.
- `src/App.css`: bố cục và component của website.
- `src/index.css`: thiết lập nền, font Be Vietnam Pro, màu và style gốc.
- `src/assets/`: asset được giữ trong source; ảnh sản phẩm/hero hiện dùng nhiều URL ảnh từ Unsplash.
- `public/`: file tĩnh có thể truy cập trực tiếp từ root URL.
- `index.html`: HTML gốc, metadata, favicon và phần tử React root.
- `vite.config.js`: cấu hình Vite với plugin React.
- `package.json`: scripts và khai báo thư viện; `package-lock.json` khóa dependency tree.
- `node_modules/`, `dist/`: thư mục sinh ra khi cài/build; không chỉnh tay.

Các trang đang được khai báo trong `App.jsx`, chưa có thư mục `pages/` hay React Context riêng.

## 7. Route và cách sử dụng

### Route hiện có

| URL | Chức năng |
|---|---|
| `/` | Trang chủ, danh mục, sản phẩm nổi bật và dịch vụ. |
| `/san-pham` | Danh sách, tìm kiếm, lọc và sắp xếp sản phẩm. |
| `/san-pham?category=Laptop` | Danh sách đã lọc theo danh mục. Có thể dùng `CPU`, `Card%20%C4%91%E1%BB%93%20h%E1%BB%8Da`, v.v.; `GPU` được ánh xạ sang Card đồ họa. |
| `/san-pham/:id` | Chi tiết sản phẩm theo ID. |
| `/gio-hang` | Danh sách giỏ, số lượng, xóa và tổng tiền. |
| `/thanh-toan` | Form đặt hàng mô phỏng và trang thành công. |
| `/dang-nhap`, `/dang-ky`, `/tai-khoan` | Tài khoản mô phỏng. |
| `/don-hang` | Lịch sử đơn đã tạo trong trình duyệt hiện tại. |
| `/yeu-thich`, `/so-sanh` | Danh sách đã đánh dấu yêu thích/so sánh. |
| `/dich-vu`, `/dat-lich`, `/theo-doi` | Dịch vụ, đặt lịch và tra cứu phiếu sửa chữa. |
| `/gioi-thieu` | Giới thiệu và form liên hệ giao diện. |
| URL khác | Trang không tìm thấy (404 trong ứng dụng). |

### Mua sắm

1. Từ trang chủ chọn danh mục hoặc mở **Linh kiện PC**.
2. Nhập tên, thương hiệu hoặc mã `PT-xxxx` vào ô tìm kiếm. Có gợi ý ở header; nhấn kết quả để mở chi tiết.
3. Dùng danh mục, thương hiệu, giá tối đa, tình trạng hàng hoặc mức đánh giá để lọc. Các chip phía trên danh sách thể hiện bộ lọc đang chọn.
4. Chọn cách sắp xếp, ví dụ giá tăng/giảm, bán chạy hoặc đánh giá.
5. Mở card để xem giá, tình trạng, mã hàng và thông số. Chọn số lượng rồi nhấn **Thêm vào giỏ hàng** hoặc **Mua ngay**.
6. Trong giỏ, dùng `+`/`−` để thay số lượng hoặc biểu tượng xóa để bỏ sản phẩm. Phí giao hàng mô phỏng là 30.000₫ dưới 2.000.000₫; từ 2.000.000₫ trở lên miễn phí.
7. Chọn **Tiến hành thanh toán**, điền các trường bắt buộc và chọn phương thức hiển thị. Nhấn xác nhận để tạo mã đơn.

Giá và tồn kho là dữ liệu minh họa. Thanh toán không kết nối ngân hàng/cổng thanh toán. Đơn LocalStorage hiện lưu mã, sản phẩm, tổng tiền và ngày; không lưu đầy đủ thông tin nhận hàng hay phương thức đã chọn.

Nút trái tim lưu danh sách yêu thích; nút so sánh lưu sản phẩm để xem tại trang tương ứng. Đây là dữ liệu cục bộ, không đồng bộ tài khoản trên server.

### Tài khoản

1. Mở **Đăng nhập** ở header hoặc vào `/dang-ky` để tạo tài khoản.
2. Đăng ký cần họ tên, email, số điện thoại, mật khẩu tối thiểu 8 ký tự, xác nhận mật khẩu và đồng ý điều khoản.
3. Đăng nhập bằng email hoặc số điện thoại đã đăng ký. Tài khoản chưa tồn tại hoặc sai mật khẩu sẽ báo toast lỗi.
4. Chọn **Ghi nhớ đăng nhập** để lưu phiên trong LocalStorage; bỏ chọn để lưu ở SessionStorage (thường hết khi đóng tab/trình duyệt).
5. Khi đăng nhập, header hiển thị tên/menu **Thông tin tài khoản**, **Đơn hàng của tôi**, **Đăng xuất**.

Mật khẩu mới được PBKDF2 băm với salt trước khi lưu; hash và salt vẫn nằm trong trình duyệt, nên đây không phải bảo mật backend. Quên mật khẩu chỉ hiện thông báo rằng cần backend, chưa có quy trình khôi phục.

### Sửa chữa và các trang khác

- `/dich-vu`: xem 8 dịch vụ và mở form đặt lịch.
- `/dat-lich`: chọn thiết bị/dịch vụ/ngày/giờ, mô tả tình trạng và gửi để tạo mã `SC...`.
- `/theo-doi`: nhập mã phiếu để tìm dữ liệu sửa chữa trong LocalStorage.
- Trạng thái phiếu mới bắt đầu là **Đã tiếp nhận**. Chưa có nhân viên/backend cập nhật tiếp các trạng thái sau.
- `/gioi-thieu`: form liên hệ chỉ đổi sang thông báo thành công, không gửi email hay lưu tin nhắn.

**Giới hạn cần biết:** component `Field` trong `App.jsx` hiện không đặt thuộc tính `name` cho các trường dùng chung. Vì vậy họ tên/email/điện thoại của form đặt lịch và thông tin người nhận ở checkout không được serialize/lưu như kỳ vọng; phiếu vẫn được tạo nhưng thông tin khách có thể thiếu. Tài liệu ghi theo đúng source hiện tại, không coi đây là chức năng đã hoàn thiện.

## 8. LocalStorage và dữ liệu

LocalStorage là kho key/value trong trình duyệt, giữ dữ liệu sau khi reload và thường còn sau khi đóng/mở lại trình duyệt trên cùng origin. SessionStorage có vòng đời theo tab. Dữ liệu của `localhost:5173` tách biệt với domain/cổng khác.

Các key được dùng trong source:

| Key | Dữ liệu |
|---|---|
| `pct-cart` | Giỏ hàng và số lượng; được đồng bộ khi state giỏ thay đổi. |
| `pct-orders` | Các đơn mô phỏng (mã, sản phẩm, tổng, ngày). |
| `pct-repairs` | Phiếu sửa chữa và trạng thái mô phỏng. |
| `pct-favorites` | ID sản phẩm yêu thích. |
| `pct-compare` | ID sản phẩm được chọn so sánh. |
| `pct-users` | Tài khoản demo; mật khẩu mới được lưu dưới dạng hash + salt PBKDF2. |
| `pct-user` | Phiên đăng nhập được ghi nhớ trong LocalStorage. |
| `pct-session-user` | Phiên đăng nhập không ghi nhớ trong SessionStorage. |

Sản phẩm, giá, đánh giá, dịch vụ và ảnh minh họa nằm trong source. Chưa có cơ sở dữ liệu máy chủ/MySQL. Nếu xóa dữ liệu site, giỏ/đơn/phiếu/tài khoản demo cục bộ sẽ mất.

### Xem hoặc xóa dữ liệu trên Chrome/Edge

1. Mở website, nhấn `F12`.
2. Chọn tab **Application** (Chrome) hoặc **Storage** (Edge DevTools).
3. Mở **Local Storage → http://localhost:5173**; xem các key `pct-*`.
4. Mở **Session Storage** để xem `pct-session-user` nếu không ghi nhớ đăng nhập.
5. Xóa một key bằng chuột phải/Delete. Có thể xóa toàn bộ dữ liệu của origin trong DevTools.

Trong Console, chỉ dùng cho dữ liệu website đang mở:

```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

Sau reload, cart/user sẽ được nạp lại nếu key còn tồn tại. Session không ghi nhớ sẽ còn khi reload cùng tab nhưng thường mất khi đóng tab.

## 9. Lỗi thường gặp

### `node` hoặc `npm` is not recognized

- **Nguyên nhân:** Node.js chưa cài hoặc terminal chưa nhận PATH mới.
- **Kiểm tra:** `node -v` và `npm -v`.
- **Khắc phục:** cài Node.js đáp ứng yêu cầu ở mục 2, đóng/mở lại PowerShell hoặc VS Code rồi kiểm tra lại.

### `npm install` lỗi

- **Nguyên nhân:** mạng/registry/proxy, Node không tương thích, hoặc thiếu quyền ghi thư mục.
- **Kiểm tra:** `node -v`, `npm -v`, kiểm tra mạng; đọc dòng lỗi đầu tiên và package được báo lỗi.
- **Thử lại:**

  ```powershell
  cd D:\TMDT\Frontend
  npm install
  ```

Không xóa `package-lock.json` để chữa lỗi tùy tiện. Nếu dependency đã lệch lockfile, trao đổi nhóm trước khi làm sạch/cài lại.

### `npm run dev` không chạy / sai thư mục

- **Nguyên nhân:** terminal không ở `Frontend` hoặc chưa cài dependencies.
- **Kiểm tra:** `Get-Location` phải là `D:\TMDT\Frontend`; xem `package.json` có scripts.
- **Khắc phục:** `cd D:\TMDT\Frontend`, `npm install`, rồi `npm run dev`.

### Port 5173 đã dùng

Vite thường tự chọn cổng khác và in URL mới. Dùng đúng URL đó hoặc dừng server cũ bằng `Ctrl+C`. Xem tiến trình đang nghe cổng:

```powershell
Get-NetTCPConnection -LocalPort 5173 -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess
```

Chỉ dừng PID nếu đã xác nhận đó là server của dự án:

```powershell
Stop-Process -Id <PID>
```

Thay `<PID>` bằng `OwningProcess` vừa kiểm tra.

### Không tìm thấy module / lỗi import

- **Nguyên nhân:** sai tên file, sai đường dẫn tương đối, thiếu package hoặc sai chữ hoa/thường.
- **Kiểm tra:** file có tồn tại không; đối chiếu import với tên export (`default` hay named export).
- **Khắc phục:** sửa import hoặc export; nếu là thư viện ngoài thì chạy `npm install` rồi khởi động lại Vite.

### Lỗi React component

- Component phải viết hoa chữ cái đầu khi dùng như `<MyComponent />`.
- Kiểm tra JSX đóng đủ thẻ, component trả về một cây JSX hợp lệ, props được truyền đúng.
- Chạy `npm run lint` và `npm run build`; đọc file/dòng mà terminal báo.

### Route không mở hoặc reload ra 404

- Kiểm tra route trong `Routes` ở `src/App.jsx`; dùng `Link`/`NavLink` để điều hướng trong app.
- Dev server Vite có fallback cho SPA. Máy chủ triển khai thực tế cần cấu hình rewrite URL về `index.html`.
- Kiểm tra route chi tiết phải có ID hợp lệ, ví dụ `/san-pham/1`.

### Ảnh không hiện

- Nhiều ảnh sản phẩm đang lấy từ Unsplash, cần mạng và URL còn khả dụng.
- Kiểm tra URL mở trực tiếp được không, DevTools **Network/Console** có lỗi 404/CSP không.
- Ảnh cục bộ đặt trong `src/assets` rồi import; file tĩnh đặt trong `public` và dùng URL bắt đầu `/`.

### CSS không áp dụng

- Kiểm tra `import './App.css'` hoặc `import './index.css'`.
- Kiểm tra className trong JSX có khớp selector không; hard refresh bằng `Ctrl+F5`.
- Nếu nhiều selector cùng đặt style, kiểm tra thứ tự và media query trong `src/App.css`.

### LocalStorage không cập nhật

- DevTools phải đang xem đúng origin/cổng; dữ liệu localhost khác nhau theo port.
- Kiểm tra Console xem JSON parse hoặc quota error; tải lại sau thao tác.
- Xóa key `pct-*` bị hỏng trong DevTools rồi reload. Không dùng `localStorage.clear()` nếu muốn giữ đơn/tài khoản demo.

## 10. Phát triển thêm

### Thêm sản phẩm

Trong đầu `src/App.jsx`, mảng `products` đang dùng mỗi dòng gồm tên, danh mục, hãng, giá, giá gốc, URL ảnh, đánh giá và số lượt đánh giá. Ví dụ thêm một dòng theo đúng format:

```js
['SSD mẫu 1TB', 'SSD/HDD', 'Hãng mẫu', 1990000, 2490000,
  'https://example.com/ssd.jpg', '4.8', 12],
```

Phần `.map((p, i) => ...)` phía sau tự tạo `id`, `slug`, `stock`, mô tả và thông số mặc định. Dùng ID duy nhất theo thứ tự dữ liệu; route chi tiết là `/san-pham/:id`. Giá đang dùng VND dạng số, không nhập dấu chấm/phẩy vào số.

### Thay giá hoặc ảnh

Sửa đúng phần tử tương ứng trong mảng sản phẩm. Ảnh URL nên là ảnh có quyền sử dụng, tỉ lệ phù hợp; không xóa cấu trúc `auto=format...` nếu còn dùng URL Unsplash. Kiểm tra card và trang chi tiết sau khi sửa.

### Thêm danh mục

Thêm sản phẩm với giá trị `category` mới, sau đó kiểm tra danh sách. Nếu muốn biểu tượng/nhóm riêng, chỉnh danh sách `categories` và mapping icon trong `App.jsx`; query dùng dạng `/san-pham?category=TenDanhMuc`.

### Tạo component hoặc trang

Component dùng lại có thể đặt trong `src/components/`. Component tài khoản hiện là ví dụ tại `AccountPages.jsx`. Trang hiện khai báo trực tiếp trong `App.jsx`; khi thêm trang:

1. Viết component, import vào `App.jsx` nếu đặt file riêng.
2. Thêm `<Route path="/duong-dan" element={<TenTrang />} />` bên trong `<Routes>`.
3. Dùng `<Link to="/duong-dan">` để điều hướng.
4. Thêm CSS trong `App.css`; style gốc/font ở `index.css`.
5. Chạy `npm run lint`, `npm test`, `npm run build`.

### Header, Footer và giao diện

`Header` và `Footer` nằm trong `src/App.jsx`. Style header và footer ở `src/App.css`. Màu/font gốc nằm trong `src/index.css`; các breakpoint responsive và style component nằm trong `src/App.css`. Giữ các lớp `wrap`, `nav`, `page`, `product-card` nhất quán để không làm vỡ bố cục.

### Dữ liệu và tài khoản

Hàm quản lý tài khoản ở `src/utils/account.js`; form nằm trong `src/components/AccountPages.jsx`. Test tương ứng ở `src/utils/account.test.js`. Không lưu mật khẩu dạng thô hoặc thông tin nhạy cảm. Hash phía client vẫn không biến mô hình này thành xác thực bảo mật; ứng dụng thật phải xác thực và lưu credential phía server.

## 11. Kiểm tra dự án

- `npm ls --depth=0`: xác nhận các package cài trong `node_modules` khớp dự án.
- `npm test`: test đăng ký/hash, xác thực, chuyển đổi tài khoản demo cũ và vòng đời phiên.
- `npm run lint`: Oxlint.
- `npm run build`: Vite compile và tạo `dist/`.
- Smoke test HTTP route chỉ xác nhận Vite phục vụ SPA/module; không chứng minh thao tác UI hoạt động.
- Kiểm thử thủ công trên trình duyệt vẫn cần cho form, menu, hình ảnh, LocalStorage và các cỡ màn hình.

Kết quả lần kiểm tra được ghi chi tiết trong [BAO_CAO_KIEM_TRA.md](./BAO_CAO_KIEM_TRA.md).
