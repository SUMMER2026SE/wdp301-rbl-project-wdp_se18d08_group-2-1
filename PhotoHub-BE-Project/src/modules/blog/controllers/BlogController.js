const BlogPost = require("../models/BlogPost");
const ApiResponse = require("../../../utils/ApiResponse");

class BlogController {
  async listBlogs(req, res) {
    try {
      const { search, tag } = req.query;
      const query = {};

      if (search) {
        query.$or = [
          { title: new RegExp(search, "i") },
          { content: new RegExp(search, "i") },
        ];
      }

      if (tag) {
        query.tags = tag;
      }

      const posts = await BlogPost.find(query)
        .populate("author", "fullName email avatar")
        .sort({ createdAt: -1 });

      return ApiResponse.success(res, posts, "Get blog list successful");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getBlogDetail(req, res) {
    try {
      const post = await BlogPost.findById(req.params.id).populate("author", "fullName email avatar");
      if (!post) {
        return ApiResponse.error(res, "Blog post not found", 404);
      }
      return ApiResponse.success(res, post, "Get blog detail successful");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async createBlog(req, res) {
    try {
      const { title, content, coverImage, tags } = req.body;
      const author = req.user.id || req.user._id;

      if (!title || !content) {
        return ApiResponse.error(res, "Title and content are required", 400);
      }

      const blog = new BlogPost({
        title,
        content,
        author,
        coverImage,
        tags: Array.isArray(tags) ? tags : String(tags || "").split(",").map(t => t.trim()).filter(Boolean),
      });

      await blog.save();
      const populatedBlog = await BlogPost.findById(blog._id).populate("author", "fullName email avatar");
      return ApiResponse.success(res, populatedBlog, "Blog post created successfully", 201);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async likeBlog(req, res) {
    try {
      const blog = await BlogPost.findById(req.params.id);
      if (!blog) {
        return ApiResponse.error(res, "Blog post not found", 404);
      }
      blog.likesCount = (blog.likesCount || 0) + 1;
      await blog.save();
      const populatedBlog = await BlogPost.findById(blog._id).populate("author", "fullName email avatar");
      return ApiResponse.success(res, populatedBlog, "Blog post liked successfully");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }
}

module.exports = new BlogController();
