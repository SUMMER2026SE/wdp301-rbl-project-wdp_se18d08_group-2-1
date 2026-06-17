const express = require("express");
const withdrawController = require("./withdraw.controller");
const { authenticate } = require("../../../middlewares/authenticate");
const authorize = require("../../../middlewares/roleMiddlewares");

const router = express.Router();

router.post("/", authenticate, authorize(["photographer"]), withdrawController.requestWithdraw);
router.get("/", authenticate, authorize(["photographer"]), withdrawController.getWithdrawRequests);

module.exports = router;
