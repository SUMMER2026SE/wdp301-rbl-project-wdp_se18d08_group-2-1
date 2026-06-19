const express = require("express");
const router = express.Router();

const authenticate = require("../../../middlewares/authenticate");
const verifyAdmin = require("../../admin/middlewares/adminAuth");

const controller = require("../controllers/styleTag.controller");

// Public
router.get("/", controller.getAll);
router.get("/:id", controller.getById);

// Admin only
router.post(
  "/",
  authenticate,
  verifyAdmin,
  controller.create
);

router.put(
  "/:id",
  authenticate,
  verifyAdmin,
  controller.update
);

router.delete(
  "/:id",
  authenticate,
  verifyAdmin,
  controller.delete
);

module.exports = router;