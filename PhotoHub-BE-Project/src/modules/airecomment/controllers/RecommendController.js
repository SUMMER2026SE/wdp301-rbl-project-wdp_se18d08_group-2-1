// src/modules/airecomment/controllers/RecommendController.js

const Portfolio = require("../models/portfolio");
const { generateEmbedding } = require("../services/aiService");

/**
 * POST /api/airecommend/search
 */
const recommendPhotographers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng upload ảnh mẫu để tìm kiếm (field name: 'image')",
      });
    }

    const rawBudget = req.body.maxBudget;
    const maxBudget = rawBudget !== undefined ? Number(rawBudget) : null;

    if (maxBudget !== null && (isNaN(maxBudget) || maxBudget < 0)) {
      return res.status(400).json({
        success: false,
        message: "maxBudget phải là số không âm",
      });
    }

    const limit = Math.min(parseInt(req.body.limit) || 5, 20);

    console.log(
      `[Recommend] Đang xử lý ảnh: ${req.file.originalname} ` +
      `(${(req.file.size / 1024).toFixed(1)} KB) ` +
      `| maxBudget: ${maxBudget ? maxBudget.toLocaleString("vi-VN") + " VNĐ" : "Không giới hạn"} ` +
      `| Limit: ${limit}`
    );

    const queryVector = await generateEmbedding(
      req.file.buffer,
      req.file.mimetype
    );

    console.log("[Recommend] ✅ Query vector đã sinh xong, đang tìm kiếm...");

    const vectorSearchStage = {
      $vectorSearch: {
        index: "portfolio_vector_index",
        path: "embedding",
        queryVector,
        numCandidates: limit * 15,
        limit: limit * 3,
      },
    };

    if (maxBudget !== null) {
      vectorSearchStage.$vectorSearch.filter = {
        price_package: { $lte: maxBudget },
      };
    }

    const aggregatePipeline = [
      vectorSearchStage,
      {
        $addFields: {
          similarity_score: { $meta: "vectorSearchScore" },
        },
      },
      {
        $lookup: {
          from: "photographers",
          localField: "photographer",
          foreignField: "_id",
          as: "photographerInfo",
          pipeline: [
            {
              $project: {
                _id: 1,
                displayName: 1,
                location: 1,
                styles: 1,
                averageRating: 1,
                completedBookings: 1,
                totalReviews: 1,
                hourlyRate: 1,
                bio: 1,
                verificationStatus: 1,
                isAvailable: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$photographerInfo",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: 1,
          image_url: 1,
          caption: 1,
          price_package: 1,
          similarity_score: 1,
          photographer: 1,
          photographerInfo: 1,
          createdAt: 1,
        },
      },
    ];

    const rawResults = await Portfolio.aggregate(aggregatePipeline);

    const photographerMap = new Map();

    for (const item of rawResults) {
      const pgId = item.photographer.toString();
      if (!photographerMap.has(pgId)) {
        photographerMap.set(pgId, item);
      }
      else if (item.similarity_score > photographerMap.get(pgId).similarity_score) {
        photographerMap.set(pgId, item);
      }
    }

    const uniqueResults = Array.from(photographerMap.values())
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit);

    console.log(
      `[Recommend] ✅ Tìm thấy ${uniqueResults.length} photographer phù hợp ` +
      `(từ ${rawResults.length} ảnh portfolio)`
    );

    return res.status(200).json({
      success: true,
      message: `Tìm thấy ${uniqueResults.length} nhiếp ảnh gia phù hợp`,
      data: {
        total: uniqueResults.length,
        maxBudget,
        results: uniqueResults.map((item) => ({
          portfolio: {
            _id: item._id,
            image_url: item.image_url,
            caption: item.caption,
            price_package: item.price_package,
            match_percent: Math.round(item.similarity_score * 100),
          },
          photographer: item.photographerInfo,
        })),
      },
    });
  } catch (err) {
    console.error("[Recommend] ❌ Lỗi:", err.message);

    if (
      err.message?.includes("$vectorSearch") ||
      err.message?.includes("vectorSearch") ||
      err.message?.includes("index")
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Vector Search Index chưa sẵn sàng. " +
          "Hãy chắc chắn index 'portfolio_vector_index' đã được tạo và có status READY trên MongoDB Atlas.",
        hint: "Xem hướng dẫn tạo index tại: README.md → Mục Vector Search Setup",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xử lý tìm kiếm AI",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

module.exports = { recommendPhotographers };
