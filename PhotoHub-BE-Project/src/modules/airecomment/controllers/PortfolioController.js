// src/modules/airecomment/controllers/PortfolioController.js

const PortfolioAlbum = require("../models/portfolioAlbum");
const PortfolioImage = require("../models/portfolioImage");
const Photographer = require("../../photographers/models/photographer");
const { generateEmbedding } = require("../services/aiService");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Upload ảnh lên Cloudinary hoặc lưu local nếu chưa cấu hình
// ─────────────────────────────────────────────────────────────────────────────
const saveImageLocal = async (buffer, originalName, subfolder = "portfolios") => {
  const dir = path.join(__dirname, `../../../uploads/${subfolder}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = path.extname(originalName) || ".jpg";
  const filename = `${uniqueSuffix}${ext}`;
  const filepath = path.join(dir, filename);
  await fs.promises.writeFile(filepath, buffer);
  return `/uploads/${subfolder}/${filename}`;
};

const uploadToCloudinaryOrLocal = async (buffer, originalName, publicIdPrefix) => {
  const hasCloudinary =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

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
            public_id: `${publicIdPrefix}_${Date.now()}`,
          },
          (error, result) => {
            if (error) reject(new Error(`Cloudinary: ${error.message}`));
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });
      return uploadResult.secure_url;
    } catch (err) {
      console.warn("[Portfolio] ⚠️ Cloudinary lỗi, fallback local:", err.message);
      return saveImageLocal(buffer, originalName);
    }
  } else {
    console.log("[Portfolio] Cloudinary chưa cấu hình, lưu local...");
    return saveImageLocal(buffer, originalName);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/airecommend/portfolio/album
// Tạo một album mới (chưa có ảnh)
// ─────────────────────────────────────────────────────────────────────────────
const createAlbum = async (req, res) => {
  try {
    const photographer = await Photographer.findOne({
      user: req.user.id || req.user._id,
    });
    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hồ sơ nhiếp ảnh gia. Vui lòng hoàn thiện hồ sơ trước.",
      });
    }

    const { title, description, price_package, category, styleTags, isPublic } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "title là bắt buộc" });
    }
    if (price_package === undefined || price_package === "") {
      return res.status(400).json({ success: false, message: "price_package là bắt buộc" });
    }
    const priceNum = Number(price_package);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ success: false, message: "price_package phải là số không âm" });
    }

    // Xử lý ảnh bìa (nếu upload kèm)
    let coverImageUrl = null;
    if (req.file) {
      coverImageUrl = await uploadToCloudinaryOrLocal(
        req.file.buffer,
        req.file.originalname,
        `cover_${photographer._id}`
      );
    }

    const album = await PortfolioAlbum.create({
      photographer: photographer._id,
      title: title.trim(),
      description: description?.trim() || "",
      coverImageUrl,
      category: category || null,
      styleTags: Array.isArray(styleTags) ? styleTags : [],
      price_package: priceNum,
      isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
    });

    return res.status(201).json({
      success: true,
      message: "Tạo album thành công",
      data: album,
    });
  } catch (err) {
    console.error("[Album Create] ❌ Lỗi:", err.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo album",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/airecommend/portfolio/album/:albumId/image
// Upload ảnh vào album (sinh AI Embedding)
// ─────────────────────────────────────────────────────────────────────────────
const uploadImageToAlbum = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ảnh để upload (field name: 'image')",
      });
    }

    const { albumId } = req.params;
    const { caption } = req.body;

    // Kiểm tra album tồn tại và thuộc photographer đang đăng nhập
    const photographer = await Photographer.findOne({
      user: req.user.id || req.user._id,
    });
    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hồ sơ nhiếp ảnh gia.",
      });
    }

    const album = await PortfolioAlbum.findOne({
      _id: albumId,
      photographer: photographer._id,
    });
    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy album hoặc bạn không có quyền truy cập.",
      });
    }

    console.log(
      `[Portfolio Image] Đang sinh embedding: ${req.file.originalname} ` +
        `(${(req.file.size / 1024).toFixed(1)} KB)`
    );

    // Sinh embedding AI
    const embedding = await generateEmbedding(req.file.buffer, req.file.mimetype);
    console.log(`[Portfolio Image] ✅ Embedding OK (${embedding.length} chiều)`);

    // Upload ảnh
    const imageUrl = await uploadToCloudinaryOrLocal(
      req.file.buffer,
      req.file.originalname,
      `portfolio_${photographer._id}`
    );

    // Nếu album chưa có ảnh bìa, dùng ảnh đầu tiên làm bìa
    if (!album.coverImageUrl) {
      album.coverImageUrl = imageUrl;
      await album.save();
    }

    // Lưu ảnh vào DB
    const image = await PortfolioImage.create({
      album: album._id,
      photographer: photographer._id,
      image_url: imageUrl,
      caption: caption?.trim() || "",
      embedding,
    });

    return res.status(201).json({
      success: true,
      message: "Upload ảnh vào album thành công",
      data: {
        _id: image._id,
        album: album._id,
        photographer: photographer._id,
        image_url: image.image_url,
        caption: image.caption,
        createdAt: image.createdAt,
      },
    });
  } catch (err) {
    console.error("[Album Image Upload] ❌ Lỗi:", err.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi upload ảnh",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/airecommend/portfolio/photographer/:photographerId
// Lấy danh sách albums của photographer (kèm số lượng ảnh và ảnh bìa)
// ─────────────────────────────────────────────────────────────────────────────
const getAlbumsByPhotographer = async (req, res) => {
  try {
    const { photographerId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const [albums, total] = await Promise.all([
      PortfolioAlbum.find({ photographer: photographerId, isPublic: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("category", "name slug iconUrl")
        .populate("styleTags", "name slug type"),
      PortfolioAlbum.countDocuments({ photographer: photographerId, isPublic: true }),
    ]);

    // Đếm số ảnh trong từng album
    const albumIds = albums.map((a) => a._id);
    const imageCounts = await PortfolioImage.aggregate([
      { $match: { album: { $in: albumIds } } },
      { $group: { _id: "$album", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    for (const ic of imageCounts) {
      countMap[ic._id.toString()] = ic.count;
    }

    const albumsWithCount = albums.map((a) => ({
      ...a.toObject(),
      imageCount: countMap[a._id.toString()] || 0,
    }));

    return res.json({
      success: true,
      data: {
        albums: albumsWithCount,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error("[Album GET by Photographer] ❌ Lỗi:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/airecommend/portfolio/album/:albumId
// Lấy chi tiết 1 album kèm tất cả ảnh
// ─────────────────────────────────────────────────────────────────────────────
const getAlbumDetail = async (req, res) => {
  try {
    const { albumId } = req.params;

    const album = await PortfolioAlbum.findById(albumId)
      .populate("category", "name slug iconUrl")
      .populate("styleTags", "name slug type");

    if (!album) {
      return res.status(404).json({ success: false, message: "Không tìm thấy album" });
    }

    const images = await PortfolioImage.find({ album: albumId })
      .sort({ createdAt: -1 })
      .select("-embedding");

    return res.json({
      success: true,
      data: {
        album,
        images,
        imageCount: images.length,
      },
    });
  } catch (err) {
    console.error("[Album Detail] ❌ Lỗi:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/airecommend/portfolio/album/:albumId
// Xóa album và toàn bộ ảnh trong album
// ─────────────────────────────────────────────────────────────────────────────
const deleteAlbum = async (req, res) => {
  try {
    const { albumId } = req.params;

    const photographer = await Photographer.findOne({
      user: req.user.id || req.user._id,
    });
    if (!photographer) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ nhiếp ảnh gia." });
    }

    const album = await PortfolioAlbum.findOne({
      _id: albumId,
      photographer: photographer._id,
    });
    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy album hoặc bạn không có quyền xóa.",
      });
    }

    // Xóa tất cả ảnh trong album trước
    const deletedImages = await PortfolioImage.deleteMany({ album: albumId });

    // Xóa album
    await PortfolioAlbum.deleteOne({ _id: albumId });

    return res.json({
      success: true,
      message: `Đã xóa album "${album.title}" và ${deletedImages.deletedCount} ảnh`,
    });
  } catch (err) {
    console.error("[Album Delete] ❌ Lỗi:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/airecommend/portfolio/image/:imageId
// Xóa 1 ảnh khỏi album
// ─────────────────────────────────────────────────────────────────────────────
const deletePortfolioImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const photographer = await Photographer.findOne({
      user: req.user.id || req.user._id,
    });
    if (!photographer) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ nhiếp ảnh gia." });
    }

    const image = await PortfolioImage.findOne({
      _id: imageId,
      photographer: photographer._id,
    });
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ảnh hoặc bạn không có quyền xóa.",
      });
    }

    await PortfolioImage.deleteOne({ _id: imageId });

    return res.json({
      success: true,
      message: "Đã xóa ảnh thành công",
    });
  } catch (err) {
    console.error("[Image Delete] ❌ Lỗi:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [LEGACY] POST /api/airecommend/portfolio/upload
// Giữ lại để tương thích ngược với FE cũ
// ─────────────────────────────────────────────────────────────────────────────
const Portfolio = require("../models/portfolio");

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
      return res.status(400).json({ success: false, message: "price_package là bắt buộc" });
    }

    const priceNum = Number(price_package);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ success: false, message: "price_package phải là số không âm" });
    }

    const photographer = await Photographer.findOne({ user: req.user.id || req.user._id });
    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hồ sơ nhiếp ảnh gia. Vui lòng hoàn thiện hồ sơ trước.",
      });
    }

    console.log(
      `[Portfolio Legacy] Đang sinh embedding: ${req.file.originalname} ` +
        `(${(req.file.size / 1024).toFixed(1)} KB)`
    );

    const embedding = await generateEmbedding(req.file.buffer, req.file.mimetype);
    console.log(`[Portfolio Legacy] ✅ Embedding OK (${embedding.length} chiều)`);

    const imageUrl = await uploadToCloudinaryOrLocal(
      req.file.buffer,
      req.file.originalname,
      `portfolio_${photographer._id}`
    );

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
    console.error("[Portfolio Legacy Upload] ❌ Lỗi:", err.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xử lý upload portfolio",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [LEGACY] GET /api/airecommend/portfolio/photographer/:photographerId (cũ)
// Vẫn hỗ trợ — trả về albums thay vì portfolios
// ─────────────────────────────────────────────────────────────────────────────
const getPortfoliosByPhotographer = getAlbumsByPhotographer;

module.exports = {
  // Mới
  createAlbum,
  uploadImageToAlbum,
  getAlbumsByPhotographer,
  getAlbumDetail,
  deleteAlbum,
  deletePortfolioImage,
  // Legacy (giữ nguyên tên để không phá routes cũ)
  uploadPortfolioImage,
  getPortfoliosByPhotographer,
};
