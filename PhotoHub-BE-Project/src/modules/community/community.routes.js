const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const communityController = require("./community.controller");
const { authenticate } = require("../../middlewares/authenticate");
const ApiResponse = require("../../utils/ApiResponse");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "cinema_secret";

const optionalAuthenticate = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }

    const token = authHeader.split(" ")[1];
    if (!token || token === "undefined" || token === "null") {
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        };
    } catch (_error) {
        // Public feed still works with an expired/stale token. Auth-only actions use authenticate below.
    }

    return next();
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype && file.mimetype.startsWith("image/")) {
            return cb(null, true);
        }
        return cb(new Error("Only image files are allowed"));
    },
});

const uploadCoverImage = (req, res, next) => {
    upload.single("coverImageFile")(req, res, (error) => {
        if (error) {
            return ApiResponse.error(res, error.message, 400);
        }
        return next();
    });
};

router.get("/posts", optionalAuthenticate, communityController.listPosts);
router.get("/posts/:id", optionalAuthenticate, communityController.getPost);
router.post("/posts", authenticate, uploadCoverImage, communityController.createPost);
router.post("/posts/:id/like", authenticate, communityController.toggleLike);
router.post("/posts/:id/save", authenticate, communityController.toggleSave);
router.post("/posts/:id/comments", authenticate, communityController.addComment);
router.delete("/posts/:id", authenticate, communityController.deletePost);

module.exports = router;