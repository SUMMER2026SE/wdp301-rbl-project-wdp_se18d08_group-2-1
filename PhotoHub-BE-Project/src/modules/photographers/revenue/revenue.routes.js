const express = require("express");
const revenueController = require("./revenue.controller");
const { authenticate } = require("../../../middlewares/authenticate");
const authorize = require("../../../middlewares/roleMiddlewares");

const router = express.Router();

router.get("/", authenticate, authorize(["photographer"]), revenueController.getRevenue);

module.exports = router;
