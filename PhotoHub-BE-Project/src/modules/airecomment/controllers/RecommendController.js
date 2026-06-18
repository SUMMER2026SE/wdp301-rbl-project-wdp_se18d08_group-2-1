// src/modules/airecomment/controllers/RecommendController.js

const PortfolioImage = require("../models/portfolioImage");
const Portfolio = require("../models/portfolio"); // legacy fallback
const { generateEmbedding } = require("../services/aiService");

/**
 * POST /api/airecommend/search
 * Tìm kiếm nhiếp ảnh gia phù hợp dựa trên ảnh mẫu của người dùng.
 * Tìm kiếm trong collection portfolio_images (mới) với Vector Search.
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

    const queryVector = await generateEmbedding(req.file.buffer, req.file.mimetype);
    console.log("[Recommend] ✅ Query vector đã sinh xong, đang tìm kiếm...");

    // ── Thử tìm kiếm trong portfolio_images (mới) ──────────────────────────
    let uniqueResults = [];
    let searchedIn = "portfolio_images";

    try {
      uniqueResults = await searchInPortfolioImages(queryVector, maxBudget, limit);
    } catch (vectorErr) {
      console.warn("[Recommend] ⚠️ Vector search portfolio_images thất bại, thử legacy portfolios:", vectorErr.message);
      // Fallback sang collection portfolios cũ
      try {
        uniqueResults = await searchInLegacyPortfolios(queryVector, maxBudget, limit);
        searchedIn = "portfolios (legacy)";
      } catch (legacyErr) {
        throw legacyErr; // Re-throw để bắt ở catch ngoài
      }
    }

    console.log(
      `[Recommend] ✅ Tìm thấy ${uniqueResults.length} photographer (collection: ${searchedIn})`
    );

    if (uniqueResults.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Không tìm thấy nhiếp ảnh gia phù hợp với bạn",
        data: {
          total: 0,
          maxBudget,
          results: [],
        },
      });
    }

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
            // price_package lấy từ album nếu có, nếu không thì từ item
            price_package: item.albumInfo?.price_package ?? item.price_package,
            match_percent: Math.round(item.similarity_score * 100),
            // Thông tin album (nếu có)
            album: item.albumInfo
              ? {
                  _id: item.albumInfo._id,
                  title: item.albumInfo.title,
                  category: item.albumInfo.category,
                  styleTags: item.albumInfo.styleTags,
                }
              : null,
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
          "Hãy chắc chắn index 'portfolio_image_vector_index' đã được tạo và có status READY trên MongoDB Atlas.",
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

/**
 * Tìm kiếm trong collection portfolio_images (MỚI)
 * Vector index name: "portfolio_image_vector_index"
 */
async function searchInPortfolioImages(queryVector, maxBudget, limit) {
  const vectorSearchStage = {
    $vectorSearch: {
      index: "portfolio_image_vector_index",
      path: "embedding",
      queryVector,
      numCandidates: limit * 20,
      limit: limit * 5,
    },
  };

  const aggregatePipeline = [
    vectorSearchStage,
    {
      $addFields: {
        similarity_score: { $meta: "vectorSearchScore" },
      },
    },
    // Lookup album để lấy price_package, category, styleTags
    {
      $lookup: {
        from: "portfolio_albums",
        localField: "album",
        foreignField: "_id",
        as: "albumInfo",
        pipeline: [
          {
            $project: {
              _id: 1,
              title: 1,
              price_package: 1,
              category: 1,
              styleTags: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$albumInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
    // Lọc theo maxBudget (từ album.price_package)
    ...(maxBudget !== null
      ? [{ $match: { "albumInfo.price_package": { $lte: maxBudget } } }]
      : []),
    // Lookup photographer
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
        similarity_score: 1,
        photographer: 1,
        photographerInfo: 1,
        albumInfo: 1,
        createdAt: 1,
      },
    },
  ];

  const rawResults = await PortfolioImage.aggregate(aggregatePipeline);
  return deduplicateByPhotographer(rawResults, limit);
}

/**
 * Fallback: Tìm kiếm trong collection portfolios (CŨ/LEGACY)
 * Vector index name: "portfolio_vector_index"
 */
async function searchInLegacyPortfolios(queryVector, maxBudget, limit) {
  const vectorSearchStage = {
    $vectorSearch: {
      index: "portfolio_vector_index",
      path: "embedding",
      queryVector,
      numCandidates: limit * 20,
      limit: limit * 5,
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
  return deduplicateByPhotographer(rawResults, limit);
}

/**
 * Dedup: giữ 1 ảnh điểm cao nhất per photographer
 */
function deduplicateByPhotographer(rawResults, limit) {
  const photographerMap = new Map();

  for (const item of rawResults) {
    const pgId = item.photographer.toString();
    if (!photographerMap.has(pgId)) {
      photographerMap.set(pgId, item);
    } else if (item.similarity_score > photographerMap.get(pgId).similarity_score) {
      photographerMap.set(pgId, item);
    }
  }

  return Array.from(photographerMap.values())
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, limit);
}

module.exports = { recommendPhotographers };
