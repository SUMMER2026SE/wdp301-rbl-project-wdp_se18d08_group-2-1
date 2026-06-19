const express = require("express");
const bookingController = require("./booking.controller");
const { authenticate } = require("../../../middlewares/authenticate");
const authorize = require("../../../middlewares/roleMiddlewares");

const router = express.Router();

router.post("/payos/webhook", bookingController.handlePayosWebhook);
router.post("/:id/payment", authenticate, authorize(["customer"]), bookingController.createPaymentLink);
router.get("/:id/payment/status", authenticate, authorize(["customer"]), bookingController.syncPaymentStatus);
router.put("/:id/accept", authenticate, authorize(["photographer"]), bookingController.acceptBooking);
router.put("/:id/reject", authenticate, authorize(["photographer"]), bookingController.rejectBooking);
router.put("/:id/complete", authenticate, authorize(["photographer"]), bookingController.completeBooking);
router.put("/:id/approve", authenticate, authorize(["customer"]), bookingController.approveCompletion);

module.exports = router;
