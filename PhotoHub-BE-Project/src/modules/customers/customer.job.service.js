const JobPost = require("../photographers/job/jobPost.model");
const Bid = require("../photographers/bid/bid.model");
const Photographer = require("../photographers/models/photographer");
const { Booking } = require("../bookings/models/booking.model");
const chatService = require("../photographers/chat/chat.service");
const CommunityPost = require("../community/community.model");

class CustomerJobService {
  async createJobPost(customerId, data, imageUrls = []) {
    const { title, description, location, budget, style, date } = data;

    if (!title || !description || !location || !budget || !style || !date) {
      throw new Error("Vui lòng điền đầy đủ các trường bắt buộc.");
    }

    const budgetNum = Number(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      throw new Error("Ngân sách phải là số dương.");
    }

    const jobDate = new Date(date);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (isNaN(jobDate.getTime()) || jobDate < startOfToday) {
      throw new Error("Ngày chụp không hợp lệ hoặc đã qua.");
    }

    if (imageUrls.length > 5) {
      throw new Error("Tối đa 5 ảnh mẫu cho mỗi job post.");
    }

    const jobPost = await JobPost.create({
      customer: customerId,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      budget: budgetNum,
      style: style.trim(),
      date: jobDate,
      referenceImages: imageUrls,
      status: "open",
    });

    // Tự động đăng lên diễn đàn cộng đồng
    try {
      const coverImage = imageUrls && imageUrls.length > 0 ? imageUrls[0] : "";
      const postTitle = `[Tuyển Photographer] ${title.trim()}`;
      const postContent = `📍 **Địa điểm**: ${location.trim()}
💰 **Ngân sách**: ${budgetNum.toLocaleString("vi-VN")} VND
📅 **Ngày chụp**: ${jobDate.toLocaleDateString("vi-VN")}
📸 **Phong cách**: ${style.trim()}

**Mô tả chi tiết yêu cầu**:
${description.trim()}`;

      await CommunityPost.create({
        author: customerId,
        title: postTitle,
        content: postContent,
        category: "job_story",
        tags: ["tuyen-photo", style.trim().toLowerCase().replace(/\s+/g, "-")],
        coverImage: coverImage,
        status: "published"
      });
    } catch (postError) {
      console.error("Failed to automatically post job to community:", postError);
    }

    return jobPost;
  }

  async getMyJobPosts(customerId) {
    const jobs = await JobPost.find({ customer: customerId })
      .sort({ createdAt: -1 });
    return jobs;
  }

  async updateReferenceImages(jobPostId, customerId, newImageUrls) {
    const job = await JobPost.findOne({ _id: jobPostId, customer: customerId });
    if (!job) {
      throw new Error("Không tìm thấy job post hoặc bạn không có quyền chỉnh sửa.");
    }

    const merged = [...(job.referenceImages || []), ...newImageUrls];
    if (merged.length > 5) {
      throw new Error(`Tổng số ảnh vượt quá 5. Hiện tại có ${job.referenceImages.length} ảnh, thêm ${newImageUrls.length} ảnh sẽ vượt giới hạn.`);
    }

    job.referenceImages = merged;
    await job.save();
    return job;
  }

  async deleteJobPost(jobPostId, customerId) {
    const job = await JobPost.findOne({ _id: jobPostId, customer: customerId });
    if (!job) {
      throw new Error("Không tìm thấy job post hoặc bạn không có quyền xóa.");
    }
    await job.deleteOne();
    return { deleted: true };
  }

  async closeJobPost(jobPostId, customerId) {
    const job = await JobPost.findOne({ _id: jobPostId, customer: customerId });
    if (!job) {
      throw new Error("Không tìm thấy job post hoặc bạn không có quyền.");
    }
    if (job.status !== "open") {
      throw new Error(`Job post đã ở trạng thái "${job.status}", không thể đóng.`);
    }
    job.status = "closed";
    await job.save();
    return job;
  }

  async updateJobPost(jobPostId, customerId, data, newImageUrls = []) {
    const job = await JobPost.findOne({ _id: jobPostId, customer: customerId });
    if (!job) {
      throw new Error("Không tìm thấy job post hoặc bạn không có quyền chỉnh sửa.");
    }

    const { title, description, location, budget, style, date } = data;

    if (!title || !description || !location || !budget || !style || !date) {
      throw new Error("Vui lòng điền đầy đủ các trường bắt buộc.");
    }

    const budgetNum = Number(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      throw new Error("Ngân sách phải là số dương.");
    }

    const jobDate = new Date(date);
    if (jobDate.toDateString() !== new Date(job.date).toDateString()) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      if (isNaN(jobDate.getTime()) || jobDate < startOfToday) {
        throw new Error("Ngày chụp không hợp lệ hoặc đã qua.");
      }
    }

    let existingImages = [];
    if (data.existingImages) {
      if (typeof data.existingImages === "string") {
        try {
          existingImages = JSON.parse(data.existingImages);
        } catch {
          existingImages = [data.existingImages];
        }
      } else if (Array.isArray(data.existingImages)) {
        existingImages = data.existingImages;
      }
    }

    const merged = [...existingImages, ...newImageUrls];
    if (merged.length > 5) {
      throw new Error("Tối đa 5 ảnh mẫu cho mỗi job post.");
    }

    job.title = title.trim();
    job.description = description.trim();
    job.location = location.trim();
    job.budget = budgetNum;
    job.style = style.trim();
    job.date = jobDate;
    job.referenceImages = merged;

    await job.save();
    return job;
  }

  async getBidsForJobPost(jobPostId, customerId) {
    const job = await JobPost.findOne({ _id: jobPostId, customer: customerId });
    if (!job) {
      throw new Error("Không tìm thấy job post hoặc bạn không có quyền xem báo giá của job này.");
    }

    const bids = await Bid.find({ jobPostId })
      .populate("photographerId", "fullName email avatar phoneNumber")
      .sort({ price: 1, createdAt: -1 });

    const enrichedBids = await Promise.all(
      bids.map(async (bid) => {
        const bidObj = bid.toObject();
        if (bid.photographerId) {
          const photographerProfile = await Photographer.findOne({ user: bid.photographerId._id })
            .select("displayName averageRating experienceYears hourlyRate bio");
          bidObj.photographerProfile = photographerProfile || null;
        } else {
          bidObj.photographerProfile = null;
        }
        return bidObj;
      })
    );

    return enrichedBids;
  }

  async acceptBid(jobPostId, customerId, bidId) {
    const job = await JobPost.findOne({ _id: jobPostId, customer: customerId });
    if (!job) {
      throw new Error("Không tìm thấy job post hoặc bạn không có quyền.");
    }

    const targetBid = await Bid.findOne({ _id: bidId, jobPostId });
    if (!targetBid) {
      throw new Error("Không tìm thấy báo giá phù hợp cho job này.");
    }

    const photographerProfile = await Photographer.findOne({ user: targetBid.photographerId });
    if (!photographerProfile) {
      throw new Error("Không tìm thấy hồ sơ của nhiếp ảnh gia.");
    }

    targetBid.status = "accepted";
    await targetBid.save();

    await Bid.updateMany(
      { jobPostId, _id: { $ne: bidId } },
      { $set: { status: "rejected" } }
    );

    job.status = "closed";
    await job.save();

    // Tự động tạo Booking khi đồng ý đề xuất
    const booking = await Booking.create({
      customer: customerId,
      photographer: photographerProfile._id,
      title: job.title,
      start: job.date,
      end: new Date(new Date(job.date).getTime() + 2 * 60 * 60 * 1000), // Mặc định 2 giờ chụp
      location: job.location,
      price: targetBid.price,
      status: "accepted",
      paymentStatus: "unpaid",
    });

    // Tạo cuộc hội thoại chat tư vấn giữa Customer và Photographer
    const conversation = await chatService.findOrCreateConversation(
      [customerId.toString(), targetBid.photographerId.toString()],
      booking._id,
      jobPostId
    );

    // Gửi tin nhắn tự động đầu tiên của cuộc hội thoại tư vấn
    await chatService.createMessage(conversation._id, customerId, {
      text: `Chào bạn, báo giá cho job "${job.title}" của bạn đã được chấp nhận. Chúng ta có thể thảo luận thêm chi tiết tại đây.`,
      messageType: "booking_detail",
      metadata: {
        bookingId: booking._id,
        status: booking.status,
        start: booking.start,
        location: booking.location,
        price: booking.price,
      },
    });

    return targetBid;
  }

  async rejectBid(jobPostId, customerId, bidId) {
    const job = await JobPost.findOne({ _id: jobPostId, customer: customerId });
    if (!job) {
      throw new Error("Không tìm thấy job post hoặc bạn không có quyền.");
    }

    const targetBid = await Bid.findOne({ _id: bidId, jobPostId });
    if (!targetBid) {
      throw new Error("Không tìm thấy báo giá phù hợp.");
    }

    targetBid.status = "rejected";
    await targetBid.save();

    return targetBid;
  }
}

module.exports = new CustomerJobService();
