const Bid = require("./bid.model");
const JobPost = require("../job/jobPost.model");
const Photographer = require("../models/photographer");
const Booking = require("../booking/booking.model");
const { ACTIVE_BOOKING_STATUSES, calculateFitScore } = require("../utils/jobFitScoring");
const { getPhotographerIdentity, normalizeBookingTime } = require("../utils/photographerIdentity");

class BidService {
  async createBid(photographerUserId, bidData) {
    const {
      jobPostId,
      proposal,
      price,
      estimatedTime,
      packageName,
      deliverables,
      aiAssistance,
    } = bidData;

    if (!jobPostId || !proposal || !price || !estimatedTime) {
      throw new Error("Missing required bid information");
    }

    const jobPost = await JobPost.findById(jobPostId);
    if (!jobPost) {
      throw new Error("Job post not found");
    }

    if (jobPost.status !== "open") {
      throw new Error("Bidding is closed for this job post");
    }

    if (new Date(jobPost.date) < new Date()) {
      throw new Error("Bidding deadline has passed for this job post");
    }

    const identity = await getPhotographerIdentity(photographerUserId);
    const existingBid = await Bid.findOne({
      jobPostId,
      photographerId: { $in: identity.ids },
    });

    if (existingBid) {
      throw new Error("You have already submitted a bid for this job post");
    }

    const newBid = new Bid({
      jobPostId,
      photographerId: photographerUserId,
      customerId: jobPost.customer,
      proposal,
      price: Number(price),
      estimatedTime,
      packageName: packageName || "",
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      deadlineAt: jobPost.date,
      aiAssistance: {
        used: Boolean(aiAssistance?.used),
        suggestedPrice: aiAssistance?.suggestedPrice,
        suggestedEstimatedTime: aiAssistance?.suggestedEstimatedTime,
        notes: aiAssistance?.notes || [],
      },
      status: "pending",
    });

    return await newBid.save();
  }

  async updateBid(bidId, photographerUserId, updateData) {
    const { proposal, price, estimatedTime } = updateData;

    const bid = await Bid.findById(bidId);
    if (!bid) {
      throw new Error("Bid not found");
    }

    const identity = await getPhotographerIdentity(photographerUserId);
    if (!identity.ids.includes(bid.photographerId.toString())) {
      throw new Error("You are not authorized to edit this bid");
    }

    if (bid.status !== "pending") {
      throw new Error("You can only edit pending bids");
    }

    const jobPost = await JobPost.findById(bid.jobPostId);
    if (!jobPost) {
      throw new Error("Associated job post not found");
    }

    if (new Date(jobPost.date) < new Date()) {
      throw new Error("Bidding deadline has passed for this job post");
    }

    if (proposal !== undefined) bid.proposal = proposal;
    if (price !== undefined) bid.price = Number(price);
    if (estimatedTime !== undefined) bid.estimatedTime = estimatedTime;
    if (updateData.packageName !== undefined) bid.packageName = updateData.packageName;
    if (Array.isArray(updateData.deliverables)) bid.deliverables = updateData.deliverables;

    return await bid.save();
  }

  async getMyBids(photographerUserId) {
    const identity = await getPhotographerIdentity(photographerUserId);
    return await Bid.find({ photographerId: { $in: identity.ids } })
      .populate("jobPostId")
      .sort({ createdAt: -1 });
  }

  async generateBidAssistance(photographerUserId, jobPostId) {
    const [jobPost, photographer] = await Promise.all([
      JobPost.findById(jobPostId).populate("customer", "fullName email"),
      Photographer.findOne({ user: photographerUserId }).populate("user", "fullName"),
    ]);

    if (!jobPost) {
      throw new Error("Job post not found");
    }

    if (!photographer) {
      throw new Error("Photographer profile not found");
    }

    const identity = await getPhotographerIdentity(photographerUserId);
    const busyBookings = await Booking.find({
      photographer: { $in: identity.ids },
      status: { $in: ACTIVE_BOOKING_STATUSES },
    }).select("start end bookingDate durationHours status title");
    const normalizedBusyBookings = busyBookings.map((booking) => ({
      ...booking.toObject(),
      ...normalizeBookingTime(booking),
    }));

    const fit = calculateFitScore(jobPost.toObject(), photographer, normalizedBusyBookings);
    const styleText = jobPost.style || "your requested style";
    const photographerName = photographer.displayName || photographer.user?.fullName || "your photographer";
    const recommendedPrice = fit.recommendedPrice || Math.round(Number(jobPost.budget || 0) * 0.9);
    const estimatedTime = fit.recommendedEstimatedTime;
    const packageName = `${styleText} Essential Coverage`;
    const deliverables = [
      "Pre-shoot concept alignment",
      "Professionally edited preview gallery",
      "Final high-resolution album delivery",
    ];

    const proposal = [
      `Hi ${jobPost.customer?.fullName || "there"},`,
      `I am ${photographerName}, and this ${styleText} project is a strong fit for my portfolio and current schedule.`,
      `I can cover the shoot in ${jobPost.location} with a clear shot plan, guided posing, and a polished final album.`,
      `My proposed package includes ${deliverables.join(", ").toLowerCase()}.`,
      `Estimated delivery time is ${estimatedTime}.`,
    ].join("\n\n");

    return {
      proposal,
      price: recommendedPrice,
      estimatedTime,
      packageName,
      deliverables,
      fitScore: fit.matchScore,
      notes: [
        fit.availability.reason,
        `Recommended price is based on your hourly rate and the customer's budget.`,
        `Fit score: ${fit.matchScore}%.`,
      ],
      matchBreakdown: fit.matchBreakdown,
    };
  }

  async optimizeBid(bidId, photographerUserId) {
    const bid = await Bid.findById(bidId).populate("jobPostId");
    if (!bid) {
      throw new Error("Bid not found");
    }

    const identity = await getPhotographerIdentity(photographerUserId);
    if (!identity.ids.includes(bid.photographerId.toString())) {
      throw new Error("You are not authorized to optimize this bid");
    }

    if (bid.status !== "pending") {
      throw new Error("Only pending bids can be optimized");
    }

    const jobPost = bid.jobPostId;
    if (!jobPost) {
      throw new Error("Associated job post not found");
    }

    if (new Date(jobPost.date) < new Date()) {
      throw new Error("Bidding deadline has passed for this job post");
    }

    const assistance = await this.generateBidAssistance(photographerUserId, jobPost._id);
    const suggestions = [];
    let score = 100;

    if ((bid.proposal || "").length < 180) {
      score -= 20;
      suggestions.push("Add more specific coverage details and delivery expectations.");
    }

    if (Number(bid.price) > Number(jobPost.budget || 0) && Number(jobPost.budget || 0) > 0) {
      score -= 25;
      suggestions.push("Your price is above the customer's listed budget. Consider a leaner package or explain the added value.");
    }

    if (!bid.deliverables || bid.deliverables.length === 0) {
      score -= 15;
      suggestions.push("List concrete deliverables so the customer can compare your package quickly.");
    }

    if (!bid.estimatedTime || !/\d/.test(bid.estimatedTime)) {
      score -= 10;
      suggestions.push("Use a clear delivery time such as '3-5 days after shooting'.");
    }

    const optimization = {
      currentScore: Math.max(0, score),
      suggestions,
      suggestedProposal: assistance.proposal,
      suggestedPrice: assistance.price,
      suggestedEstimatedTime: assistance.estimatedTime,
      suggestedPackageName: assistance.packageName,
      suggestedDeliverables: assistance.deliverables,
    };

    bid.optimization = {
      lastScore: optimization.currentScore,
      suggestions,
      optimizedAt: new Date(),
    };
    await bid.save();

    return optimization;
  }
}

module.exports = new BidService();
