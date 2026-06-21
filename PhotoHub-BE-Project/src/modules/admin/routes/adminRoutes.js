const express = require("express");
const router = express.Router();

const authenticate = require("../../../middlewares/authenticate");
const verifyAdmin = require("../middlewares/adminAuth");
const AdminController = require("../controllers/AdminController");

// Tất cả các API Admin đều yêu cầu Đăng nhập (authenticate) và là Quản trị viên (verifyAdmin)
router.use(authenticate);
router.use(verifyAdmin);

// ================= 2. MANAGE USERS =================
router.get("/users", (req, res) => AdminController.getUsers(req, res));
router.get("/users/:id", (req, res) => AdminController.getUserById(req, res));
router.patch("/users/:id/status", (req, res) => AdminController.updateUserStatus(req, res));
router.delete("/users/:id", (req, res) => AdminController.deleteUser(req, res));

// ================= 3. VERIFY PHOTOGRAPHER =================
router.get("/photographer-verifications", (req, res) => AdminController.getPhotographerVerifications(req, res));
router.get("/photographer-verifications/:id", (req, res) => AdminController.getPhotographerVerificationById(req, res));
router.patch("/photographer-verifications/:id/approve", (req, res) => AdminController.approvePhotographerVerification(req, res));
router.patch("/photographer-verifications/:id/reject", (req, res) => AdminController.rejectPhotographerVerification(req, res));

// ================= 4. MANAGE BOOKINGS =================
router.get("/bookings", (req, res) => AdminController.getBookings(req, res));
router.get("/bookings/:id", (req, res) => AdminController.getBookingById(req, res));
router.patch("/bookings/:id/status", (req, res) => AdminController.updateBookingStatus(req, res));

// ================= 5. MANAGE PAYMENTS & ESCROW =================
router.get("/payments", (req, res) => AdminController.getPayments(req, res));
router.get("/payments/:id", (req, res) => AdminController.getPaymentById(req, res));
router.patch("/payments/:id/confirm", (req, res) => AdminController.confirmPayment(req, res));
router.patch("/payments/:id/refund", (req, res) => AdminController.refundPayment(req, res));

// ================= 6. MANAGE COMMISSION =================
router.get("/commissions", (req, res) => AdminController.getCommissions(req, res));
router.get("/commissions/summary", (req, res) => AdminController.getCommissionSummary(req, res));
router.patch("/commission-rate", (req, res) => AdminController.updateCommissionRate(req, res));

// ================= 7. RESOLVE DISPUTES =================
router.get("/disputes", (req, res) => AdminController.getDisputes(req, res));
router.get("/disputes/:id", (req, res) => AdminController.getDisputeById(req, res));
router.patch("/disputes/:id/investigate", (req, res) => AdminController.investigateDispute(req, res));
router.patch("/disputes/:id/resolve", (req, res) => AdminController.resolveDispute(req, res));
router.patch("/disputes/:id/reject", (req, res) => AdminController.rejectDispute(req, res));

// ================= 8. MANAGE REPORTS =================
router.get("/reports", (req, res) => AdminController.getReports(req, res));
router.get("/reports/:id", (req, res) => AdminController.getReportById(req, res));
router.patch("/reports/:id/resolve", (req, res) => AdminController.resolveReport(req, res));
router.patch("/reports/:id/reject", (req, res) => AdminController.rejectReport(req, res));

// ================= 9. MODERATE CHAT =================
router.get("/chat-messages", (req, res) => AdminController.getChatMessages(req, res));
router.patch("/chat-messages/:id/hide", (req, res) => AdminController.hideChatMessage(req, res));
router.patch("/chat-messages/:id/unhide", (req, res) => AdminController.unhideChatMessage(req, res));

// ================= 10. MANAGE FEATURED PACKAGES =================
router.get("/featured-packages", (req, res) => AdminController.getFeaturedPackages(req, res));
router.post("/featured-packages", (req, res) => AdminController.createFeaturedPackage(req, res));
router.patch("/featured-packages/:id", (req, res) => AdminController.updateFeaturedPackage(req, res));
router.delete("/featured-packages/:id", (req, res) => AdminController.deleteFeaturedPackage(req, res));

// ================= 11. SEND SYSTEM NOTIFICATIONS =================
router.post("/notifications/send", (req, res) => AdminController.sendSystemNotification(req, res));

// ================= 12. STATISTICS DASHBOARD =================
router.get("/dashboard/statistics", (req, res) => AdminController.getDashboardStatistics(req, res));

// ================= 13. MANAGE WITHDRAW REQUESTS =================
router.get("/withdraw-requests", (req, res) => AdminController.getWithdrawRequests(req, res));
router.get("/withdraw-requests/:id", (req, res) => AdminController.getWithdrawRequestById(req, res));
router.patch("/withdraw-requests/:id/approve", (req, res) => AdminController.approveWithdrawRequest(req, res));
router.patch("/withdraw-requests/:id/reject", (req, res) => AdminController.rejectWithdrawRequest(req, res));
router.patch("/withdraw-requests/:id/mark-paid", (req, res) => AdminController.markPaidWithdrawRequest(req, res));

// ================= EXTENDED ADMIN ROUTES (UC86 - UC95) =================
const AdminExtensionController = require("../controllers/AdminExtensionController");

// UC86 - Risk Dashboard
router.get("/risk-dashboard", (req, res) => AdminExtensionController.getRiskDashboard(req, res));

// UC87 - Withdrawals
router.get("/withdrawals/pending", (req, res) => AdminExtensionController.getPendingWithdrawals(req, res));
router.patch("/withdrawals/:id/approve", (req, res) => AdminExtensionController.approveWithdrawal(req, res));
router.patch("/withdrawals/:id/reject", (req, res) => AdminExtensionController.rejectWithdrawal(req, res));
router.patch("/withdrawals/:id/mark-paid", (req, res) => AdminExtensionController.markPaidWithdrawal(req, res));

// UC88 - Refund & Partial Release Control
router.post("/disputes/:id/refund-full", (req, res) => AdminExtensionController.refundFullDispute(req, res));
router.post("/disputes/:id/refund-partial", (req, res) => AdminExtensionController.refundPartialDispute(req, res));
router.post("/disputes/:id/release-payment", (req, res) => AdminExtensionController.releaseEscrowDispute(req, res));

// UC89 - Insights
router.get("/marketplace-insights", (req, res) => AdminExtensionController.getMarketplaceInsights(req, res));

// UC90 - System Settings
router.get("/settings", (req, res) => AdminExtensionController.getSettings(req, res));
router.patch("/settings", (req, res) => AdminExtensionController.updateSettings(req, res));

// UC91 - Audit Logs
router.get("/audit-logs", (req, res) => AdminExtensionController.getAuditLogs(req, res));
router.get("/audit-logs/:id", (req, res) => AdminExtensionController.getAuditLogById(req, res));

// UC92 - Photographer Performance
router.get("/photographer-performance", (req, res) => AdminExtensionController.getPhotographerPerformance(req, res));

// UC93 - Customer Behavior
router.get("/customer-behavior", (req, res) => AdminExtensionController.getCustomerBehavior(req, res));

// UC94 - Promotion Campaigns
router.get("/campaigns", (req, res) => AdminExtensionController.getCampaigns(req, res));
router.post("/campaigns", (req, res) => AdminExtensionController.createCampaign(req, res));
router.patch("/campaigns/:id", (req, res) => AdminExtensionController.updateCampaign(req, res));
router.delete("/campaigns/:id", (req, res) => AdminExtensionController.deleteCampaign(req, res));

// UC95 - Revenue Forecast
router.get("/revenue-forecast", (req, res) => AdminExtensionController.getRevenueForecast(req, res));

module.exports = router;
