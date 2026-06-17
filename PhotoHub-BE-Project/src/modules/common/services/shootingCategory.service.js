const ShootingCategory = require("../models/shootingCategory");

class ShootingCategoryService {
  async createCategory(data) {
    const existing = await ShootingCategory.findOne({
      $or: [
        { name: data.name },
        { slug: data.slug }
      ]
    });

    if (existing) {
      throw new Error("Category already exists");
    }

    return await ShootingCategory.create(data);
  }

  async getAllCategories() {
    return await ShootingCategory.find({
      status: "ACTIVE"
    }).sort({ createdAt: -1 });
  }

  async getCategoryById(id) {
    const category = await ShootingCategory.findById(id);

    if (!category) {
      throw new Error("Category not found");
    }

    return category;
  }

  async updateCategory(id, data) {
    const category = await ShootingCategory.findById(id);

    if (!category) {
      throw new Error("Category not found");
    }

    Object.assign(category, data);

    await category.save();

    return category;
  }

  async deleteCategory(id) {
    const category = await ShootingCategory.findById(id);

    if (!category) {
      throw new Error("Category not found");
    }

    category.status = "INACTIVE";

    await category.save();

    return category;
  }
}

module.exports = new ShootingCategoryService();