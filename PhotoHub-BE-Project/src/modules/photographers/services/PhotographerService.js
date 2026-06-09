// services/PhotographerService.js
const Photographer = require("../models/photographer");

class PhotographerService {
  // Lấy danh sách photographers với search & filter
  async searchPhotographers(filters = {}) {
    try {
      const {
        search = "",
        location = "",
        styles = [],
        minRating = 0,
        minPrice = 0,
        maxPrice = Infinity,
        minExperience = 0,
        sortBy = "relevance", // relevance, rating, price, experience
        page = 1,
        limit = 12,
      } = filters;

      // Xây dựng query
      let query = {};

      // Search theo tên
      if (search) {
        query.$or = [
          { displayName: { $regex: search, $options: "i" } },
          { bio: { $regex: search, $options: "i" } },
        ];
      }

      // Filter theo địa điểm
      if (location) {
        query.location = { $regex: location, $options: "i" };
      }

      // Filter theo phong cách
      if (styles && styles.length > 0) {
        query.styles = { $in: styles };
      }

      // Filter theo rating
      if (minRating > 0) {
        query.averageRating = { $gte: minRating };
      }

      // Filter theo giá (hourlyRate)
      if (maxPrice !== Infinity) {
        query.hourlyRate = { $lte: maxPrice };
      }
      // filter min price
      if (minPrice > 0) {
        query.hourlyRate = { ...query.hourlyRate, $gte: minPrice };
      }
      // Filter theo kinh nghiệm
      if (minExperience > 0) {
        query.experienceYears = { $gte: minExperience };
      }

      // Sắp xếp
      let sortOptions = {};
      switch (sortBy) {
        case "rating":
          sortOptions = { averageRating: -1, totalReviews: -1 };
          break;
        case "price":
          sortOptions = { hourlyRate: 1 };
          break;
        case "experience":
          sortOptions = { experienceYears: -1 };
          break;
        case "relevance":
        default:
          sortOptions = { completedBookings: -1, averageRating: -1 };
          break;
      }

      // Phân trang
      const skip = (page - 1) * limit;

      // Thực hiện query
      const photographers = await Photographer.find(query)
        .populate("user", "avatar email fullName")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      // Tổng số kết quả
      const total = await Photographer.countDocuments(query);

      return {
        data: photographers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Search photographers failed: ${error.message}`);
    }
  }

  // Lấy tất cả photographers (có phân trang)
  async listPhotographers(options = {}) {
    try {
      const { page = 1, limit = 12, sortBy = "relevance" } = options;

      let sortOptions = {};
      switch (sortBy) {
        case "rating":
          sortOptions = { averageRating: -1, totalReviews: -1 };
          break;
        case "price":
          sortOptions = { hourlyRate: 1 };
          break;
        case "experience":
          sortOptions = { experienceYears: -1 };
          break;
        case "relevance":
        default:
          sortOptions = { completedBookings: -1, averageRating: -1 };
          break;
      }

      const skip = (page - 1) * limit;
      const photographers = await Photographer.find()
        .populate("user", "avatar email fullName")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Photographer.countDocuments();

      return {
        data: photographers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`List photographers failed: ${error.message}`);
    }
  }

  // Lấy chi tiết photographer
  async getPhotographerDetail(photographerId) {
    try {
      const photographer = await Photographer.findById(photographerId)
        .populate("user", "avatar email fullName phoneNumber");

      if (!photographer) {
        throw new Error("Photographer not found");
      }

      return photographer;
    } catch (error) {
      throw new Error(`Get photographer detail failed: ${error.message}`);
    }
  }

  // Lấy photographers theo user ID
  async getPhotographerByUserId(userId) {
    try {
      const photographer = await Photographer.findOne({ user: userId })
        .populate("user", "avatar email fullName phoneNumber address");

      return photographer;
    } catch (error) {
      throw new Error(`Get photographer by user ID failed: ${error.message}`);
    }
  }

  // Tạo photographer profile (khi user đăng ký là photographer)
  async createPhotographerProfile(userId, profileData) {
    try {
      const existingPhotographer = await Photographer.findOne({ user: userId });
      if (existingPhotographer) {
        throw new Error("Photographer profile already exists");
      }

      const photographer = new Photographer({
        ...profileData,
        user: userId,
        UUID: require("uuid").v4(),
      });

      await photographer.save();
      return photographer;
    } catch (error) {
      throw new Error(`Create photographer profile failed: ${error.message}`);
    }
  }

  // Cập nhật photographer profile
  async updatePhotographerProfile(photographerId, updateData) {
    try {
      const photographer = await Photographer.findByIdAndUpdate(
        photographerId,
        updateData,
        { new: true, runValidators: true }
      ).populate("user", "avatar email fullName");

      if (!photographer) {
        throw new Error("Photographer not found");
      }

      return photographer;
    } catch (error) {
      throw new Error(`Update photographer profile failed: ${error.message}`);
    }
  }

  // Lấy danh sách styles có sẵn
  async getAllPhotographyStyles() {
    try {
      const styles = await Photographer.distinct("styles");
      return styles.filter(Boolean).sort();
    } catch (error) {
      throw new Error(`Get photography styles failed: ${error.message}`);
    }
  }

  // Lấy danh sách locations có sẵn
  async getAllPhotographyLocations() {
    try {
      const locations = await Photographer.distinct("location");
      return locations.filter(Boolean).sort();
    } catch (error) {
      throw new Error(`Get photography locations failed: ${error.message}`);
    }
  }

  // Lấy top photographers (featured)
  async getTopPhotographers(limit = 6) {
    try {
      const photographers = await Photographer.find()
        .populate("user", "avatar email fullName")
        .sort({ averageRating: -1, totalReviews: -1 })
        .limit(parseInt(limit));

      return photographers;
    } catch (error) {
      throw new Error(`Get top photographers failed: ${error.message}`);
    }
  }
}

module.exports = new PhotographerService();
