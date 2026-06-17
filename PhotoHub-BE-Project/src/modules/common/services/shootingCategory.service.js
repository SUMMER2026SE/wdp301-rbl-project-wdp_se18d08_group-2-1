const ShootingCategory = require("../models/shootingCategory");
const slugify = require("slugify");

class ShootingCategoryService {
    async createCategory(data) {
        // 1. Tự sinh slug nếu chưa có
        let baseSlug = data.slug?.trim()
            ? data.slug
            : slugify(data.name, {
                lower: true,
                strict: true,
                locale: "vi"
            });

        let slug = baseSlug;

        // 2. Check trùng slug -> nếu trùng thì thêm suffix
        let counter = 1;
        while (await ShootingCategory.exists({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        // 3. Check trùng name (option)
        const existingName = await ShootingCategory.findOne({ name: data.name });
        if (existingName) {
            throw new Error("Category name already exists");
        }

        // 4. Create
        return await ShootingCategory.create({
            ...data,
            slug
        });
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