const express = require("express");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/roleMiddlewares");
const controller = require("./subscription.controller");
const {
  validatePurchaseSubscription,
  validateIdParam,
  validatePauseSubscription,
  validateRenewSubscription,
} = require("./subscription.validation");

const router = express.Router();

router.get("/packages", controller.listPackages);
router.post("/webhook/payos", controller.handlePayosWebhook);
router.get("/payment/status", authenticate, controller.paymentStatus);

router.post("/purchase", authenticate, authorize(["customer"]), validatePurchaseSubscription, controller.purchase);
router.get("/my", authenticate, controller.getMy);
router.get("/:id", authenticate, validateIdParam("id"), controller.getById);
router.post("/:id/pause", authenticate, authorize(["customer", "admin"]), validateIdParam("id"), validatePauseSubscription, controller.pause);
router.post("/:id/resume", authenticate, authorize(["customer", "admin"]), validateIdParam("id"), controller.resume);
router.post("/:id/cancel", authenticate, authorize(["customer", "admin"]), validateIdParam("id"), controller.cancel);
router.post("/:id/renew", authenticate, authorize(["customer", "admin"]), validateIdParam("id"), validateRenewSubscription, controller.renew);
router.get("/:id/remaining-sessions", authenticate, validateIdParam("id"), controller.remainingSessions);
router.post("/:id/generate-sessions", authenticate, authorize(["photographer", "admin"]), validateIdParam("id"), controller.generateSessions);

module.exports = router;
