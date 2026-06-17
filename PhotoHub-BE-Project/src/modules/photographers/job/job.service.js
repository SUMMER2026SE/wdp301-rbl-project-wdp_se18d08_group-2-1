const JobPost = require("./jobPost.model");

class JobService {
  async listOpenJobs(filters = {}) {
    const { location, budget, style, date } = filters;

    const query = { status: "open" };

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (budget) {
      query.budget = { $gte: Number(budget) };
    }

    if (style) {
      query.style = { $regex: style, $options: "i" };
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    return await JobPost.find(query)
      .populate("customer", "fullName email avatar phoneNumber")
      .sort({ createdAt: -1 });
  }

  async getJobById(id) {
    const job = await JobPost.findById(id).populate("customer", "fullName email avatar phoneNumber");
    if (!job) {
      throw new Error("Job post not found");
    }
    return job;
  }
}

module.exports = new JobService();
