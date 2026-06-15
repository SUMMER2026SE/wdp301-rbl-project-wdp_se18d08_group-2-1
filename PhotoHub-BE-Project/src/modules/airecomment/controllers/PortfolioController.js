// src/modules/airecomment/controllers/PortfolioController.js

const Portfolio = require("../models/portfolio");
const Photographer = require("../../photographers/models/photographer");
const { generateEmbedding } = require("../services/aiService");
const cloudinary = require("cloudinary").v2;

/**
 * POST /api/airecommend/portfolio/upload
 */
const uploadPortfolioImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ảnh để upload (field name: 'image')",
      });
    }

    const { price_package, caption } = req.body;

    if (price_package === undefined || price_package === "") {
      return res.status(400).json({
        success: false,
        message: "price_package là bắt buộc",
      });
    }

    const priceNum = Number(price_package);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({
        success: false,
        message: "price_package phải là số không âm",
      });
    }

    const photographer = await Photographer.findOne({ user: req.user.id || req.user._id });
    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hồ sơ nhiếp ảnh gia. Vui lòng hoàn thiện hồ sơ trước.",
      });
    }

    console.log(
      `[Portfolio] Đang sinh embedding cho ảnh: ${req.file.originalname} ` +
      `(${(req.file.size / 1024).toFixed(1)} KB)`
    );

    const embedding = await generateEmbedding(
      req.file.buffer,
      req.file.mimetype
    );

    console.log(`[Portfolio] ✅ Embedding sinh thành công (${embedding.length} chiều)`);

    // Helper lưu file local khi Cloudinary không có hoặc lỗi
    const fs = require("fs");
    const path = require("path");
    const saveImageLocal = async (buffer, originalName) => {
      const dir = path.join(__dirname, "../../../uploads/portfolios");
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(originalName) || ".jpg";
      const filename = `${uniqueSuffix}${ext}`;
      const filepath = path.join(dir, filename);
      await fs.promises.writeFile(filepath, buffer);
      return `/uploads/portfolios/${filename}`;
    };

    // ── 5. Upload ảnh lên Cloudinary hoặc Fallback Local ───────────────────
    let imageUrl = "";
    const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

    if (hasCloudinary) {
      try {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "photohub/portfolios",
              resource_type: "image",
              public_id: `portfolio_${photographer._id}_${Date.now()}`,
            },
            (error, result) => {
              if (error) {
                reject(new Error(`Upload Cloudinary thất bại: ${error.message}`));
              } else {
                resolve(result);
              }
            }
          );
          uploadStream.end(req.file.buffer);
        });
        imageUrl = uploadResult.secure_url;
      } catch (err) {
        console.warn("[Portfolio Upload] ⚠️ Upload Cloudinary lỗi, chuyển sang lưu local:", err.message);
        imageUrl = await saveImageLocal(req.file.buffer, req.file.originalname);
      }
    } else {
      console.log("[Portfolio Upload] Cloudinary chưa cấu hình, lưu local...");
      imageUrl = await saveImageLocal(req.file.buffer, req.file.originalname);
    }

    // ── 6. Lưu Portfolio vào MongoDB ──────────────────────────────────────
    const portfolio = await Portfolio.create({
      photographer: photographer._id,
      image_url: imageUrl,
      caption: caption?.trim() || "",
      price_package: priceNum,
      embedding,
    });

    return res.status(201).json({
      success: true,
      message: "Upload ảnh portfolio thành công",
      data: {
        _id: portfolio._id,
        image_url: portfolio.image_url,
        caption: portfolio.caption,
        price_package: portfolio.price_package,
        photographer: photographer._id,
        createdAt: portfolio.createdAt,
      },
    });
  } catch (err) {
    console.error("[Portfolio Upload] ❌ Lỗi:", err.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xử lý upload portfolio",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/**
 * GET /api/airecommend/portfolio/photographer/:photographerId
 */
const getPortfoliosByPhotographer = async (req, res) => {
  try {
    const { photographerId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const [portfolios, total] = await Promise.all([
      Portfolio.find({ photographer: photographerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-embedding"),
      Portfolio.countDocuments({ photographer: photographerId }),
    ]);

    return res.json({
      success: true,
      data: {
        portfolios,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error("[Portfolio GET] ❌ Lỗi:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  uploadPortfolioImage,
  getPortfoliosByPhotographer,
};
