const Review = require("../models/review.model");
const { Booking } = require("../../bookings/models/booking.model");
const Photographer = require("../../photographers/models/photographer");
const mongoose = require("mongoose");

class ReviewService {
  async createReview(customerUserId, bookingId, { rating, comment }) {
    const score = Number(rating);
    if (isNaN(score) || score < 1 || score > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    if (!comment || !comment.trim()) {
      throw new Error("Comment is required");
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.customer.toString() !== customerUserId.toString()) {
      throw new Error("You are not authorized to review this booking");
    }

    if (booking.status !== "completed") {
      throw new Error("You can only review a photographer after the booking is completed");
    }

    if (booking.isReviewed) {
      throw new Error("You have already reviewed this booking");
    }

    const photographerProfile = await Photographer.findById(booking.photographer);
    if (!photographerProfile) {
      throw new Error("Photographer profile not found");
    }

    // Create review
    const review = await Review.create({
      booking: bookingId,
      customer: customerUserId,
      photographer: photographerProfile._id,
      rating: score,
      comment: comment.trim(),
    });

    // Mark booking as reviewed
    booking.isReviewed = true;
    await booking.save();

    // Thưởng điểm tích lũy cho việc gửi đánh giá review (50 điểm cơ bản)
    try {
      const loyaltyService = require("../../loyalty/services/loyalty.service");
      await loyaltyService.addPoints(
        customerUserId,
        50, // Base points
        "Earn_Review",
        `Thưởng đánh giá nhiếp ảnh gia cho đơn chụp #${String(bookingId).slice(-6)}`,
        bookingId
      );
    } catch (loyaltyError) {
      console.error("[Loyalty] Error earning points on review submission:", loyaltyError.message);
    }

    // Recalculate average rating & total reviews for the photographer
    const stats = await Review.aggregate([
      { $match: { photographer: photographerProfile._id } },
      {
        $group: {
          _id: "$photographer",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    let averageRating = score;
    let totalReviews = 1;

    if (stats && stats.length > 0) {
      averageRating = stats[0].averageRating;
      totalReviews = stats[0].totalReviews;
    }

    // Update the photographer's document in the DB
    photographerProfile.averageRating = averageRating;
    photographerProfile.totalReviews = totalReviews;
    await photographerProfile.save();

    // Return the review populated with customer info
    return await Review.findById(review._id).populate("customer", "fullName avatar email");
  }

  async getPhotographerReviews(photographerProfileId, { page = 1, limit = 10 } = {}) {
    const photographer = await Photographer.findById(photographerProfileId);
    if (!photographer) {
      throw new Error("Photographer profile not found");
    }

    const query = { photographer: photographer._id };
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate("customer", "fullName avatar email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(query),
    ]);

    return {
      reviews,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }
}

module.exports = new ReviewService();
