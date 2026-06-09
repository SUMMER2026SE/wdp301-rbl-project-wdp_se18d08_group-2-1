const express = require("express");
const bookingController = require("./booking.controller");
const { authenticate } = require("../../../middlewares/authenticate");
const authorize = require("../../../middlewares/roleMiddlewares");

const router = express.Router();

router.put("/:id/reject", authenticate, authorize(["photographer"]), bookingController.rejectBooking);

module.exports = router;
