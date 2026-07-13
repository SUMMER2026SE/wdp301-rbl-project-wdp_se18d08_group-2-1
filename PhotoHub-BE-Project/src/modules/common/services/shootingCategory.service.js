const ShootingCategory = require("../models/shootingCategory");
const slugify = require("slugify");

const defaultCategories = [
    { name: "Wedding", description: "Gói chụp cưới, lễ hỏi, pre-wedding" },
    { name: "Portrait", description: "Chân dung cá nhân, profile, lifestyle" },
    { name: "Event", description: "Sự kiện, hội nghị, khai trương" },
    { name: "Family", description: "Gia đình, em bé, ảnh kỷ niệm" },
    { name: "Graduation", description: "Tốt nghiệp, kỷ yếu, lớp học" },
    { name: "Couple", description: "Cặp đôi, engagement, anniversary" },
    { name: "Maternity", description: "Bầu, newborn, gia đình nhỏ" },
    { name: "Product", description: "Sản phẩm, thương mại, catalog" },
    { name: "Fashion", description: "Thời trang, lookbook, editorial" },
    { name: "Street", description: "Street life, documentary, candid" },
    { name: "Corporate", description: "Doanh nghiệp, profile công ty" },
    { name: "Travel", description: "Du lịch, trải nghiệm, vacation" },
    { name: "Food", description: "Ẩm thực, menu, nhà hàng" },
    { name: "Architecture", description: "Kiến trúc, nội thất, không gian" },
    { name: "Nature", description: "Thiên nhiên, landscape, outdoor" },
];

class ShootingCategoryService {
    async ensureDefaultCategories() {
        for (const item of defaultCategories) {
            const slug = slugify(item.name, {
                lower: true,
                strict: true,
                locale: "vi"
            });

            const exists = await ShootingCategory.findOne({
                $or: [{ slug }, { name: item.name }],
            });

            if (!exists) {
                await ShootingCategory.create({
                    name: item.name,
                    slug,
                    description: item.description,
                    status: "ACTIVE",
                });
            }
        }
    }

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
        await this.ensureDefaultCategories();
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
