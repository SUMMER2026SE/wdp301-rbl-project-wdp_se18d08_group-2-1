const express = require("express");
const recommendationController = require("./recommendation.controller");
const { authenticate } = require("../../../middlewares/authenticate");
const authorize = require("../../../middlewares/roleMiddlewares");

const router = express.Router();

router.get("/", authenticate, authorize(["photographer"]), recommendationController.getRecommendations);

module.exports = router;
