const JobPost = require("../photographers/job/jobPost.model");

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
}

module.exports = new CustomerJobService();
