# PC TECH STORE

Website thương mại điện tử B2C mô phỏng cho cửa hàng linh kiện máy tính và dịch vụ sửa chữa laptop. Dự án dùng React, JavaScript JSX, Vite, React Router DOM và CSS thuần. Dữ liệu sản phẩm là dữ liệu mẫu; một số thao tác được lưu trong LocalStorage/SessionStorage để dùng thử trên trình duyệt. Dự án chưa có backend hoặc cơ sở dữ liệu máy chủ.

## Yêu cầu

- Node.js theo yêu cầu của Vite trong lockfile: `^20.19.0 || >=22.12.0`.
- npm đi kèm Node.js.
- Trình duyệt hiện đại như Chrome hoặc Edge.
- Visual Studio Code được khuyến nghị để mở source.

## Chạy nhanh trên Windows PowerShell

```powershell
cd D:\TMDT\Frontend
npm install
npm run dev
```

Mở URL `http://localhost:5173` (hoặc địa chỉ Vite in ra). Nhấn `Ctrl+C` trong terminal để dừng server.

## Scripts

| Lệnh | Công dụng |
|---|---|
| `npm run dev` | Chạy Vite ở chế độ phát triển. |
| `npm run build` | Kiểm tra và tạo bản build trong `dist/`. |
| `npm run preview` | Chạy thử bản build cục bộ sau khi build. |
| `npm run lint` | Kiểm tra mã bằng Oxlint. |
| `npm test` | Chạy test Node.js cho tiện ích tài khoản. |

## Tài liệu chi tiết

Xem [HUONG_DAN_CAI_DAT_VA_SU_DUNG.md](./HUONG_DAN_CAI_DAT_VA_SU_DUNG.md) để cài môi trường, sử dụng website, hiểu cấu trúc source và xử lý lỗi. Kết quả kiểm tra hiện tại và giới hạn được ghi tại [BAO_CAO_KIEM_TRA.md](./BAO_CAO_KIEM_TRA.md).

> Đây là ứng dụng frontend phục vụ học tập. Giá, đặt hàng, thanh toán, tài khoản và sửa chữa chỉ được mô phỏng; không dùng để giao dịch thật.
