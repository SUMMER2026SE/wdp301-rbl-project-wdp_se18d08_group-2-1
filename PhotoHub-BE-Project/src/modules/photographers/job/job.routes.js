const express = require("express");
const jobController = require("./job.controller");
const { authenticate } = require("../../../middlewares/authenticate");
const authorize = require("../../../middlewares/roleMiddlewares");

const router = express.Router();

router.get("/", authenticate, authorize(["photographer"]), jobController.getJobPosts);
router.get("/:id", authenticate, authorize(["photographer"]), jobController.getJobDetail);

module.exports = router;
