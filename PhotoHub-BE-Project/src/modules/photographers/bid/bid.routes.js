const express = require("express");
const bidController = require("./bid.controller");
const { authenticate } = require("../../../middlewares/authenticate");
const authorize = require("../../../middlewares/roleMiddlewares");

const router = express.Router();

router.post("/", authenticate, authorize(["photographer"]), bidController.submitBid);
router.put("/:id", authenticate, authorize(["photographer"]), bidController.updateBid);
router.get("/", authenticate, authorize(["photographer"]), bidController.getMyBids);

module.exports = router;
