const express = require("express");
const FavoritePhotographerController = require("../controllers/FavoritePhotographerController");
const { authenticate } = require("../../../middlewares/authenticate");

const router = express.Router();

// Tất cả các endpoints yêu thích đều bắt buộc phải đăng nhập (authenticate middleware)
router.use(authenticate);

// API endpoints
router.post("/", FavoritePhotographerController.addFavorite);
router.delete("/:photographerId", FavoritePhotographerController.removeFavorite);
router.get("/", FavoritePhotographerController.getFavorites);
router.get("/:photographerId/status", FavoritePhotographerController.checkFavoriteStatus);

module.exports = router;
