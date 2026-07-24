# Chi Tiết Công Nghệ & Kiến Trúc Kỹ Thuật (Technical Stack)

Dự án PhotoHub được xây dựng trên mô hình Client-Server độc lập, vận hành trên nền tảng Node.js ở phía Backend và React SPA ở phía Frontend.

---

## 🖥️ 1. Cấu Trúc Chi Tiết Backend (PhotoHub-BE-Project)

Backend đóng vai trò cung cấp REST APIs, thiết lập kết nối WebSockets thời gian thực, và xử lý thuật toán nhúng vector hình ảnh cục bộ.

### 1.1. Thư viện & Dependencies Chính
*   **Web Framework**: `express` (`^4.18.2`) làm nhân định tuyến chính.
*   **ODM (Object Document Mapper)**: `mongoose` (`^9.3.1`) kết nối cơ sở dữ liệu MongoDB Atlas.
*   **Trí tuệ nhân tạo (Local AI Inference)**:
    *   `@xenova/transformers` (`^2.17.2`): Tải và chạy mô hình mạng nơ-ron cục bộ dựa trên định dạng ONNX Runtime.
    *   Sử dụng mô hình **CLIP Vision** (`Xenova/clip-vit-base-patch32`) để sinh các vector đặc trưng 512 chiều từ tệp tin hình ảnh nhị phân.
    *   Lưu trữ cache của model tại thư mục cục bộ `./.model_cache` trong thư mục gốc của backend để tránh tải lại từ Hugging Face trong các lần khởi động tiếp theo.
*   **Cổng thanh toán điện tử**:
    *   `@payos/node` (`^2.0.5`): Kết nối trực tiếp với cổng thanh toán PayOS để tạo link thanh toán, hủy link và nhận callback/webhook từ hệ thống ngân hàng.
    *   `vnpay` (`^2.4.4`): Thư viện hỗ trợ tích hợp Cổng thanh toán VNPAY.
*   **Xác thực người dùng**:
    *   `jsonwebtoken` (`^9.0.3`) & `passport` (`^0.7.0`) hỗ trợ xác thực JWT và bảo vệ các tuyến API nhạy cảm.
    *   `passport-google-oauth20` (`^2.0.0`) hỗ trợ đăng nhập liên kết qua tài khoản Google.
    *   `bcryptjs` (`^2.4.3`) dùng để mã hóa mật khẩu trước khi lưu trữ vào cơ sở dữ liệu.
*   **Tải lên tập tin**: `multer` (`^1.4.5-lts.1`) làm middleware nhận dữ liệu tệp tin nhị phân và `cloudinary` (`^1.41.3`) / `multer-storage-cloudinary` (`^4.0.0`) để đẩy ảnh lên máy chủ Cloudinary.
*   **Bảo mật**: `helmet` (`^7.1.0`), `cors` (`^2.8.5`) và `express-rate-limit` (`^7.1.5`).
*   **Giao tiếp Real-time**: `socket.io` (`^4.8.3`).
*   **Dịch vụ Email**: `nodemailer` (`^6.9.7`) hỗ trợ gửi mail mã OTP kích hoạt và thông báo lịch hẹn.
*   **Xuất tài liệu**: `pdfkit` (`^0.13.0`) để sinh hóa đơn giao dịch dạng PDF và `exceljs` (`^4.4.0`) xuất báo cáo tài chính Excel.

### 1.2. Mạng và Cổng Kết Nối (Port Mapping)
*   **Cổng dịch vụ Backend**: Mặc định chạy tại port `3000` (Ví dụ: `https://photo-hub-be-project.vercel.app`).

---

## 🎨 2. Cấu Trúc Chi Tiết Frontend (PhotoHub-FE-Project)

Frontend được phát triển theo dạng ứng dụng Single Page Application (SPA), chạy trên môi trường trình duyệt client-side.

### 2.1. Thư viện & Dependencies Chính
*   **Thư viện cơ sở**: `react` (`^18.2.0`) và `react-dom` (`^18.2.0`).
*   **Định tuyến**: `react-router-dom` (`^6.20.0`) quản lý các tuyến trang chính và trang quản trị (Admin).
*   **CSS & Styling**: `tailwindcss` (`^3.4.13`) kết hợp `postcss` (`^8.5.8`) và `autoprefixer` (`^10.4.27`) làm bộ tiền xử lý và xây dựng giao diện tùy chỉnh.
*   **Micro-animations**: `framer-motion` (`^12.35.1`) tạo hiệu ứng động mượt mà cho các menu, popup và bộ lọc kết quả tìm kiếm.
*   **API Client**: `axios` (`^1.16.1`) gửi yêu cầu API đến Backend.
*   **Thông báo giao diện**: `sweetalert2` (`^11.26.25`) thay thế hộp thoại alert mặc định của trình duyệt để tăng tính chuyên nghiệp (UX).
*   **Hệ thống Icon**: `lucide-react` (`^0.577.0`) & `react-icons` (`^5.6.0`).
*   **Real-time client**: `socket.io-client` (`^4.8.3`).

### 2.2. Mạng và Cổng Kết Nối (Port Mapping)
*   **Cổng dịch vụ Frontend**: Được định cấu hình tại port `4200` (được khai báo qua `PORT=4200` trong file `.env` của frontend để tránh xung đột cổng `3000` mặc định của các dự án chạy local khác).

---

## 🔑 3. Quản Lý Biến Môi Trường (.env Configuration)

Cả hai thư mục dự án Backend và Frontend đều chứa cấu hình biến môi trường cục bộ để kết nối hệ thống:

```text
# Kết nối DB và Dịch vụ Lưu trữ
MONGO_URI=mongodb+srv://...            # URI kết nối tới MongoDB Atlas
CLOUDINARY_CLOUD_NAME=dugd9yxog        # Cloudinary Cloud Name
CLOUDINARY_API_KEY=825817911957931     # Cloudinary API Key
CLOUDINARY_API_SECRET=...              # Cloudinary API Secret

# Cổng thanh toán PayOS
PAYOS_CLIENT_ID=...                    # Client ID kết nối PayOS
PAYOS_API_KEY=...                      # API Key kết nối PayOS
PAYOS_CHECKSUM_KEY=...                 # Checksum Key ký số giao dịch
PAYOS_RETURN_URL=http://localhost:4200/payment/result   # URL phản hồi khi thanh toán thành công
PAYOS_CANCEL_URL=http://localhost:4200/payment/result?canceled=true # URL khi hủy thanh toán

# Kết nối Gmail SMTP gửi OTP
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=dat200120040@gmail.com
MAIL_PASSWORD=owuk hbsn pyit tgbz      # App password của Gmail SMTP
MAIL_FROM=dat200120040@gmail.com
MAIL_FROM_NAME="PHOTOHUB System"

# Tích hợp Google OAuth2
GOOGLE_CLIENT_ID=449539395574-7hs2h9nj9u0fkfhaift6se52nnn6d53p.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```
*Lưu ý bảo mật:* Cần loại bỏ các tệp tin chứa thông tin nhạy cảm này ra khỏi lịch sử Git trước khi đưa dự án lên môi trường Production thực tế.
