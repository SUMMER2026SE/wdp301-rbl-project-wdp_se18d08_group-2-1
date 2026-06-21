const express = require("express");
const router = express.Router();

const authenticate = require("../../../middlewares/authenticate");
const authorize    = require("../../../middlewares/roleMiddlewares");
const { validateCreateBooking, validateRejectBooking } = require("../validation/booking.validation");

const customerCtrl     = require("../controller/booking.customer.controller");
const photographerCtrl = require("../controller/booking.photographer.controller");


router.post("/webhook/payos", customerCtrl.handlePayosWebhook);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  [2] CUSTOMER â€” Static routes (POST /, GET /my)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/**
 * POST /api/bookings
 * Customer táº¡o booking má»›i â†’ Emit Socket.IO "new-booking-request" cho Photographer
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
 * Customer xem danh sĂ¡ch booking cá»§a mĂ¬nh (cĂ³ phĂ¢n trang)
 */
router.get(
  "/my",
  authenticate,
  authorize(["customer"]),
  customerCtrl.getMyBookings
);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  [3] PHOTOGRAPHER â€” Static routes (GET /photographer/my)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/**
 * GET /api/bookings/photographer/my?status=pending&page=1&limit=10
 * Photographer xem danh sĂ¡ch booking Ä‘Æ°á»£c Ä‘áº·t cho mĂ¬nh (cĂ³ phĂ¢n trang)
 */
router.get(
  "/photographer/my",
  authenticate,
  authorize(["photographer"]),
  photographerCtrl.getMyBookings
);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  [4] CUSTOMER â€” Dynamic routes vá»›i suffix cá»‘ Ä‘á»‹nh
//  Äáº·t TRÆ¯á»C /:id Ä‘á»ƒ Express khĂ´ng hiá»ƒu nháº§m suffix ("cancel","payment")
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/**
 * PUT /api/bookings/:id/cancel
 * Customer huá»· booking (chá»‰ khi pending hoáº·c accepted)
 */
router.put(
  "/:id/cancel",
  authenticate,
  authorize(["customer"]),
  customerCtrl.cancelBooking
);

/**
 * POST /api/bookings/:id/payment
 * Customer táº¡o link thanh toĂ¡n PayOS (booking pháº£i á»Ÿ tráº¡ng thĂ¡i accepted)
 */
router.post(
  "/:id/payment",
  authenticate,
  authorize(["customer"]),
  customerCtrl.createPaymentLink
);

router.get(
  "/:id/payment/status",
  authenticate,
  authorize(["customer"]),
  customerCtrl.syncPaymentStatus
);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  [4] PHOTOGRAPHER â€” Dynamic routes vá»›i suffix cá»‘ Ä‘á»‹nh
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/**
 * PUT /api/bookings/:id/accept
 * Photographer cháº¥p nháº­n booking â†’ Emit Socket.IO "booking-status-updated" cho Customer
 */
router.put(
  "/:id/accept",
  authenticate,
  authorize(["photographer"]),
  photographerCtrl.acceptBooking
);

/**
 * PUT /api/bookings/:id/reject
 * Photographer tá»« chá»‘i booking kĂ¨m lĂ½ do â†’ Emit Socket.IO cho Customer
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
 * Photographer Ä‘Ă¡nh dáº¥u hoĂ n thĂ nh (báº¯t buá»™c upload finalAlbum trÆ°á»›c)
 */
router.put(
  "/:id/complete",
  authenticate,
  authorize(["photographer"]),
  photographerCtrl.completeBooking
);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  [5] SHARED â€” Dynamic route thuáº§n /:id  â† PHáº¢I Äáº¶T CUá»I CĂ™NG
//  Náº¿u Ä‘áº·t trÆ°á»›c, Express sáº½ match "my" / "photographer" / "webhook" nhÆ° :id
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/**
 * GET /api/bookings/:id
 * Xem chi tiáº¿t má»™t booking.
 * Controller tá»± kiá»ƒm tra: chá»‰ customer/photographer liĂªn quan hoáº·c admin.
 */
router.get(
  "/:id",
  authenticate,
  customerCtrl.getBookingDetail
);

module.exports = router;
