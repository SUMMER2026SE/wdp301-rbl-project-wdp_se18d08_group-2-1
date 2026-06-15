const Bid = require("./bid.model");
const JobPost = require("../job/jobPost.model");

class BidService {
  async createBid(photographerUserId, bidData) {
    const { jobPostId, proposal, price, estimatedTime } = bidData;

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

    const existingBid = await Bid.findOne({
      jobPostId,
      photographerId: photographerUserId,
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

    if (bid.photographerId.toString() !== photographerUserId.toString()) {
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

    return await bid.save();
  }

  async getMyBids(photographerUserId) {
    return await Bid.find({ photographerId: photographerUserId })
      .populate("jobPostId")
      .sort({ createdAt: -1 });
  }
}

module.exports = new BidService();
