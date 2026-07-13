const StyleTag = require("../models/styleTag.js");
const slugify = require("slugify");

const defaultStyleTags = [
    { name: "Natural Light", type: "STYLE", description: "Ánh sáng tự nhiên, mềm và thoáng" },
    { name: "Cinematic", type: "STYLE", description: "Màu phim, cảm xúc điện ảnh" },
    { name: "Editorial", type: "STYLE", description: "Chỉnh chu, sang trọng, tạp chí" },
    { name: "Minimalist", type: "STYLE", description: "Tối giản, sạch, ít chi tiết" },
    { name: "Vintage", type: "STYLE", description: "Hoài cổ, film, ấm áp" },
    { name: "Film Look", type: "STYLE", description: "Tông film cổ điển" },
    { name: "Soft Tone", type: "STYLE", description: "Mềm, nhẹ, dịu mắt" },
    { name: "Warm Tone", type: "COLOR", description: "Tông ấm, gần gũi" },
    { name: "Cool Tone", type: "COLOR", description: "Tông lạnh, hiện đại" },
    { name: "Dark Tone", type: "COLOR", description: "Bóng tối, dramatic" },
    { name: "Korean", type: "CONCEPT", description: "Trong trẻo, tinh tế, Hàn Quốc" },
    { name: "Boho", type: "CONCEPT", description: "Mộc mạc, tự do, tự nhiên" },
    { name: "Luxury", type: "CONCEPT", description: "Sang trọng, cao cấp" },
    { name: "Street", type: "MOOD", description: "Tự nhiên, đời thường, bắt khoảnh khắc" },
    { name: "Romantic", type: "MOOD", description: "Ngọt ngào, cảm xúc" },
    { name: "Commercial", type: "STYLE", description: "Phục vụ quảng cáo, sản phẩm" },
];

class StyleTagService {
    async ensureDefaultStyleTags() {
        for (const item of defaultStyleTags) {
            const slug = slugify(item.name, {
                lower: true,
                strict: true,
                locale: "vi"
            });

            const exists = await StyleTag.findOne({
                $or: [{ slug }, { name: item.name }],
            });

            if (!exists) {
                await StyleTag.create({
                    name: item.name,
                    slug,
                    type: item.type,
                    description: item.description,
                    status: "ACTIVE",
                });
            }
        }
    }

    async createStyleTag(data) {
        // 1. Check trùng name trước (đỡ tốn slug xử lý)
        const existingName = await StyleTag.findOne({ name: data.name });
        if (existingName) {
            throw new Error("Style tag name already exists");
        }

        // 2. Tự sinh slug nếu không có
        let baseSlug = data.slug?.trim()
            ? data.slug
            : slugify(data.name, {
                lower: true,
                strict: true,
                locale: "vi"
            });

        let slug = baseSlug;

        // 3. Tránh trùng slug
        let counter = 1;
        while (await StyleTag.exists({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        // 4. Create
        return await StyleTag.create({
            ...data,
            slug
        });
    }

    async getAllStyleTags() {
        await this.ensureDefaultStyleTags();
        return await StyleTag.find({
            status: "ACTIVE"
        }).sort({ createdAt: -1 });
    }

    async getStyleTagById(id) {
        const tag = await StyleTag.findById(id);

        if (!tag) {
            throw new Error("Style tag not found");
        }

        return tag;
    }

    async updateStyleTag(id, data) {
        const tag = await StyleTag.findById(id);

        if (!tag) {
            throw new Error("Style tag not found");
        }

        Object.assign(tag, data);

        await tag.save();

        return tag;
    }

    async deleteStyleTag(id) {
        const tag = await StyleTag.findById(id);

        if (!tag) {
            throw new Error("Style tag not found");
        }

        tag.status = "INACTIVE";

        await tag.save();

        return tag;
    }
}

module.exports = new StyleTagService();
