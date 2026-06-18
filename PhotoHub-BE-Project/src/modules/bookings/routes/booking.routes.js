const express = require("express");
const router = express.Router();

const authenticate = require("../../../middlewares/authenticate");
const authorize    = require("../../../middlewares/roleMiddlewares");
const { validateCreateBooking, validateRejectBooking } = require("../validation/booking.validation");

const customerCtrl     = require("../controller/booking.customer.controller");
const photographerCtrl = require("../controller/booking.photographer.controller");


router.post("/webhook/payos", customerCtrl.handlePayosWebhook);

// ═══════════════════════════════════════════════════════════════════
//  [2] CUSTOMER — Static routes (POST /, GET /my)
// ═══════════════════════════════════════════════════════════════════

/**
 * POST /api/bookings
 * Customer tạo booking mới → Emit Socket.IO "new-booking-request" cho Photographer
 */
router.post(
  "/",
  authenticate,
  authorize(["customer"]),
  validateCreateBooking,
  customerCtrl.createBooking
);

/**
 * GET /api/bookings/my?status=pending&page=1&limit=10
 * Customer xem danh sách booking của mình (có phân trang)
 */
router.get(
  "/my",
  authenticate,
  authorize(["customer"]),
  customerCtrl.getMyBookings
);

// ═══════════════════════════════════════════════════════════════════
//  [3] PHOTOGRAPHER — Static routes (GET /photographer/my)
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/bookings/photographer/my?status=pending&page=1&limit=10
 * Photographer xem danh sách booking được đặt cho mình (có phân trang)
 */
router.get(
  "/photographer/my",
  authenticate,
  authorize(["photographer"]),
  photographerCtrl.getMyBookings
);

// ═══════════════════════════════════════════════════════════════════
//  [4] CUSTOMER — Dynamic routes với suffix cố định
//  Đặt TRƯỚC /:id để Express không hiểu nhầm suffix ("cancel","payment")
// ═══════════════════════════════════════════════════════════════════

/**
 * PUT /api/bookings/:id/cancel
 * Customer huỷ booking (chỉ khi pending hoặc accepted)
 */
router.put(
  "/:id/cancel",
  authenticate,
  authorize(["customer"]),
  customerCtrl.cancelBooking
);

/**
 * POST /api/bookings/:id/payment
 * Customer tạo link thanh toán PayOS (booking phải ở trạng thái accepted)
 */
router.post(
  "/:id/payment",
  authenticate,
  authorize(["customer"]),
  customerCtrl.createPaymentLink
);

// ═══════════════════════════════════════════════════════════════════
//  [4] PHOTOGRAPHER — Dynamic routes với suffix cố định
// ═══════════════════════════════════════════════════════════════════

/**
 * PUT /api/bookings/:id/accept
 * Photographer chấp nhận booking → Emit Socket.IO "booking-status-updated" cho Customer
 */
router.put(
  "/:id/accept",
  authenticate,
  authorize(["photographer"]),
  photographerCtrl.acceptBooking
);

/**
 * PUT /api/bookings/:id/reject
 * Photographer từ chối booking kèm lý do → Emit Socket.IO cho Customer
 */
router.put(
  "/:id/reject",
  authenticate,
  authorize(["photographer"]),
  validateRejectBooking,
  photographerCtrl.rejectBooking
);

/**
 * PUT /api/bookings/:id/complete
 * Photographer đánh dấu hoàn thành (bắt buộc upload finalAlbum trước)
 */
router.put(
  "/:id/complete",
  authenticate,
  authorize(["photographer"]),
  photographerCtrl.completeBooking
);

// ═══════════════════════════════════════════════════════════════════
//  [5] SHARED — Dynamic route thuần /:id  ← PHẢI ĐẶT CUỐI CÙNG
//  Nếu đặt trước, Express sẽ match "my" / "photographer" / "webhook" như :id
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/bookings/:id
 * Xem chi tiết một booking.
 * Controller tự kiểm tra: chỉ customer/photographer liên quan hoặc admin.
 */
router.get(
  "/:id",
  authenticate,
  customerCtrl.getBookingDetail
);

module.exports = router;
