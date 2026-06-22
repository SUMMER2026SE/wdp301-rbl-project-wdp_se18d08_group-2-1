const express = require("express");
const router = express.Router();

const authenticate = require("../../../middlewares/authenticate");
const ApiResponse = require("../../../utils/ApiResponse");
const upload = require("../../../middlewares/upload.middleware")

// Controllers
const AuthController = require("../../../modules/auth/controllers/AuthController");
const googleAuth = require("../../../modules/auth/controllers/GoogleAuthController");
const ProfileController = require("../../../modules/auth/controllers/ProfileController");

const auth = new AuthController();
const profile = new ProfileController();

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

router.post(
  "/profile/avatar",
  authenticate,
  upload.single("avatar"),
  (req, res) => {
    profile.uploadAvatar(req, res);
  }
);

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