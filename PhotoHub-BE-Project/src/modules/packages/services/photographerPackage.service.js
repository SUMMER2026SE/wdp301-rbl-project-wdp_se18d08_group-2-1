const mongoose = require("mongoose");

const PhotographerPackage = require("../models/photographerPackage.model");
const PackageCategory = require("../models/packageCategory.model");
const PackageStyle = require("../models/packageStyle.model");
const PackageImage = require("../models/packageImage.model");

const ShootingCategory = require("../../common/models/shootingCategory");
const StyleTag = require("../../common/models/styleTag");

class PhotographerPackageService {
  async createPackage(data, photographerId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        title,
        description,
        price,
        durationHours,
        numberOfPhotos,
        editedPhotos,
        locationType,
        status,
        isFeatured,
        categoryIds = [],
        styleTagIds = [],
        images = []
      } = data;

      // 1. Create package
      const pkg = await PhotographerPackage.create(
        [
          {
            photographerId,
            title,
            description,
            price,
            durationHours,
            numberOfPhotos,
            editedPhotos,
            locationType,
            status,
            isFeatured
          }
        ],
        { session }
      );

      const packageId = pkg[0]._id;

      // 2. Validate categories
      if (categoryIds.length) {
        const categories = await ShootingCategory.find({
          _id: { $in: categoryIds }
        });

        if (categories.length !== categoryIds.length) {
          throw new Error("Invalid categoryIds");
        }

        await PackageCategory.insertMany(
          categoryIds.map((categoryId) => ({
            packageId,
            categoryId
          })),
          { session }
        );
      }

      // 3. Validate styles
      if (styleTagIds.length) {
        const styles = await StyleTag.find({
          _id: { $in: styleTagIds }
        });

        if (styles.length !== styleTagIds.length) {
          throw new Error("Invalid styleTagIds");
        }

        await PackageStyle.insertMany(
          styleTagIds.map((styleTagId) => ({
            packageId,
            styleTagId
          })),
          { session }
        );
      }

      // 4. Images
      if (images.length) {
        await PackageImage.insertMany(
          images.map((url) => ({
            packageId,
            imageUrl: url
          })),
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      return pkg[0];
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  async getMyPackages(photographerId, filters = {}) {
    const { categoryIds = [], styleTagIds = [] } = filters;

    const pipeline = [
      // 1. base match
      {
        $match: {
          photographerId: new mongoose.Types.ObjectId(photographerId),
          isDeleted: { $ne: true }
        }
      },

      // 2. categories mapping
      {
        $lookup: {
          from: "packagecategories",
          localField: "_id",
          foreignField: "packageId",
          as: "pkgCategories"
        }
      },

      // 3. styles mapping
      {
        $lookup: {
          from: "packagestyles",
          localField: "_id",
          foreignField: "packageId",
          as: "pkgStyles"
        }
      }
    ];

    // 4. FILTER CATEGORY (chuẩn hơn bằng $expr + $in)
    if (categoryIds.length > 0) {
      const catIds = categoryIds.map(id => new mongoose.Types.ObjectId(id));

      pipeline.push({
        $match: {
          pkgCategories: {
            $elemMatch: {
              categoryId: { $in: catIds }
            }
          }
        }
      });
    }

    // 5. FILTER STYLE (chuẩn hơn)
    if (styleTagIds.length > 0) {
      const styleIds = styleTagIds.map(id => new mongoose.Types.ObjectId(id));

      pipeline.push({
        $match: {
          pkgStyles: {
            $elemMatch: {
              styleTagId: { $in: styleIds }
            }
          }
        }
      });
    }

    // 6. JOIN images + category + style details
    pipeline.push(
      {
        $lookup: {
          from: "packageimages",
          localField: "_id",
          foreignField: "packageId",
          as: "images"
        }
      },

      // categories detail
      {
        $lookup: {
          from: "shootingcategories",
          localField: "pkgCategories.categoryId",
          foreignField: "_id",
          as: "categories"
        }
      },

      // styles detail
      {
        $lookup: {
          from: "styletags",
          localField: "pkgStyles.styleTagId",
          foreignField: "_id",
          as: "styles"
        }
      },

      // 7. sort
      {
        $sort: { createdAt: -1 }
      },

      // 8. clean output
      {
        $project: {
          pkgCategories: 0,
          pkgStyles: 0
        }
      }
    );

    return await PhotographerPackage.aggregate(pipeline);
  }

  /**
   * 2. CẬP NHẬT PACKAGE (Bao gồm đồng bộ lại Categories, Styles và Images)
   */
  async updatePackage(packageId, data) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        title,
        description,
        price,
        durationHours,
        numberOfPhotos,
        editedPhotos,
        locationType,
        status,
        isFeatured,
        categoryIds,
        styleTagIds,
        images
      } = data;

      // Tìm và cập nhật các thông tin cơ bản của Package
      const updatedPkg = await PhotographerPackage.findByIdAndUpdate(
        packageId,
        {
          $set: {
            title,
            description,
            price,
            durationHours,
            numberOfPhotos,
            editedPhotos,
            locationType,
            status,
            isFeatured
          }
        },
        { new: true, session }
      );

      if (!updatedPkg) throw new Error("Package không tồn tại");

      // Đồng bộ hóa danh mục nếu được gửi lên
      if (categoryIds !== undefined) {
        await PackageCategory.deleteMany({ packageId }, { session });
        if (categoryIds.length > 0) {
          const categories = await ShootingCategory.find({ _id: { $in: categoryIds } });
          if (categories.length !== categoryIds.length) throw new Error("Mã danh mục không hợp lệ");

          await PackageCategory.insertMany(
            categoryIds.map(id => ({ packageId, categoryId: id })),
            { session }
          );
        }
      }

      // Đồng bộ hóa phong cách nếu được gửi lên
      if (styleTagIds !== undefined) {
        await PackageStyle.deleteMany({ packageId }, { session });
        if (styleTagIds.length > 0) {
          const styles = await StyleTag.find({ _id: { $in: styleTagIds } });
          if (styles.length !== styleTagIds.length) throw new Error("Mã phong cách không hợp lệ");

          await PackageStyle.insertMany(
            styleTagIds.map(id => ({ packageId, styleTagId: id })),
            { session }
          );
        }
      }

      // Đồng bộ hóa ảnh nếu được gửi lên
      if (images !== undefined) {
        await PackageImage.deleteMany({ packageId }, { session });
        if (images.length > 0) {
          await PackageImage.insertMany(
            images.map(url => ({ packageId, imageUrl: url })),
            { session }
          );
        }
      }

      await session.commitTransaction();
      session.endSession();

      return updatedPkg;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * 3. SOFT-DELETE PACKAGE (Xóa tạm thời bài viết)
   */
  async softDeletePackage(packageId) {
    const pkg = await PhotographerPackage.findByIdAndUpdate(
      packageId,
      { $set: { isDeleted: true } },
      { new: true }
    );
    if (!pkg) throw new Error("Package không tồn tại");
    return { success: true, message: "Đã xóa tạm thời gói dịch vụ" };
  }

  /**
   * 4. BẬT/TẮT TRẠNG THÁI HOẠT ĐỘNG (Toggle active status)
   */
  async toggleStatusPackage(packageId) {
    const currentPkg = await PhotographerPackage.findById(packageId);
    if (!currentPkg) throw new Error("Package không tồn tại");

    // Đảo ngược trạng thái hoạt động hiện tại (Ví dụ: "ACTIVE" <=> "INACTIVE")
    const nextStatus = currentPkg.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const updatedPkg = await PhotographerPackage.findByIdAndUpdate(
      packageId,
      { $set: { status: nextStatus } },
      { new: true }
    );

    return updatedPkg;
  }

  async getPackageDetail(packageId) {
    const result = await PhotographerPackage.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(packageId),
          isDeleted: { $ne: true }
        }
      },

      // ===================== IMAGES =====================
      {
        $lookup: {
          from: "packageimages",
          localField: "_id",
          foreignField: "packageId",
          as: "images"
        }
      },

      // ===================== CATEGORIES JOIN =====================
      {
        $lookup: {
          from: "packagecategories",
          localField: "_id",
          foreignField: "packageId",
          as: "categoryLinks"
        }
      },

      {
        $lookup: {
          from: "shootingcategories",
          localField: "categoryLinks.categoryId",
          foreignField: "_id",
          as: "categories"
        }
      },

      // ===================== STYLES JOIN =====================
      {
        $lookup: {
          from: "packagestyles",
          localField: "_id",
          foreignField: "packageId",
          as: "styleLinks"
        }
      },

      {
        $lookup: {
          from: "styletags",
          localField: "styleLinks.styleTagId",
          foreignField: "_id",
          as: "styles"
        }
      },

      // ===================== CLEAN DATA =====================
      {
        $project: {
          categoryLinks: 0,
          styleLinks: 0
        }
      }
    ]);

    return result.length > 0 ? result[0] : null;
  }
}

module.exports = new PhotographerPackageService();