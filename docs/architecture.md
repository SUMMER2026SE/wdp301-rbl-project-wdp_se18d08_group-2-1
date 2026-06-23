# Kiến Trúc Thư Mục & Hệ Thống (Architecture Guide)

Tài liệu này giải thích chi tiết cấu trúc thư mục của dự án PhotoHub, mục đích của từng thư mục, các tệp cấu hình quan trọng ở cả hai đầu dự án: **Backend (BE)** và **Frontend (FE)**.

---

## 🖥️ 1. Kiến Trúc Backend (PhotoHub-BE-Project)

Backend được xây dựng theo mô hình kiến trúc phân lớp (layered architecture) kết hợp thiết kế hướng mô-đun (modular design).

```text
PhotoHub-BE-Project/
├── src/                          # Thư mục mã nguồn chính
│   ├── app.js                    # Khởi tạo ứng dụng Express & đăng ký Routes toàn hệ thống
│   ├── server.js                 # Điểm đầu vào (Entry point), kết nối DB & khởi động HTTP/Socket server
│   ├── mongo.js                  # Cấu hình & thiết lập kết nối MongoDB Mongoose
│   ├── socket.js                 # Cấu hình Socket.io Server, quản lý kết nối real-time
│   │
│   ├── config/                   # Cấu hình dịch vụ bên thứ ba (Third-party)
│   │   ├── database.js           # [Legacy] Cấu hình MySQL cũ (không còn sử dụng)
│   │   └── cloudinary.js         # Cấu hình tham số kết nối API Cloudinary
│   │
│   ├── constants/                # Định nghĩa các hằng số, Enum dùng chung
│   ├── middlewares/              # Các hàm trung gian xử lý Request
│   │   ├── authenticate.js       # Xác thực JWT Token & giải mã thông tin phiên đăng nhập
│   │   └── upload.js             # Middleware Multer hỗ trợ phân tích luồng upload tệp nhị phân
│   │
│   ├── services/                 # Logic phụ trợ toàn hệ thống
│   │   └── EmailService.js       # Logic gửi mail thông báo OTP & xác nhận booking bằng Nodemailer
│   │
│   ├── utils/                    # Các hàm tiện ích dùng chung
│   │   ├── ApiResponse.js        # Cấu trúc chuẩn hóa dữ liệu API trả về (Success/Error format)
│   │   ├── cloudinaryUpload.js   # Các helper xử lý upload ảnh lên Cloudinary
│   │   └── upload.routes.js      # Tuyến API hỗ trợ upload ảnh đơn lẻ
│   │
│   ├── validations/              # Các schema kiểm định đầu vào dữ liệu (express-validator)
│   │
│   └── modules/                  # Các Mô-đun nghiệp vụ chính (Domain Bounded Contexts)
│       ├── auth/                 # Mô-đun Đăng ký/Đăng nhập, Google OAuth2, OTP & Khôi phục mật khẩu
│       ├── admin/                # Mô-đun Quản trị: Duyệt danh tính, tài chính, tranh chấp, ví tiền
│       ├── customers/            # Hồ sơ khách hàng & quản lý Job Post để nhiếp ảnh gia vào đấu thầu
│       ├── photographers/        # Hồ sơ nhiếp ảnh gia, các mô-đun con:
│       │   ├── album/            # Quản lý hình ảnh và album của nhiếp ảnh gia
│       │   ├── bid/              # Nghiệp vụ gửi thầu & tối ưu hóa giá thầu bằng thuật toán khớp AI
│       │   ├── booking/          # [Duplicated/Legacy] Quản lý booking thuộc domain nhiếp ảnh gia
│       │   ├── calendar/         # Truy vấn sự kiện lịch, kiểm tra xung đột thời gian bận
│       │   ├── chat/             # Hệ thống lưu vết hội thoại và tin nhắn thời gian thực
│       │   └── withdraw/         # Quản lý ví và yêu cầu rút tiền của nhiếp ảnh gia
│       ├── bookings/             # Mô-đun đặt lịch chụp chính của khách hàng (Booking & Payment)
│       ├── packages/             # Thiết lập các gói dịch vụ mẫu của nhiếp ảnh gia (Packages)
│       ├── favorite_photographers/# Chức năng yêu thích & theo dõi nhiếp ảnh gia
│       ├── review/               # Mô-đun đánh giá sao & nhận xét sau khi hoàn thành buổi chụp
│       └── community/            # Mô-đun diễn đàn: Bài đăng thảo luận, lượt thích, bình luận
│
├── tests/                        # Hệ thống viết test tự động (fixtures, unit, integration tests)
├── .model_cache/                 # Nơi lưu trữ cache mô hình AI CLIP chạy local offline sau khi tải về
├── nodemon.json                  # Cấu hình giám sát tự động khởi động lại backend khi sửa đổi code
└── package.json                  # Khai báo các thư viện phụ thuộc (dependencies) của Backend
```

### Chi tiết vai trò các tệp BE cốt lõi:
*   [app.js](file:///d:/SU26/WDP301/wdp301-rbl-project-wdp_se18d08_group-2-1/PhotoHub-BE-Project/src/app.js): Khởi tạo Express, cài đặt middleware bảo mật (`helmet`, `cors`, `express.json` với giới hạn 300MB cho phép upload base64/files dung lượng lớn), đăng ký tất cả các mô-đun API prefix bắt đầu bằng `/api`.
*   [server.js](file:///d:/SU26/WDP301/wdp301-rbl-project-wdp_se18d08_group-2-1/PhotoHub-BE-Project/src/server.js): Điểm khởi chạy của dịch vụ. Kết nối MongoDB trước, nạp mô hình AI vào bộ nhớ đệm (warm-up), tạo server HTTP tích hợp Socket.io để bắt đầu lắng nghe cổng.
*   [mongo.js](file:///d:/SU26/WDP301/wdp301-rbl-project-wdp_se18d08_group-2-1/PhotoHub-BE-Project/src/mongo.js): Đảm bảo tính sẵn sàng kết nối cơ sở dữ liệu MongoDB Atlas, nếu kết nối lỗi sẽ dừng ứng dụng ngay lập tức.
*   [socket.js](file:///d:/SU26/WDP301/wdp301-rbl-project-wdp_se18d08_group-2-1/PhotoHub-BE-Project/src/socket.js): Thiết lập cơ chế WebSocket, phân chia phòng (rooms) theo ID người dùng giúp đẩy thông báo thời gian thực khi có chat hoặc cập nhật trạng thái đơn đặt lịch.

---

## 🎨 2. Kiến Trúc Frontend (PhotoHub-FE-Project)

Frontend được viết theo mô hình Single Page Application (SPA) trên thư viện **React 18** sử dụng **React Router** để quản lý giao diện màn hình.

```text
PhotoHub-FE-Project/
├── public/                       # Các tài nguyên tĩnh (static assets: index.html, favicons, logos)
├── src/                          # Thư mục mã nguồn chính của Client
│   ├── App.jsx                   # Component gốc, chứa sơ đồ định tuyến (Routing) & quản lý Theme/Language
│   ├── index.js                  # Điểm khởi đầu khởi tạo DOM ứng dụng React lên trình duyệt
│   │
│   ├── booking/                  # Các UI Components nghiệp vụ đặt lịch chụp & xem kết quả thanh toán
│   │   ├── BookingModal.jsx      # Modal chọn gói dịch vụ, điền thông tin chụp để gửi yêu cầu đặt lịch
│   │   ├── CustomerBookingList.jsx# Giao diện xem lịch sử đơn đặt lịch của khách hàng
│   │   ├── PhotographerBookingList.jsx # Giao diện phản hồi duyệt/từ chối lịch chụp của nhiếp ảnh gia
│   │   └── PaymentResult.jsx     # Trang hạ cánh hiển thị trạng thái thanh toán sau khi từ PayOS quay lại
│   │
│   ├── components/               # Các UI Components tái sử dụng (Re-usable Components)
│   │   ├── admin/                # Giao diện khung (Layout), thanh bên (Sidebar) của trang quản trị
│   │   ├── customer/             # Form chỉnh sửa hồ sơ khách hàng, tùy chọn phong cách
│   │   ├── photographers/        # Hồ sơ, gói dịch vụ, đánh giá, danh mục ảnh của nhiếp ảnh gia
│   │   ├── review/               # Hiển thị và viết đánh giá sao buổi chụp
│   │   └── landingPage/          # Thanh điều hướng (Header), Chân trang (Footer) chung hệ thống
│   │
│   ├── pages/                    # Các màn hình chính (Pages)
│   │   ├── Home.jsx              # Trang chủ hiển thị thông tin giới thiệu PhotoHub
│   │   ├── AuthPage.jsx          # Trang đăng nhập, đăng ký tài khoản (Tích hợp biểu mẫu động)
│   │   ├── AiSearchPage.jsx      # Trang tìm kiếm nhiếp ảnh gia bằng công nghệ tải lên hình ảnh AI
│   │   ├── PhotographerDashboard.jsx # Bảng điều khiển quản lý doanh thu, ví, rút tiền, thầu của photographer
│   │   ├── ProfilePage.jsx       # Trang chỉnh sửa hồ sơ thông tin cá nhân chung
│   │   ├── CommunityPage.jsx     # Trang mạng xã hội nhiếp ảnh (viết bài, tương tác bình luận)
│   │   ├── ChatPage.jsx          # Hộp thoại chat trực tiếp theo thời gian thực
│   │   └── admin/                # Thư mục chứa các màn hình phân hệ Admin
│   │       ├── AdminDashboard.jsx# Thống kê hệ thống
│   │       ├── AdminUsers.jsx    # Mở/Khóa tài khoản
│   │       ├── AdminVerifications.jsx # Duyệt danh tính nhiếp ảnh gia
│   │       ├── AdminFinance.jsx  # Xem chiết khấu, duyệt yêu cầu rút tiền
│   │       └── AdminDisputes.jsx # Trọng tài xử lý khiếu nại chất lượng sản phẩm
│   │
│   ├── services/                 # Lớp tích hợp kết nối API (API Client integration)
│   │   ├── authService.js        # Gửi request đăng nhập, đăng ký, OTP
│   │   ├── bookingService.js     # Gửi request tạo lịch chụp, lấy link thanh toán PayOS
│   │   ├── aiRecommendService.js # Gửi ảnh mẫu lên backend phục vụ Vector Search
│   │   ├── photographerService.js# Tìm kiếm, lọc và xem thông tin chi tiết các photographer
│   │   └── adminService.js       # Gọi APIs phục vụ chức năng quản trị hệ thống
│   │
│   ├── hooks/                    # Các Custom React Hooks dùng chung
│   └── styles/                   # Cấu hình kiểu dáng CSS bổ trợ
│
├── tailwind.config.js            # Khai báo cấu hình các utility classes, màu sắc của Tailwind CSS
└── package.json                  # Danh sách các thư viện phụ thuộc (dependencies) của Frontend
```

### Chi tiết vai trò các tệp FE cốt lõi:
*   [App.jsx](file:///d:/SU26/WDP301/wdp301-rbl-project-wdp_se18d08_group-2-1/PhotoHub-FE-Project/src/App.jsx): Nơi kiểm soát việc nạp dữ liệu cấu hình ngôn ngữ (`vi`/`en`), thay đổi chủ đề tối/sáng (`theme-dark`/`theme-light`) bằng cách chèn class trực tiếp vào phần tử thẻ `html` để Tailwind CSS v3 tự động cập nhật, đồng thời cấu hình định tuyến cho toàn bộ ứng dụng thông qua `<Routes>` của `react-router-dom`.
*   [services/](file:///d:/SU26/WDP301/wdp301-rbl-project-wdp_se18d08_group-2-1/PhotoHub-FE-Project/src/services/): Lớp dịch vụ đóng gói các cuộc gọi API thông qua Axios hoặc Fetch. Tất cả các dịch vụ đều nạp mã token JWT lưu tại `localStorage` tự động để đính kèm vào header `Authorization: Bearer <token>` phục vụ xác thực phía backend.
