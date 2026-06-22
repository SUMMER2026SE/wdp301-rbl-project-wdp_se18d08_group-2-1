const express = require("express");
const router = express.Router();
const authenticate = require("../../../middlewares/authenticate");
const authorize = require("../../../middlewares/roleMiddlewares");
const reviewController = require("../controller/review.controller");

// POST review for a booking
router.post(
  "/bookings/:id/reviews",
  authenticate,
  authorize(["customer"]),
  reviewController.createReview
);

// GET reviews for a photographer profile
router.get(
  "/photographers/:id/reviews",
  reviewController.getPhotographerReviews
);

module.exports = router;
