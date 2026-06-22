const express = require("express");
const router = express.Router();

const authenticate = require("../../../middlewares/authenticate");
const ApiResponse = require("../../../utils/ApiResponse");

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../../../config/cloudinary");

// Controllers
const AuthController = require("../../../modules/auth/controllers/AuthController");
const googleAuth = require("../../../modules/auth/controllers/GoogleAuthController");
const ProfileController = require("../../../modules/auth/controllers/ProfileController");

const auth = new AuthController();
const profile = new ProfileController();

// ── Upload avatar config ─ Cloudinary ────────────────────────────────────
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "photohub/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face", quality: "auto" }],
  },
});

const uploadAvatarMulter = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith("image/")) return cb(null, true);
    cb(new Error("Chỉ chấp nhận file ảnh"));
  },
}).single("avatar");


// ================= AUTH =================
router.post("/register", (req, res) => auth.register(req, res));

router.post("/verify-email", (req, res) =>
  auth.verifyEmail(req, res)
);

router.post("/resend-verify-email", (req, res) =>
  auth.resendVerifyEmail(req, res)
);

router.post("/login", (req, res) => auth.login(req, res));

router.post("/forgot-password", (req, res) =>
  auth.forgotPassword(req, res)
);

router.post("/reset-password", (req, res) =>
  auth.resetPassword(req, res)
);

// ================= PROFILE =================
router.get("/profile", authenticate, (req, res) =>
  profile.getProfile(req, res)
);

router.put("/profile", authenticate, (req, res) =>
  profile.updateProfile(req, res)
);

router.post("/profile/avatar", authenticate, (req, res) => {
  uploadAvatarMulter(req, res, (err) => {
    if (err) {
      const msg =
        err.code === "LIMIT_FILE_SIZE"
          ? "Ảnh tối đa 5MB"
          : err.message || "Upload thất bại";

      return ApiResponse.error(res, msg, 400);
    }

    profile.uploadAvatar(req, res);
  });
});

router.put("/change-password", authenticate, (req, res) =>
  profile.changePassword(req, res)
);

// ================= GOOGLE AUTH =================
router.get("/google", (req, res, next) =>
  googleAuth.initiate(req, res, next)
);

router.get("/google/callback", (req, res, next) =>
  googleAuth.callback(req, res, next)
);

router.get("/google/verify", authenticate, (req, res) =>
  googleAuth.verifyToken(req, res)
);

module.exports = router;