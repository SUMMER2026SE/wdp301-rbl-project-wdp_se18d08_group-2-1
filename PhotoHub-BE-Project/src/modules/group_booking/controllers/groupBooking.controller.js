/**
 * groupBooking.controller.js
 *
 * Thin controller — chỉ nhận request, gọi service, trả response.
 * Mọi business logic nằm ở groupBooking.service.js.
 *
 * Route map (mount tại /api/group-bookings):
 *
 *   [PUBLIC / NO AUTH]
 *   POST   /webhook/payos                     → handlePayosWebhook
 *
 *   [CUSTOMER AUTH]
 *   POST   /                                   → createGroup        (UC96)
 *   POST   /:groupId/join                      → joinGroup          (UC98)
 *   POST   /:groupId/members/payment           → createPaymentLink  (UC98)
 *   GET    /:groupId/members/payment/status    → syncPaymentStatus  (UC98)
 *   GET    /:groupId/invite                    → getInviteLink      (UC99)
 *   DELETE /:groupId/leave                     → leaveGroup         (UC100)
 *   GET    /my                                 → getMyGroups
 *   GET    /discover                           → discoverGroups
 *   DELETE /:groupId                           → cancelGroup        (UC104 Leader)
 *
 *   [ALL AUTH (customer & photographer)]
 *   GET    /:groupId                           → getGroupDetail
 */

const groupBookingService = require("../services/groupBooking.service");
const ApiResponse = require("../../../utils/ApiResponse");

class GroupBookingController {
  // ─── UC96: Tạo nhóm ────────────────────────────────────────────────────────

  /**
   * POST /api/group-bookings
   * Customer tạo nhóm chụp ảnh chung mới.
   */
  async createGroup(req, res) {
    try {
      const result = await groupBookingService.createGroupBooking(
        req.user.id,
        req.body
      );
      return ApiResponse.success(
        res,
        result,
        `Tạo nhóm thành công! Mã nhóm của bạn: ${result.groupCode}`,
        201
      );
    } catch (error) {
      console.error("[GroupBooking] createGroup:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  // ─── UC98: Tham gia nhóm ───────────────────────────────────────────────────

  /**
   * POST /api/group-bookings/:groupId/join
   * Customer tham gia nhóm (theo groupId hoặc groupCode).
   */
  async joinGroup(req, res) {
    try {
      const result = await groupBookingService.joinGroupBooking(
        req.user.id,
        req.params.groupId
      );
      return ApiResponse.success(
        res,
        result,
        "Tham gia nhóm thành công! Vui lòng thanh toán đặt cọc để giữ chỗ."
      );
    } catch (error) {
      console.error("[GroupBooking] joinGroup:", error.message);
      const statusCode = error.message.includes("không tồn tại") ? 404 : 400;
      return ApiResponse.error(res, error.message, statusCode);
    }
  }

  /**
   * POST /api/group-bookings/:groupId/members/payment
   * Tạo PayOS payment link cho thành viên đặt cọc.
   */
  async createPaymentLink(req, res) {
    try {
      const result = await groupBookingService.createMemberPaymentLink(
        req.params.groupId,
        req.user.id
      );
      return ApiResponse.success(res, result, "Tạo link thanh toán thành công");
    } catch (error) {
      console.error("[GroupBooking] createPaymentLink:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/group-bookings/:groupId/members/payment/status
   * Đồng bộ trạng thái thanh toán từ PayOS.
   */
  async syncPaymentStatus(req, res) {
    try {
      const { orderCode, canceled } = req.query;
      const forceCancel = canceled === "true" || canceled === true;
      const result = await groupBookingService.syncMemberPaymentStatus(
        req.params.groupId,
        req.user.id,
        orderCode,
        forceCancel
      );
      return ApiResponse.success(res, result, "Đồng bộ trạng thái thanh toán thành công");
    } catch (error) {
      console.error("[GroupBooking] syncPaymentStatus:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * POST /api/group-bookings/webhook/payos
   * Nhận callback từ PayOS — KHÔNG cần authenticate.
   * Luôn trả về 200 để PayOS không retry.
   */
  async handlePayosWebhook(req, res) {
    try {
      const result = await groupBookingService.handleMemberPayosWebhook(
        req.body
      );
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error("[GroupBooking] PayOS Webhook error:", error.message);
      // Trả 200 để PayOS không spam retry
      return res.status(200).json({ success: false, error: error.message });
    }
  }

  // ─── UC99: Mời bạn bè ──────────────────────────────────────────────────────

  /**
   * GET /api/group-bookings/:groupId/invite
   * Lấy link mời + URL chia sẻ mạng xã hội.
   */
  async getInviteLink(req, res) {
    try {
      const result = await groupBookingService.getInviteLink(
        req.params.groupId,
        req.user.id
      );
      return ApiResponse.success(res, result, "Lấy link mời thành công");
    } catch (error) {
      console.error("[GroupBooking] getInviteLink:", error.message);
      const statusCode = error.message.includes("không tồn tại") ? 404 : 400;
      return ApiResponse.error(res, error.message, statusCode);
    }
  }

  // ─── UC100: Rời nhóm ───────────────────────────────────────────────────────

  /**
   * DELETE /api/group-bookings/:groupId/leave
   * User rời nhóm. Tự động xử lý LEADER/MEMBER và refund.
   */
  async leaveGroup(req, res) {
    try {
      const result = await groupBookingService.leaveGroup(
        req.params.groupId,
        req.user.id
      );
      return ApiResponse.success(res, result, result.message || "Rời nhóm thành công");
    } catch (error) {
      console.error("[GroupBooking] leaveGroup:", error.message);
      const statusCode = error.message.includes("không tồn tại") ? 404 : 400;
      return ApiResponse.error(res, error.message, statusCode);
    }
  }

  // ─── UC104: Hủy nhóm (Leader) ──────────────────────────────────────────────

  /**
   * DELETE /api/group-bookings/:groupId
   * Leader chủ động hủy nhóm và kích hoạt hoàn tiền cho tất cả thành viên.
   */
  async cancelGroup(req, res) {
    try {
      const result = await groupBookingService.cancelGroupByLeader(
        req.params.groupId,
        req.user.id
      );
      return ApiResponse.success(
        res,
        result,
        `Đã hủy nhóm và hoàn tiền cho ${result.refundedCount} thành viên`
      );
    } catch (error) {
      console.error("[GroupBooking] cancelGroup:", error.message);
      const statusCode = error.message.includes("không tồn tại") ? 404 : 400;
      return ApiResponse.error(res, error.message, statusCode);
    }
  }

  // ─── Queries ────────────────────────────────────────────────────────────────

  /**
   * GET /api/group-bookings/discover?conceptId=...&page=1&limit=12
   * Danh sách nhóm PENDING đang mở để join.
   */
  async discoverGroups(req, res) {
    try {
      const { conceptId, page, limit } = req.query;
      const result = await groupBookingService.discoverGroups({
        conceptId,
        page,
        limit,
      });
      return ApiResponse.success(res, result, "Lấy danh sách nhóm thành công");
    } catch (error) {
      console.error("[GroupBooking] discoverGroups:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/group-bookings/my?status=PENDING&page=1&limit=10
   * Các nhóm mà user hiện tại đang tham gia.
   */
  async getMyGroups(req, res) {
    try {
      const { status, page, limit } = req.query;
      const result = await groupBookingService.getMyGroups(req.user.id, {
        status,
        page,
        limit,
      });
      return ApiResponse.success(res, result, "Lấy danh sách nhóm của tôi thành công");
    } catch (error) {
      console.error("[GroupBooking] getMyGroups:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/group-bookings/:groupId
   * Chi tiết một nhóm kèm danh sách thành viên.
   * Cho phép mọi user đã đăng nhập xem (không giới hạn role).
   */
  async getGroupDetail(req, res) {
    try {
      const group = await groupBookingService.getGroupDetail(
        req.params.groupId,
        req.user?.id
      );
      if (!group) {
        return ApiResponse.error(res, "Nhóm không tồn tại", 404);
      }
      return ApiResponse.success(res, group, "Lấy chi tiết nhóm thành công");
    } catch (error) {
      console.error("[GroupBooking] getGroupDetail:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * POST /api/group-bookings/:groupId/transfer-leader
   * Chuyển giao quyền Trưởng nhóm cho thành viên khác.
   */
  async transferLeader(req, res) {
    try {
      const { newLeaderId } = req.body;
      if (!newLeaderId) {
        throw new Error("Thiếu ID thành viên mới (newLeaderId)");
      }
      const result = await groupBookingService.transferLeader(
        req.params.groupId,
        req.user.id,
        newLeaderId
      );
      return ApiResponse.success(res, result, result.message || "Chuyển Trưởng nhóm thành công");
    } catch (error) {
      console.error("[GroupBooking] transferLeader:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * DELETE /api/group-bookings/:groupId/kick/:targetUserId
   * Leader trục xuất thành viên khỏi nhóm.
   */
  async kickMember(req, res) {
    try {
      const { targetUserId } = req.params;
      if (!targetUserId) {
        throw new Error("Thiếu ID thành viên bị trục xuất (targetUserId)");
      }
      const result = await groupBookingService.kickMember(
        req.params.groupId,
        req.user.id,
        targetUserId
      );
      return ApiResponse.success(res, result, result.message || "Trục xuất thành viên thành công");
    } catch (error) {
      console.error("[GroupBooking] kickMember:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * POST /api/group-bookings/:groupId/toggle-lock
   * Leader khóa/mở khóa đăng ký tham gia nhóm.
   */
  async toggleLockGroup(req, res) {
    try {
      const { isLocked } = req.body;
      const result = await groupBookingService.toggleLockGroup(
        req.params.groupId,
        req.user.id,
        isLocked
      );
      return ApiResponse.success(res, result, result.message || "Thao tác thành công");
    } catch (error) {
      console.error("[GroupBooking] toggleLockGroup:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new GroupBookingController();



