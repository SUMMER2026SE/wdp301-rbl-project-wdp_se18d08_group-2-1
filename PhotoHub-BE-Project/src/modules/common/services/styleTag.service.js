const StyleTag = require("../models/styleTag.js");
const slugify = require("slugify");

class StyleTagService {
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