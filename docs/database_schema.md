# Lược Đồ Cơ Sở Dữ Liệu MongoDB (Database Schema)

Hệ thống PhotoHub sử dụng cơ sở dữ liệu **MongoDB** (thông qua **Mongoose ODM** ở Backend). Dưới đây là lược đồ dữ liệu chi tiết của toàn bộ các collection đang vận hành trong dự án.

---

## 👥 1. Các Thực Thể Người Dùng (Users, Customers, Photographers)

### 1.1. Collection: `users`
Định danh tài khoản đăng nhập chung cho mọi đối tượng.
*   `UUID` (String, Duy nhất): ID chuỗi định danh duy nhất (sinh từ ObjectId).
*   `email` (String, Bắt buộc, Duy nhất): Email đăng nhập.
*   `password` (String, Cho phép rỗng): Mật khẩu băm (sẽ null đối với tài khoản liên kết Google).
*   `role` (String, Enum): Quyền hạn tài khoản (`admin`, `manager`, `staff`, `customer`, `photographer`). Mặc định: `customer`.
*   `fullName` (String): Họ và tên đầy đủ.
*   `phoneNumber` (String, Duy nhất, Cho phép rỗng): Số điện thoại.
*   `isBlocked` (Boolean, Mặc định: `false`): Khóa tài khoản.
*   `isVerified` (Boolean, Mặc định: `false`): Trạng thái xác thực email.
*   `googleId` (String, Duy nhất, Cho phép rỗng): Định danh Google OAuth2.
*   `avatar` (String): URL ảnh đại diện.
*   `authProvider` (String, Enum): Phương thức đăng nhập (`local`, `google`).
*   `dateOfBirth` (Date): Ngày sinh.
*   `gender` (String, Enum): Giới tính (`male`, `female`, `other`).
*   `address` (String): Địa chỉ liên lạc.
*   `branch` (ObjectId, Tham chiếu: `CinemaBranch`): Ghi chú chi nhánh rạp (Dữ liệu cũ thời Cinema Management).

### 1.2. Collection: `photographers`
Hồ sơ tác nghiệp của nhiếp ảnh gia.
*   `user` (ObjectId, Tham chiếu: `User`, Bắt buộc, Duy nhất): Khóa ngoại liên kết tài khoản.
*   `displayName` (String, Bắt buộc): Tên nghệ danh / thương hiệu.
*   `location` (String): Vùng/Tỉnh hoạt động chính.
*   `experienceYears` (Number, Mặc định: `0`): Kinh nghiệm tác nghiệp.
*   `equipment` (String): Thiết bị camera, ống kính sử dụng.
*   `bio` (String): Thông tin giới thiệu ngắn.
*   `socialLinks` (Sub-document): Liên kết mạng xã hội (`facebook`, `instagram`, `website`).
*   `averageRating` (Number, Mặc định: `0`): Điểm đánh giá trung bình.
*   `completedBookings` (Number, Mặc định: `0`): Số đơn đặt lịch đã hoàn thành.
*   `totalReviews` (Number, Mặc định: `0`): Số lượt đánh giá.
*   `totalEarnings` (Number, Mặc định: `0`): Doanh thu tích lũy.
*   `hourlyRate` (Number, Mặc định: `0`): Giá chụp theo giờ (dùng để ước lượng giá đề xuất thầu).
*   `verificationStatus` (String, Enum): Trạng thái kiểm duyệt hồ sơ của Admin (`PENDING`, `VERIFIED`, `REJECTED`).
*   `isFeatured` (Boolean, Mặc định: `false`): Đánh dấu nhiếp ảnh gia tiêu biểu.
*   `isAvailable` (Boolean, Mặc định: `true`): Trạng thái sẵn sàng nhận lịch.

### 1.3. Collection: `customers`
Hồ sơ sở thích của khách hàng.
*   `user` (ObjectId, Tham chiếu: `User`, Bắt buộc, Duy nhất): Khóa ngoại liên kết tài khoản.
*   `preferredStyles` (Mảng String): Phong cách chụp mong muốn.
*   `preferredLocation` (String): Địa bàn hoạt động ưa thích.
*   `totalBookings` (Number, Mặc định: `0`): Số lượt đặt lịch.
*   `completedBookings` (Number, Mặc định: `0`): Lịch chụp hoàn thành thành công.
*   `canceledBookings` (Number, Mặc định: `0`): Lịch chụp bị hủy.
*   `totalSpent` (Number, Mặc định: `0`): Tổng tiền đã thanh toán.

---

## 📅 2. Quản Lý Đặt Lịch & Ký Quỹ Giao Dịch

### 2.1. Collection: `bookings`
Hợp đồng lịch hẹn chụp ảnh và trạng thái bàn giao sản phẩm.
*   `customer` (ObjectId, Tham chiếu: `User`, Bắt buộc): Người đặt lịch.
*   `photographer` (ObjectId, Tham chiếu: `Photographer`, Bắt buộc): Người thực hiện.
*   `package` (ObjectId, Tham chiếu: `PhotographerPackage`, Cho phép null): Gói chụp mặc định được áp dụng.
*   `title` (String, Bắt buộc): Tiêu đề buổi chụp.
*   `note` (String): Ghi chú bối cảnh từ khách hàng.
*   `start` (Date, Bắt buộc): Thời gian bắt đầu.
*   `end` (Date, Bắt buộc): Thời gian kết thúc.
*   `location` (String, Bắt buộc): Địa chỉ bối cảnh chụp.
*   `price` (Number, Bắt buộc): Giá trị hợp đồng thanh toán.
*   `status` (String, Enum): Trạng thái buổi hẹn (`pending`, `accepted`, `confirmed`, `completed`, `rejected`, `cancelled`).
*   `paymentStatus` (String, Enum): Trạng thái dòng tiền (`unpaid`, `pending`, `paid`, `refunded`, `cancelled`, `expired`).
*   `payosOrderCode` (Number, Duy nhất, Cho phép rỗng): Mã đơn hàng PayOS.
*   `paymentLinkId` (String): ID liên kết giao dịch PayOS.
*   `paymentLink` (String): URL mã QR thanh toán PayOS.
*   `paidAmount` (Number, Mặc định: `0`): Số tiền đã trả.
*   `paidAt` (Date): Ngày giờ thanh toán thành công.
*   `finalAlbum` (ObjectId, Tham chiếu: `Album`): Album ảnh sản phẩm hoàn chỉnh.
*   `completionStatus` (String, Enum): Tiến độ bàn giao (`pending`, `album_uploaded`, `completed`).
*   `deliveryDeadline` (Date): Hạn chót giao ảnh (mặc định bằng thời điểm kết thúc buổi chụp cộng 7 ngày).
*   `completedAt` (Date): Ngày hoàn thành.
*   `payoutEligibleAt` (Date): Ngày đủ điều kiện giải ngân tiền ví.
*   `isReviewed` (Boolean, Mặc định: `false`): Trạng thái đã gửi đánh giá.

### 2.2. Collection: `wallets`
Ví tài chính nội bộ của Nhiếp ảnh gia.
*   `user` (ObjectId, Tham chiếu: `User`, Bắt buộc, Duy nhất): Chủ ví.
*   `balance` (Number, Mặc định: `0`): Số dư khả dụng (có thể rút tiền về ngân hàng).
*   `holdBalance` (Number, Mặc định: `0`): Số dư ký quỹ đang bị tạm khóa (chờ hoàn thành buổi chụp và bàn giao album).
*   `currency` (String, Mặc định: `VND`).

---

## 💼 3. Đấu Thầu & Tuyển Dụng Dự Án (Bidding Module)

### 3.1. Collection: `jobposts`
Bảng tuyển dụng dự án chụp ảnh của khách hàng.
*   `customer` (ObjectId, Tham chiếu: `User`, Bắt buộc): Người đăng tin tuyển.
*   `title` (String, Bắt buộc): Tên tin tuyển dụng.
*   `description` (String, Bắt buộc): Chi tiết yêu cầu.
*   `location` (String, Bắt buộc): Địa bàn buổi chụp.
*   `budget` (Number, Bắt buộc): Ngân sách tối đa của khách hàng.
*   `style` (String, Bắt buộc): Phong cách nghệ thuật yêu cầu.
*   `date` (Date, Bắt buộc): Ngày tác nghiệp dự kiến.
*   `status` (String, Enum): Trạng thái tin tuyển (`open`, `closed`, `completed`).
*   `referenceImages` (Mảng String): Ảnh mẫu làm bối cảnh tham khảo.

### 3.2. Collection: `bids`
Đề xuất hồ sơ thầu của nhiếp ảnh gia gửi cho khách hàng.
*   `jobPostId` (ObjectId, Tham chiếu: `JobPost`, Bắt buộc): Dự án tham gia thầu.
*   `photographerId` (ObjectId, Tham chiếu: `User`, Bắt buộc): Nhiếp ảnh gia gửi đề xuất.
*   `customerId` (ObjectId, Tham chiếu: `User`, Bắt buộc): Người tạo dự án.
*   `proposal` (String, Bắt buộc): Thư giới thiệu năng lực.
*   `price` (Number, Bắt buộc): Giá thầu đề xuất.
*   `estimatedTime` (String, Bắt buộc): Thời gian hoàn tất (ví dụ: '3 ngày').
*   `packageName` (String): Tên gói dịch vụ tự đặt.
*   `deliverables` (Mảng String): Đầu ra sản phẩm bàn giao (Ví dụ: 30 ảnh gốc, 10 ảnh chỉnh sửa chuyên sâu).
*   `status` (String, Enum): Trạng thái thầu (`pending`, `accepted`, `rejected`).
*   `aiAssistance` (Sub-document): Ghi nhận lịch sử định giá của trợ lý AI:
    *   `used` (Boolean): Có sử dụng thư đề xuất và giá do AI tính hay không.
    *   `suggestedPrice` (Number): Mức giá AI khuyến nghị.
    *   `suggestedEstimatedTime` (String): Thời gian AI khuyến nghị.
    *   `notes` (Mảng String): Ghi chú phân tích của AI.
*   `optimization` (Sub-document): Đánh giá thang điểm tối ưu hóa của thầu:
    *   `lastScore` (Number): Điểm thầu tối ưu hóa (từ 0 - 100).
    *   `suggestions` (Mảng String): Các chỉ dẫn tối ưu (Ví dụ: "Viết thêm đề xuất cụ thể", "Giảm giá thầu để khớp ngân sách").
    *   `optimizedAt` (Date): Thời điểm chạy tối ưu hóa.

---

## 🧠 4. Thư Viện Tác Phẩm & Vector AI (Portfolio & Embeddings)

### 4.1. Collection: `portfolio_albums`
*   `photographer` (ObjectId, Tham chiếu: `Photographer`, Bắt buộc): Tác giả.
*   `title` (String, Bắt buộc): Tên album.
*   `description` (String): Mô tả chi tiết.
*   `coverImageUrl` (String): URL ảnh bìa album.
*   `category` (ObjectId, Tham chiếu: `PackageCategory`): Danh mục.
*   `styleTags` (Mảng ObjectId, Tham chiếu: `StyleTag`): Thẻ phong cách.
*   `price_package` (Number, Bắt buộc): Giá gói tham chiếu.
*   `isPublic` (Boolean, Mặc định: `true`): Công khai.

### 4.2. Collection: `portfolio_images`
*   `album` (ObjectId, Tham chiếu: `PortfolioAlbum`, Bắt buộc): Album chứa ảnh.
*   `photographer` (ObjectId, Tham chiếu: `Photographer`, Bắt buộc): Người chụp.
*   `image_url` (String, Bắt buộc): URL ảnh.
*   `caption` (String): Chú thích.
*   `embedding` (Mảng Number, Kích thước: `512`, Bắt buộc): **Vector nhúng 512 chiều** được tạo bởi mô hình CLIP Vision.
    *   *Chỉ mục đặc biệt*: `portfolio_image_vector_index` thiết lập trên Atlas Vector Search cho phép so khớp hình ảnh theo không gian Vector.
