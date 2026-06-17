// src/modules/airecomment/services/aiService.js

/**
 * AI Service — Singleton wrapper cho CLIP model (@xenova/transformers).
 */

const { AutoProcessor, CLIPVisionModelWithProjection, RawImage, env } = require("@xenova/transformers");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Cache model vào .model_cache/ trong thư mục gốc project
env.cacheDir = "./.model_cache";

let _processorInstance = null;
let _modelInstance = null;
let _loadPromise = null;

/**
 * Tải model CLIP Vision và Processor - Singleton.
 */
async function getClipModels() {
  if (_processorInstance && _modelInstance) {
    return { processor: _processorInstance, model: _modelInstance };
  }

  if (_loadPromise) {
    return _loadPromise;
  }

  console.log("[AI Service] Đang tải CLIP model và processor lần đầu, vui lòng chờ...");

  const modelId = "Xenova/clip-vit-base-patch32";

  _loadPromise = Promise.all([
    AutoProcessor.from_pretrained(modelId, { revision: "main" }),
    CLIPVisionModelWithProjection.from_pretrained(modelId, { revision: "main" })
  ])
    .then(([processor, model]) => {
      _processorInstance = processor;
      _modelInstance = model;
      _loadPromise = null;
      console.log("[AI Service] ✅ CLIP model và processor đã sẵn sàng");
      return { processor, model };
    })
    .catch((err) => {
      _loadPromise = null;
      console.error("[AI Service] ❌ Lỗi tải model:", err.message);
      throw err;
    });

  return _loadPromise;
}

/**
 * Sinh Vector 512 chiều từ một ảnh.
 *
 * @param {Buffer} imageBuffer  Buffer nhị phân của ảnh (từ multer memoryStorage)
 * @param {string} mimeType     MIME type của ảnh, vd: "image/jpeg", "image/png"
 * @returns {Promise<number[]>} Mảng 512 số thực chuẩn hoá (unit vector)
 */
async function generateEmbedding(imageBuffer, mimeType) {
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("imageBuffer không được rỗng");
  }

  // Tạo file tạm để RawImage.read đọc trực tiếp
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(
    tempDir,
    `clip_temp_${Date.now()}_${Math.round(Math.random() * 1e9)}.jpg`
  );
  await fs.promises.writeFile(tempFilePath, imageBuffer);

  let image;
  try {
    // RawImage.read xử lý rất tốt các đường dẫn file cục bộ trong Node.js
    image = await RawImage.read(tempFilePath);
  } finally {
    // Luôn luôn dọn dẹp file tạm sau khi đã đọc xong
    try {
      await fs.promises.unlink(tempFilePath);
    } catch (err) {
      console.warn("[AI Service] ⚠️ Không thể xóa file tạm:", err.message);
    }
  }

  // Lấy processor và model
  const { processor, model } = await getClipModels();

  // Tiền xử lý ảnh thành pixel_values
  const imageInputs = await processor(image);

  // Suy luận tạo embeddings
  const { image_embeds } = await model(imageInputs);

  // Chuyển tensor sang array JS thông thường
  const embedding = Array.from(image_embeds.data);

  if (embedding.length !== 512) {
    throw new Error(
      `Vector embedding không hợp lệ: nhận ${embedding.length} chiều, cần 512`
    );
  }

  return embedding;
}

/**
 * Warm-up: Gọi khi server khởi động để tải trước model.
 */
async function warmupModel() {
  try {
    await getClipModels();
    console.log("[AI Service] ✅ Model warm-up hoàn tất");
  } catch (err) {
    console.warn("[AI Service] ⚠️  Warm-up thất bại:", err.message);
  }
}

module.exports = {
  generateEmbedding,
  warmupModel,
};
