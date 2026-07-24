// services/PhotographerService.js
const Photographer = require("../models/photographer");
const PhotographerVerification = require("../models/photographerVerification");
const PhotographerStyle = require("../models/photographerStyle.model");
const PhotographerCategory = require("../models/photographerCategory.model")
const StyleTag = require("../../common/models/styleTag");
const ShootingCategory = require("../../common/models/shootingCategory")
const { uploadBufferToCloudinary } = require("../../../utils/cloudinaryUpload");
const User = require("../../auth/models/User");
const mongoose = require("mongoose");
const path = require("path");
const fs = require('fs').promises;
const fsSync = require('fs');
class PhotographerService {
  // Lấy danh sách photographers với search & filter
  async searchPhotographers(filters = {}) {
    try {
      const {
        search = "",
        location = "",
        styles = [],
        categories = [],
        minRating = 0,
        minPrice = 0,
        maxPrice = Infinity,
        minExperience = 0,
        sortBy = "relevance",
        page = 1,
        limit = 12,
      } = filters;

      let query = { verificationStatus: "VERIFIED" };

      // Helper: Hàm kiểm tra và chuyển đổi giá trị sang ObjectId nếu có thể
      const toObjectId = (val) => {
        if (mongoose.Types.ObjectId.isValid(val)) {
          return new mongoose.Types.ObjectId(val);
        }
        return val; // Trả về nguyên bản nếu không phải ID (để tránh lỗi cast trực tiếp)
      };

      // Chuẩn hóa mảng styles/categories (đảm bảo là array)
      const styleArray = Array.isArray(styles) ? styles : [styles].filter(Boolean);
      const categoryArray = Array.isArray(categories) ? categories : [categories].filter(Boolean);

      // Xử lý Categories và Styles
      if (categoryArray.length > 0 || styleArray.length > 0) {
        let intersectionIds = null;

        if (categoryArray.length > 0) {
          const catIds = await PhotographerCategory.find({
            category: { $in: categoryArray.map(toObjectId) }
          }).distinct("photographer");
          intersectionIds = catIds;
        }

        if (styleArray.length > 0) {
          const styIds = await PhotographerStyle.find({
            styleTag: { $in: styleArray.map(toObjectId) }
          }).distinct("photographer");

          intersectionIds = intersectionIds
            ? intersectionIds.filter(id => styIds.some(s => s.toString() === id.toString()))
            : styIds;
        }

        if (intersectionIds !== null) {
          query._id = { $in: intersectionIds };
        }
      }

      // --- CÁC PHẦN CÒN LẠI GIỮ NGUYÊN ---
      if (search) {
        query.$or = [
          { displayName: { $regex: search, $options: "i" } },
          { bio: { $regex: search, $options: "i" } },
        ];
      }

      if (location) {
        query.location = { $regex: location, $options: "i" };
      }

      if (minRating > 0) query.averageRating = { $gte: parseFloat(minRating) };

      if (maxPrice !== Infinity || minPrice > 0) {
        query.hourlyRate = {};
        if (maxPrice !== Infinity) query.hourlyRate.$lte = parseFloat(maxPrice);
        if (minPrice > 0) query.hourlyRate.$gte = parseFloat(minPrice);
      }

      if (minExperience > 0) query.experienceYears = { $gte: parseInt(minExperience) };

      // Sắp xếp
      let sortOptions = { completedBookings: -1, averageRating: -1 };
      switch (sortBy) {
        case "rating": sortOptions = { averageRating: -1, totalReviews: -1 }; break;
        case "price": sortOptions = { hourlyRate: 1 }; break;
        case "experience": sortOptions = { experienceYears: -1 }; break;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      console.log("query =", query);
      const photographers = await Photographer.find(query)
        .populate("user", "avatar email fullName")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

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
      console.error("Lỗi chi tiết:", error);
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
      const photographers = await Photographer.find({ verificationStatus: "VERIFIED" })
        .populate("user", "avatar email fullName")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      const photographerIds =
        photographers.map(p => p._id);

      const styles =
        await PhotographerStyle.find({
          photographer: {
            $in: photographerIds
          }
        }).populate("styleTag");

      const categories =
        await PhotographerCategory.find({
          photographer: {
            $in: photographerIds
          }
        }).populate("category");

      const total = await Photographer.countDocuments({
        verificationStatus: "VERIFIED",
      });

      const photographersWithRelations =
        photographers.map(photo => ({
          ...photo.toObject(),

          styles: styles
            .filter(
              s =>
                s.photographer.toString() ===
                photo._id.toString()
            )
            .map(s => s.styleTag),

          categories: categories
            .filter(
              c =>
                c.photographer.toString() ===
                photo._id.toString()
            )
            .map(c => c.category),
        }));
      return {
        data: photographersWithRelations,

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
      const photographer =
        await Photographer.findById(photographerId)
          .populate(
            "user",
            "avatar email fullName phoneNumber"
          );

      if (!photographer) {
        throw new Error("Photographer not found");
      }

      const styles =
        await PhotographerStyle.find({
          photographer: photographerId,
        }).populate("styleTag");

      const categories =
        await PhotographerCategory.find({
          photographer: photographerId,
        }).populate("category");

      return {
        ...photographer.toObject(),
        styles: styles.map(s => s.styleTag),
        categories: categories.map(c => c.category),
      };
    } catch (error) {
      throw new Error(`Get photographer detail failed: ${error.message}`);
    }
  }

  // Lấy photographers theo user ID
  async getPhotographerByUserId(userId) {
    try {
      const photographer = await Photographer.findOne({
        user: userId,
      }).populate(
        "user",
        "avatar email fullName phoneNumber address"
      );

      if (!photographer) {
        return null;
      }
      const styles =
        await PhotographerStyle.find({
          photographer: photographer._id,
        }).populate("styleTag");

      const categories =
        await PhotographerCategory.find({
          photographer: photographer._id,
        }).populate("category");

      const verification =
        await PhotographerVerification.findOne({
          photographer: photographer._id,
        }).select(
          "documentType documentFrontUrl documentBackUrl status adminNote reviewedAt"
        );

      return {
        ...photographer.toObject(),
        styles: styles.map(s => s.styleTag),
        categories: categories.map(c => c.category),
        verification,
      };
    } catch (error) {
      throw new Error(
        `Get photographer by user ID failed: ${error.message}`
      );
    }
  }
  async createPhotographerProfile(
    userId,
    profileData
  ) {
    try {
      const existingPhotographer =
        await Photographer.findOne({
          user: userId,
        });

      if (existingPhotographer) {
        throw new Error(
          "Photographer profile already exists"
        );
      }

      const {
        styleIds,
        categoryIds,
        ...photographerData
      } = profileData;

      const photographer =
        await Photographer.create({
          ...photographerData,
          user: userId,
          UUID: require("uuid").v4(),
        });

      // tạo styles
      if (
        Array.isArray(styleIds) &&
        styleIds.length > 0
      ) {
        await PhotographerStyle.insertMany(
          styleIds.map(styleId => ({
            photographer: photographer._id,
            styleTag: styleId,
          }))
        );
      }

      // tạo categories
      if (
        Array.isArray(categoryIds) &&
        categoryIds.length > 0
      ) {
        await PhotographerCategory.insertMany(
          categoryIds.map(categoryId => ({
            photographer: photographer._id,
            category: categoryId,
          }))
        );
      }

      return photographer;
    } catch (error) {
      throw new Error(
        `Create photographer profile failed: ${error.message}`
      );
    }
  }

  async updatePhotographerProfile(
    photographerId,
    updateData
  ) {
    try {
      const {
        styleIds,
        categoryIds,
        ...photographerData
      } = updateData;

      const photographer =
        await Photographer.findByIdAndUpdate(
          photographerId,
          photographerData,
          {
            new: true,
            runValidators: true,
          }
        ).populate(
          "user",
          "avatar email fullName"
        );

      if (!photographer) {
        throw new Error("Photographer not found");
      }

      // update styles
      if (Array.isArray(styleIds)) {
        await PhotographerStyle.deleteMany({
          photographer: photographerId,
        });

        if (styleIds.length > 0) {
          await PhotographerStyle.insertMany(
            styleIds.map(styleId => ({
              photographer: photographerId,
              styleTag: styleId,
            }))
          );
        }
      }

      // update categories
      if (Array.isArray(categoryIds)) {
        await PhotographerCategory.deleteMany({
          photographer: photographerId,
        });

        if (categoryIds.length > 0) {
          await PhotographerCategory.insertMany(
            categoryIds.map(categoryId => ({
              photographer: photographerId,
              category: categoryId,
            }))
          );
        }
      }

      // ===== LOAD LẠI STYLES =====
      const styles = await PhotographerStyle.find({
        photographer: photographerId,
      }).populate("styleTag");

      // ===== LOAD LẠI CATEGORIES =====
      const categories =
        await PhotographerCategory.find({
          photographer: photographerId,
        }).populate("category");

      const result = photographer.toObject();

      result.styles = styles.map(item => item.styleTag);
      result.categories = categories.map(
        item => item.category
      );

      return result;

    } catch (error) {
      throw new Error(
        `Update photographer profile failed: ${error.message}`
      );
    }
  }

  // Lấy danh sách styles có sẵn
  async getAllPhotographyStyles() {
    try {
      const styles =
        await StyleTag.find({
          status: "ACTIVE",
        });
      return styles.filter(Boolean).sort();
    } catch (error) {
      throw new Error(`Get photography styles failed: ${error.message}`);
    }
  }

  // Lấy danh sách categories có sẵn
  async getAllPhotographyCategories() {
    try {
      const categories =
        await ShootingCategory.find({
          status: "ACTIVE",
        });
      return categories.filter(Boolean).sort();
    } catch (error) {
      throw new Error(`Get photography categories failed: ${error.message}`);
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

  async uploadVerification(userId, files) {
    try {
      const photographer = await Photographer.findOne({
        user: userId,
      });

      if (!photographer) {
        throw new Error("Photographer profile not found");
      }

      const frontImage = files?.frontImage?.[0];
      const backImage = files?.backImage?.[0];

      if (!frontImage) {
        throw new Error("Front image is required");
      }

      // Upload mặt trước
      const frontUpload = await uploadBufferToCloudinary(
        frontImage.buffer,
        frontImage.mimetype,
        {
          folder: "photographer-verifications/front",
          public_id: `${photographer._id}_front_${Date.now()}`,
        }
      );

      // Upload mặt sau (nếu có)
      let backUpload = null;

      if (backImage) {
        backUpload = await uploadBufferToCloudinary(
          backImage.buffer,
          backImage.mimetype,
          {
            folder: "photographer-verifications/back",
            public_id: `${photographer._id}_back_${Date.now()}`,
          }
        );
      }

      // Nếu đã từng upload thì xóa record cũ
      const oldVerification = await PhotographerVerification.findOne({
        photographer: photographer._id,
      });

      if (oldVerification) {
        await oldVerification.deleteOne();
      }

      // Tạo verification mới
      const verification = await PhotographerVerification.create({
        photographer: photographer._id,
        documentType: "CCCD",

        documentFrontUrl: frontUpload.secure_url,

        documentBackUrl: backUpload
          ? backUpload.secure_url
          : null,

        status: "PENDING",
      });

      photographer.verificationStatus = "PENDING";
      await photographer.save();

      return verification;
    } catch (error) {
      throw new Error(`Upload verification failed: ${error.message}`);
    }
  }
  
  async getProfileStatus(userId) {
    try {
      const photographer = await Photographer.findOne({
        user: userId,
      });

      if (!photographer) {
        throw new Error("Photographer profile not found");
      }

      const verification =
        await PhotographerVerification.findOne({
          photographer: photographer._id,
        });

      const missingFields = [];

      if (!photographer.displayName)
        missingFields.push("displayName");

      if (!photographer.bio)
        missingFields.push("bio");

      if (!photographer.location)
        missingFields.push("location");

      if (!photographer.equipment)
        missingFields.push("equipment");

      const categoriesCount =
        await PhotographerCategory.countDocuments({
          photographer: photographer._id,
        });

      if (categoriesCount === 0) {
        missingFields.push("categories");
      }

      const stylesCount =
        await PhotographerStyle.countDocuments({
          photographer: photographer._id,
        });

      if (stylesCount === 0) {
        missingFields.push("styles");
      }

      if (!photographer.hourlyRate) {
        missingFields.push("hourlyRate");
      }

      if (!verification) {
        missingFields.push("verification");
      }

      return {
        profileCompleted:
          missingFields.length === 0,

        verificationUploaded:
          !!verification,

        verificationStatus:
          photographer.verificationStatus,

        missingFields,
      };
    } catch (error) {
      throw new Error(
        `Get profile status failed: ${error.message}`
      );
    }
  }

}

module.exports = new PhotographerService();
