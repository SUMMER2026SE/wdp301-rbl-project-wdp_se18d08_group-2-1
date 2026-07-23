/**
 * groupBooking.routes.js
 *
 * Router cho tính năng Group Booking.
 * Mount tại: app.use("/api/group-bookings", groupBookingRoutes)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỨ TỰ ROUTE QUAN TRỌNG:
 *  1. Webhook (không cần auth) — TRƯỚC HẾT
 *  2. Static routes (/discover, /my) — TRƯỚC dynamic routes (/:groupId)
 *  3. Dynamic routes có suffix (/join, /invite, /leave, /members/payment)
 *  4. Dynamic route thuần /:groupId — CUỐI CÙNG
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require("express");
const router = express.Router();

const authenticate = require("../../../middlewares/authenticate");
const authorize = require("../../../middlewares/roleMiddlewares");

const ctrl = require("../controllers/groupBooking.controller");
const {
  validateCreateGroup,
  validateGroupIdParam,
  validateListQuery,
} = require("../validation/groupBooking.validation");

// ─── [1] Webhook — không cần authenticate ────────────────────────────────────

/**
 * POST /api/group-bookings/webhook/payos
 * PayOS callback sau khi member thanh toán đặt cọc.
 * KHÔNG dùng authenticate — PayOS gọi trực tiếp từ server.
 */
router.post("/webhook/payos", ctrl.handlePayosWebhook);

// ─── [2] Static routes — phải đặt TRƯỚC /:groupId ───────────────────────────

/**
 * GET /api/group-bookings/discover?conceptId=...&page=1&limit=12
 * Danh sách nhóm PENDING mở để join (không cần đăng nhập để xem).
 */
router.get("/discover", validateListQuery, ctrl.discoverGroups);

/**
 * GET /api/group-bookings/my?status=PENDING&page=1&limit=10
 * Danh sách nhóm của user hiện tại (đã đăng nhập).
 */
router.get(
  "/my",
  authenticate,
  authorize(["customer"]),
  validateListQuery,
  ctrl.getMyGroups
);

// ─── [3] POST / — Tạo nhóm mới (UC96) ───────────────────────────────────────

/**
 * POST /api/group-bookings
 * Customer tạo nhóm chụp ảnh chung.
 * Body: { conceptId, minMembers, maxMembers, expireTime, note? }
 */
router.post(
  "/",
  authenticate,
  authorize(["customer"]),
  validateCreateGroup,
  ctrl.createGroup
);

// ─── [4] Dynamic routes với suffix cố định ───────────────────────────────────
//  Đặt TRƯỚC /:groupId thuần để Express không nhầm suffix thành :groupId

/**
 * POST /api/group-bookings/:groupId/join
 * UC98 — Customer tham gia nhóm (có in-memory lock).
 * :groupId có thể là ObjectId hoặc groupCode (6-8 ký tự).
 */
router.post(
  "/:groupId/join",
  authenticate,
  authorize(["customer"]),
  validateGroupIdParam,
  ctrl.joinGroup
);

/**
 * POST /api/group-bookings/:groupId/members/payment
 * UC98 — Tạo PayOS link thanh toán đặt cọc cho member.
 */
router.post(
  "/:groupId/members/payment",
  authenticate,
  authorize(["customer"]),
  validateGroupIdParam,
  ctrl.createPaymentLink
);

/**
 * GET /api/group-bookings/:groupId/members/payment/status?orderCode=...&canceled=false
 * UC98 — Đồng bộ trạng thái thanh toán sau khi redirect về từ PayOS.
 */
router.get(
  "/:groupId/members/payment/status",
  authenticate,
  authorize(["customer"]),
  validateGroupIdParam,
  ctrl.syncPaymentStatus
);

/**
 * GET /api/group-bookings/:groupId/invite
 * UC99 — Lấy link mời bạn bè (chỉ members của nhóm).
 */
router.get(
  "/:groupId/invite",
  authenticate,
  authorize(["customer"]),
  validateGroupIdParam,
  ctrl.getInviteLink
);

/**
 * POST /api/group-bookings/:groupId/transfer-leader
 * Chuyển giao quyền Trưởng nhóm (Leader) sang thành viên khác.
 */
router.post(
  "/:groupId/transfer-leader",
  authenticate,
  authorize(["customer"]),
  validateGroupIdParam,
  ctrl.transferLeader
);

/**
 * DELETE /api/group-bookings/:groupId/kick/:targetUserId
 * Leader trục xuất một thành viên khỏi nhóm.
 */
router.delete(
  "/:groupId/kick/:targetUserId",
  authenticate,
  authorize(["customer"]),
  validateGroupIdParam,
  ctrl.kickMember
);

/**
 * POST /api/group-bookings/:groupId/toggle-lock
 * Leader khóa hoặc mở khóa đăng ký tham gia nhóm.
 */
router.post(
  "/:groupId/toggle-lock",
  authenticate,
  authorize(["customer"]),
  validateGroupIdParam,
  ctrl.toggleLockGroup
);

/**


 * DELETE /api/group-bookings/:groupId/leave
 * UC100 — User rời nhóm (tự động xử lý LEADER/MEMBER + refund).
 */
router.delete(
  "/:groupId/leave",
  authenticate,
  authorize(["customer"]),
  validateGroupIdParam,
  ctrl.leaveGroup
);


/**
 * GET /api/group-bookings/:groupId/messages
 * Lấy lịch sử nhắn tin nhóm (chỉ thành viên).
 */
router.get(
  "/:groupId/messages",
  authenticate,
  validateGroupIdParam,
  ctrl.getGroupMessages
);

/**
 * POST /api/group-bookings/:groupId/messages
 * Gửi tin nhắn vào nhóm (chỉ thành viên).
 */
router.post(
  "/:groupId/messages",
  authenticate,
  validateGroupIdParam,
  ctrl.sendGroupMessage
);

// ─── [5] Dynamic route thuần /:groupId — CUỐI CÙNG ──────────────────────────

/**
 * GET /api/group-bookings/:groupId
 * Chi tiết nhóm (mọi role đã đăng nhập có thể xem).
 */
router.get(
  "/:groupId",
  authenticate,
  validateGroupIdParam,
  ctrl.getGroupDetail
);

/**
 * DELETE /api/group-bookings/:groupId
 * UC104 — Leader chủ động hủy nhóm và trigger refund cho tất cả.
 */
router.delete(
  "/:groupId",
  authenticate,
  authorize(["customer"]),
  validateGroupIdParam,
  ctrl.cancelGroup
);

module.exports = router;
