const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const os = require("os");
const path = require("path");
const streamifier = require("streamifier");


const CHUNK_SIZE = 6 * 1024 * 1024;
const MAX_FILENAME_LENGTH = 80;

function mimeToExt(mimetype = "") {
  const map = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/tiff": "tiff",
    "image/bmp": "bmp",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  return map[mimetype] || "jpg";
}

function hasCloudinaryConfig() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function normalizeLocalFolder(folder = "packages") {
  return String(folder || "packages")
    .replace(/^photohub\//, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9/_-]/g, "") || "packages";
}

function saveBufferToLocalUploads(buffer, mimetype, options = {}) {
  const ext = mimeToExt(mimetype);
  const folder = normalizeLocalFolder(options.localFolder || "packages");
  const uploadDir = path.join(__dirname, "..", "uploads", folder);
  fs.mkdirSync(uploadDir, { recursive: true });

  const baseName = String(options.originalName || "image")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, MAX_FILENAME_LENGTH) || "image";
  const filename = Date.now() + "_" + Math.random().toString(36).slice(2) + "_" + baseName + "." + ext;
  const finalPath = path.join(uploadDir, filename);
  fs.writeFileSync(finalPath, buffer);

  const publicUrl = ("/uploads/" + folder + "/" + filename).replace(/\\/g, "/");
  const publicId = `${folder}/${path.basename(filename, "." + ext)}`;
  return {
    secure_url: publicUrl,
    url: publicUrl,
    public_id: publicId,
    storage: "local",
  };
}

async function uploadBufferToCloudinary(
  buffer,
  mimetype,
  options = {}
) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("Invalid image buffer");
  }

  if (!hasCloudinaryConfig()) {
    throw new Error("Cloudinary is not configured.");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        ...options,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

module.exports = { uploadBufferToCloudinary, saveBufferToLocalUploads };
