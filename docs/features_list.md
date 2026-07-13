# Danh Sách Tính Năng Hệ Thống PhotoHub

Hệ thống PhotoHub cung cấp một nền tảng toàn diện hỗ trợ đặt lịch, đấu thầu dự án và tìm kiếm phong cách dựa trên 3 vai trò người dùng chính: **Khách hàng (Customer)**, **Nhiếp ảnh gia (Photographer)**, và **Quản trị viên (Admin)**.

---

## 🔑 1. Hệ Thống Tài Khoản & Xác Thực (Auth Module)
* **Đăng ký / Đăng nhập**: Hỗ trợ xác thực bằng tài khoản cục bộ hoặc đăng nhập nhanh thông qua Google OAuth2.
* **Xác thực OTP & Khôi phục mật khẩu**: Sử dụng Gmail (thông qua SMTP cấu hình trong `.env`) để gửi OTP xác minh đăng ký tài khoản hoặc mã thiết lập lại mật khẩu.
* **Phân quyền người dùng**: Phân chia chi tiết dựa trên vai trò `role` (Admin, Manager, Staff, Customer, Photographer).

---

## 📸 2. Quản Lý Album & Portfolio Tích Hợp AI
* **Tổ chức Album (Portfolio Albums)**: 
  * Nhiếp ảnh gia có thể tạo và tùy chỉnh các album tác phẩm của mình.
  * Thông tin bao gồm: Tiêu đề, Mô tả, Danh mục dịch vụ, Thẻ phong cách (Style Tags), Mức giá tham khảo của gói và trạng thái công khai (`isPublic`).
* **Upload ảnh & Sinh Vector Nhúng**:
  * Lưu trữ ảnh trên Cloudinary hoặc máy chủ cục bộ (thư mục `/uploads/portfolios`).
  * Hệ thống tự động phân tích ảnh qua mô hình **CLIP Vision AI** để sinh ra mảng Vector nhúng 512 chiều (`embedding`) để lưu vào DB của từng bức ảnh phục vụ so khớp ảnh.

---

## 🔍 3. Tìm Kiếm Thông Minh Bằng AI (AI Semantic Search)
* **Tìm kiếm nhiếp ảnh gia bằng ảnh mẫu**:
  * Khách hàng tải ảnh mẫu lên để tìm kiếm nhiếp ảnh gia có phong cách tương tự.
  * Backend sinh vector của ảnh mẫu và thực hiện `$vectorSearch` trên MongoDB Atlas với chỉ mục `portfolio_image_vector_index`.
  * Trả về kết quả khớp phong cách cùng điểm phần trăm tương đồng (`match_percent`).
  * Áp dụng thuật toán **Deduplicate (Khử trùng lặp)**: Nếu nhiếp ảnh gia có nhiều ảnh tương đồng trong kết quả, hệ thống chỉ giữ lại 1 ảnh có điểm số cao nhất cho nhiếp ảnh gia đó trong danh sách trả về để đa dạng hóa kết quả.

---

## 📅 4. Đặt Lịch Chụp & Quản Lý Lịch Trình (Booking & Calendar)
* **Quy trình Đặt lịch (Booking)**: Khách hàng điền thông tin chi tiết (gói chụp, thời gian bắt đầu/kết thúc, tiêu đề, ghi chú, địa điểm, mức giá thỏa thuận).
* **Ngăn ngừa đặt lịch trùng lặp (Overlap Check)**:
  * Hệ thống tự động quét các buổi lịch trình đã được đồng ý/thanh toán của nhiếp ảnh gia. Nếu thời gian đặt lịch mới bị giao thoa với lịch cũ, hệ thống sẽ chặn không cho khách hàng tiến hành đặt lịch.
* **Hệ thống Lịch trình thông minh (Calendar Service)**:
  * Hiển thị toàn bộ lịch trình dưới dạng sự kiện trực quan.
  * Tự động tính toán các mốc **Thời hạn bàn giao sản phẩm** (mặc định là `7 ngày` kể từ khi kết thúc buổi chụp nếu không cấu hình khác).
  * Kiểm tra và cảnh báo trễ hạn bàn giao (`isDeliveryOverdue`).
  * Phát hiện xung đột lịch trình trực quan (`hasConflict: true`) và chỉ rõ những buổi chụp nào đang bị trùng lặp (`conflictWith`).

---

## 📝 5. Đăng Tin Tuyển Dụng & Đấu Thầu (Job Board & Bidding)
* **Đăng tuyển dự án (Job Post)**: Khách hàng đăng tin tuyển dụng bao gồm ngân sách (`budget`), phong cách chụp (`style`), địa điểm, ngày chụp, và hình ảnh tham khảo.
* **Nhiếp ảnh gia đấu thầu (Bids)**: Nhiếp ảnh gia gửi đề xuất thầu kèm mức giá, thời gian hoàn thiện dự kiến, và danh sách các sản phẩm bàn giao cam kết (`deliverables`).
* **Thuật toán Tự động Tính Điểm Hợp Việc (Fit Scoring Algorithm)**:
  Tính toán độ phù hợp của dự án với nhiếp ảnh gia theo thang điểm **100**:
  1.  **Phong cách chụp (Style Match - 30 điểm)**: Khớp nhãn phong cách giữa portfolio của nhiếp ảnh gia và yêu cầu dự án.
  2.  **Địa điểm hoạt động (Location Match - 20 điểm)**: Khớp vùng địa lý.
  3.  **Mức giá & Ngân sách (Budget Match - 20 điểm)**: So sánh ngân sách dự án với mức giá ước tính (bằng `hourlyRate` của nhiếp ảnh gia nhân với 3 giờ).
  4.  **Lịch trình trống (Availability - 20 điểm)**: Cộng 20 điểm nếu lịch của nhiếp ảnh gia trống vào ngày diễn ra dự án; 0 điểm nếu trùng lịch.
  5.  **Đánh giá uy tín (Rating - 6 điểm)**: Quy đổi từ điểm đánh giá trung bình (5 sao tương đương 6 điểm).
  6.  **Lịch sử hoàn thành (History - 4 điểm)**: Tính toán dựa trên số lượng đơn hàng hoàn thành (đạt tối đa 4 điểm khi hoàn thành từ 20 đơn hàng trở lên).
* **Trợ lý đề xuất AI (AI Bidding Assistance & Optimization)**:
  * Tự động viết nháp thư đề xuất giới thiệu bản thân dựa trên thông tin nhiếp ảnh gia và mô tả dự án.
  * Đánh giá chất lượng hồ sơ thầu bằng điểm tối ưu hóa (`optimization.lastScore` từ 0 - 100) và đưa ra các chỉ dẫn sửa đổi:
    * `-20 điểm`: Đề xuất quá ngắn (<180 ký tự).
    * `-25 điểm`: Mức giá thầu vượt quá ngân sách khách hàng đề ra.
    * `-15 điểm`: Không liệt kê danh sách sản phẩm bàn giao cam kết (`deliverables`).
    * `-10 điểm`: Thời gian bàn giao không rõ ràng (không chứa ký tự số).

---

## 💳 6. Thanh Toán Ký Quỹ & Ví Tài Chính (Escrow & Finance)
* **Ký quỹ giao dịch (Escrow)**: Khách hàng thanh toán qua liên kết thanh toán của PayOS. Tiền thanh toán sẽ được hệ thống tạm giữ trong tài khoản ví của nhiếp ảnh gia ở mục Số dư đóng băng (`holdBalance`).
* **Giải phóng tiền (Payout Release)**: Chỉ khi nhiếp ảnh gia hoàn thành buổi chụp và upload Album ảnh bàn giao thành công, tiền mới chuyển từ `holdBalance` sang số dư khả dụng (`balance`) để rút tiền về ngân hàng.

---

## 💬 7. Đồng Bộ Thời Gian Thực (Socket.io)
Hệ thống sử dụng các phòng (Rooms) và sự kiện (Events) để thông báo tức thời giữa khách hàng và nhiếp ảnh gia:
* **Phòng nhiếp ảnh gia (`user:${photographerUserId}`)**: Nhận sự kiện `new-booking-request` khi có đơn đặt lịch mới, hoặc `booking-paid` khi khách hoàn tất thanh toán.
* **Phòng khách hàng (`user:${customerUserId}`)**: Nhận sự kiện `booking-status-updated` khi nhiếp ảnh gia phản hồi chấp nhận (`accepted`), từ chối (`rejected`), hoặc khi hoàn thành album (`completed`).

---

## 🛡️ 8. Phân Hệ Quản Trị Hệ Thống (Admin Panel)
* **Quản trị Người dùng**: Khóa hoặc mở khóa tài khoản vi phạm.
* **Kiểm duyệt danh tính (Verifications)**: Xem xét giấy tờ cá nhân, bằng cấp chuyên môn của nhiếp ảnh gia để cấp trạng thái `VERIFIED`.
* **Quản lý Tài chính**: Điều chỉnh tỷ lệ chiết khấu hệ thống (`COMMISSION_RATE`), kiểm duyệt và xử lý các yêu cầu rút tiền (`WithdrawRequest`).
* **Trọng tài tranh chấp (Disputes)**: Giải quyết các khiếu nại giữa khách hàng và nhiếp ảnh gia khi sản phẩm bàn giao không đúng cam kết.
