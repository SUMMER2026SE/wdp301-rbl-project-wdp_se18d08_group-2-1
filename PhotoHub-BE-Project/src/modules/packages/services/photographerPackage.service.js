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
}

module.exports = new PhotographerPackageService();