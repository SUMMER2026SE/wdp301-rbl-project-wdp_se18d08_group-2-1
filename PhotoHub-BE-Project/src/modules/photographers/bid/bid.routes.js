const express = require("express");
const bidController = require("./bid.controller");
const { authenticate } = require("../../../middlewares/authenticate");
const authorize = require("../../../middlewares/roleMiddlewares");

const router = express.Router();

router.get("/", authenticate, authorize(["photographer"]), bidController.getMyBids);
router.post("/assist", authenticate, authorize(["photographer"]), bidController.assistBid);
router.post("/", authenticate, authorize(["photographer"]), bidController.submitBid);
router.post("/:id/optimize", authenticate, authorize(["photographer"]), bidController.optimizeBid);
router.put("/:id", authenticate, authorize(["photographer"]), bidController.updateBid);

module.exports = router;
