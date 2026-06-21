const { User } = require("../../auth/models/User");
const Photographer = require("../../photographers/models/Photographer");
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
const Notification = require("../models/Notification");
const Campaign = require("../models/Campaign");

const logAdminAction = require("../utils/adminActionLogger");
const ApiResponse = require("../../../utils/ApiResponse");

class AdminExtensionController {
  // ================= UC86 — Marketplace Risk Dashboard =================
  async getRiskDashboard(req, res) {
    try {
      const now = new Date();
      
      // 1. Risky Users (Disputes > 3 OR Cancellations > 5)
      const users = await User.find({ role: "customer" });
      const riskyUsers = [];
      for (const u of users) {
        const disputesCount = await Dispute.countDocuments({ customer: u._id });
        const cancellationsCount = await Booking.countDocuments({ customer: u._id, status: "CANCELLED" });
        if (disputesCount > 3 || cancellationsCount > 5) {
          riskyUsers.push({
            user: { _id: u._id, fullName: u.fullName, email: u.email, avatar: u.avatar },
            disputesCount,
            cancellationsCount
          });
        }
      }

      // 2. Risky Photographers (Dispute Rate > 20% OR Completion Rate < 70%)
      const photographers = await Photographer.find().populate("user", "fullName email avatar");
      const riskyPhotographers = [];
      for (const ph of photographers) {
        const totalBookings = await Booking.countDocuments({ photographer: ph._id });
        if (totalBookings > 0) {
          const completedBookings = await Booking.countDocuments({ photographer: ph._id, status: "COMPLETED" });
          const disputesCount = await Dispute.countDocuments({ photographer: ph._id });
          const disputeRate = disputesCount / totalBookings;
          const completionRate = completedBookings / totalBookings;
          if (disputeRate > 0.20 || completionRate < 0.70) {
            riskyPhotographers.push({
              photographer: ph,
              totalBookings,
              completedBookings,
              disputesCount,
              disputeRate,
              completionRate
            });
          }
        }
      }

      // 3. Risky Bookings (Delayed Delivery OR Dispute Opened)
      const riskyBookings = await Booking.find({
        $or: [
          { status: "DISPUTED" },
          { deliveryDeadline: { $ne: null, $lt: now }, completedAt: null, status: { $nin: ["COMPLETED", "CANCELLED"] } },
          { completedAt: { $ne: null }, deliveryDeadline: { $ne: null }, $expr: { $gt: ["$completedAt", "$deliveryDeadline"] } }
        ]
      }).populate("customer", "fullName email").populate({ path: "photographer", populate: { path: "user", select: "fullName" } });

      // 4. Risky Payments (Refund/Refunded activity)
      const riskyPayments = await Payment.find({
        $or: [
          { paymentType: "REFUND" },
          { status: "REFUNDED" }
        ]
      }).populate("booking").populate("sender", "fullName email").populate("receiver", "fullName email");

      return ApiResponse.success(res, {
        riskyUsers,
        riskyPhotographers,
        riskyBookings,
        riskyPayments
      }, "Lấy dữ liệu Risk Dashboard thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= UC87 — Withdrawal Approval Workflow =================
  async getPendingWithdrawals(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const query = { status: "PENDING" };
      const requests = await WithdrawRequest.find(query)
        .populate({ path: "photographer", populate: { path: "user", select: "fullName email avatar" } })
        .populate("wallet")
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
      }, "Lấy danh sách yêu cầu rút tiền đang chờ duyệt thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async approveWithdrawal(req, res) {
    try {
      const { adminNote } = req.body;
      const request = await WithdrawRequest.findById(req.params.id).populate("photographer");
      if (!request) {
        return ApiResponse.error(res, "Không tìm thấy yêu cầu rút tiền", 404);
      }
      if (request.status !== "PENDING") {
        return ApiResponse.error(res, "Yêu cầu này đã được xử lý từ trước", 400);
      }

      // Validation 1: Wallet balance enough
      const wallet = await Wallet.findOne({ user: request.photographer?.user || request.photographerId });
      if (!wallet || wallet.balance < request.amount) {
        return ApiResponse.error(res, "Số dư ví không đủ để phê duyệt yêu cầu này", 400);
      }

      // Validation 2: No active disputes
      const activeDispute = await Dispute.findOne({
        photographer: request.photographer?._id,
        status: { $in: ["OPEN", "INVESTIGATING"] }
      });
      if (activeDispute) {
        return ApiResponse.error(res, "Không thể duyệt yêu cầu do nhiếp ảnh gia đang có tranh chấp hoạt động", 400);
      }

      // Validation 3: Bookings are completed
      if (request.eligibleBookingIds && request.eligibleBookingIds.length > 0) {
        const uncompletedBooking = await Booking.findOne({
          _id: { $in: request.eligibleBookingIds },
          status: { $ne: "COMPLETED" }
        });
        if (uncompletedBooking) {
          return ApiResponse.error(res, "Có lịch đặt liên quan chưa hoàn thành", 400);
        }
      }

      request.status = "APPROVED";
      request.processedBy = req.user.id;
      request.processedAt = new Date();
      request.adminNote = adminNote || "Phê duyệt thành công. Chờ thanh toán chuyển khoản.";
      await request.save();

      // Send System Notification
      await Notification.create({
        recipientType: "SPECIFIC",
        recipient: request.photographer?.user || request.photographerId,
        title: "Yêu cầu rút tiền được phê duyệt",
        message: `Yêu cầu rút số tiền ${request.amount} VND của bạn đã được phê duyệt. Hệ thống đang tiến hành chuyển khoản. Ghi chú: ${request.adminNote}`,
        type: "WALLET"
      });

      // Write log
      await logAdminAction(req.user.id, "APPROVE_WITHDRAW", "WithdrawRequest", request._id, { amount: request.amount }, req);

      return ApiResponse.success(res, request, "Đã phê duyệt yêu cầu rút tiền");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async rejectWithdrawal(req, res) {
    try {
      const { adminNote } = req.body;
      if (!adminNote) {
        return ApiResponse.error(res, "Cần cung cấp lý do từ chối (adminNote)", 400);
      }

      const request = await WithdrawRequest.findById(req.params.id).populate("photographer");
      if (!request) {
        return ApiResponse.error(res, "Không tìm thấy yêu cầu rút tiền", 404);
      }
      if (request.status !== "PENDING" && request.status !== "APPROVED") {
        return ApiResponse.error(res, "Không thể từ chối yêu cầu ở trạng thái hiện tại", 400);
      }

      request.status = "REJECTED";
      request.processedBy = req.user.id;
      request.processedAt = new Date();
      request.adminNote = adminNote;
      await request.save();

      // Send System Notification
      await Notification.create({
        recipientType: "SPECIFIC",
        recipient: request.photographer?.user || request.photographerId,
        title: "Yêu cầu rút tiền bị từ chối",
        message: `Yêu cầu rút số tiền ${request.amount} VND của bạn đã bị từ chối. Lý do: ${adminNote}`,
        type: "WALLET"
      });

      // Write log
      await logAdminAction(req.user.id, "REJECT_WITHDRAW", "WithdrawRequest", request._id, { amount: request.amount, adminNote }, req);

      return ApiResponse.success(res, request, "Đã từ chối yêu cầu rút tiền");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async markPaidWithdrawal(req, res) {
    try {
      const { adminNote } = req.body;
      const request = await WithdrawRequest.findById(req.params.id).populate("photographer");
      if (!request) {
        return ApiResponse.error(res, "Không tìm thấy yêu cầu rút tiền", 404);
      }
      if (request.status !== "PENDING" && request.status !== "APPROVED") {
        return ApiResponse.error(res, "Yêu cầu phải ở trạng thái PENDING hoặc APPROVED", 400);
      }

      const wallet = await Wallet.findOne({ user: request.photographer?.user || request.photographerId });
      if (!wallet || wallet.balance < request.amount) {
        return ApiResponse.error(res, "Số dư ví không đủ để thực hiện thanh toán", 400);
      }

      // Deduct wallet balance
      wallet.balance -= request.amount;
      await wallet.save();

      // Update request status
      request.status = "PAID";
      request.processedBy = req.user.id;
      request.processedAt = new Date();
      request.adminNote = adminNote || "Đã xác nhận thanh toán chuyển khoản thành công.";
      await request.save();

      // Create Payment WITHDRAW
      const payoutAmount = request.finalAmount || request.amount;
      await Payment.create({
        booking: null,
        sender: request.photographer?.user || request.photographerId,
        receiver: null,
        amount: payoutAmount,
        paymentType: "WITHDRAW",
        paymentMethod: "WALLET",
        status: "SUCCESS",
        confirmedBy: req.user.id,
        confirmedAt: new Date(),
        adminNote: `Chuyển khoản thành công rút tiền về: ${request.bankName} - STK: ${request.bankAccountNumber}`
      });

      // Send System Notification
      await Notification.create({
        recipientType: "SPECIFIC",
        recipient: request.photographer?.user || request.photographerId,
        title: "Yêu cầu rút tiền hoàn tất thành công",
        message: `Số tiền ${request.amount} VND đã được chuyển thành công tới tài khoản ngân hàng của bạn.`,
        type: "WALLET"
      });

      // Write log
      await logAdminAction(req.user.id, "PAY_WITHDRAW", "WithdrawRequest", request._id, { amount: request.amount, payoutAmount }, req);

      return ApiResponse.success(res, { request, wallet }, "Xác nhận chuyển tiền thành công và khấu trừ ví");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= UC88 — Refund & Partial Release Control =================
  async refundFullDispute(req, res) {
    try {
      const { resolutionNote } = req.body;
      if (!resolutionNote) {
        return ApiResponse.error(res, "Cần cung cấp ghi chú giải quyết (resolutionNote)", 400);
      }

      const dispute = await Dispute.findById(req.params.id).populate("photographer");
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

      const escrowAmount = booking.depositAmount || 0;

      // 1. Refund 100% to customer wallet
      let customerWallet = await Wallet.findOne({ user: dispute.customer });
      if (!customerWallet) {
        customerWallet = await Wallet.create({ user: dispute.customer, balance: 0, holdBalance: 0 });
      }
      customerWallet.balance += escrowAmount;
      await customerWallet.save();

      // Create REFUND Payment
      await Payment.create({
        booking: booking._id,
        sender: dispute.photographer?.user || dispute.photographerId,
        receiver: dispute.customer,
        amount: escrowAmount,
        paymentType: "REFUND",
        paymentMethod: "WALLET",
        status: "SUCCESS",
        confirmedBy: req.user.id,
        confirmedAt: new Date(),
        adminNote: `Hoàn tiền tranh chấp full 100%: ${resolutionNote}`
      });

      // 2. Clear photographer holdBalance
      const photoWallet = await Wallet.findOne({ user: dispute.photographer?.user || dispute.photographerId });
      if (photoWallet) {
        photoWallet.holdBalance = Math.max(0, photoWallet.holdBalance - escrowAmount);
        await photoWallet.save();
      }

      // 3. Update Booking
      booking.status = "CANCELLED";
      booking.paymentStatus = "refunded";
      booking.statusLogs.push({
        status: "CANCELLED",
        note: `Giải quyết tranh chấp: Hoàn trả 100% cọc (${escrowAmount} VND) cho Khách hàng.`,
        updatedAt: new Date()
      });
      await booking.save();

      // 4. Update Commission
      let commission = await Commission.findOne({ booking: booking._id });
      if (commission) {
        commission.amount = 0;
        commission.status = "COLLECTED";
        await commission.save();
      } else {
        await Commission.create({
          booking: booking._id,
          amount: 0,
          rate: booking.commissionRate || 0.1,
          status: "COLLECTED"
        });
      }

      // 5. Update Dispute
      dispute.status = "RESOLVED";
      dispute.resolutionType = "REFUND_FULL";
      dispute.refundAmount = escrowAmount;
      dispute.releaseAmount = 0;
      dispute.resolutionNote = resolutionNote;
      dispute.resolvedBy = req.user.id;
      dispute.resolvedAt = new Date();
      await dispute.save();

      // Send Notifications
      await Notification.create({
        recipientType: "SPECIFIC",
        recipient: dispute.customer,
        title: "Tranh chấp của bạn đã được hoàn tiền 100%",
        message: `Admin đã hoàn trả 100% số tiền cọc (${escrowAmount} VND) vào ví của bạn. Ghi chú: ${resolutionNote}`,
        type: "SYSTEM"
      });

      await Notification.create({
        recipientType: "SPECIFIC",
        recipient: dispute.photographer?.user || dispute.photographerId,
        title: "Khiếu nại tranh chấp đã được hoàn tiền cho Khách hàng",
        message: `Tranh chấp Booking của bạn đã được giải quyết. Hoàn trả 100% cọc cho khách hàng. Ghi chú: ${resolutionNote}`,
        type: "SYSTEM"
      });

      // Write Log
      await logAdminAction(req.user.id, "RESOLVE_DISPUTE", "Dispute", dispute._id, { resolutionType: "REFUND_FULL", refundAmount: escrowAmount, releaseAmount: 0, resolutionNote }, req);

      return ApiResponse.success(res, dispute, "Hoàn trả 100% tiền tranh chấp thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async refundPartialDispute(req, res) {
    try {
      const { refundPercent, resolutionNote } = req.body;
      if (refundPercent === undefined || refundPercent < 0 || refundPercent > 100) {
        return ApiResponse.error(res, "Phần trăm hoàn tiền refundPercent phải nằm trong khoảng 0 - 100", 400);
      }
      if (!resolutionNote) {
        return ApiResponse.error(res, "Cần cung cấp ghi chú giải quyết (resolutionNote)", 400);
      }

      const dispute = await Dispute.findById(req.params.id).populate("photographer");
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

      const escrowAmount = booking.depositAmount || 0;
      const finalRefund = escrowAmount * (refundPercent / 100);
      const finalRelease = escrowAmount - finalRefund;

      // 1. Refund portion to customer wallet
      if (finalRefund > 0) {
        let customerWallet = await Wallet.findOne({ user: dispute.customer });
        if (!customerWallet) {
          customerWallet = await Wallet.create({ user: dispute.customer, balance: 0, holdBalance: 0 });
        }
        customerWallet.balance += finalRefund;
        await customerWallet.save();

        await Payment.create({
          booking: booking._id,
          sender: dispute.photographer?.user || dispute.photographerId,
          receiver: dispute.customer,
          amount: finalRefund,
          paymentType: "REFUND",
          paymentMethod: "WALLET",
          status: "SUCCESS",
          confirmedBy: req.user.id,
          confirmedAt: new Date(),
          adminNote: `Hoàn tiền một phần tranh chấp (${refundPercent}%): ${resolutionNote}`
        });
      }

      // 2. Release rest to photographer wallet (minus commission)
      const photoWallet = await Wallet.findOne({ user: dispute.photographer?.user || dispute.photographerId });
      const commissionRate = booking.commissionRate || 0.1;
      const commissionAmt = finalRelease * commissionRate;
      const netRelease = finalRelease - commissionAmt;

      if (photoWallet) {
        photoWallet.holdBalance = Math.max(0, photoWallet.holdBalance - escrowAmount);
        if (netRelease > 0) {
          photoWallet.balance += netRelease;
        }
        await photoWallet.save();
      }

      if (netRelease > 0) {
        await Payment.create({
          booking: booking._id,
          sender: dispute.customer,
          receiver: dispute.photographer?.user || dispute.photographerId,
          amount: netRelease,
          paymentType: "FINAL",
          paymentMethod: "WALLET",
          status: "SUCCESS",
          confirmedBy: req.user.id,
          confirmedAt: new Date(),
          adminNote: `Giải ngân một phần tranh chấp: ${resolutionNote}`
        });
      }

      // 3. Update Booking
      booking.status = "CANCELLED";
      booking.paymentStatus = "paid";
      booking.statusLogs.push({
        status: "CANCELLED",
        note: `Giải quyết tranh chấp: Hoàn trả ${refundPercent}% (${finalRefund} VND) cho Khách hàng. Giải ngân còn lại (${finalRelease} VND) cho Nhiếp ảnh gia.`,
        updatedAt: new Date()
      });
      await booking.save();

      // 4. Update/Create Commission
      let commission = await Commission.findOne({ booking: booking._id });
      if (commission) {
        commission.amount = commissionAmt;
        commission.rate = commissionRate;
        commission.status = "COLLECTED";
        await commission.save();
      } else {
        await Commission.create({
          booking: booking._id,
          amount: commissionAmt,
          rate: commissionRate,
          status: "COLLECTED"
        });
      }

      // 5. Update Dispute
      dispute.status = "RESOLVED";
      dispute.resolutionType = "REFUND_PARTIAL";
      dispute.refundAmount = finalRefund;
      dispute.releaseAmount = finalRelease;
      dispute.resolutionNote = resolutionNote;
      dispute.resolvedBy = req.user.id;
      dispute.resolvedAt = new Date();
      await dispute.save();

      // Send Notifications
      await Notification.create({
        recipientType: "SPECIFIC",
        recipient: dispute.customer,
        title: "Tranh chấp của bạn đã được hoàn tiền một phần",
        message: `Admin đã hoàn trả một phần cọc (${finalRefund} VND) vào ví của bạn. Ghi chú: ${resolutionNote}`,
        type: "SYSTEM"
      });

      await Notification.create({
        recipientType: "SPECIFIC",
        recipient: dispute.photographer?.user || dispute.photographerId,
        title: "Khiếu nại tranh chấp được giải quyết một phần",
        message: `Giải ngân một phần tranh chấp. Nhận thực tế ${netRelease} VND (sau khấu trừ hoa hồng). Ghi chú: ${resolutionNote}`,
        type: "SYSTEM"
      });

      // Write Log
      await logAdminAction(req.user.id, "RESOLVE_DISPUTE", "Dispute", dispute._id, { resolutionType: "REFUND_PARTIAL", refundAmount: finalRefund, releaseAmount: finalRelease, resolutionNote }, req);

      return ApiResponse.success(res, dispute, "Hoàn trả một phần tiền tranh chấp thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async releaseEscrowDispute(req, res) {
    try {
      const { resolutionNote } = req.body;
      if (!resolutionNote) {
        return ApiResponse.error(res, "Cần cung cấp ghi chú giải quyết (resolutionNote)", 400);
      }

      const dispute = await Dispute.findById(req.params.id).populate("photographer");
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

      const escrowAmount = booking.depositAmount || 0;
      const commissionRate = booking.commissionRate || 0.1;
      const commissionAmt = escrowAmount * commissionRate;
      const netRelease = escrowAmount - commissionAmt;

      // 1. Release 100% to photographer wallet (minus commission)
      const photoWallet = await Wallet.findOne({ user: dispute.photographer?.user || dispute.photographerId });
      if (photoWallet) {
        photoWallet.holdBalance = Math.max(0, photoWallet.holdBalance - escrowAmount);
        photoWallet.balance += netRelease;
        await photoWallet.save();
      }

      // Create FINAL payment
      await Payment.create({
        booking: booking._id,
        sender: dispute.customer,
        receiver: dispute.photographer?.user || dispute.photographerId,
        amount: netRelease,
        paymentType: "FINAL",
        paymentMethod: "WALLET",
        status: "SUCCESS",
        confirmedBy: req.user.id,
        confirmedAt: new Date(),
        adminNote: `Giải ngân tranh chấp full 100%: ${resolutionNote}`
      });

      // 2. Update Booking
      booking.status = "COMPLETED";
      booking.paymentStatus = "paid";
      booking.statusLogs.push({
        status: "COMPLETED",
        note: `Giải quyết tranh chấp: Giải ngân 100% cọc (${escrowAmount} VND) cho Nhiếp ảnh gia.`,
        updatedAt: new Date()
      });
      await booking.save();

      // 3. Update/Create Commission
      let commission = await Commission.findOne({ booking: booking._id });
      if (commission) {
        commission.amount = commissionAmt;
        commission.rate = commissionRate;
        commission.status = "COLLECTED";
        await commission.save();
      } else {
        await Commission.create({
          booking: booking._id,
          amount: commissionAmt,
          rate: commissionRate,
          status: "COLLECTED"
        });
      }

      // 4. Update Dispute
      dispute.status = "RESOLVED";
      dispute.resolutionType = "RELEASE_PAYMENT";
      dispute.refundAmount = 0;
      dispute.releaseAmount = escrowAmount;
      dispute.resolutionNote = resolutionNote;
      dispute.resolvedBy = req.user.id;
      dispute.resolvedAt = new Date();
      await dispute.save();

      // Send Notifications
      await Notification.create({
        recipientType: "SPECIFIC",
        recipient: dispute.customer,
        title: "Tranh chấp của bạn đã kết thúc",
        message: `Admin đã giải ngân 100% số tiền cọc cho Nhiếp ảnh gia. Ghi chú: ${resolutionNote}`,
        type: "SYSTEM"
      });

      await Notification.create({
        recipientType: "SPECIFIC",
        recipient: dispute.photographer?.user || dispute.photographerId,
        title: "Khiếu nại tranh chấp được giải quyết thành công",
        message: `Admin đã giải ngân 100% số tiền cọc vào tài khoản của bạn. Nhận thực tế ${netRelease} VND (sau khấu trừ hoa hồng). Ghi chú: ${resolutionNote}`,
        type: "SYSTEM"
      });

      // Write Log
      await logAdminAction(req.user.id, "RESOLVE_DISPUTE", "Dispute", dispute._id, { resolutionType: "RELEASE_PAYMENT", refundAmount: 0, releaseAmount: escrowAmount, resolutionNote }, req);

      return ApiResponse.success(res, dispute, "Đã giải ngân tiền ký quỹ thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= UC89 — AI Marketplace Insights =================
  async getMarketplaceInsights(req, res) {
    try {
      // 1. Top Booking Styles
      const topStyles = await Booking.aggregate([
        { $match: { style: { $ne: null, $ne: "" } } },
        { $group: { _id: "$style", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      // 2. Top Locations
      const topLocations = await Booking.aggregate([
        { $match: { location: { $ne: null, $ne: "" } } },
        { $group: { _id: "$location", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      // 3. Best Selling Packages
      const topPackages = await Booking.aggregate([
        { $match: { packageName: { $ne: null, $ne: "" } } },
        { $group: { _id: "$packageName", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      // 4. Fastest Growing Photographers (Completed Bookings in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const growingRaw = await Booking.aggregate([
        { $match: { status: "COMPLETED", completedAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: "$photographer", bookingsCount: { $sum: 1 }, earnings: { $sum: "$totalPrice" } } },
        { $sort: { bookingsCount: -1, earnings: -1 } },
        { $limit: 5 }
      ]);
      const fastestGrowingPhotographers = await Photographer.populate(growingRaw, {
        path: "_id",
        populate: { path: "user", select: "fullName email avatar" }
      });

      return ApiResponse.success(res, {
        topBookingStyles: topStyles,
        topLocations,
        bestSellingPackages: topPackages,
        fastestGrowingPhotographers
      }, "Lấy Marketplace Insights thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= UC90 — System Policy Configuration =================
  async getSettings(req, res) {
    try {
      const settings = await SystemSetting.find();
      const settingsObj = {};
      settings.forEach((s) => {
        settingsObj[s.key] = s.value;
      });

      const defaults = {
        depositRate: 0.20,
        commissionRate: 0.10,
        disputeDeadlineDays: 7,
        escrowReleaseDays: 3,
        refundPolicy: "standard"
      };

      return ApiResponse.success(res, { ...defaults, ...settingsObj }, "Lấy cấu hình hệ thống thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async updateSettings(req, res) {
    try {
      const keys = ["depositRate", "commissionRate", "disputeDeadlineDays", "escrowReleaseDays", "refundPolicy"];
      const updated = {};
      for (const k of keys) {
        if (req.body[k] !== undefined) {
          await SystemSetting.findOneAndUpdate({ key: k }, { value: req.body[k] }, { upsert: true });
          updated[k] = req.body[k];
        }
      }

      await logAdminAction(req.user.id, "UPDATE_SETTINGS", "SystemSetting", "ALL", updated, req);
      return ApiResponse.success(res, updated, "Cập nhật cấu hình hệ thống thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= UC91 — Admin Action Audit Log =================
  async getAuditLogs(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const { admin, actionType, startDate, endDate } = req.query;
      const query = {};

      if (admin) query.admin = admin;
      if (actionType) query.actionType = actionType;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const logs = await AdminAction.find(query)
        .populate("admin", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await AdminAction.countDocuments(query);
      return ApiResponse.success(res, {
        logs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }, "Lấy danh sách Audit Logs thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getAuditLogById(req, res) {
    try {
      const log = await AdminAction.findById(req.params.id).populate("admin", "fullName email");
      if (!log) {
        return ApiResponse.error(res, "Không tìm thấy log hoạt động", 404);
      }
      return ApiResponse.success(res, log, "Lấy chi tiết log hoạt động thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= UC92 — Photographer Performance Audit =================
  async getPhotographerPerformance(req, res) {
    try {
      const photographers = await Photographer.find().populate("user", "fullName email avatar");
      const performanceList = [];
      const now = new Date();

      for (const ph of photographers) {
        const totalBookings = await Booking.countDocuments({ photographer: ph._id });
        const completedBookings = await Booking.countDocuments({ photographer: ph._id, status: "COMPLETED" });
        const disputesCount = await Dispute.countDocuments({ photographer: ph._id });

        // Late deliveries
        const lateDeliveries = await Booking.countDocuments({
          photographer: ph._id,
          $or: [
            { completedAt: { $ne: null }, deliveryDeadline: { $ne: null }, $expr: { $gt: ["$completedAt", "$deliveryDeadline"] } },
            { deliveryDeadline: { $ne: null, $lt: now }, completedAt: null, status: { $nin: ["COMPLETED", "CANCELLED"] } }
          ]
        });

        const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) : 1.0;
        const disputeRate = totalBookings > 0 ? (disputesCount / totalBookings) : 0.0;
        const lateDeliveryRate = totalBookings > 0 ? (lateDeliveries / totalBookings) : 0.0;

        // Response Time (average hours between created and accepted status log)
        let avgResponseTimeHours = 2.0; // default
        const acceptedBookings = await Booking.find({ photographer: ph._id, "statusLogs.status": "ACCEPTED" });
        if (acceptedBookings.length > 0) {
          let sumTime = 0;
          let countTime = 0;
          for (const b of acceptedBookings) {
            const logItem = b.statusLogs.find(l => l.status === "ACCEPTED");
            if (logItem) {
              sumTime += (logItem.updatedAt - b.createdAt) / (1000 * 60 * 60);
              countTime++;
            }
          }
          if (countTime > 0) avgResponseTimeHours = sumTime / countTime;
        }

        // Ranking
        let rank = "NORMAL";
        if (ph.averageRating >= 4.5 && completionRate >= 0.9 && totalBookings >= 3) {
          rank = "Top Photographer";
        } else if (ph.averageRating < 3.5 || completionRate < 0.7 || disputeRate > 0.2 || lateDeliveryRate > 0.3) {
          rank = "Warning Photographer";
        }

        performanceList.push({
          photographer: ph,
          totalBookings,
          completedBookings,
          disputesCount,
          lateDeliveries,
          completionRate: Math.round(completionRate * 100),
          disputeRate: Math.round(disputeRate * 100),
          lateDeliveryRate: Math.round(lateDeliveryRate * 100),
          responseTime: Math.round(avgResponseTimeHours * 10) / 10,
          averageRating: ph.averageRating,
          rank
        });
      }

      return ApiResponse.success(res, performanceList, "Lấy đánh giá hiệu quả photographer thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= UC93 — Customer Behavior Monitoring =================
  async getCustomerBehavior(req, res) {
    try {
      const customers = await User.find({ role: "customer" });
      const behaviorList = [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      for (const u of customers) {
        const totalBookings = await Booking.countDocuments({ customer: u._id });
        const cancellations = await Booking.countDocuments({ customer: u._id, status: "CANCELLED" });
        const disputes = await Dispute.countDocuments({ customer: u._id });
        const spamBookings = await Booking.countDocuments({ customer: u._id, createdAt: { $gte: sevenDaysAgo } });

        // Calculate Risk Score
        const cancellationScore = Math.min(40, cancellations * 15);
        const disputeScore = Math.min(50, disputes * 25);
        const spamScore = spamBookings > 5 ? 30 : 0;
        const riskScore = Math.min(100, cancellationScore + disputeScore + spamScore);

        // Status
        let status = "NORMAL";
        if (riskScore >= 70 || cancellations > 8 || disputes > 3) {
          status = "HIGH_RISK";
        } else if (riskScore >= 35 || cancellations > 4 || disputes > 1) {
          status = "WATCHLIST";
        }

        behaviorList.push({
          customer: { _id: u._id, fullName: u.fullName, email: u.email, avatar: u.avatar },
          totalBookings,
          cancellations,
          disputes,
          spamBookings,
          riskScore,
          status
        });
      }

      return ApiResponse.success(res, behaviorList, "Lấy phân tích hành vi khách hàng thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= UC94 — Promotion Campaign Manager =================
  async getCampaigns(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const { status } = req.query;
      const query = {};
      if (status) query.status = status;

      const campaigns = await Campaign.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Campaign.countDocuments(query);
      return ApiResponse.success(res, {
        campaigns,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }, "Lấy danh sách chiến dịch khuyến mại thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async createCampaign(req, res) {
    try {
      const campaign = await Campaign.create(req.body);
      await logAdminAction(req.user.id, "CREATE_CAMPAIGN", "Campaign", campaign._id, req.body, req);
      return ApiResponse.success(res, campaign, "Tạo chiến dịch khuyến mại thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async updateCampaign(req, res) {
    try {
      const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!campaign) {
        return ApiResponse.error(res, "Không tìm thấy chiến dịch", 404);
      }
      await logAdminAction(req.user.id, "UPDATE_CAMPAIGN", "Campaign", campaign._id, req.body, req);
      return ApiResponse.success(res, campaign, "Cập nhật chiến dịch khuyến mại thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async deleteCampaign(req, res) {
    try {
      const campaign = await Campaign.findByIdAndDelete(req.params.id);
      if (!campaign) {
        return ApiResponse.error(res, "Không tìm thấy chiến dịch để xóa", 404);
      }
      await logAdminAction(req.user.id, "DELETE_CAMPAIGN", "Campaign", req.params.id, {}, req);
      return ApiResponse.success(res, null, "Xóa chiến dịch khuyến mại thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ================= UC95 — Platform Revenue Forecast =================
  async getRevenueForecast(req, res) {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      // 1. Current Month Revenue (payments type DEPOSIT/FINAL successfully paid in current month)
      const currentMonthPayments = await Payment.aggregate([
        {
          $match: {
            status: "SUCCESS",
            paymentType: { $in: ["DEPOSIT", "FINAL"] },
            createdAt: { $gte: startOfMonth, $lt: endOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      const currentMonthRevenue = currentMonthPayments[0]?.total || 0;

      // 2. Projected Revenue (totalPrice of bookings in active status scheduled for this month)
      const projectedBookings = await Booking.aggregate([
        {
          $match: {
            status: { $in: ["PENDING", "ACCEPTED", "DEPOSIT_PAID", "IN_PROGRESS"] },
            bookingDate: { $gte: startOfMonth, $lt: endOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ]);
      const projectedRevenue = projectedBookings[0]?.total || 0;

      // 3. Pending Payouts (total holdBalance across all wallets)
      const walletsHold = await Wallet.aggregate([
        { $group: { _id: null, totalHold: { $sum: "$holdBalance" } } }
      ]);
      const pendingPayouts = walletsHold[0]?.totalHold || 0;

      // 4. Estimated Commission (total of all PENDING commissions)
      const commissionsPending = await Commission.aggregate([
        { $match: { status: "PENDING" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      const estimatedCommission = commissionsPending[0]?.total || 0;

      return ApiResponse.success(res, {
        currentMonthRevenue,
        projectedRevenue,
        pendingPayouts,
        estimatedCommission
      }, "Tính toán dự báo doanh thu nền tảng thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }
}

module.exports = new AdminExtensionController();
