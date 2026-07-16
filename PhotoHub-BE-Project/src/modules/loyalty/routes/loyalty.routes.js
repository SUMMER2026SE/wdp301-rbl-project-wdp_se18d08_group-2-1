const express = require("express");
const router = express.Router();

const authenticate = require("../../../middlewares/authenticate");
const authorize = require("../../../middlewares/roleMiddlewares");
const loyaltyController = require("../controllers/LoyaltyController");

// Customer Loyalty Endpoints
router.get("/my-account", authenticate, loyaltyController.getMyAccount);
router.get("/my-history", authenticate, loyaltyController.getMyHistory);
router.get("/my-rewards", authenticate, loyaltyController.getMyRewards);
router.get("/catalog", authenticate, loyaltyController.getRewardCatalog);
router.post("/redeem", authenticate, loyaltyController.redeemReward);

// Admin Loyalty Endpoints
router.get("/admin/accounts", authenticate, authorize(["admin"]), loyaltyController.adminGetAccounts);
router.get("/admin/histories", authenticate, authorize(["admin"]), loyaltyController.adminGetHistories);
router.get("/admin/vouchers", authenticate, authorize(["admin"]), loyaltyController.adminGetVouchers);
router.post("/admin/vouchers", authenticate, authorize(["admin"]), loyaltyController.adminCreateVoucher);
router.patch("/admin/vouchers/:id", authenticate, authorize(["admin"]), loyaltyController.adminUpdateVoucher);
router.delete("/admin/vouchers/:id", authenticate, authorize(["admin"]), loyaltyController.adminDeleteVoucher);

module.exports = router;
