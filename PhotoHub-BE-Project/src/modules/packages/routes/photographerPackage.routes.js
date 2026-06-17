const express = require("express");
const router = express.Router();

const controller = require("../controllers/photographerPackage.controller");

const authenticate = require("../../../middlewares/authenticate");
const attachPhotographer = require("../../../middlewares/attachPhotographer.middleware");

router.post(
  "/",
  authenticate,
  attachPhotographer,
  controller.create
);

module.exports = router;