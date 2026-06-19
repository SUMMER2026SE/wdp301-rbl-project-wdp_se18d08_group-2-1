const mongoose = require("mongoose");

const communityCommentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

const communityPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 6000,
    },
    category: {
      type: String,
      enum: ["discussion", "question", "showcase", "tips", "gear", "behind_the_scenes", "job_story"],
      default: "discussion",
    },
    tags: {
      type: [String],
      default: [],
    },
    coverImage: {
      type: String,
      default: "",
    },
    attachments: {
      type: [String],
      default: [],
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: {
      type: [communityCommentSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["published", "hidden"],
      default: "published",
    },
  },
  { timestamps: true, collection: "community_posts" }
);

communityPostSchema.index({ title: "text", content: "text", tags: "text" });
communityPostSchema.index({ category: 1, createdAt: -1 });
communityPostSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.models.CommunityPost || mongoose.model("CommunityPost", communityPostSchema);
