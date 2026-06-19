const { User, UserRole } = require("../../auth/models/User");
const Photographer = require("../../photographers/models/Photographer");
const Customer = require("../../customers/models/customer");
const AdminAction = require("../models/AdminAction");
const PhotographerVerification = require("../models/PhotographerVerification");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Commission = require("../models/Commission");
const SystemSetting = require("../models/SystemSetting");
const Wallet = require("../models/Wallet");
const WithdrawRequest = require("../models/WithdrawRequest");
const Report = require("../models/Report");
const Dispute = require("../models/Dispute");
const ChatMessage = require("../models/ChatMessage");
const FeaturedPackage = require("../models/FeaturedPackage");
const Notification = require("../models/Notification");

const logAdminAction = require("../utils/adminActionLogger");
const ApiResponse = require("../../../utils/ApiResponse");
const { sendApprovalEmail, sendRejectionEmail } = require("../../../utils/emailService");

const COMMISSION_RATE = Number(process.env.PHOTOGRAPHER_COMMISSION_RATE || 0.1);
const getBookingAmount = (booking) => Number(booking?.totalPrice || booking?.price || booking?.depositAmount || 0);

const ensureWallet = async (userId) =>
  Wallet.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, balance: 0, holdBalance: 0, currency: "VND" } },
    { new: true, upsert: true }
  );

const addStatusLog = (booking, status, note) => {
  booking.statusLogs = booking.statusLogs || [];
  booking.statusLogs.push({ status, note, updatedAt: new Date() });
};

const resolvePhotographerUserId = async (photographerRef) => {
  const photographer = await Photographer.findOne({
    $or: [{ _id: photographerRef }, { user: photographerRef }],
  }).select("user");

  return photographer?.user || photographerRef;
};

class AdminController {

  // ================= 1. AUTH & ROLE MIDDLEWARE CHECK =================
  // Đã được xử lý ở verifyAdmin middleware.

  // ================= 2. MANAGE USERS =================

  // GET /api/admin/users - Xem danh sách user kèm phân trang, tìm kiếm, lọc
  async getUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const { role, status, search } = req.query;
      const query = {};

      // Lọc theo role (lowercase theo DB)
      if (role) {
        query.role = role.toLowerCase();
      }

      // Lọc theo status
      if (status) {
        if (status === "LOCKED") {
          query.isBlocked = true;
          query.isDeleted = { $ne: true };
        } else if (status === "ACTIVE") {
          query.isBlocked = false;
          query.isVerified = true;
          query.isDeleted = { $ne: true };
        } else if (status === "PENDING") {
          query.isVerified = false;
          query.isDeleted = { $ne: true };
        } else if (status === "DELETED") {
          query.isDeleted = true;
        }
      } else {
        // Mặc định không hiển thị user đã bị xóa trừ khi yêu cầu rõ
        query.isDeleted = { $ne: true };
      }

      // Tìm kiếm theo email, fullName, phone
      if (search) {
        const searchRegex = new RegExp(search, "i");
        query.$or = [
          { email: searchRegex },
          { fullName: searchRegex },
          { phoneNumber: searchRegex }
        ];
      }

      const users = await User.find(query)
        .select("-password -passwordPlainForAdmin")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(query);

      return ApiResponse.success(res, {
        users,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }, "Lấy danh sách người dùng thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // GET /api/admin/users/:id - Chi tiết user
  async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id).select("-password -passwordPlainForAdmin");
      if (!user) {
        return ApiResponse.error(res, "Không tìm thấy người dùng", 404);
      }

      // Lấy thêm thông tin profile tương ứng nếu có
      let profile = null;
      if (user.role === "photographer") {
        profile = await Photographer.findOne({ user: user._id });
      } else if (user.role === "customer") {
        profile = await Customer.findOne({ user: user._id });
      }

      return ApiResponse.success(res, { user, profile }, "Lấy chi tiết người dùng thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // PATCH /api/admin/users/:id/status - Khóa/mở tài khoản user
  async updateUserStatus(req, res) {
    try {
      const { isBlocked } = req.body;
      if (typeof isBlocked !== "boolean") {
        return ApiResponse.error(res, "Trường isBlocked (boolean) là bắt buộc", 400);
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return ApiResponse.error(res, "Không tìm thấy người dùng", 404);
      }

      user.isBlocked = isBlocked;
      await user.save();

      // Ghi log hoạt động
      const actionType = isBlocked ? "LOCK_USER" : "UNLOCK_USER";
      await logAdminAction(
        req.user.id,
        actionType,
        "User",
        user._id,
        { email: user.email, fullName: user.fullName },
        req
      );

      return ApiResponse.success(
        res,
        { userId: user._id, isBlocked: user.isBlocked },
        isBlocked ? "Đã khóa tài khoản thành công" : "Đã mở khóa tài khoản thành công"
      );
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // DELETE /api/admin/users/:id - Soft delete user
  async deleteUser(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return ApiResponse.error(res, "Không tìm thấy người dùng", 404);
      }

      // Soft delete bằng cách set flag isDeleted và khóa luôn tài khoản
      user.isDeleted = true;
      user.isBlocked = true;
      await user.save();

      // Ghi log
      await logAdminAction(
        req.user.id,
        "DELETE_USER",
        "User",
        user._id,
        { email: user.email, fullName: user.fullName },
        req
      );

      return ApiResponse.success(res, { userId: user._id }, "Đã xóa mềm tài khoản thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= 3. VERIFY PHOTOGRAPHER =================

  // GET /api/admin/photographer-verifications - Danh sách yêu cầu xác minh
  async getPhotographerVerifications(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const { verificationStatus } = req.query;

      const query = {};

      if (verificationStatus) {
        query.verificationStatus = verificationStatus;
      }

      const photographers = await Photographer.find(query)
        .populate("user", "fullName email avatar phoneNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const photographerIds = photographers.map(
        (p) => p._id
      );

      const verifications =
        await PhotographerVerification.find({
          photographer: { $in: photographerIds },
        });

      const result = photographers.map((photographer) => {
        const verification = verifications.find(
          (v) =>
            v.photographer.toString() ===
            photographer._id.toString()
        );

        return {
          ...photographer.toObject(),
          verification: verification || null,
        };
      });

      const total = await Photographer.countDocuments(query);

      return ApiResponse.success(
        res,
        {
          photographers: result,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        },
        "Lấy danh sách photographer thành công"
      );
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // GET /api/admin/photographer-verifications/:id - Chi tiết xác minh
  async getPhotographerVerificationById(req, res) {
    try {
      const verification = await PhotographerVerification.findById(req.params.id)
        .populate("user", "fullName email avatar phoneNumber")
        .populate("photographer")
        .populate("PhotographerVerification");

      if (!verification) {
        return ApiResponse.error(res, "Không tìm thấy yêu cầu xác minh", 404);
      }

      return ApiResponse.success(res, verification, "Lấy chi tiết yêu cầu xác minh thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // PATCH /api/admin/photographer-verifications/:id/approve - Duyệt photographer
  async approvePhotographerVerification(req, res) {
    try {
      const { adminNote } = req.body;
      const verification = await PhotographerVerification.findById(req.params.id).populate("user");

      if (!verification) {
        return ApiResponse.error(res, "Không tìm thấy yêu cầu xác minh", 404);
      }

      if (verification.status !== "PENDING") {
        return ApiResponse.error(res, "Yêu cầu này đã được xử lý từ trước", 400);
      }

      // Cập nhật trạng thái xác minh
      verification.status = "VERIFIED";
      verification.reviewedBy = req.user.id;
      verification.reviewedAt = new Date();
      verification.adminNote = adminNote || "Hồ sơ hợp lệ";
      await verification.save();

      // Cập nhật profile photographer
      const photographer = await Photographer.findById(verification.photographer);
      if (photographer) {
        photographer.verificationStatus = "VERIFIED";
        await photographer.save();
      }

      // Tạo thông báo hệ thống gửi photographer
      await Notification.create({
        recipientType: "SPECIFIC",
        recipient: verification.user ? verification.user._id : null,
        title: "Hồ sơ Nhiếp ảnh gia đã được duyệt!",
        message: `Chúc mừng bạn! Hồ sơ đăng ký hoạt động nhiếp ảnh gia của bạn đã được Admin phê duyệt. Ghi chú: ${verification.adminNote}`,
        type: "VERIFICATION"
      });

      // Gửi email thông báo
      if (verification.user && verification.user.email) {
        sendApprovalEmail(verification.user.email, verification.user.fullName, verification.adminNote)
          .catch((err) => console.error("Lỗi gửi email duyệt:", err.message));
      }

      // Tạo ví Wallet cho photographer nếu chưa có
      const existingWallet = await Wallet.findOne({ user: verification.user ? verification.user._id : null });
      if (!existingWallet) {
        await Wallet.create({
          user: verification.user ? verification.user._id : null,
          balance: 0,
          holdBalance: 0
        });
      }

      // Ghi log
      await logAdminAction(
        req.user.id,
        "APPROVE_PHOTOGRAPHER",
        "PhotographerVerification",
        verification._id,
        { photographerId: verification.photographer, adminNote },
        req
      );

      return ApiResponse.success(res, verification, "Phê duyệt hồ sơ nhiếp ảnh gia thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // PATCH /api/admin/photographer-verifications/:id/reject - Từ chối photographer
  async rejectPhotographerVerification(req, res) {
    try {
      const { adminNote } = req.body;
      if (!adminNote) {
        return ApiResponse.error(res, "Cần nhập lý do từ chối (adminNote)", 400);
      }

      const verification = await PhotographerVerification.findById(req.params.id).populate("user");
      if (!verification) {
        return ApiResponse.error(res, "Không tìm thấy yêu cầu xác minh", 404);
      }

      if (verification.status !== "PENDING") {
        return ApiResponse.error(res, "Yêu cầu này đã được xử lý từ trước", 400);
      }

      // Cập nhật trạng thái từ chối
      verification.status = "REJECTED";
      verification.reviewedBy = req.user.id;
      verification.reviewedAt = new Date();
      verification.adminNote = adminNote;
      await verification.save();

      // Cập nhật profile photographer
      const photographer = await Photographer.findById(verification.photographer);
      if (photographer) {
        photographer.verificationStatus = "REJECTED";
        await photographer.save();
      }

      // Gửi thông báo từ chối
      await Notification.create({
        recipientType: "SPECIFIC",
        recipient: verification.user ? verification.user._id : null,
        title: "Yêu cầu xác minh nhiếp ảnh gia bị từ chối",
        message: `Rất tiếc, hồ sơ đăng ký của bạn không được phê duyệt. Lý do: ${adminNote}. Vui lòng cập nhật hồ sơ và gửi lại yêu cầu.`,
        type: "VERIFICATION"
      });

      // Gửi email thông báo
      if (verification.user && verification.user.email) {
        sendRejectionEmail(verification.user.email, verification.user.fullName, verification.adminNote)
          .catch((err) => console.error("Lỗi gửi email từ chối:", err.message));
      }

      // Ghi log
      await logAdminAction(
        req.user.id,
        "REJECT_PHOTOGRAPHER",
        "PhotographerVerification",
        verification._id,
        { photographerId: verification.photographer, adminNote },
        req
      );

      return ApiResponse.success(res, verification, "Từ chối hồ sơ nhiếp ảnh gia thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= 4. MANAGE BOOKINGS =================

  // GET /api/admin/bookings - Xem toàn bộ booking
  async getBookings(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const { status, customerId, photographerId } = req.query;

      const query = {};
      if (status) query.status = status;
      if (customerId) query.customer = customerId;
      if (photographerId) query.photographer = photographerId;

      const bookings = await Booking.find(query)
        .populate("customer", "fullName email avatar phoneNumber")
        .populate({
          path: "photographer",
          populate: { path: "user", select: "fullName email avatar" }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Booking.countDocuments(query);

      return ApiResponse.success(res, {
        bookings,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }, "Lấy danh sách lịch đặt thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // GET /api/admin/bookings/:id - Chi tiết booking, payment, dispute liên quan
  async getBookingById(req, res) {
    try {
      const booking = await Booking.findById(req.params.id)
        .populate("customer", "fullName email avatar phoneNumber")
        .populate({
          path: "photographer",
          populate: { path: "user", select: "fullName email avatar" }
        });

      if (!booking) {
        return ApiResponse.error(res, "Không tìm thấy lịch đặt", 404);
      }

      // Lấy lịch sử payment và tranh chấp liên quan
      const payments = await Payment.find({ booking: booking._id });
      const dispute = await Dispute.findOne({ booking: booking._id })
        .populate("resolvedBy", "fullName email");

      return ApiResponse.success(res, {
        booking,
        payments,
        dispute
      }, "Lấy chi tiết lịch đặt thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // PATCH /api/admin/bookings/:id/status - Cập nhật trạng thái đặc biệt
  async updateBookingStatus(req, res) {
    try {
      const { status, note } = req.body;
      if (!status) {
        return ApiResponse.error(res, "Trạng thái status là bắt buộc", 400);
      }

      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return ApiResponse.error(res, "Không tìm thấy lịch đặt", 404);
      }

      // Lưu log thay đổi trạng thái
      booking.statusLogs.push({
        status,
        note: note || "Admin cập nhật trạng thái khẩn cấp",
        updatedAt: new Date()
      });
      booking.status = status;
      await booking.save();

      // Ghi log AdminAction
      await logAdminAction(
        req.user.id,
        "UPDATE_BOOKING_STATUS",
        "Booking",
        booking._id,
        { status, note },
        req
      );

      return ApiResponse.success(res, booking, "Cập nhật trạng thái lịch đặt thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= 5. MANAGE PAYMENTS & ESCROW =================

  // GET /api/admin/payments - Lịch sử giao dịch
  async getPayments(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const { paymentType, status } = req.query;

      const query = {};
      if (paymentType) query.paymentType = paymentType;
      if (status) query.status = status;

      const payments = await Payment.find(query)
        .populate("sender", "fullName email")
        .populate("receiver", "fullName email")
        .populate("booking", "totalPrice status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Payment.countDocuments(query);

      return ApiResponse.success(res, {
        payments,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }, "Lấy danh sách giao dịch thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // GET /api/admin/payments/:id - Chi tiết giao dịch
  async getPaymentById(req, res) {
    try {
      const payment = await Payment.findById(req.params.id)
        .populate("sender", "fullName email")
        .populate("receiver", "fullName email")
        .populate("booking");

      if (!payment) {
        return ApiResponse.error(res, "Không tìm thấy giao dịch", 404);
      }

      return ApiResponse.success(res, payment, "Lấy chi tiết giao dịch thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // PATCH /api/admin/payments/:id/confirm - Xác nhận thanh toán thủ công
  async confirmPayment(req, res) {
    try {
      const { adminNote } = req.body;
      const payment = await Payment.findById(req.params.id);

      if (!payment) {
        return ApiResponse.error(res, "Không tìm thấy giao dịch", 404);
      }

      if (payment.status !== "PENDING") {
        return ApiResponse.error(res, "Giao dịch không ở trạng thái PENDING", 400);
      }

      payment.status = "SUCCESS";
      payment.confirmedBy = req.user.id;
      payment.confirmedAt = new Date();
      payment.adminNote = adminNote || "Xác nhận thủ công bởi Admin";
      await payment.save();

      // Đồng bộ ví hoặc lịch đặt tương ứng nếu thanh toán cọc thành công
      if (false && payment.booking) {
        const booking = await Booking.findById(payment.booking);
        if (booking) {
          if (payment.paymentType === "DEPOSIT") {
            booking.status = "DEPOSIT_PAID";
            booking.statusLogs.push({
              status: "DEPOSIT_PAID",
              note: "Đặt cọc thành công qua cổng thanh toán (Xác nhận thủ công)",
              updatedAt: new Date()
            });
            await booking.save();

            // Cộng holdBalance ký quỹ vào ví của photographer tương ứng
            const photographer = await Photographer.findById(booking.photographer);
            if (photographer) {
              const wallet = await Wallet.findOne({ user: photographer.user });
              if (wallet) {
                wallet.holdBalance += payment.amount;
                await wallet.save();
              }
            }
          }
        }
      }

      if (payment.booking && (payment.paymentType === "DEPOSIT" || payment.paymentType === "FINAL")) {
        const booking = await Booking.findById(payment.booking);
        if (booking) {
          booking.status = "confirmed";
          booking.paymentStatus = "paid";
          booking.paidAmount = Math.max(Number(booking.paidAmount || 0), Number(payment.amount || getBookingAmount(booking)));
          booking.paidAt = booking.paidAt || new Date();
          addStatusLog(booking, "PAYMENT_PAID", "Admin confirmed payment and moved funds to photographer escrow");
          await booking.save();

          const photographerUserId = await resolvePhotographerUserId(booking.photographer);
          const wallet = await ensureWallet(photographerUserId);
          wallet.holdBalance = Number(wallet.holdBalance || 0) + Number(payment.amount || 0);
          await wallet.save();

          const commissionAmount = Math.round(Number(payment.amount || 0) * COMMISSION_RATE);
          if (commissionAmount > 0) {
            await Commission.findOneAndUpdate(
              { booking: booking._id },
              {
                $setOnInsert: {
                  booking: booking._id,
                  amount: commissionAmount,
                  rate: COMMISSION_RATE,
                  status: "PENDING",
                },
              },
              { upsert: true }
            );
          }
        }
      }

      // Ghi log AdminAction
      await logAdminAction(
        req.user.id,
        "CONFIRM_PAYMENT",
        "Payment",
        payment._id,
        { amount: payment.amount, paymentType: payment.paymentType, adminNote },
        req
      );

      return ApiResponse.success(res, payment, "Xác nhận thanh toán thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // PATCH /api/admin/payments/:id/refund - Xử lý refund thủ công
  async refundPayment(req, res) {
    try {
      const { adminNote, refundAmount } = req.body;
      const payment = await Payment.findById(req.params.id);

      if (!payment) {
        return ApiResponse.error(res, "Không tìm thấy giao dịch", 404);
      }

      if (payment.status !== "SUCCESS") {
        return ApiResponse.error(res, "Chỉ hoàn tiền các giao dịch đã SUCCESS", 400);
      }

      const amountToRefund = refundAmount || payment.amount;

      // Cập nhật giao dịch gốc sang trạng thái hoàn tiền hoặc ghi nhận
      payment.status = "REFUNDED";
      payment.adminNote = adminNote || "Hoàn tiền được phê duyệt bởi Admin";
      await payment.save();

      // Tạo giao dịch REFUND mới
      const refundTx = await Payment.create({
        booking: payment.booking,
        sender: payment.receiver, // Đổi chiều người gửi nhận
        receiver: payment.sender,
        amount: amountToRefund,
        paymentType: "REFUND",
        paymentMethod: "WALLET",
        status: "SUCCESS",
        confirmedBy: req.user.id,
        confirmedAt: new Date(),
        adminNote: `Hoàn trả từ giao dịch gốc ${payment._id}`
      });

      // Nếu có booking và ví tương ứng, trừ holdBalance hoặc trả ví Customer
      if (false && payment.booking) {
        const booking = await Booking.findById(payment.booking);
        if (booking) {
          booking.status = "CANCELLED";
          booking.statusLogs.push({
            status: "CANCELLED",
            note: `Lịch bị hủy & được hoàn lại số tiền ${amountToRefund} VND`,
            updatedAt: new Date()
          });
          await booking.save();

          // Trừ holdBalance của photographer
          const photographer = await Photographer.findById(booking.photographer);
          if (photographer) {
            const photoWallet = await Wallet.findOne({ user: photographer.user });
            if (photoWallet) {
              photoWallet.holdBalance = Math.max(0, photoWallet.holdBalance - amountToRefund);
              await photoWallet.save();
            }
          }

          // Trả tiền về ví của Customer
          const customerWallet = await Wallet.findOne({ user: booking.customer });
          if (customerWallet) {
            customerWallet.balance += amountToRefund;
            await customerWallet.save();
          }
        }
      }

      if (payment.booking) {
        const booking = await Booking.findById(payment.booking);
        if (booking) {
          booking.status = "cancelled";
          booking.paymentStatus = "refunded";
          addStatusLog(booking, "REFUNDED", `Refunded ${amountToRefund} VND to customer wallet`);
          await booking.save();

          const photographerUserId = await resolvePhotographerUserId(booking.photographer);
          const photoWallet = await ensureWallet(photographerUserId);
          const refundFromHold = Math.min(Number(photoWallet.holdBalance || 0), Number(amountToRefund));
          const refundRemainder = Number(amountToRefund) - refundFromHold;
          photoWallet.holdBalance = Math.max(0, Number(photoWallet.holdBalance || 0) - refundFromHold);
          photoWallet.balance = Math.max(0, Number(photoWallet.balance || 0) - refundRemainder);
          await photoWallet.save();

          const customerWallet = await ensureWallet(booking.customer);
          customerWallet.balance = Number(customerWallet.balance || 0) + Number(amountToRefund);
          await customerWallet.save();
        }
      }

      // Ghi log AdminAction
      await logAdminAction(
        req.user.id,
        "REFUND_PAYMENT",
        "Payment",
        payment._id,
        { refundAmount: amountToRefund, originalAmount: payment.amount, adminNote },
        req
      );

      return ApiResponse.success(res, { payment, refundTx }, "Hoàn tiền giao dịch thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= 6. MANAGE COMMISSION =================

  // GET /api/admin/commissions - Danh sách chiết khấu hoa hồng
  async getCommissions(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const commissions = await Commission.find()
        .populate({
          path: "booking",
          populate: [
            { path: "customer", select: "fullName email" },
            { path: "photographer", populate: { path: "user", select: "fullName" } }
          ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Commission.countDocuments();

      return ApiResponse.success(res, {
        commissions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }, "Lấy danh sách hoa hồng thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // GET /api/admin/commissions/summary - Thống kê tài chính
  async getCommissionSummary(req, res) {
    try {
      // Tính toán các tổng quan tài chính
      const payments = await Payment.find({ status: "SUCCESS" });
      const bookings = await Booking.find({ status: "COMPLETED" });
      const commissions = await Commission.find();

      let totalRevenue = 0; // tổng các giao dịch thành công
      payments.forEach(p => {
        if (p.paymentType === "DEPOSIT" || p.paymentType === "FINAL") {
          totalRevenue += p.amount;
        }
      });

      let totalCommission = 0;
      commissions.forEach(c => {
        totalCommission += c.amount;
      });

      let totalPhotographerPayout = 0;
      bookings.forEach(b => {
        totalPhotographerPayout += (b.photographerPayout || 0);
      });

      // Lấy commission rate cấu hình hiện tại
      let currentRateSetting = await SystemSetting.findOne({ key: "commissionRate" });
      const currentRate = currentRateSetting ? currentRateSetting.value : 0.10;

      return ApiResponse.success(res, {
        totalRevenue,
        totalCommission,
        totalPhotographerPayout,
        totalCompletedBookings: bookings.length,
        currentCommissionRate: currentRate
      }, "Lấy tóm tắt hoa hồng thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // PATCH /api/admin/commission-rate - Thay đổi tỷ lệ hoa hồng toàn sàn
  async updateCommissionRate(req, res) {
    try {
      const { commissionRate } = req.body;
      if (typeof commissionRate !== "number" || commissionRate < 0 || commissionRate > 1) {
        return ApiResponse.error(res, "commissionRate phải là số từ 0.0 đến 1.0 (ví dụ: 0.10 cho 10%)", 400);
      }

      let setting = await SystemSetting.findOne({ key: "commissionRate" });
      if (!setting) {
        setting = new SystemSetting({ key: "commissionRate", value: commissionRate });
      } else {
        setting.value = commissionRate;
      }
      await setting.save();

      // Ghi log AdminAction
      await logAdminAction(
        req.user.id,
        "UPDATE_COMMISSION_RATE",
        "SystemSetting",
        setting._id,
        { commissionRate },
        req
      );

      return ApiResponse.success(res, { commissionRate: setting.value }, "Cấu hình tỷ lệ hoa hồng mới thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= 7. RESOLVE DISPUTES =================

  // GET /api/admin/disputes - Danh sách tranh chấp
  async getDisputes(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const { status } = req.query;

      const query = {};
      if (status) query.status = status;

      const disputes = await Dispute.find(query)
        .populate("customer", "fullName email avatar")
        .populate({
          path: "photographer",
          populate: { path: "user", select: "fullName email" }
        })
        .populate("booking", "totalPrice bookingDate status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Dispute.countDocuments(query);

      return ApiResponse.success(res, {
        disputes,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }, "Lấy danh sách tranh chấp thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // GET /api/admin/disputes/:id - Chi tiết tranh chấp + bằng chứng + chat evidence
  async getDisputeById(req, res) {
    try {
      const dispute = await Dispute.findById(req.params.id)
        .populate("customer", "fullName email avatar phoneNumber")
        .populate({
          path: "photographer",
          populate: { path: "user", select: "fullName email avatar phoneNumber" }
        })
        .populate("booking")
        .populate("payment");

      if (!dispute) {
        return ApiResponse.error(res, "Không tìm thấy vụ tranh chấp", 404);
      }

      // Lấy lịch sử chat evidence giữa hai bên
      const chatMessages = await ChatMessage.find({
        $or: [
          { sender: dispute.customer, receiver: dispute.photographer?.user?._id },
          { sender: dispute.photographer?.user?._id, receiver: dispute.customer }
        ]
      }).sort({ createdAt: 1 }).limit(100);

      return ApiResponse.success(res, { dispute, chatMessages }, "Lấy chi tiết tranh chấp thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // PATCH /api/admin/disputes/:id/investigate - Đánh dấu đang điều tra
  async investigateDispute(req, res) {
    try {
      const dispute = await Dispute.findById(req.params.id);
      if (!dispute) {
        return ApiResponse.error(res, "Không tìm thấy tranh chấp", 404);
      }

      if (dispute.status !== "OPEN") {
        return ApiResponse.error(res, "Chỉ cập nhật trạng thái khi đang ở OPEN", 400);
      }

      dispute.status = "INVESTIGATING";
      await dispute.save();

      // Ghi log
      await logAdminAction(req.user.id, "INVESTIGATE_DISPUTE", "Dispute", dispute._id, {}, req);

      return ApiResponse.success(res, dispute, "Đã chuyển trạng thái tranh chấp sang ĐANG ĐIỀU TRA");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // PATCH /api/admin/disputes/:id/resolve - Đưa ra phán quyết và giải quyết tranh chấp
  async resolveDispute(req, res) {
    try {
      const { resolutionType, refundAmount, releaseAmount, resolutionNote } = req.body;

      if (!resolutionType || !["REFUND_FULL", "REFUND_PARTIAL", "RELEASE_PAYMENT"].includes(resolutionType)) {
        return ApiResponse.error(res, "resolutionType không hợp lệ (REFUND_FULL, REFUND_PARTIAL, RELEASE_PAYMENT)", 400);
      }
      if (!resolutionNote) {
        return ApiResponse.error(res, "Cần cung cấp ghi chú giải quyết (resolutionNote)", 400);
      }

      const dispute = await Dispute.findById(req.params.id)
        .populate("photographer");
      if (!dispute) {
        return ApiResponse.error(res, "Không tìm thấy tranh chấp", 404);
      }

      if (dispute.status === "RESOLVED" || dispute.status === "REJECTED") {
        return ApiResponse.error(res, "Tranh chấp này đã được đóng trước đó", 400);
      }

      const booking = await Booking.findById(dispute.booking);
      if (!booking) {
        return ApiResponse.error(res, "Không tìm thấy booking tương ứng", 404);
      }

      // Xử lý tiền ký quỹ (depositAmount)
      const escrowAmount = booking.depositAmount || 0;
      let finalRefund = 0;
      let finalRelease = 0;

      if (resolutionType === "REFUND_FULL") {
        finalRefund = escrowAmount;
        finalRelease = 0;
      } else if (resolutionType === "RELEASE_PAYMENT") {
        finalRefund = 0;
        finalRelease = escrowAmount;
      } else if (resolutionType === "REFUND_PARTIAL") {
        finalRefund = refundAmount || 0;
        finalRelease = releaseAmount || 0;
        if (finalRefund + finalRelease > escrowAmount) {
          return ApiResponse.error(res, `Tổng số tiền hoàn và giải ngân (${finalRefund + finalRelease}) không được vượt quá số tiền ký quỹ cọc (${escrowAmount})`, 400);
        }
      }

      // 1. Cập nhật Ví của Khách hàng (Nhận hoàn tiền nếu có)
      if (finalRefund > 0) {
        let customerWallet = await Wallet.findOne({ user: dispute.customer });
        if (!customerWallet) {
          customerWallet = await Wallet.create({ user: dispute.customer, balance: 0, holdBalance: 0 });
        }
        customerWallet.balance += finalRefund;
        await customerWallet.save();

        // Tạo giao dịch PAYMENT ghi nhận
        await Payment.create({
          booking: booking._id,
          sender: dispute.photographer?.user,
          receiver: dispute.customer,
          amount: finalRefund,
          paymentType: "REFUND",
          paymentMethod: "WALLET",
          status: "SUCCESS",
          confirmedBy: req.user.id,
          confirmedAt: new Date(),
          adminNote: `Hoàn tiền phán quyết tranh chấp: ${resolutionNote}`
        });
      }

      // 2. Cập nhật Ví của Photographer (Giải ngân phần còn lại nếu có)
      if (finalRelease > 0) {
        let photoWallet = await Wallet.findOne({ user: dispute.photographer?.user });
        if (!photoWallet) {
          photoWallet = await Wallet.create({ user: dispute.photographer?.user, balance: 0, holdBalance: 0 });
        }

        // Trừ hold balance và cộng vào balance khả dụng
        photoWallet.holdBalance = Math.max(0, photoWallet.holdBalance - escrowAmount);
        photoWallet.balance += finalRelease;
        await photoWallet.save();

        // Tạo giao dịch giải ngân
        await Payment.create({
          booking: booking._id,
          sender: dispute.customer,
          receiver: dispute.photographer?.user,
          amount: finalRelease,
          paymentType: "FINAL",
          paymentMethod: "WALLET",
          status: "SUCCESS",
          confirmedBy: req.user.id,
          confirmedAt: new Date(),
          adminNote: `Giải ngân phán quyết tranh chấp: ${resolutionNote}`
        });
      } else {
        // Nếu không giải ngân đồng nào cho photographer, chỉ trừ hold balance cọc đã giữ trước đó
        const photoWallet = await Wallet.findOne({ user: dispute.photographer?.user });
        if (photoWallet) {
          photoWallet.holdBalance = Math.max(0, photoWallet.holdBalance - escrowAmount);
          await photoWallet.save();
        }
      }

      // 3. Cập nhật trạng thái Booking
      booking.status = "CANCELLED";
      booking.statusLogs.push({
        status: "CANCELLED",
        note: `Tranh chấp được phân xử. Hoàn customer: ${finalRefund} VND | Giải ngân photographer: ${finalRelease} VND.`,
        updatedAt: new Date()
      });
      await booking.save();

      // 4. Cập nhật Dispute
      dispute.status = "RESOLVED";
      dispute.resolutionType = resolutionType;
      dispute.refundAmount = finalRefund;
      dispute.releaseAmount = finalRelease;
      dispute.resolutionNote = resolutionNote;
      dispute.resolvedBy = req.user.id;
      dispute.resolvedAt = new Date();
      await dispute.save();

      // 5. Gửi thông báo cho cả hai bên
      await Notification.create({
        recipientType: "SPECIFIC",
        recipient: dispute.customer,
        title: "Tranh chấp của bạn đã được Admin phân xử",
        message: `Admin đã kết luận tranh chấp về lịch chụp ngày ${booking.bookingDate.toLocaleDateString()}. Kết quả: Hoàn trả lại ${finalRefund} VND vào số dư ví của bạn. Ghi chú: ${resolutionNote}`,
        type: "SYSTEM"
      });

      await Notification.create({
        recipientType: "SPECIFIC",
        recipient: dispute.photographer?.user,
        title: "Tranh chấp Booking của bạn đã được giải quyết",
        message: `Kết quả phân xử tranh chấp: Giải ngân ${finalRelease} VND vào số dư khả dụng của bạn. Ghi chú: ${resolutionNote}`,
        type: "SYSTEM"
      });

      // Ghi log AdminAction
      await logAdminAction(
        req.user.id,
        "RESOLVE_DISPUTE",
        "Dispute",
        dispute._id,
        { resolutionType, refundAmount: finalRefund, releaseAmount: finalRelease, resolutionNote },
        req
      );

      return ApiResponse.success(res, dispute, "Giải quyết tranh chấp thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // PATCH /api/admin/disputes/:id/reject - Bác bỏ tranh chấp (đóng lại)
  async rejectDispute(req, res) {
    try {
      const { resolutionNote } = req.body;
      if (!resolutionNote) {
        return ApiResponse.error(res, "Cần nhập ghi chú lý do bác bỏ (resolutionNote)", 400);
      }

      const dispute = await Dispute.findById(req.params.id);
      if (!dispute) {
        return ApiResponse.error(res, "Không tìm thấy tranh chấp", 404);
      }

      dispute.status = "REJECTED";
      dispute.resolutionNote = resolutionNote;
      dispute.resolvedBy = req.user.id;
      dispute.resolvedAt = new Date();
      await dispute.save();

      // Ghi log
      await logAdminAction(req.user.id, "REJECT_DISPUTE", "Dispute", dispute._id, { resolutionNote }, req);

      return ApiResponse.success(res, dispute, "Bác bỏ khiếu nại tranh chấp thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= 8. MANAGE REPORTS =================

  // GET /api/admin/reports - Danh sách báo cáo vi phạm
  async getReports(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const { status } = req.query;

      const query = {};
      if (status) query.status = status;

      const reports = await Report.find(query)
        .populate("reporter", "fullName email")
        .populate("reportedUser", "fullName email isBlocked")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Report.countDocuments(query);

      return ApiResponse.success(res, {
        reports,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }, "Lấy danh sách báo cáo thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // GET /api/admin/reports/:id - Chi tiết báo cáo
  async getReportById(req, res) {
    try {
      const report = await Report.findById(req.params.id)
        .populate("reporter", "fullName email phoneNumber")
        .populate("reportedUser", "fullName email isBlocked address avatar");

      if (!report) {
        return ApiResponse.error(res, "Không tìm thấy báo cáo vi phạm", 404);
      }

      return ApiResponse.success(res, report, "Lấy chi tiết báo cáo vi phạm thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // PATCH /api/admin/reports/:id/resolve - Xử lý báo cáo
  async resolveReport(req, res) {
    try {
      const { resolution, blockUser } = req.body;
      if (!resolution) {
        return ApiResponse.error(res, "Nội dung cách giải quyết resolution là bắt buộc", 400);
      }

      const report = await Report.findById(req.params.id);
      if (!report) {
        return ApiResponse.error(res, "Không tìm thấy báo cáo", 404);
      }

      report.status = "RESOLVED";
      report.resolution = resolution;
      report.resolvedBy = req.user.id;
      report.resolvedAt = new Date();
      await report.save();

      // Khóa tài khoản bị báo cáo nếu vi phạm nghiêm trọng
      if (blockUser) {
        const user = await User.findById(report.reportedUser);
        if (user) {
          user.isBlocked = true;
          await user.save();

          await logAdminAction(
            req.user.id,
            "LOCK_USER",
            "User",
            user._id,
            { reason: `Bị khóa do báo cáo vi phạm: ${resolution}` },
            req
          );
        }
      }

      // Ghi log AdminAction
      await logAdminAction(
        req.user.id,
        "RESOLVE_REPORT",
        "Report",
        report._id,
        { resolution, blockUser },
        req
      );

      return ApiResponse.success(res, report, "Đã đánh dấu giải quyết báo cáo thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // PATCH /api/admin/reports/:id/reject - Từ chối báo cáo
  async rejectReport(req, res) {
    try {
      const { resolution } = req.body;
      const report = await Report.findById(req.params.id);
      if (!report) {
        return ApiResponse.error(res, "Không tìm thấy báo cáo", 404);
      }

      report.status = "REJECTED";
      report.resolution = resolution || "Bác bỏ báo cáo (không đủ bằng chứng vi phạm)";
      report.resolvedBy = req.user.id;
      report.resolvedAt = new Date();
      await report.save();

      // Ghi log AdminAction
      await logAdminAction(
        req.user.id,
        "REJECT_REPORT",
        "Report",
        report._id,
        { resolution: report.resolution },
        req
      );

      return ApiResponse.success(res, report, "Từ chối báo cáo thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= 9. MODERATE CHAT =================

  // GET /api/admin/chat-messages - Xem tin nhắn vi phạm
  async getChatMessages(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const { scamDetected } = req.query;

      const query = {};
      if (scamDetected !== undefined) {
        query.scamDetected = scamDetected === "true";
      } else {
        // Mặc định xem các tin nhắn bị nghi ngờ scam/vi phạm quy chế
        query.scamDetected = true;
      }

      const messages = await ChatMessage.find(query)
        .populate("sender", "fullName email role")
        .populate("receiver", "fullName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await ChatMessage.countDocuments(query);

      return ApiResponse.success(res, {
        messages,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }, "Lấy danh sách tin nhắn chat thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // PATCH /api/admin/chat-messages/:id/hide - Ẩn tin nhắn vi phạm
  async hideChatMessage(req, res) {
    try {
      const msg = await ChatMessage.findById(req.params.id);
      if (!msg) {
        return ApiResponse.error(res, "Không tìm thấy tin nhắn", 404);
      }

      msg.isHidden = true;
      await msg.save();

      // Ghi log AdminAction
      await logAdminAction(req.user.id, "HIDE_CHAT_MESSAGE", "ChatMessage", msg._id, { messageText: msg.message }, req);

      return ApiResponse.success(res, msg, "Đã ẩn tin nhắn vi phạm");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // PATCH /api/admin/chat-messages/:id/unhide - Hiện lại tin nhắn nếu đánh dấu nhầm
  async unhideChatMessage(req, res) {
    try {
      const msg = await ChatMessage.findById(req.params.id);
      if (!msg) {
        return ApiResponse.error(res, "Không tìm thấy tin nhắn", 404);
      }

      msg.isHidden = false;
      await msg.save();

      // Ghi log
      await logAdminAction(req.user.id, "UNHIDE_CHAT_MESSAGE", "ChatMessage", msg._id, { messageText: msg.message }, req);

      return ApiResponse.success(res, msg, "Đã mở khóa ẩn tin nhắn");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= 10. MANAGE FEATURED PACKAGES =================

  // GET /api/admin/featured-packages - Danh sách package
  async getFeaturedPackages(req, res) {
    try {
      const packages = await FeaturedPackage.find().sort({ price: 1 });
      return ApiResponse.success(res, packages, "Lấy danh sách gói quảng bá thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // POST /api/admin/featured-packages - Tạo mới package
  async createFeaturedPackage(req, res) {
    try {
      const { title, description, price, durationDays, isFeatured, startDate, endDate, status } = req.body;
      if (!title || !price || !durationDays) {
        return ApiResponse.error(res, "Các trường title, price, durationDays là bắt buộc", 400);
      }

      const newPackage = await FeaturedPackage.create({
        title,
        description,
        price,
        durationDays,
        isFeatured: isFeatured || false,
        startDate,
        endDate,
        status: status || "ACTIVE"
      });

      // Ghi log
      await logAdminAction(req.user.id, "CREATE_FEATURED_PACKAGE", "FeaturedPackage", newPackage._id, { title, price }, req);

      return ApiResponse.success(res, newPackage, "Tạo gói nổi bật thành công", 201);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // PATCH /api/admin/featured-packages/:id - Cập nhật package
  async updateFeaturedPackage(req, res) {
    try {
      const updatedPackage = await FeaturedPackage.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );

      if (!updatedPackage) {
        return ApiResponse.error(res, "Không tìm thấy gói nổi bật", 404);
      }

      // Ghi log
      await logAdminAction(
        req.user.id,
        "UPDATE_FEATURED_PACKAGE",
        "FeaturedPackage",
        updatedPackage._id,
        { title: updatedPackage.title },
        req
      );

      return ApiResponse.success(res, updatedPackage, "Cập nhật gói nổi bật thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // DELETE /api/admin/featured-packages/:id - Xóa package
  async deleteFeaturedPackage(req, res) {
    try {
      const deletedPackage = await FeaturedPackage.findByIdAndDelete(req.params.id);
      if (!deletedPackage) {
        return ApiResponse.error(res, "Không tìm thấy gói nổi bật", 404);
      }

      // Ghi log
      await logAdminAction(req.user.id, "DELETE_FEATURED_PACKAGE", "FeaturedPackage", deletedPackage._id, { title: deletedPackage.title }, req);

      return ApiResponse.success(res, { id: req.params.id }, "Xóa gói nổi bật thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= 11. SEND SYSTEM NOTIFICATIONS =================

  // POST /api/admin/notifications/send - Gửi thông báo hệ thống
  async sendSystemNotification(req, res) {
    try {
      const { recipientType, recipientId, title, message } = req.body;
      if (!recipientType || !title || !message) {
        return ApiResponse.error(res, "recipientType, title và message là bắt buộc", 400);
      }

      let notif;
      if (recipientType === "SPECIFIC") {
        if (!recipientId) {
          return ApiResponse.error(res, "recipientId là bắt buộc khi recipientType là SPECIFIC", 400);
        }
        notif = await Notification.create({
          recipientType,
          recipient: recipientId,
          title,
          message,
          type: "SYSTEM"
        });
      } else {
        // Gửi diện rộng ALL, CUSTOMER, PHOTOGRAPHER
        notif = await Notification.create({
          recipientType,
          title,
          message,
          type: "SYSTEM"
        });
      }

      // Ghi log AdminAction
      await logAdminAction(
        req.user.id,
        "SEND_NOTIFICATION",
        "Notification",
        notif._id,
        { recipientType, recipientId, title },
        req
      );

      return ApiResponse.success(res, notif, "Gửi thông báo hệ thống thành công", 201);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= 12. STATISTICS DASHBOARD =================

  // GET /api/admin/dashboard/statistics - Báo cáo tổng thể và biểu đồ
  async getDashboardStatistics(req, res) {
    try {
      const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });
      const totalCustomers = await User.countDocuments({ role: "customer", isDeleted: { $ne: true } });
      const totalPhotographers = await User.countDocuments({ role: "photographer", isDeleted: { $ne: true } });
      const totalVerifiedPhotographers = await Photographer.countDocuments({ verificationStatus: "VERIFIED" });

      const totalBookings = await Booking.countDocuments();
      const completedBookings = await Booking.countDocuments({ status: "COMPLETED" });
      const cancelledBookings = await Booking.countDocuments({ status: "CANCELLED" });
      const disputedBookings = await Booking.countDocuments({ status: "DISPUTED" });

      const pendingWithdrawRequests = await WithdrawRequest.countDocuments({ status: "PENDING" });

      // Tính tổng doanh thu & commission thu được
      const payments = await Payment.find({ status: "SUCCESS" });
      const commissions = await Commission.find();

      let totalRevenue = 0;
      payments.forEach(p => {
        if (p.paymentType === "DEPOSIT" || p.paymentType === "FINAL") {
          totalRevenue += p.amount;
        }
      });

      let totalCommission = 0;
      commissions.forEach(c => {
        totalCommission += c.amount;
      });

      // 1. Biểu đồ doanh thu theo tháng (monthlyRevenueChart)
      // Nhóm giao dịch thành công theo tháng
      const monthlyRevenueMap = {};
      payments.forEach(p => {
        if (p.paymentType === "DEPOSIT" || p.paymentType === "FINAL") {
          const date = new Date(p.createdAt);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          monthlyRevenueMap[monthKey] = (monthlyRevenueMap[monthKey] || 0) + p.amount;
        }
      });
      const monthlyRevenueChart = Object.keys(monthlyRevenueMap).map(key => ({
        month: key,
        revenue: monthlyRevenueMap[key]
      })).sort((a, b) => a.month.localeCompare(b.month));

      // 2. Biểu đồ trạng thái đặt lịch (bookingStatusChart)
      const bookingStatuses = ["PENDING", "ACCEPTED", "DEPOSIT_PAID", "IN_PROGRESS", "COMPLETED", "CANCELLED", "DISPUTED"];
      const bookingStatusChart = [];
      for (const status of bookingStatuses) {
        const count = await Booking.countDocuments({ status });
        bookingStatusChart.push({ status, count });
      }

      // 3. Top Nhiếp ảnh gia (topPhotographers) - Sắp xếp theo thu nhập hoặc số lịch hoàn thành
      const topPhotographers = await Photographer.find()
        .populate("user", "fullName email avatar")
        .sort({ completedBookings: -1, totalEarnings: -1 })
        .limit(5);

      return ApiResponse.success(res, {
        totalUsers,
        totalCustomers,
        totalPhotographers,
        totalVerifiedPhotographers,
        totalBookings,
        completedBookings,
        cancelledBookings,
        disputedBookings,
        totalRevenue,
        totalCommission,
        pendingWithdrawRequests,
        monthlyRevenueChart,
        bookingStatusChart,
        topPhotographers
      }, "Lấy số liệu thống kê Dashboard thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= 13. MANAGE WITHDRAW REQUESTS =================

  // GET /api/admin/withdraw-requests - Xem danh sách yêu cầu rút tiền
  async getWithdrawRequests(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const { status } = req.query;

      const query = {};
      if (status) query.status = status;

      const requests = await WithdrawRequest.find(query)
        .populate({
          path: "photographer",
          populate: { path: "user", select: "fullName email avatar" }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await WithdrawRequest.countDocuments(query);

      return ApiResponse.success(res, {
        requests,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }, "Lấy danh sách yêu cầu rút tiền thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // GET /api/admin/withdraw-requests/:id - Chi tiết yêu cầu rút tiền
  async getWithdrawRequestById(req, res) {
    try {
      const request = await WithdrawRequest.findById(req.params.id)
        .populate({
          path: "photographer",
          populate: { path: "user", select: "fullName email avatar phoneNumber" }
        })
        .populate("wallet");

      if (!request) {
        return ApiResponse.error(res, "Không tìm thấy yêu cầu rút tiền", 404);
      }

      return ApiResponse.success(res, request, "Lấy chi tiết yêu cầu rút tiền thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // PATCH /api/admin/withdraw-requests/:id/approve - Phê duyệt yêu cầu (Chờ chuyển khoản)
  async approveWithdrawRequest(req, res) {
    try {
      const { adminNote } = req.body;
      const request = await WithdrawRequest.findById(req.params.id)
        .populate("photographer");
      if (!request) {
        return ApiResponse.error(res, "Không tìm thấy yêu cầu rút tiền", 404);
      }

      if (request.status !== "PENDING") {
        return ApiResponse.error(res, "Yêu cầu đã được xử lý từ trước", 400);
      }

      request.status = "APPROVED";
      request.processedBy = req.user.id;
      request.processedAt = new Date();
      request.adminNote = adminNote || "Phê duyệt. Chờ thanh toán thủ công.";
      await request.save();

      // Gửi thông báo
      await Notification.create({
        recipientType: "SPECIFIC",
        recipient: request.photographer?.user,
        title: "Yêu cầu rút tiền được phê duyệt",
        message: `Yêu cầu rút số tiền ${request.amount} VND của bạn đã được phê duyệt. Hệ thống đang tiến hành chuyển khoản ngân hàng. Ghi chú: ${request.adminNote}`,
        type: "WALLET"
      });

      // Ghi log
      await logAdminAction(req.user.id, "APPROVE_WITHDRAW", "WithdrawRequest", request._id, { amount: request.amount }, req);

      return ApiResponse.success(res, request, "Đã phê duyệt yêu cầu rút tiền (Trạng thái APPROVED)");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // PATCH /api/admin/withdraw-requests/:id/reject - Từ chối yêu cầu rút tiền
  async rejectWithdrawRequest(req, res) {
    try {
      const { adminNote } = req.body;
      if (!adminNote) {
        return ApiResponse.error(res, "Lý do từ chối (adminNote) là bắt buộc", 400);
      }

      const request = await WithdrawRequest.findById(req.params.id)
        .populate("photographer");
      if (!request) {
        return ApiResponse.error(res, "Không tìm thấy yêu cầu rút tiền", 404);
      }

      if (request.status !== "PENDING" && request.status !== "APPROVED") {
        return ApiResponse.error(res, "Không thể từ chối yêu cầu đã thanh toán hoặc đã hủy", 400);
      }

      request.status = "REJECTED";
      request.processedBy = req.user.id;
      request.processedAt = new Date();
      request.adminNote = adminNote;
      await request.save();

      const wallet = (request.wallet && (await Wallet.findById(request.wallet))) ||
        (await Wallet.findOne({ user: request.photographer?.user || request.photographerId }));
      if (wallet) {
        const amount = Number(request.amount || 0);
        const releaseFromHold = Math.min(Number(wallet.holdBalance || 0), amount);
        wallet.holdBalance = Math.max(0, Number(wallet.holdBalance || 0) - releaseFromHold);
        wallet.balance = Number(wallet.balance || 0) + releaseFromHold;
        await wallet.save();
      }

      // Gửi thông báo từ chối
      await Notification.create({
        recipientType: "SPECIFIC",
        recipient: request.photographer?.user,
        title: "Yêu cầu rút tiền bị từ chối",
        message: `Yêu cầu rút số tiền ${request.amount} VND của bạn đã bị từ chối. Lý do: ${adminNote}`,
        type: "WALLET"
      });

      // Ghi log
      await logAdminAction(req.user.id, "REJECT_WITHDRAW", "WithdrawRequest", request._id, { amount: request.amount, adminNote }, req);

      return ApiResponse.success(res, request, "Từ chối yêu cầu rút tiền thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // PATCH /api/admin/withdraw-requests/:id/mark-paid - Xác nhận đã chuyển khoản (Trừ tiền ví)
  async markPaidWithdrawRequest(req, res) {
    try {
      const { adminNote } = req.body;
      const request = await WithdrawRequest.findById(req.params.id)
        .populate("photographer");
      if (!request) {
        return ApiResponse.error(res, "Không tìm thấy yêu cầu rút tiền", 404);
      }

      if (request.status !== "PENDING" && request.status !== "APPROVED") {
        return ApiResponse.error(res, "Yêu cầu phải ở trạng thái PENDING hoặc APPROVED", 400);
      }

      // Khấu trừ số tiền khả dụng từ Wallet của Photographer
      const wallet = (request.wallet && (await Wallet.findById(request.wallet))) ||
        (await Wallet.findOne({ user: request.photographer?.user || request.photographerId }));
      if (!wallet) {
        return ApiResponse.error(res, "Không tìm thấy ví tiền của nhiếp ảnh gia để trừ tiền", 404);
      }

      if ((Number(wallet.holdBalance || 0) + Number(wallet.balance || 0)) < Number(request.amount || 0)) {
        return ApiResponse.error(res, `Số dư ví không đủ để rút. Số dư hiện tại: ${wallet.balance} VND | Số tiền rút: ${request.amount} VND`, 400);
      }

      // Khấu trừ số dư
      const amount = Number(request.amount || 0);
      const amountFromHold = Math.min(Number(wallet.holdBalance || 0), amount);
      const amountFromBalance = amount - amountFromHold;
      wallet.holdBalance = Math.max(0, Number(wallet.holdBalance || 0) - amountFromHold);
      wallet.balance = Math.max(0, Number(wallet.balance || 0) - amountFromBalance);
      await wallet.save();

      const payoutAmount = request.finalAmount || request.amount;

      // Cập nhật trạng thái yêu cầu rút
      request.status = "PAID";
      request.processedBy = req.user.id;
      request.processedAt = new Date();
      request.adminNote = adminNote || "Đã chuyển khoản thành công & trừ số dư ví.";
      await request.save();

      // Tạo giao dịch rút tiền thành công (Payment WITHDRAW)
      await Payment.create({
        booking: null,
        sender: request.photographer?.user,
        receiver: null, // Rút ra ngoài ngân hàng
        amount: payoutAmount,
        paymentType: "WITHDRAW",
        paymentMethod: "WALLET",
        status: "SUCCESS",
        confirmedBy: req.user.id,
        confirmedAt: new Date(),
        adminNote: `Rút tiền về tài khoản ngân hàng ${request.bankName} - STK: ${request.bankAccountNumber}`
      });

      // Gửi thông báo
      await Notification.create({
        recipientType: "SPECIFIC",
        recipient: request.photographer?.user,
        title: "Yêu cầu rút tiền hoàn tất thành công",
        message: `Số tiền ${request.amount} VND đã được chuyển thành công tới tài khoản ngân hàng của bạn. Số dư ví khả dụng hiện tại: ${wallet.balance} VND.`,
        type: "WALLET"
      });

      // Ghi log AdminAction
      await logAdminAction(req.user.id, "PAY_WITHDRAW", "WithdrawRequest", request._id, { amount: request.amount, payoutAmount }, req);

      return ApiResponse.success(res, { request, wallet }, "Xác nhận đã chuyển khoản thành công và khấu trừ ví");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }
}

module.exports = new AdminController();
