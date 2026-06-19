const CommunityPost = require("./community.model");
const cloudinary = require("../../config/cloudinary");

const uploadImageToCloudinary = async (file) => {
  if (!file) return "";

  const base64Image = file.buffer.toString("base64");
  const dataUri = `data:${file.mimetype};base64,${base64Image}`;

  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder: "photohub/community",
    resource_type: "image",
  });

  return uploaded.secure_url;
};

const sanitizeTags = (tags = []) => {
  if (typeof tags === "string") {
    tags = tags.split(",");
  }

  return [...new Set(
    (Array.isArray(tags) ? tags : [])
      .map((tag) => String(tag).trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 8)
  )];
};

const normalizePost = (post, viewerId = null) => {
  const object = post.toObject ? post.toObject() : post;
  const viewerKey = viewerId ? String(viewerId) : null;

  return {
    ...object,
    likesCount: object.likes?.length || 0,
    commentsCount: object.comments?.length || 0,
    savesCount: object.savedBy?.length || 0,
    likedByMe: viewerKey ? (object.likes || []).some((id) => String(id) === viewerKey) : false,
    savedByMe: viewerKey ? (object.savedBy || []).some((id) => String(id) === viewerKey) : false,
  };
};

class CommunityService {
  async listPosts(filters = {}, viewerId = null) {
    const { category, search, tag, sort = "latest", page = 1, limit = 12 } = filters;
    const query = { status: "published" };

    if (category && category !== "all") {
      query.category = category;
    }

    if (tag) {
      query.tags = String(tag).trim().toLowerCase();
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (filters.savedOnly === "true" || filters.savedOnly === true) {
      if (!viewerId) {
        throw new Error("Login required");
      }

      query.savedBy = viewerId;
    }

    const numericLimit = Math.min(Math.max(Number(limit) || 12, 1), 30);
    const numericPage = Math.max(Number(page) || 1, 1);
    const skip = (numericPage - 1) * numericLimit;
    const sortQuery = sort === "popular" ? { likes: -1, createdAt: -1 } : { createdAt: -1 };

    const [posts, total] = await Promise.all([
      CommunityPost.find(query)
        .populate("author", "fullName avatar role")
        .populate("comments.author", "fullName avatar role")
        .sort(sortQuery)
        .skip(skip)
        .limit(numericLimit),
      CommunityPost.countDocuments(query),
    ]);

    return {
      posts: posts.map((post) => normalizePost(post, viewerId)),
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        totalPages: Math.ceil(total / numericLimit),
      },
    };
  }

  async getPostById(id, viewerId = null) {
    const post = await CommunityPost.findById(id)
      .populate("author", "fullName avatar role")
      .populate("comments.author", "fullName avatar role");

    if (!post || post.status !== "published") {
      throw new Error("Community post not found");
    }

    return normalizePost(post, viewerId);
  }

  async createPost(authorId, payload, coverImageFile = null) {
    const { title, content, category } = payload;

    if (!authorId) {
      throw new Error("Login required");
    }

    if (!title || !content) {
      throw new Error("Title and content are required");
    }

    let coverImageUrl = payload.coverImage || "";

    if (coverImageFile) {
      coverImageUrl = await uploadImageToCloudinary(coverImageFile);
    }

    const post = new CommunityPost({
      author: authorId,
      title,
      content,
      category: category || "discussion",
      tags: sanitizeTags(payload.tags),
      coverImage: coverImageUrl,
      attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
    });

    await post.save();
    return await this.getPostById(post._id, authorId);
  }

  async toggleLike(postId, userId) {
    const post = await CommunityPost.findById(postId);
    if (!post || post.status !== "published") {
      throw new Error("Community post not found");
    }

    if (!Array.isArray(post.savedBy)) {
      post.savedBy = [];
    }

    const existingIndex = post.likes.findIndex((id) => String(id) === String(userId));
    if (existingIndex >= 0) {
      post.likes.splice(existingIndex, 1);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    return await this.getPostById(post._id, userId);
  }

  async toggleSave(postId, userId) {
    const post = await CommunityPost.findById(postId);
    if (!post || post.status !== "published") {
      throw new Error("Community post not found");
    }

    if (!userId) {
      throw new Error("Login required");
    }

    if (!Array.isArray(post.savedBy)) {
      post.savedBy = [];
    }

    const existingIndex = post.savedBy.findIndex((id) => String(id) === String(userId));
    if (existingIndex >= 0) {
      post.savedBy.splice(existingIndex, 1);
    } else {
      post.savedBy.push(userId);
    }

    await post.save();
    return await this.getPostById(post._id, userId);
  }
  async addComment(postId, userId, content, parentComment = null) {
    if (!userId) {
      throw new Error("Login required");
    }

    if (!content || !String(content).trim()) {
      throw new Error("Comment content is required");
    }

    const post = await CommunityPost.findById(postId);
    if (!post || post.status !== "published") {
      throw new Error("Community post not found");
    }

    let parentId = null;
    if (parentComment) {
      const parent = post.comments.id(parentComment);
      if (!parent) {
        throw new Error("Parent comment not found");
      }
      parentId = parent._id;
    }

    post.comments.push({
      author: userId,
      content: String(content).trim(),
      parentComment: parentId,
    });
    await post.save();
    return await this.getPostById(post._id, userId);
  }

  async deletePost(postId, user) {
    const post = await CommunityPost.findById(postId);
    if (!post || post.status !== "published") {
      throw new Error("Community post not found");
    }

    const canDelete = String(post.author) === String(user.id) || ["admin", "manager"].includes(user.role);
    if (!canDelete) {
      throw new Error("You are not authorized to delete this post");
    }

    post.status = "hidden";
    await post.save();
    return { id: post._id };
  }
}

module.exports = new CommunityService();
