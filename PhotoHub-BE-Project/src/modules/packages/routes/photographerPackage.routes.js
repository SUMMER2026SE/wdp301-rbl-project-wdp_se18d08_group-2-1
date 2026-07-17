const express = require("express");
const router = express.Router();

const controller = require("../controllers/photographerPackage.controller");

const authenticate = require("../../../middlewares/authenticate");
const attachPhotographer = require("../../../middlewares/attachPhotographer.middleware");

/**
 * GET /api/packages
 * Public — lấy tất cả group package ACTIVE (isGroupPackage=true) từ mọi photographer.
 * Dùng cho CreateGroupModal.
 * Query: ?photographerId=xxx (tùy chọn filter theo photographer)
 */
router.get("/", controller.getAllGroupPackages);

router.post(
  "/",
  authenticate,
  attachPhotographer,
  controller.create
);

router.get(
  "/my",
  authenticate,
  attachPhotographer,
  controller.getMyPackages
);

router.get(
  "/photographer/:photographerId",
  controller.getPhotographerPackages
);

router.get("/:id", authenticate, controller.getPackageDetail);
router.put("/:id", authenticate, attachPhotographer, controller.update);
router.patch("/:id/toggle-status", authenticate, attachPhotographer, controller.toggleStatus);
router.delete("/:id", authenticate, attachPhotographer, controller.softDelete);

module.exports = router;
