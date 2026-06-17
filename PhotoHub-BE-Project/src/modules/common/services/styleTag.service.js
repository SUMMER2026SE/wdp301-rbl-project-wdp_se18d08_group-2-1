const StyleTag = require("../models/styleTag.js");

class StyleTagService {
  async createStyleTag(data) {
    const existing = await StyleTag.findOne({
      $or: [
        { name: data.name },
        { slug: data.slug }
      ]
    });

    if (existing) {
      throw new Error("Style tag already exists");
    }

    return await StyleTag.create(data);
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