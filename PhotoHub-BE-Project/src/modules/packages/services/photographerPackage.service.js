const mongoose = require("mongoose");

const PhotographerPackage = require("../models/photographerPackage.model");
const PackageCategory = require("../models/packageCategory.model");
const PackageStyle = require("../models/packageStyle.model");
const PackageImage = require("../models/packageImage.model");
const SubscriptionPackage = require("../../subscriptions/models/subscriptionPackage.model");

const ShootingCategory = require("../../common/models/shootingCategory");
const StyleTag = require("../../common/models/styleTag");


const normalizeImageUrls = (images = []) => {
  if (!Array.isArray(images)) return [];

  return images
    .map((image) => {
      if (!image) return "";
      if (typeof image === "string") return image;
      return image.imageUrl || image.secure_url || image.url || "";
    })
    .map((url) => String(url || "").trim())
    .filter(Boolean)
    .filter((url, index, arr) => arr.indexOf(url) === index);
};

const syncSubscriptionPackageFromPhotographerPackage = async ({ packageDoc, session }) => {
  if (!packageDoc) return null;

  const sourcePackageId = String(packageDoc._id);
  const isMonthly = String(packageDoc.packageType || "SHOOTING").toUpperCase() === "MONTHLY";
  const codeSuffix = sourcePackageId.slice(-8).toUpperCase();
  const query = {
    "metadata.source": "PHOTOGRAPHER_PACKAGE",
    "metadata.sourcePackageId": sourcePackageId,
  };

  if (!isMonthly) {
    await SubscriptionPackage.updateOne(query, { $set: { isActive: false } }, session ? { session } : undefined);
    return null;
  }

  const payload = {
    code: `MP-${codeSuffix}`,
    slug: `monthly-${codeSuffix.toLowerCase()}`,
    name: packageDoc.title,
    description: packageDoc.description || "",
    billingType: "MONTHLY",
    monthlyPrice: Number(packageDoc.price || 0),
    perSessionPrice: 0,
    sessionsPerMonth: Math.max(1, Number(packageDoc.numberOfPhotos || 1)),
    commitmentMonths: Math.max(1, Number(packageDoc.durationHours || 1)),
    maxPauseDays: 30,
    autoRenewDefault: true,
    features: [
      "Created from photographer package",
      `Location: ${packageDoc.locationType || "ANY"}`,
    ],
    isActive: packageDoc.status !== "DELETED" && packageDoc.status !== "INACTIVE",
    sortOrder: 1000,
    metadata: {
      source: "PHOTOGRAPHER_PACKAGE",
      sourcePackageId,
      photographerId: String(packageDoc.photographerId || ""),
      packageType: packageDoc.packageType || "SHOOTING",
      locationType: packageDoc.locationType || "ANY",
      isFeatured: Boolean(packageDoc.isFeatured),
    },
  };

  const existing = await SubscriptionPackage.findOne(query).session(session || null);
  if (existing) {
    Object.assign(existing, payload);
    await existing.save(session ? { session } : undefined);
    return existing;
  }

  return await SubscriptionPackage.create([payload], session ? { session } : undefined).then((items) => items[0]);
};

class PhotographerPackageService {
  async createPackage(data, photographerId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        title,
        description,
        packageType = "SHOOTING",
        price,
        durationHours,
        numberOfPhotos,
        editedPhotos,
        locationType,
        status,
        isFeatured,
        isGroupPackage,
        categoryIds = [],
        styleTagIds = [],
        images = []
      } = data;

      // 1. Create package
      // ─── Rule: Gói MONTHLY không được phép dùng cho Group Booking ───
      const resolvedIsGroupPackage = packageType === "MONTHLY" ? false : !!isGroupPackage;

      const pkg = await PhotographerPackage.create(
        [
          {
            photographerId,
            title,
            description,
            packageType,
            price,
            durationHours,
            numberOfPhotos,
            editedPhotos,
            locationType,
            status,
            isFeatured,
            isGroupPackage: resolvedIsGroupPackage,
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
      const imageUrls = normalizeImageUrls(images);
      if (imageUrls.length) {
        await PackageImage.insertMany(
          imageUrls.map((url) => ({
            packageId,
            imageUrl: url
          })),
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      await syncSubscriptionPackageFromPhotographerPackage({ packageDoc: pkg[0] });

      return pkg[0];
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  async getMyPackages(photographerId, filters = {}) {
    const { categoryIds = [], styleTagIds = [], isGroupPackage, packageType } = filters;

    const matchStage = {
      photographerId: new mongoose.Types.ObjectId(photographerId),
      isDeleted: { $ne: true },
      status: { $ne: "DELETED" }
    };

    // Filter isGroupPackage nếu được truyền vào (true hoặc false)
    if (isGroupPackage !== undefined && isGroupPackage !== null) {
      const isGroup = isGroupPackage === true || isGroupPackage === "true";
      if (isGroup) {
        // Chỉ lấy package có isGroupPackage: true
        matchStage.isGroupPackage = true;
      } else {
        // Lấy package false + các package CŨ chưa có field này (null/undefined)
        matchStage.isGroupPackage = { $ne: true };
      }
    }

    if (packageType === "MONTHLY") {
      matchStage.packageType = "MONTHLY";
    } else if (packageType === "SHOOTING") {
      matchStage.$or = [
        { packageType: "SHOOTING" },
        { packageType: { $exists: false } },
        { packageType: null },
      ];
    }

    const pipeline = [
      // 1. base match
      {
        $match: matchStage
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

    // 4. FILTER CATEGORY (chuáº©n hÆ¡n báº±ng $expr + $in)
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

    // 5. FILTER STYLE (chuáº©n hÆ¡n)
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
   * Lấy tất cả package nhóm ACTIVE từ mọi photographer.
   * Dùng cho CreateGroupModal — không cần authenticate.
   * Nếu truyền photographerId thì filter theo photographer đó.
   */
  async getAllGroupPackages({ photographerId } = {}) {
    const match = {
      isGroupPackage: true,
      status: "ACTIVE",
      isDeleted: { $ne: true },
      status: { $ne: "DELETED" }
    };
    if (photographerId) {
      match.photographerId = new mongoose.Types.ObjectId(photographerId);
    }

    return await PhotographerPackage.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "photographers",
          localField: "photographerId",
          foreignField: "_id",
          as: "photographerInfo",
        },
      },
      {
        $addFields: {
          photographer: { $arrayElemAt: ["$photographerInfo", 0] },
        },
      },
      { $project: { photographerInfo: 0 } },
      { $sort: { createdAt: -1 } },
    ]);
  }

  /**
   * 2. Cáº¬P NHáº¬T PACKAGE (Bao gá»“m Ä‘á»“ng bá»™ láº¡i Categories, Styles vĂ  Images)
   */
  async updatePackage(packageId, data) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        title,
        description,
        packageType,
        price,
        durationHours,
        numberOfPhotos,
        editedPhotos,
        locationType,
        status,
        isFeatured,
        isGroupPackage,
        categoryIds,
        styleTagIds,
        images
      } = data;

      const updateData = {
        title,
        description,
        price,
        durationHours,
        numberOfPhotos,
        editedPhotos,
        locationType,
        status,
        isFeatured,
      };

      if (packageType !== undefined) {
        updateData.packageType = packageType;
      }

      if (isGroupPackage !== undefined) {
        // ─── Rule: Gói MONTHLY không được phép dùng cho Group Booking ───
        const resolvedType = updateData.packageType ?? packageType;
        updateData.isGroupPackage = resolvedType === "MONTHLY" ? false : !!isGroupPackage;
      } else if (updateData.packageType === "MONTHLY") {
        // Nếu đang chuyển sang MONTHLY nhưng không gửi isGroupPackage → tự động tắt
        updateData.isGroupPackage = false;
      }

      const updatedPkg = await PhotographerPackage.findByIdAndUpdate(
        packageId,
        {
          $set: updateData
        },
        { new: true, session }
      );

      if (!updatedPkg) throw new Error("Package khĂ´ng tá»“n táº¡i");

      // Ä á»“ng bá»™ hĂ³a danh má»¥c náº¿u Ä‘Æ°á»£c gá»­i lĂªn
      if (categoryIds !== undefined) {
        await PackageCategory.deleteMany({ packageId }, { session });
        if (categoryIds.length > 0) {
          const categories = await ShootingCategory.find({ _id: { $in: categoryIds } });
          if (categories.length !== categoryIds.length) throw new Error("MĂ£ danh má»¥c khĂ´ng há»£p lá»‡");

          await PackageCategory.insertMany(
            categoryIds.map(id => ({ packageId, categoryId: id })),
            { session }
          );
        }
      }

      // Äá»“ng bá»™ hĂ³a phong cĂ¡ch náº¿u Ä‘Æ°á»£c gá»­i lĂªn
      if (styleTagIds !== undefined) {
        await PackageStyle.deleteMany({ packageId }, { session });
        if (styleTagIds.length > 0) {
          const styles = await StyleTag.find({ _id: { $in: styleTagIds } });
          if (styles.length !== styleTagIds.length) throw new Error("MĂ£ phong cĂ¡ch khĂ´ng há»£p lá»‡");

          await PackageStyle.insertMany(
            styleTagIds.map(id => ({ packageId, styleTagId: id })),
            { session }
          );
        }
      }

      // Äá»“ng bá»™ hĂ³a áº£nh náº¿u Ä‘Æ°á»£c gá»­i lĂªn
      if (images !== undefined) {
        await PackageImage.deleteMany({ packageId }, { session });
        const imageUrls = normalizeImageUrls(images);
        if (imageUrls.length > 0) {
          await PackageImage.insertMany(
            imageUrls.map(url => ({ packageId, imageUrl: url })),
            { session }
          );
        }
      }

      await session.commitTransaction();
      session.endSession();

      await syncSubscriptionPackageFromPhotographerPackage({ packageDoc: updatedPkg });

      return updatedPkg;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * 3. SOFT-DELETE PACKAGE (XĂ³a táº¡m thá»i bĂ i viáº¿t)
   */
  async softDeletePackage(packageId) {
    const pkg = await PhotographerPackage.findByIdAndUpdate(
      packageId,
      { $set: { isDeleted: true, status: "DELETED" } },
      { new: true }
    );
    if (!pkg) throw new Error("Package khong ton tai");
    await syncSubscriptionPackageFromPhotographerPackage({ packageDoc: { ...pkg.toObject(), status: "DELETED" } });
    return { success: true, message: "Da xoa tam thoi goi dich vu" };
  }

  /**
   * 4. Báº¬T/Táº®T TRáº NG THĂI HOáº T Äá»˜NG (Toggle active status)
   */
  async toggleStatusPackage(packageId) {
    const currentPkg = await PhotographerPackage.findById(packageId);
    if (!currentPkg) throw new Error("Package khĂ´ng tá»“n táº¡i");

    // Äáº£o ngÆ°á»£c tráº¡ng thĂ¡i hoáº¡t Ä‘á»™ng hiá»‡n táº¡i (VĂ­ dá»¥: "ACTIVE" <=> "INACTIVE")
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
