# Tổng Quan Dự Án PhotoHub

Dự án **PhotoHub** là một nền tảng Marketplace trực tuyến kết nối khách hàng (Customers) với các nhiếp ảnh gia chuyên nghiệp (Photographers). Hệ thống cung cấp các giải pháp đặt lịch chụp ảnh, thanh toán trực tuyến, quản lý công việc và đấu thầu thông qua thuật toán khớp lịch trình tự động cùng với tính năng tìm kiếm phong cách chụp thông minh bằng trí tuệ nhân tạo (AI).

---

## 🏛️ 1. Cấu Trúc Dự Án (Project Structure)

Hệ thống được tổ chức dưới dạng thư mục phẳng chứa hai dự án độc lập:

*   **PhotoHub-BE-Project**:
    *   Hệ thống REST API viết bằng **Node.js** và **Express**.
    *   Sử dụng cơ sở dữ liệu phi quan hệ **MongoDB** thông qua **Mongoose ODM**.
    *   Cấu hình cổng chạy mặc định: `3000` (được cấu hình qua biến môi trường `PORT` ở backend).
*   **PhotoHub-FE-Project**:
    *   Ứng dụng Single Page Application (SPA) phát triển trên nền tảng **React 18** và thiết kế giao diện bằng **Tailwind CSS v3**.
    *   Sử dụng công cụ scaffold **Create React App** (`react-scripts`).
    *   Cấu hình cổng chạy mặc định: `4200` (được cấu hình qua biến môi trường `PORT` ở frontend).
*   **scratch**:
    *   Chứa các file sao lưu mã nguồn thực tế như [photographerRoutes.backup.js](file:///d:/SU26/WDP301/wdp301-rbl-project-wdp_se18d08_group-2-1/scratch/photographerRoutes.backup.js) và [photographerService.backup.js](file:///d:/SU26/WDP301/wdp301-rbl-project-wdp_se18d08_group-2-1/scratch/photographerService.backup.js).
    *   Những file này lưu trữ các mẫu thiết kế router phụ trợ và các hàm gọi API thông qua Axios/Fetch từ client để kết nối các tính năng như calendar, revenue, withdraw, chat và bids.
*   **docs**:
    *   Thư mục tài liệu phân tích hệ thống (Thư mục hiện tại).

---

## 🎬 2. Di Sản Hệ Thống (Legacy Code & Architecture Origin)

Qua quá trình phân tích kỹ lưỡng mã nguồn backend, chúng tôi phát hiện ra hệ thống ban đầu được phát triển từ một **Cinema Management System** (Hệ thống Quản lý Rạp chiếu phim):
1.  **README.md gốc của Backend**:
    *   Tệp tin [README.md của BE](file:///d:/SU26/WDP301/wdp301-rbl-project-wdp_se18d08_group-2-1/PhotoHub-BE-Project/README.md) vẫn lưu giữ nguyên bản mô tả về hệ thống bán vé online, quản lý suất chiếu và bỏ túi tài liệu phân công nhiệm vụ của nhóm học viên cũ (gồm 5 thành viên phụ trách các module: Tài khoản & Tìm kiếm, Quy trình đặt vé, Nhân viên tại quầy, Quản lý nội dung & Lịch chiếu, Quản trị hệ thống & Báo cáo).
2.  **Mã hóa & Khóa bảo mật**:
    *   Các biến cấu hình trong `.env` của cả Backend và Frontend vẫn lưu giữ tên gọi `cinema_secret_key` và `cinema_refresh_secret_key` làm khóa ký token JWT.
3.  **Lược đồ Người dùng (User Schema)**:
    *   Trong tệp [User.js](file:///d:/SU26/WDP301/wdp301-rbl-project-wdp_se18d08_group-2-1/PhotoHub-BE-Project/src/modules/auth/models/User.js), vẫn còn tồn tại ghi chú bằng tiếng Việt về việc quản lý chi nhánh rạp (`branch` liên kết tới `CinemaBranch`).

*Nhận xét:* Đội ngũ phát triển đã tận dụng bộ khung hệ thống MVC trước đó, chuyển đổi cấu trúc dữ liệu từ cơ sở dữ liệu quan hệ (được đề cập là MySQL/Sequelize) sang MongoDB/Mongoose và phát triển toàn bộ các mô-đun nghiệp vụ mới dành cho PhotoHub.

---

## 🧠 3. Điểm Nhấn Công Nghệ Cốt Lõi

Hệ thống tích hợp hai tính năng thông minh giúp nâng tầm trải nghiệm giao dịch và tuyển dụng:

### 3.1. Tìm Kiếm Ảnh Bằng AI (AI Vector Search)
*   **Sinh Embedding**: Sử dụng mô hình **CLIP Vision** (`Xenova/clip-vit-base-patch32`) chạy cục bộ thông qua `@xenova/transformers`. 
*   **So Khớp**: Khi khách hàng tải ảnh mẫu lên, hệ thống sẽ chuyển ảnh thành vector 512 chiều, đối sánh thông qua Atlas Vector Search (`$vectorSearch`) trên trường `embedding` của collection `portfolio_images` để tìm ra nhiếp ảnh gia phù hợp nhất theo thời gian thực.

### 3.2. Tính Điểm Hợp Việc & Hỗ Trợ Đấu Thầu AI (AI Bidding Assistance)
*   Nhiếp ảnh gia được gợi ý công việc dựa trên điểm số khớp lịch trình và ngân sách được tính toán trong [jobFitScoring.js](file:///d:/SU26/WDP301/wdp301-rbl-project-wdp_se18d08_group-2-1/PhotoHub-BE-Project/src/modules/photographers/utils/jobFitScoring.js).
*   Công cụ tối ưu hóa thầu (`optimizeBid`) cho điểm tối đa 100 và tự động trừ điểm dựa trên độ dài đề xuất, ngân sách vượt mức của khách, thiếu danh sách sản phẩm bàn giao hoặc thời gian bàn giao không rõ ràng.
