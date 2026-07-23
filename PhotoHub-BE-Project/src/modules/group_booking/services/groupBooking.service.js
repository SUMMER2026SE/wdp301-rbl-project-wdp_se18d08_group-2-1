const { PayOS } = require("@payos/node");
const mongoose = require("mongoose");

const { GroupBooking, GROUP_STATUS } = require("../models/groupBooking.model");
const {
  GroupMember,
  MEMBER_ROLE,
  MEMBER_PAYMENT_STATUS,
} = require("../models/groupMember.model");
const PhotographerPackage = require("../../packages/models/photographerPackage.model");
const Photographer = require("../../photographers/models/photographer");
const Wallet = require("../../admin/models/Wallet");
const Payment = require("../../admin/models/Payment");
const { Booking, BOOKING_STATUS, PAYMENT_STATUS } = require("../../bookings/models/booking.model");
const { getIO } = require("../../../socket");

// ─── Config ───────────────────────────────────────────────────────────────────

const DEFAULT_FRONTEND_URL =
  process.env.FRONTEND_URL || "https://photo-hub-be-project.vercel.app";

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

// ─── Discount Table (UC102) ───────────────────────────────────────────────────

/**
 * Bảng giảm giá bậc thang theo số lượng thành viên PAID.
 * @param {number} paidCount - Số thành viên đã thanh toán
 * @returns {number} Phần trăm giảm giá (0 | 10 | 15 | 20)
 */
function getDiscountPercent(paidCount) {
  if (paidCount >= 5) return 20;
  if (paidCount >= 3) return 15;
  if (paidCount >= 2) return 10;
  return 0;
}

// ─── In-Memory Distributed Lock (thay thế Redis) ─────────────────────────────

/**
 * Map lưu trữ chuỗi Promise theo groupId.
 * Đảm bảo tránh Race Condition khi nhiều người join cùng lúc
 * (an toàn cho single-process Node.js).
 */
const _lockMap = new Map();

/**
 * Thực thi hàm fn trong ngữ cảnh khóa của groupId.
 * Nếu có request khác đang chạy với cùng groupId, request mới sẽ đợi.
 */
async function withGroupLock(groupId, fn) {
  const key = String(groupId);
  const current = _lockMap.get(key) || Promise.resolve();
  let releaseFn;
  const next = new Promise((resolve) => {
    releaseFn = resolve;
  });
  _lockMap.set(key, current.then(() => next));
  try {
    await current;
    return await fn();
  } finally {
    releaseFn();
    // Dọn dẹp map nếu không còn ai dùng
    if (_lockMap.get(key) === next) {
      _lockMap.delete(key);
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Emit Socket.IO an toàn — không crash nếu chưa khởi tạo
 */
function safeEmit(room, event, data) {
  try {
    getIO().to(room).emit(event, data);
  } catch (err) {
    console.error(`[GroupBooking Socket] emit "${event}" to "${room}":`, err.message);
  }
}

/**
 * Đảm bảo user có Wallet, tạo mới nếu chưa có
 */
async function ensureWallet(userId) {
  return Wallet.findOneAndUpdate(
    { user: userId },
    {
      $setOnInsert: {
        user: userId,
        balance: 0,
        holdBalance: 0,
        currency: "VND",
      },
    },
    { new: true, upsert: true }
  );
}

/**
 * Tạo PayOS payment link
 */
async function createPayOSLink(paymentData) {
  if (payos.paymentRequests?.create) {
    return payos.paymentRequests.create(paymentData);
  }
  return payos.createPaymentLink(paymentData);
}

/**
 * Lấy thông tin PayOS payment link
 */
async function getPayOSLink(orderCode) {
  if (payos.paymentRequests?.get) {
    return payos.paymentRequests.get(orderCode);
  }
  return payos.getPaymentLinkInformation(orderCode);
}

/**
 * Xác minh PayOS webhook
 */
async function verifyPayOSWebhook(body) {
  if (payos.webhooks?.verify) {
    return payos.webhooks.verify(body);
  }
  return payos.verifyPaymentWebhookData(body);
}

// ─── Service Class ────────────────────────────────────────────────────────────

class GroupBookingService {
  // ═══════════════════════════════════════════════════════════════════════════
  // UC96: Tạo nhóm
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Sinh mã nhóm ngẫu nhiên 6-8 ký tự (A-Z, 0-9), đảm bảo không trùng DB.
   */
  async generateUniqueGroupCode() {
    const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const LENGTH = 7; // 7 ký tự
    let code;
    let attempts = 0;
    do {
      code = Array.from({ length: LENGTH }, () =>
        CHARS.charAt(Math.floor(Math.random() * CHARS.length))
      ).join("");
      attempts++;
      if (attempts > 20) throw new Error("Không thể sinh mã nhóm duy nhất");
    } while (await GroupBooking.exists({ groupCode: code }));
    return code;
  }

  /**
   * UC96 — Tạo nhóm chụp ảnh chung.
   *
   * @param {string} userId      - ID của User tạo nhóm (Leader)
   * @param {object} dto         - Dữ liệu đầu vào
   * @param {string} dto.conceptId   - ID của PhotographerPackage
   * @param {number} dto.minMembers  - Số thành viên tối thiểu
   * @param {number} dto.maxMembers  - Số thành viên tối đa
   * @param {string} dto.expireTime  - ISO date string thời gian hết hạn
   * @param {string} dto.shootDate   - Định dạng YYYY-MM-DD
   * @param {string} dto.shootStartTime - Định dạng HH:mm
   * @param {string} [dto.note]      - Ghi chú của Leader
   */
  async createGroupBooking(userId, dto) {
    const { conceptId, minMembers, maxMembers, expireTime, shootDate, shootStartTime, note } = dto;

    // Kiểm tra concept (PhotographerPackage) tồn tại và đang ACTIVE
    const concept = await PhotographerPackage.findById(conceptId);
    if (!concept) throw new Error("Concept không tồn tại");
    if (concept.status !== "ACTIVE")
      throw new Error("Concept hiện không còn hoạt động");

    // ─── Rule: Gói MONTHLY và gói không được đánh dấu Group không thể tạo nhóm ───
    if (concept.packageType === "MONTHLY") {
      throw new Error("Gói tháng (MONTHLY) không được phép dùng cho đặt lịch nhóm");
    }
    if (!concept.isGroupPackage) {
      throw new Error("Gói này không được cấu hình cho đặt lịch nhóm. Vui lòng chọn gói có bật chức năng nhóm");
    }

    // Lấy thông tin Photographer từ package
    const photographer = await Photographer.findById(
      concept.photographerId
    ).select("_id user");
    if (!photographer) throw new Error("Nhiếp ảnh gia không tồn tại");

    // Tính toán start và end của buổi chụp
    const start = new Date(`${shootDate}T${shootStartTime}:00`);
    if (isNaN(start.getTime()) || start <= new Date()) {
      throw new Error("Thời gian chụp phải là một thời điểm trong tương lai");
    }
    const durationHours = concept.durationHours || 2; // Mặc định 2 tiếng nếu không có
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

    // Kiểm tra trùng lịch Booking lẻ của Photographer
    const overlapBooking = await Booking.findOne({
      photographer: photographer._id,
      status: { $nin: ["cancelled", "rejected"] },
      start: { $lt: end },
      end: { $gt: start },
    });
    if (overlapBooking) {
      throw new Error("Nhiếp ảnh gia đã có lịch chụp khác vào khung giờ này");
    }

    // Kiểm tra trùng lịch với các nhóm chụp chung khác đang hoạt động
    const overlapGroup = await GroupBooking.findOne({
      photographer: photographer._id,
      status: { $in: ["PENDING", "CONFIRMED"] },
      start: { $lt: end },
      end: { $gt: start },
    });
    if (overlapGroup) {
      throw new Error("Nhiếp ảnh gia đã được đặt lịch chụp nhóm khác vào khung giờ này");
    }

    // Validate thời gian hết hạn
    const expireDate = new Date(expireTime);
    if (isNaN(expireDate.getTime()) || expireDate <= new Date()) {
      throw new Error("Thời gian hết hạn phải là trong tương lai");
    }

    // Validate số lượng thành viên (min: 2, max: 10)
    const min = Number(minMembers);
    const max = Number(maxMembers);
    if (min < 2 || min > 10) {
      throw new Error("Số thành viên tối thiểu phải từ 2 đến 10 người");
    }
    if (max < min || max > 10) {
      throw new Error(
        "Số thành viên tối đa phải từ 2 đến 10 và lớn hơn hoặc bằng số tối thiểu"
      );
    }

    // Sinh mã nhóm
    const groupCode = await this.generateUniqueGroupCode();

    // Tạo GroupBooking
    const group = await GroupBooking.create({
      groupCode,
      concept: concept._id,
      photographer: photographer._id,
      leader: userId,
      minMembers: min,
      maxMembers: max,
      currentMemberCount: 0, // Leader chưa thanh toán
      basePrice: concept.price,
      currentPrice: concept.price, // Chưa có giảm giá
      discountPercent: 0,
      status: GROUP_STATUS.PENDING,
      expireTime: expireDate,
      note: note?.trim() || null,
      shootDate,
      shootStartTime,
      start,
      end,
    });

    // Thêm Leader vào GroupMember (chưa thanh toán → PENDING)
    await GroupMember.create({
      group: group._id,
      user: userId,
      role: MEMBER_ROLE.LEADER,
      paymentStatus: MEMBER_PAYMENT_STATUS.PENDING,
      depositAmount: concept.price,
    });

    // Emit socket thông báo cho photographer
    safeEmit(`user:${photographer.user}`, "group-booking-created", {
      groupId: group._id,
      groupCode: group.groupCode,
      conceptTitle: concept.title,
      leaderUserId: userId,
    });

    return this.getGroupDetail(group._id, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UC98: Tham gia nhóm
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * UC98 — User tham gia nhóm bằng groupId hoặc groupCode.
   * Sử dụng in-memory lock để tránh race condition.
   */
  async joinGroupBooking(userId, groupIdentifier) {
    // Tìm nhóm theo ObjectId hoặc groupCode
    let group;
    if (mongoose.Types.ObjectId.isValid(groupIdentifier)) {
      group = await GroupBooking.findById(groupIdentifier);
    }
    if (!group) {
      group = await GroupBooking.findOne({
        groupCode: String(groupIdentifier).toUpperCase(),
      });
    }
    if (!group) throw new Error("Nhóm không tồn tại");

    return withGroupLock(group._id, async () => {
      // Reload để lấy dữ liệu mới nhất sau khi có lock
      const freshGroup = await GroupBooking.findById(group._id);

      // Kiểm tra điều kiện
      if (freshGroup.status !== GROUP_STATUS.PENDING) {
        throw new Error(
          freshGroup.status === GROUP_STATUS.CONFIRMED
            ? "Nhóm đã được chốt, không thể tham gia"
            : "Nhóm đã bị hủy"
        );
      }
      if (freshGroup.expireTime <= new Date()) {
        throw new Error("Nhóm đã hết hạn");
      }
      if (freshGroup.isLocked) {
        throw new Error("Nhóm đã bị Trưởng nhóm khóa đăng ký mới");
      }

      // Join qua link mời phải idempotent: nếu trình duyệt gửi lặp request,
      // trả lại membership hiện tại thay vì báo lỗi sau khi lượt đầu đã thành công.
      const existing = await GroupMember.findOne({
        group: freshGroup._id,
        user: userId,
      });
      if (existing) {
        return {
          member: existing,
          group: freshGroup,
          alreadyJoined: true,
          nextStep: "Bạn đã ở trong nhóm này",
        };
      }

      // Đếm tổng số thành viên đã đăng ký tham gia (bất kể trạng thái cọc) để kiểm tra slot đăng ký
      const totalMemberCount = await GroupMember.countDocuments({
        group: freshGroup._id,
      });
      if (totalMemberCount >= freshGroup.maxMembers) {
        throw new Error("Nhóm đã đủ số lượng đăng ký chờ thanh toán, không còn slot trống");
      }

      // Tạo bản ghi GroupMember → PENDING (chờ thanh toán)
      const member = await GroupMember.create({
        group: freshGroup._id,
        user: userId,
        role: MEMBER_ROLE.MEMBER,
        paymentStatus: MEMBER_PAYMENT_STATUS.PENDING,
        depositAmount: freshGroup.currentPrice,
      });

      // Tính toán lại giá cọc và phần trăm giảm giá của nhóm sau khi có thành viên mới gia nhập
      const discountResult = await this.calculateGroupDiscount(freshGroup._id);

      // Emit socket thông báo cho leader
      safeEmit(`user:${freshGroup.leader}`, "group-member-joined", {
        groupId: freshGroup._id,
        groupCode: freshGroup.groupCode,
        newMemberUserId: userId,
        currentMemberCount: discountResult?.totalCount || (totalMemberCount + 1), // Đã bao gồm cả người mới tham gia
      });

      // Emit socket cập nhật nhóm realtime
      safeEmit(`group:${freshGroup._id}`, "group-updated", {
        groupId: freshGroup._id,
        action: "join",
        message: "Có thành viên mới tham gia nhóm",
      });

      return {
        member,
        group: freshGroup,
        nextStep: "Vui lòng thanh toán đặt cọc để giữ chỗ",
      };
    });
  }

  /**
   * UC98 — Tạo PayOS payment link cho thành viên đặt cọc.
   *
   * @param {string} groupId  - ID của GroupBooking
   * @param {string} userId   - ID của User (phải là member của nhóm)
   */
  async createMemberPaymentLink(groupId, userId) {
    const group = await GroupBooking.findById(groupId).populate(
      "concept",
      "title"
    );
    if (!group) throw new Error("Nhóm không tồn tại");
    if (group.status !== GROUP_STATUS.PENDING) {
      throw new Error("Nhóm không còn ở trạng thái chờ");
    }

    const member = await GroupMember.findOne({ group: groupId, user: userId });
    if (!member) throw new Error("Bạn chưa tham gia nhóm này");
    if (member.paymentStatus === MEMBER_PAYMENT_STATUS.PAID) {
      return { alreadyPaid: true };
    }

    // Nếu đã có link và chưa hết hạn + giá trị đặt cọc trùng khớp với giá hiện tại của nhóm → trả lại link cũ
    if (
      member.paymentLink &&
      member.payosOrderCode &&
      member.paymentStatus === MEMBER_PAYMENT_STATUS.PENDING &&
      member.depositAmount === Math.round(group.currentPrice)
    ) {
      return {
        paymentLink: member.paymentLink,
        checkoutUrl: member.paymentLink,
        orderCode: member.payosOrderCode,
      };
    }

    const orderCode = Number(
      `${Date.now()}${Math.floor(Math.random() * 90 + 10)}`.slice(-12)
    );
    const amount = Math.round(group.currentPrice);
    const frontendUrl =
      process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;
    const returnUrl = `${frontendUrl}/group-booking/${groupId}?orderCode=${orderCode}&groupId=${groupId}`;
    const cancelUrl = `${frontendUrl}/group-booking/${groupId}?orderCode=${orderCode}&groupId=${groupId}&canceled=true`;

    const paymentData = {
      orderCode,
      amount,
      description: `PhotoHub Group ${group.groupCode}`.slice(0, 25),
      returnUrl,
      cancelUrl,
      items: [
        {
          name: `Đặt cọc nhóm ${group.groupCode}`.substring(0, 25),
          quantity: 1,
          price: amount,
        },
      ],
    };

    const response = await createPayOSLink(paymentData);

    // Cập nhật thông tin thanh toán vào GroupMember
    await GroupMember.findByIdAndUpdate(member._id, {
      payosOrderCode: orderCode,
      paymentLinkId: response.paymentLinkId || response.id || null,
      paymentLink: response.checkoutUrl,
      depositAmount: amount,
    });

    return {
      paymentLink: response.checkoutUrl,
      checkoutUrl: response.checkoutUrl,
      orderCode,
      paymentLinkId: response.paymentLinkId || response.id || null,
      qrCode: response.qrCode,
    };
  }

  /**
   * UC98 — Đánh dấu member đã thanh toán sau khi PayOS webhook gọi về.
   * Trigger tính lại giá và kiểm tra chốt nhóm.
   *
   * @param {object} webhookBody - Raw body từ PayOS
   */
  async handleMemberPayosWebhook(webhookBody) {
    const verifiedData = await verifyPayOSWebhook(webhookBody);
    const data = verifiedData?.data || verifiedData;
    const orderCode = data?.orderCode;
    const code = data?.code || webhookBody?.code;

    if (!orderCode) throw new Error("Webhook thiếu orderCode");
    if (String(code) !== "00") {
      return { skipped: true, orderCode, reason: "Thanh toán không thành công" };
    }

    // Tìm GroupMember theo orderCode
    const member = await GroupMember.findOne({
      payosOrderCode: Number(orderCode),
    });
    if (!member) throw new Error(`Không tìm thấy member với orderCode=${orderCode}`);
    if (member.paymentStatus === MEMBER_PAYMENT_STATUS.PAID) {
      return { alreadyProcessed: true };
    }

    const amount = Number(data.amount || data.amountPaid || member.depositAmount || 0);

    // Cập nhật trạng thái member
    member.paymentStatus = MEMBER_PAYMENT_STATUS.PAID;
    member.paidAt = new Date();
    member.depositAmount = amount || member.depositAmount;
    await member.save();

    // Ghi nhận Payment record
    await Payment.create({
      sender: member.user,
      amount: member.depositAmount,
      paymentType: "DEPOSIT",
      paymentMethod: "PAYOS",
      transactionId: String(orderCode),
      status: "SUCCESS",
      confirmedAt: new Date(),
      adminNote: `Group Booking đặt cọc - GroupMember ${member._id}`,
    });

    // Trigger tính lại giá (UC102)
    await this.calculateGroupDiscount(member.group);

    // Trigger kiểm tra chốt nhóm (UC103)
    await this.checkAndConfirmGroup(member.group);

    return { success: true, memberId: member._id, orderCode };
  }

  /**
   * UC98 — Đồng bộ trạng thái thanh toán bằng cách query PayOS.
   */
  async syncMemberPaymentStatus(groupId, userId, orderCode, forceCancel = false) {
    const member = await GroupMember.findOne({ group: groupId, user: userId });
    if (!member) throw new Error("Bạn chưa tham gia nhóm này");

    if (forceCancel) {
      member.paymentStatus = MEMBER_PAYMENT_STATUS.PENDING;
      await member.save();
      const code = Number(orderCode || member.payosOrderCode);
      if (code) {
        try {
          if (payos.paymentRequests?.cancel) {
            await payos.paymentRequests.cancel(code, "User cancelled payment");
          } else if (payos.cancelPaymentLink) {
            await payos.cancelPaymentLink(code, "User cancelled payment");
          }
        } catch (e) {
          console.warn("[GroupBooking PayOS] Cancel link error:", e.message);
        }
      }
      return { paid: false, status: "CANCELLED" };
    }

    if (member.paymentStatus === MEMBER_PAYMENT_STATUS.PAID) {
      return { paid: true, member };
    }

    const code = Number(orderCode || member.payosOrderCode);
    if (!code) throw new Error("Chưa có mã đơn hàng PayOS");

    const paymentLink = await getPayOSLink(code);
    if (
      paymentLink.status === "PAID" ||
      Number(paymentLink.amountPaid || 0) >= member.depositAmount
    ) {
      member.paymentStatus = MEMBER_PAYMENT_STATUS.PAID;
      member.paidAt = new Date();
      await member.save();

      await this.calculateGroupDiscount(member.group);
      await this.checkAndConfirmGroup(member.group);

      return { paid: true, payosStatus: paymentLink.status, member };
    }

    return { paid: false, payosStatus: paymentLink.status, member };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UC99: Mời bạn bè
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * UC99 — Trả về thông tin link mời.
   * Chỉ user đang là member trong nhóm mới có quyền mời.
   */
  async getInviteLink(groupId, userId) {
    const group = await GroupBooking.findById(groupId);
    if (!group) throw new Error("Nhóm không tồn tại");

    // Kiểm tra user là thành viên
    const member = await GroupMember.findOne({ group: groupId, user: userId });
    if (!member) throw new Error("Bạn không phải thành viên của nhóm này");

    if (group.status !== GROUP_STATUS.PENDING) {
      throw new Error("Nhóm đã không còn ở trạng thái chờ");
    }

    const paidCount = await GroupMember.countDocuments({
      group: groupId,
      paymentStatus: MEMBER_PAYMENT_STATUS.PAID,
    });
    if (paidCount >= group.maxMembers) {
      throw new Error("Nhóm đã đầy");
    }

    const frontendUrl = process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;
    const inviteUrl = `${frontendUrl}/group-booking?code=${group.groupCode}`;

    return {
      groupCode: group.groupCode,
      inviteUrl,
      shareText: `📸 Tham gia nhóm chụp ảnh chung trên PhotoHub!\nMã nhóm: ${group.groupCode}\nLink: ${inviteUrl}`,
      shareUrls: {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`,
        zalo: `https://zalo.me/share?url=${encodeURIComponent(inviteUrl)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`Tham gia nhóm chụp ảnh PhotoHub (${group.groupCode}): ${inviteUrl}`)}`,
      },
      remainingSlots: group.maxMembers - paidCount,
      expireTime: group.expireTime,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UC100: Rời nhóm
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * UC100 — User rời nhóm.
   * - MEMBER: Xóa khỏi nhóm, hoàn tiền vào Wallet nếu đã PAID
   * - LEADER: Chỉ định thành viên kế tiếp lên làm Leader mới, hoặc hủy nhóm nếu chỉ có 1 người
   */
  async leaveGroup(groupId, userId) {
    const group = await GroupBooking.findById(groupId);
    if (!group) throw new Error("Nhóm không tồn tại");
    if (group.status !== GROUP_STATUS.PENDING) {
      throw new Error("Chỉ có thể rời nhóm khi nhóm đang ở trạng thái chờ");
    }

    const member = await GroupMember.findOne({ group: groupId, user: userId });
    if (!member) throw new Error("Bạn không phải thành viên của nhóm này");

    return withGroupLock(groupId, async () => {
      if (member.role === MEMBER_ROLE.LEADER) {
        return this._handleLeaderLeave(group, member, userId);
      } else {
        return this._handleMemberLeave(group, member, userId);
      }
    });
  }

  /**
   * Xử lý khi MEMBER rời nhóm — xóa bản ghi, hoàn tiền nếu đã PAID
   * @private
   */
  async _handleMemberLeave(group, member, userId) {
    const wasPaid = member.paymentStatus === MEMBER_PAYMENT_STATUS.PAID;
    const refundAmount = wasPaid ? member.depositAmount : 0;

    // Xóa bản ghi member
    await GroupMember.findByIdAndDelete(member._id);

    // Hoàn tiền vào Wallet nội bộ nếu đã đóng tiền
    if (wasPaid && refundAmount > 0) {
      await ensureWallet(userId);
      await Wallet.findOneAndUpdate(
        { user: userId },
        { $inc: { balance: refundAmount } },
        { new: true }
      );

      // Ghi nhận refund payment
      await Payment.create({
        sender: group.leader,
        receiver: userId,
        amount: refundAmount,
        paymentType: "REFUND",
        paymentMethod: "WALLET",
        transactionId: `GB_REFUND_${member._id}_${Date.now()}`,
        status: "SUCCESS",
        confirmedAt: new Date(),
        adminNote: `Hoàn tiền đặt cọc nhóm ${group.groupCode} - Member rời nhóm`,
      });

      // Cập nhật GroupMember
      await GroupMember.findByIdAndUpdate(member._id, {
        paymentStatus: MEMBER_PAYMENT_STATUS.REFUNDED,
        refundedAt: new Date(),
        refundedAmount: refundAmount,
      }).catch(() => { });
    }

    // Tính lại giá giảm sau khi member rời
    await this.calculateGroupDiscount(group._id);

    // Emit socket
    safeEmit(`user:${group.leader}`, "group-member-left", {
      groupId: group._id,
      leftUserId: userId,
      refunded: wasPaid,
      refundAmount,
    });

    safeEmit(`group:${group._id}`, "group-updated", {
      groupId: group._id,
      action: "leave",
      message: "Có thành viên đã rời nhóm",
    });

    return {
      success: true,
      message: wasPaid
        ? `Rời nhóm thành công. ${refundAmount.toLocaleString("vi-VN")}đ đã được hoàn vào ví của bạn.`
        : "Rời nhóm thành công.",
      refunded: wasPaid,
      refundAmount,
    };
  }

  /**
   * Xử lý khi LEADER rời nhóm.
   * Logic: Tìm thành viên PAID vào sớm nhất kế tiếp → lên làm Leader.
   * Nếu không có thành viên nào → hủy nhóm luôn.
   * @private
   */
  async _handleLeaderLeave(group, leaderMember, userId) {
    // Tìm thành viên PAID kế tiếp (theo thứ tự gia nhập)
    const nextLeaderMember = await GroupMember.findOne({
      group: group._id,
      user: { $ne: userId },
      role: MEMBER_ROLE.MEMBER,
      paymentStatus: MEMBER_PAYMENT_STATUS.PAID,
    }).sort({ createdAt: 1 });

    if (!nextLeaderMember) {
      // Không có ai kế tiếp → hủy nhóm và hoàn tiền cho leader nếu đã trả
      const leaderWasPaid = leaderMember.paymentStatus === MEMBER_PAYMENT_STATUS.PAID;
      await GroupMember.findByIdAndDelete(leaderMember._id);

      if (leaderWasPaid && leaderMember.depositAmount > 0) {
        await ensureWallet(userId);
        await Wallet.findOneAndUpdate(
          { user: userId },
          { $inc: { balance: leaderMember.depositAmount } },
          { new: true }
        );
        await Payment.create({
          receiver: userId,
          amount: leaderMember.depositAmount,
          paymentType: "REFUND",
          paymentMethod: "WALLET",
          transactionId: `GB_LEADER_REFUND_${leaderMember._id}_${Date.now()}`,
          status: "SUCCESS",
          confirmedAt: new Date(),
          adminNote: `Hoàn tiền đặt cọc nhóm ${group.groupCode} - Leader hủy khi không còn thành viên`,
        });
      }

      await GroupBooking.findByIdAndUpdate(group._id, {
        status: GROUP_STATUS.CANCELED,
        canceledAt: new Date(),
      });

      return {
        success: true,
        message: "Nhóm đã bị hủy do không có thành viên nào kế nhiệm.",
        groupCanceled: true,
      };
    }

    // Bổ nhiệm thành viên kế tiếp làm Leader mới
    await GroupMember.findByIdAndUpdate(nextLeaderMember._id, {
      role: MEMBER_ROLE.LEADER,
    });
    await GroupBooking.findByIdAndUpdate(group._id, {
      leader: nextLeaderMember.user,
    });

    // Hoàn tiền cho leader cũ nếu đã thanh toán
    const leaderWasPaid = leaderMember.paymentStatus === MEMBER_PAYMENT_STATUS.PAID;
    const refundAmount = leaderWasPaid ? leaderMember.depositAmount : 0;
    await GroupMember.findByIdAndDelete(leaderMember._id);

    if (leaderWasPaid && refundAmount > 0) {
      await ensureWallet(userId);
      await Wallet.findOneAndUpdate(
        { user: userId },
        { $inc: { balance: refundAmount } },
        { new: true }
      );
      await Payment.create({
        receiver: userId,
        amount: refundAmount,
        paymentType: "REFUND",
        paymentMethod: "WALLET",
        transactionId: `GB_LEADER_REFUND_${leaderMember._id}_${Date.now()}`,
        status: "SUCCESS",
        confirmedAt: new Date(),
        adminNote: `Hoàn tiền đặt cọc nhóm ${group.groupCode} - Leader rời nhóm`,
      });
    }

    // Tính lại giá giảm
    await this.calculateGroupDiscount(group._id);

    // Thông báo cho leader mới
    safeEmit(`user:${nextLeaderMember.user}`, "group-leader-promoted", {
      groupId: group._id,
      groupCode: group.groupCode,
      message: "Bạn đã được bổ nhiệm làm Leader của nhóm",
    });

    safeEmit(`group:${group._id}`, "group-updated", {
      groupId: group._id,
      action: "leader_changed",
      message: "Trưởng nhóm đã rời đi, trưởng nhóm mới đã được bổ nhiệm",
    });

    return {
      success: true,
      message: "Rời nhóm thành công. Một thành viên khác đã được bổ nhiệm làm Leader mới.",
      newLeaderUserId: nextLeaderMember.user,
      refunded: leaderWasPaid,
      refundAmount,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UC102: Tính giá giảm bậc thang
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * UC102 — Tính lại giá sau khi số thành viên PAID thay đổi.
   * Cập nhật currentPrice và discountPercent trong GroupBooking.
   * Emit socket để FE cập nhật realtime cho tất cả members.
   */
  async calculateGroupDiscount(groupId) {
    const group = await GroupBooking.findById(groupId);
    if (!group) return null;

    // Tính discount % dựa trên tổng số thành viên đăng ký (bất kể cọc hay chưa)
    const totalCount = await GroupMember.countDocuments({
      group: groupId,
    });

    const paidCount = await GroupMember.countDocuments({
      group: groupId,
      paymentStatus: MEMBER_PAYMENT_STATUS.PAID,
    });

    const discountPercent = getDiscountPercent(totalCount);
    const currentPrice =
      group.basePrice * (1 - discountPercent / 100);
    const savedAmount = group.basePrice - currentPrice;

    const roundedPrice = Math.round(currentPrice);

    await GroupBooking.findByIdAndUpdate(groupId, {
      currentMemberCount: paidCount,
      discountPercent,
      currentPrice: roundedPrice,
    });

    // Cập nhật lại số tiền cọc cần đóng cho các thành viên chưa thanh toán (PENDING)
    await GroupMember.updateMany(
      { group: groupId, paymentStatus: MEMBER_PAYMENT_STATUS.PENDING },
      { depositAmount: roundedPrice }
    );

    // Emit realtime cho tất cả members trong phòng nhóm
    safeEmit(`group:${groupId}`, "group-price-updated", {
      groupId,
      paidCount,
      totalCount,
      discountPercent,
      basePrice: group.basePrice,
      currentPrice: Math.round(currentPrice),
      savedAmount: Math.round(savedAmount),
    });

    return {
      paidCount,
      totalCount,
      discountPercent,
      basePrice: group.basePrice,
      currentPrice: Math.round(currentPrice),
      savedAmount: Math.round(savedAmount),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UC103: Xác nhận nhóm đủ thành viên
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * UC103 — Kiểm tra điều kiện và chốt nhóm nếu đủ người.
   * Được trigger sau mỗi lần member thanh toán thành công.
   */
  async checkAndConfirmGroup(groupId) {
    const group = await GroupBooking.findById(groupId).populate({
      path: "concept",
      select: "title price durationHours",
    });
    if (!group || group.status !== GROUP_STATUS.PENDING) return null;

    const paidCount = await GroupMember.countDocuments({
      group: groupId,
      paymentStatus: MEMBER_PAYMENT_STATUS.PAID,
    });

    const now = new Date();
    const isExpired = group.expireTime <= now;
    const reachedMax = paidCount >= group.maxMembers;
    const reachedMin = paidCount >= group.minMembers;

    // Lấy tổng số thành viên đăng ký hiện tại (PENDING hoặc PAID)
    const totalMemberCount = await GroupMember.countDocuments({
      group: groupId,
    });

    let shouldConfirm = false;

    // 1. Đạt tối đa thành viên
    if (reachedMax) {
      shouldConfirm = true;
    }
    // 2. Hết hạn gom nhóm nhưng đạt số lượng thành viên tối thiểu
    else if (isExpired && reachedMin) {
      shouldConfirm = true;
    }
    // 3. Nhóm bị Leader khóa đăng ký, tất cả thành viên hiện tại đã cọc xong và số người cọc >= 2
    else if (group.isLocked && totalMemberCount === paidCount && paidCount >= 2) {
      shouldConfirm = true;
    }

    if (!shouldConfirm) return null;

    // Chốt nhóm
    await GroupBooking.findByIdAndUpdate(groupId, {
      status: GROUP_STATUS.CONFIRMED,
      confirmedAt: now,
      currentMemberCount: paidCount,
    });

    // Tự động tạo Booking chính thức cho Photographer
    let scheduledBookingId = null;
    try {
      const concept = group.concept || {};
      const newBooking = await Booking.create({
        customer: group.leader,
        photographer: group.photographer,
        package: concept._id || null,
        title: `Chụp nhóm [${group.groupCode}]: ${concept.title || "Concept chụp ảnh"}`,
        note: `Đặt lịch chung từ nhóm ${group.groupCode}. ${group.note || ""}`,
        start: group.start,
        end: group.end,
        location: concept.locationType || "Tại Studio",
        price: Math.round(group.currentPrice * paidCount),
        status: "confirmed", // Nhóm đã cọc xong chuyển thẳng sang confirmed
        paymentStatus: "paid", // Đã thanh toán cọc qua nhóm
        paidAmount: Math.round(group.currentPrice * paidCount),
        paidAt: new Date(),
        groupBooking: group._id, // Liên kết Booking ngược lại GroupBooking
      });
      scheduledBookingId = newBooking._id;

      // Cập nhật lại liên kết scheduledBooking trong GroupBooking
      await GroupBooking.findByIdAndUpdate(groupId, {
        scheduledBooking: scheduledBookingId,
      });

      // Cập nhật Wallet và Earnings của Photographer
      const photographer = await Photographer.findById(group.photographer).select("user");
      if (photographer && photographer.user) {
        await ensureWallet(photographer.user);
        await Wallet.findOneAndUpdate(
          { user: photographer.user },
          { $inc: { holdBalance: newBooking.price } },
          { new: true }
        );
        await Photographer.findByIdAndUpdate(
          group.photographer,
          { $inc: { totalEarnings: newBooking.price } }
        );
      }

      // Tạo Commission record cho Booking nhóm
      try {
        const Commission = require("../../admin/models/Commission");
        const SystemSetting = require("../../admin/models/SystemSetting");
        const COMMISSION_RATE = Number(process.env.PHOTOGRAPHER_COMMISSION_RATE || 0.1);

        const rateSetting = await SystemSetting.findOne({ key: "commissionRate" });
        const currentRate = rateSetting ? rateSetting.value : COMMISSION_RATE;
        const finalCommission = Math.round(newBooking.price * currentRate);

        if (finalCommission > 0) {
          await Commission.create({
            booking: newBooking._id,
            photographer: group.photographer,
            amount: finalCommission,
            rate: currentRate,
            status: "PENDING"
          });
        }
      } catch (commError) {
        console.error("[GroupBooking] Tạo Commission thất bại:", commError.message);
      }

      // Emit socket thông báo cho photographer về booking mới
      if (photographer) {
        safeEmit(`user:${photographer.user}`, "new-booking-request", {
          bookingId: newBooking._id,
          title: newBooking.title,
          start: newBooking.start,
          end: newBooking.end,
          location: newBooking.location,
          price: newBooking.price,
          createdAt: newBooking.createdAt,
        });
      }
    } catch (bookingError) {
      console.error("[GroupBooking] Tự động tạo Booking thất bại:", bookingError.message);
    }

    // Lấy tất cả thành viên PAID để gửi thông báo
    const members = await GroupMember.find({
      group: groupId,
      paymentStatus: MEMBER_PAYMENT_STATUS.PAID,
    }).populate("user", "email fullName");

    // Emit socket cho tất cả members
    safeEmit(`group:${groupId}`, "group-confirmed", {
      groupId,
      groupCode: group.groupCode,
      paidCount,
      discountPercent: group.discountPercent,
      currentPrice: group.currentPrice,
      message: "🎉 Nhóm đã đủ người và được chốt thành công!",
    });

    safeEmit(`group:${groupId}`, "group-updated", {
      groupId,
      action: "confirm",
      message: "Nhóm đã đủ người và được chốt thành công!",
    });

    // Gửi email thông báo cho từng thành viên
    this._sendGroupConfirmedEmails(group, members).catch((err) =>
      console.error("[GroupBooking Email]", err.message)
    );

    return {
      confirmed: true,
      groupId,
      paidCount,
      members: members.map((m) => ({
        userId: m.user._id,
        fullName: m.user.fullName,
        email: m.user.email,
        role: m.role,
      })),
    };
  }

  /**
   * Gửi email xác nhận chốt nhóm cho tất cả thành viên.
   * @private
   */
  async _sendGroupConfirmedEmails(group, members) {
    const { hasMailConfig } = require("../../../utils/emailService");
    if (!hasMailConfig()) {
      console.log(
        `[GroupBooking Email] Chưa cấu hình SMTP — bỏ qua gửi mail cho nhóm ${group.groupCode}`
      );
      return;
    }
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: String(process.env.MAIL_PASSWORD).replace(/\s+/g, ""),
      },
    });

    const conceptTitle = group.concept?.title || "Buổi chụp ảnh nhóm";
    const discountText =
      group.discountPercent > 0
        ? `Giảm giá: <strong>${group.discountPercent}%</strong> — Tiết kiệm ${(
          group.basePrice - group.currentPrice
        ).toLocaleString("vi-VN")}đ/người`
        : "";

    for (const member of members) {
      if (!member.user?.email) continue;
      try {
        await transporter.sendMail({
          from: `"${process.env.MAIL_FROM_NAME || "PHOTOHUB"}" <${process.env.MAIL_USER}>`,
          to: member.user.email,
          subject: `✅ Nhóm chụp ảnh ${group.groupCode} đã được chốt! - PHOTOHUB`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px;">
              <h1 style="color:#f97316;">📸 PHOTOHUB</h1>
              <h2 style="color:#22c55e;">🎉 Nhóm của bạn đã được chốt thành công!</h2>
              <p>Xin chào <strong>${member.user.fullName || "bạn"}</strong>,</p>
              <p>Nhóm chụp ảnh <strong>${group.groupCode}</strong> đã đủ thành viên và được xác nhận chính thức.</p>
              <div style="background:#fff;padding:16px;border-left:4px solid #f97316;border-radius:4px;margin:16px 0;">
                <p><strong>Concept:</strong> ${conceptTitle}</p>
                <p><strong>Mã nhóm:</strong> ${group.groupCode}</p>
                <p><strong>Số thành viên:</strong> ${members.length} người</p>
                <p><strong>Giá mỗi người:</strong> ${group.currentPrice.toLocaleString("vi-VN")}đ</p>
                ${discountText ? `<p>${discountText}</p>` : ""}
                <p><strong>Vai trò của bạn:</strong> ${member.role === MEMBER_ROLE.LEADER ? "Trưởng nhóm" : "Thành viên"}</p>
              </div>
              <p>Chúng tôi sẽ liên hệ để xác nhận lịch chụp cụ thể. Cảm ơn bạn đã sử dụng PhotoHub!</p>
              <p style="color:#6b7280;font-size:12px;margin-top:24px;">Trân trọng,<br>Đội ngũ PhotoHub</p>
            </div>
          `,
          text: `Nhóm ${group.groupCode} đã được chốt! Số thành viên: ${members.length}. Giá/người: ${group.currentPrice.toLocaleString("vi-VN")}đ`,
        });
        console.log(`[GroupBooking Email] Đã gửi xác nhận nhóm cho ${member.user.email}`);
      } catch (err) {
        console.error(`[GroupBooking Email] Lỗi gửi cho ${member.user.email}:`, err.message);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UC104: Hủy nhóm và hoàn tiền
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * UC104 — Hủy một nhóm cụ thể và hoàn tiền cho tất cả thành viên PAID.
   * Dùng nội bộ (cho cron job) và cho Leader chủ động hủy.
   */
  async cancelGroup(groupId, reason = "Nhóm bị hủy") {
    const group = await GroupBooking.findById(groupId);
    if (!group) return null;
    if (group.status !== GROUP_STATUS.PENDING && group.status !== GROUP_STATUS.CONFIRMED) return null;

    // Lấy tất cả members đã thanh toán
    const paidMembers = await GroupMember.find({
      group: groupId,
      paymentStatus: MEMBER_PAYMENT_STATUS.PAID,
    }).populate("user", "email fullName");

    // Hoàn tiền cho từng member
    for (const member of paidMembers) {
      if (member.depositAmount > 0) {
        await ensureWallet(member.user._id || member.user);
        await Wallet.findOneAndUpdate(
          { user: member.user._id || member.user },
          { $inc: { balance: member.depositAmount } },
          { new: true }
        );
        await Payment.create({
          receiver: member.user._id || member.user,
          amount: member.depositAmount,
          paymentType: "REFUND",
          paymentMethod: "WALLET",
          transactionId: `GB_CANCEL_REFUND_${member._id}_${Date.now()}`,
          status: "SUCCESS",
          confirmedAt: new Date(),
          adminNote: `Hoàn tiền nhóm ${group.groupCode} - ${reason}`,
        });

        // Cập nhật trạng thái member
        await GroupMember.findByIdAndUpdate(member._id, {
          paymentStatus: MEMBER_PAYMENT_STATUS.REFUNDED,
          refundedAt: new Date(),
          refundedAmount: member.depositAmount,
        });
      }

      // Emit socket cho từng member
      const uid = member.user._id || member.user;
      safeEmit(`user:${uid}`, "group-booking-canceled", {
        groupId,
        groupCode: group.groupCode,
        reason,
        refundAmount: member.depositAmount,
        message: `Nhóm ${group.groupCode} đã bị hủy. Tiền đặt cọc ${member.depositAmount.toLocaleString("vi-VN")}đ đã được hoàn vào ví của bạn.`,
      });
    }

    // Cập nhật trạng thái nhóm
    await GroupBooking.findByIdAndUpdate(groupId, {
      status: GROUP_STATUS.CANCELED,
      canceledAt: new Date(),
    });

    safeEmit(`group:${groupId}`, "group-updated", {
      groupId,
      action: "cancel",
      message: reason,
    });

    // Gửi email thông báo hủy
    this._sendGroupCanceledEmails(group, paidMembers, reason).catch((err) =>
      console.error("[GroupBooking Cancel Email]", err.message)
    );

    console.log(
      `[GroupBooking] Đã hủy nhóm ${group.groupCode} — Hoàn tiền cho ${paidMembers.length} thành viên`
    );

    return {
      canceled: true,
      groupCode: group.groupCode,
      refundedCount: paidMembers.length,
    };
  }

  /**
   * UC104 — Leader chủ động hủy nhóm (cần kiểm tra quyền).
   */
  async cancelGroupByLeader(groupId, userId) {
    const group = await GroupBooking.findById(groupId);
    if (!group) throw new Error("Nhóm không tồn tại");
    if (String(group.leader) !== String(userId)) {
      throw new Error("Chỉ Leader mới có quyền hủy nhóm");
    }
    if (group.status !== GROUP_STATUS.PENDING) {
      throw new Error("Chỉ có thể hủy nhóm đang ở trạng thái chờ");
    }
    return this.cancelGroup(groupId, "Leader chủ động hủy nhóm");
  }

  /**
   * UC104 — Cron job: Hủy tất cả nhóm PENDING đã hết hạn mà chưa đủ người.
   * Được gọi mỗi phút bởi scheduler.
   */
  async cancelExpiredGroups() {
    const now = new Date();
    const expiredGroups = await GroupBooking.find({
      status: GROUP_STATUS.PENDING,
      expireTime: { $lte: now },
    }).select("_id groupCode minMembers");

    let canceledCount = 0;
    for (const group of expiredGroups) {
      const paidCount = await GroupMember.countDocuments({
        group: group._id,
        paymentStatus: MEMBER_PAYMENT_STATUS.PAID,
      });

      if (paidCount < group.minMembers) {
        // Chưa đủ người → hủy và hoàn tiền
        await this.cancelGroup(
          group._id,
          `Hết thời gian chờ, chỉ có ${paidCount}/${group.minMembers} người tham gia`
        );
        canceledCount++;
      } else {
        // Đủ người → chốt nhóm
        await this.checkAndConfirmGroup(group._id);
      }
    }

    if (canceledCount > 0 || expiredGroups.length > 0) {
      console.log(
        `[GroupBooking Cron] Xử lý ${expiredGroups.length} nhóm hết hạn — Hủy: ${canceledCount}`
      );
    }
  }

  /**
   * Gửi email thông báo hủy nhóm cho tất cả thành viên.
   * @private
   */
  async _sendGroupCanceledEmails(group, members, reason) {
    const { hasMailConfig } = require("../../../utils/emailService");
    if (!hasMailConfig()) return;

    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: String(process.env.MAIL_PASSWORD).replace(/\s+/g, ""),
      },
    });

    for (const member of members) {
      if (!member.user?.email) continue;
      try {
        await transporter.sendMail({
          from: `"${process.env.MAIL_FROM_NAME || "PHOTOHUB"}" <${process.env.MAIL_USER}>`,
          to: member.user.email,
          subject: `❌ Nhóm chụp ảnh ${group.groupCode} đã bị hủy - PHOTOHUB`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px;">
              <h1 style="color:#f97316;">📸 PHOTOHUB</h1>
              <p>Xin chào <strong>${member.user.fullName || "bạn"}</strong>,</p>
              <p>Rất tiếc thông báo rằng nhóm <strong>${group.groupCode}</strong> đã bị hủy.</p>
              <div style="background:#fff;padding:16px;border-left:4px solid #ef4444;border-radius:4px;margin:16px 0;">
                <p><strong>Lý do:</strong> ${reason}</p>
                <p><strong>Số tiền hoàn trả:</strong> <span style="color:#22c55e;font-weight:bold;">${member.depositAmount?.toLocaleString("vi-VN") || 0}đ</span></p>
                <p>Số tiền đã được cộng trực tiếp vào <strong>ví PhotoHub</strong> của bạn.</p>
              </div>
              <p>Bạn có thể tham gia nhóm khác hoặc tạo nhóm mới trên PhotoHub!</p>
              <p style="color:#6b7280;font-size:12px;margin-top:24px;">Trân trọng,<br>Đội ngũ PhotoHub</p>
            </div>
          `,
        });
      } catch (err) {
        console.error(`[GroupBooking Email] Lỗi gửi hủy nhóm cho ${member.user.email}:`, err.message);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Queries: Danh sách & Chi tiết
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Lấy danh sách nhóm PENDING đang mở để Discover.
   *
   * @param {object} query
   * @param {string} [query.conceptId]  - Lọc theo concept
   * @param {number} [query.page]       - Trang (default: 1)
   * @param {number} [query.limit]      - Số lượng/trang (default: 12)
   */
  async discoverGroups({ conceptId, search, shootDate, status, availableOnly, page = 1, limit = 12 } = {}) {
    const filter = {
      ...(status === GROUP_STATUS.CONFIRMED
        ? { status: GROUP_STATUS.CONFIRMED }
        : { status: GROUP_STATUS.PENDING, expireTime: { $gt: new Date() } }),
    };
    if (shootDate) {
      filter.shootDate = shootDate;
    }
    if (search?.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");
      const matchingConcepts = await PhotographerPackage.find({
        title: searchRegex,
      }).distinct("_id");

      const searchConditions = [
        { groupCode: searchRegex },
        { note: searchRegex },
        { concept: { $in: matchingConcepts } },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }
    if (availableOnly === true || availableOnly === "true") {
      filter.$expr = { $lt: ["$currentMemberCount", "$maxMembers"] };
    }

    const facetRows = await GroupBooking.aggregate([
      { $match: filter },
      { $group: { _id: "$concept", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const facetPackages = await PhotographerPackage.find({
      _id: { $in: facetRows.map((row) => row._id) },
    }).select("title");
    const conceptFacets = facetRows.map((row) => ({
      _id: row._id,
      title: facetPackages.find((pkg) => String(pkg._id) === String(row._id))?.title || "Gói chụp",
      count: row.count,
    }));

    if (conceptId && mongoose.Types.ObjectId.isValid(conceptId)) {
      filter.concept = new mongoose.Types.ObjectId(conceptId);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [groups, total] = await Promise.all([
      GroupBooking.find(filter)
        .populate("concept", "title price durationHours locationType")
        .populate({ path: "photographer", populate: { path: "user", select: "fullName avatar" } })
        .populate("leader", "fullName avatar")
        .sort({ expireTime: 1 }) // Nhóm sắp hết hạn lên đầu
        .skip(skip)
        .limit(Number(limit)),
      GroupBooking.countDocuments(filter),
    ]);

    const enrichedGroups = await Promise.all(
      groups.map(async (g) => {
        const registeredCount = await GroupMember.countDocuments({
          group: g._id,
        });
        return {
          ...g.toObject(),
          registeredCount,
        };
      })
    );

    return {
      groups: enrichedGroups,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
      conceptFacets,
    };
  }

  /**
   * Lấy chi tiết một nhóm kèm danh sách thành viên.
   */
  async getGroupDetail(groupId, requestUserId = null) {
    // Tự động kiểm tra và chốt nhóm nếu đủ điều kiện nhưng trạng thái chưa cập nhật
    await this.checkAndConfirmGroup(groupId);

    const group = await GroupBooking.findById(groupId)
      .populate("concept", "title description price durationHours numberOfPhotos editedPhotos locationType")
      .populate({
        path: "photographer",
        populate: { path: "user", select: "fullName avatar email" },
      })
      .populate("leader", "fullName avatar");
    if (!group) return null;

    const members = await GroupMember.find({ group: groupId })
      .populate("user", "fullName avatar")
      .sort({ createdAt: 1 });

    const paidCount = members.filter(
      (m) => m.paymentStatus === MEMBER_PAYMENT_STATUS.PAID
    ).length;

    const discountInfo = this.getGroupDiscountInfo(group, members);

    let myMembership = null;
    if (requestUserId) {
      myMembership = members.find(
        (m) => String(m.user?._id || m.user) === String(requestUserId)
      ) || null;
    }

    const groupObj = group.toObject();
    if (groupObj.concept?._id) {
      const PackageImage = require("../../packages/models/packageImage.model");
      const pkgImages = await PackageImage.find({ packageId: groupObj.concept._id });
      groupObj.concept.images = pkgImages;
    }

    return {
      ...groupObj,
      members,
      paidCount,
      remainingSlots: group.maxMembers - paidCount,
      discountInfo,
      myMembership,
    };
  }

  /**
   * Tính toán thông tin discount động (không side-effect) phục vụ cho API GetDetail.
   */
  getGroupDiscountInfo(group, members) {
    const totalCount = Array.isArray(members) ? members.length : 0;
    const paidCount = Array.isArray(members)
      ? members.filter((m) => m.paymentStatus === MEMBER_PAYMENT_STATUS.PAID).length
      : 0;

    const discountPercent = getDiscountPercent(totalCount);
    const currentPrice = group.basePrice * (1 - discountPercent / 100);
    const savedAmount = group.basePrice - currentPrice;

    return {
      paidCount,
      totalCount,
      discountPercent,
      basePrice: group.basePrice,
      currentPrice: Math.round(currentPrice),
      savedAmount: Math.round(savedAmount),
    };
  }


  /**
   * Lấy danh sách nhóm của user hiện tại (cả leader lẫn member).
   */
  async getMyGroups(userId, { status, page = 1, limit = 10 } = {}) {
    const memberDocs = await GroupMember.find({ user: userId }).select("group");
    const groupIds = memberDocs.map((m) => m.group);

    const filter = { _id: { $in: groupIds } };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [groups, total] = await Promise.all([
      GroupBooking.find(filter)
        .populate("concept", "title price")
        .populate("leader", "fullName avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      GroupBooking.countDocuments(filter),
    ]);

    // Gắn thêm membership info và registeredCount cho từng nhóm
    const enriched = await Promise.all(
      groups.map(async (g) => {
        const registeredCount = await GroupMember.countDocuments({
          group: g._id,
        });
        const myMembership = await GroupMember.findOne({
          group: g._id,
          user: userId,
        }).select("role paymentStatus depositAmount");
        return { ...g.toObject(), myMembership, registeredCount };
      })
    );

    return {
      groups: enriched,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Chuyển giao vai trò Leader cho thành viên khác trong nhóm.
   */
  async transferLeader(groupId, leaderId, newLeaderId) {
    if (String(leaderId) === String(newLeaderId)) {
      throw new Error("Bạn đã là Trưởng nhóm rồi");
    }

    const group = await GroupBooking.findById(groupId);
    if (!group) throw new Error("Nhóm không tồn tại");

    if (String(group.leader) !== String(leaderId)) {
      throw new Error("Chỉ Trưởng nhóm mới có quyền chuyển giao vai trò này");
    }

    if (group.status !== GROUP_STATUS.PENDING) {
      throw new Error("Chỉ có thể chuyển quyền khi nhóm đang ở trạng thái chờ");
    }

    // Kiểm tra thành viên mới có ở trong nhóm không
    const newLeaderMember = await GroupMember.findOne({
      group: groupId,
      user: newLeaderId,
    });
    if (!newLeaderMember) {
      throw new Error("Thành viên được chọn không ở trong nhóm này");
    }

    return withGroupLock(groupId, async () => {
      // 1. Cập nhật thành viên mới thành LEADER
      newLeaderMember.role = MEMBER_ROLE.LEADER;
      await newLeaderMember.save();

      // 2. Cập nhật Leader cũ thành MEMBER
      await GroupMember.findOneAndUpdate(
        { group: groupId, user: leaderId },
        { role: MEMBER_ROLE.MEMBER }
      );

      // 3. Cập nhật leader trong GroupBooking
      group.leader = newLeaderId;
      await group.save();

      // Emit socket cập nhật nhóm realtime
      safeEmit(`group:${groupId}`, "group-updated", {
        groupId,
        action: "leader_changed",
        message: "Vai trò Trưởng nhóm đã được chuyển giao thành công",
      });

      return {
        success: true,
        message: "Chuyển giao quyền Trưởng nhóm thành công!",
      };
    });
  }

  /**
   * Leader trục xuất một thành viên khỏi nhóm.
   * Hoàn tiền đặt cọc vào ví của họ nếu họ đã thanh toán (PAID).
   */
  async kickMember(groupId, leaderId, targetUserId) {
    if (String(leaderId) === String(targetUserId)) {
      throw new Error("Bạn không thể tự trục xuất chính mình");
    }

    const group = await GroupBooking.findById(groupId);
    if (!group) throw new Error("Nhóm không tồn tại");

    if (String(group.leader) !== String(leaderId)) {
      throw new Error("Chỉ Trưởng nhóm mới có quyền trục xuất thành viên");
    }

    if (group.status !== GROUP_STATUS.PENDING) {
      throw new Error("Chỉ có thể trục xuất thành viên khi nhóm đang ở trạng thái chờ");
    }

    const member = await GroupMember.findOne({ group: groupId, user: targetUserId });
    if (!member) throw new Error("Thành viên này không ở trong nhóm");

    if (member.role === MEMBER_ROLE.LEADER) {
      throw new Error("Không thể trục xuất Trưởng nhóm");
    }

    if (member.paymentStatus === MEMBER_PAYMENT_STATUS.PAID) {
      throw new Error("Không thể trục xuất thành viên đã đặt cọc tiền");
    }

    return withGroupLock(groupId, async () => {
      const wasPaid = member.paymentStatus === MEMBER_PAYMENT_STATUS.PAID;
      const refundAmount = wasPaid ? member.depositAmount : 0;

      // Xóa thành viên
      await GroupMember.findByIdAndDelete(member._id);

      // Hoàn tiền vào Wallet của thành viên bị kick
      if (wasPaid && refundAmount > 0) {
        await ensureWallet(targetUserId);
        await Wallet.findOneAndUpdate(
          { user: targetUserId },
          { $inc: { balance: refundAmount } },
          { new: true }
        );

        // Ghi nhận Payment record
        await Payment.create({
          sender: leaderId,
          receiver: targetUserId,
          amount: refundAmount,
          paymentType: "REFUND",
          paymentMethod: "WALLET",
          transactionId: `GB_KICK_REFUND_${member._id}_${Date.now()}`,
          status: "SUCCESS",
          confirmedAt: new Date(),
          adminNote: `Hoàn tiền đặt cọc nhóm ${group.groupCode} - Thành viên bị Leader trục xuất`,
        });
      }

      // Tính lại giá của nhóm
      await this.calculateGroupDiscount(groupId);

      // Emit socket thông báo cho thành viên bị kick
      safeEmit(`user:${targetUserId}`, "group-booking-kicked", {
        groupId,
        groupCode: group.groupCode,
        refundAmount,
        message: `Bạn đã bị trục xuất khỏi nhóm ${group.groupCode} bởi Trưởng nhóm. ${wasPaid ? `${refundAmount.toLocaleString("vi-VN")}đ tiền cọc đã được hoàn vào ví của bạn.` : ""
          }`,
      });

      // Emit socket cập nhật nhóm realtime cho những người còn lại
      safeEmit(`group:${groupId}`, "group-updated", {
        groupId,
        action: "kick",
        message: `Một thành viên đã bị Trưởng nhóm trục xuất khỏi nhóm`,
      });

      return {
        success: true,
        message: wasPaid
          ? `Đã trục xuất thành viên và hoàn trả ${refundAmount.toLocaleString("vi-VN")}đ vào ví của họ.`
          : "Đã trục xuất thành viên thành công.",
      };
    });
  }

  /**
   * Khóa hoặc mở khóa đăng ký tham gia nhóm.
   */
  async toggleLockGroup(groupId, leaderId, isLocked) {
    const group = await GroupBooking.findById(groupId);
    if (!group) throw new Error("Nhóm không tồn tại");

    if (String(group.leader) !== String(leaderId)) {
      throw new Error("Chỉ Trưởng nhóm mới có quyền khóa/mở khóa nhóm");
    }

    if (group.status !== GROUP_STATUS.PENDING) {
      throw new Error("Chỉ có thể khóa/mở khóa nhóm đang ở trạng thái chờ");
    }

    group.isLocked = !!isLocked;
    await group.save();

    // Nếu khóa nhóm, tự động check chốt nhóm sớm
    if (group.isLocked) {
      await this.checkAndConfirmGroup(groupId);
    }

    // Emit socket cập nhật nhóm realtime
    safeEmit(`group:${groupId}`, "group-updated", {
      groupId,
      action: isLocked ? "lock" : "unlock",
      message: isLocked
        ? "Trưởng nhóm đã khóa đăng ký thành viên mới"
        : "Trưởng nhóm đã mở khóa đăng ký thành viên",
    });

    return {
      success: true,
      isLocked: group.isLocked,
      message: isLocked ? "Đã khóa đăng ký nhóm thành công!" : "Đã mở khóa đăng ký nhóm thành công!",
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Realtime Group Chat
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Lấy lịch sử nhắn tin nhóm (Chỉ dành cho thành viên của nhóm).
   */
  async getGroupMessages(groupId, userId) {
    const isMember = await GroupMember.exists({ group: groupId, user: userId });
    if (!isMember) {
      throw new Error("Bạn phải là thành viên của nhóm mới được phép xem tin nhắn");
    }

    const GroupMessage = require("../models/groupMessage.model");
    const messages = await GroupMessage.find({ group: groupId })
      .populate("sender", "fullName avatar role")
      .sort({ createdAt: 1 });

    return messages;
  }

  /**
   * Gửi tin nhắn nhóm realtime (Chỉ dành cho thành viên của nhóm).
   */
  async sendGroupMessage(groupId, userId, messageText) {
    const isMember = await GroupMember.exists({ group: groupId, user: userId });
    if (!isMember) {
      throw new Error("Bạn phải là thành viên của nhóm mới được phép gửi tin nhắn");
    }

    const text = String(messageText || "").trim();
    if (!text) {
      throw new Error("Nội dung tin nhắn không được để trống");
    }

    const GroupMessage = require("../models/groupMessage.model");
    const newMsg = await GroupMessage.create({
      group: groupId,
      sender: userId,
      message: text,
    });

    const populatedMsg = await GroupMessage.findById(newMsg._id).populate(
      "sender",
      "fullName avatar role"
    );

    // Phát sự kiện realtime đến tất cả thành viên trong room group:groupId
    safeEmit(`group:${groupId}`, "new-group-message", populatedMsg);

    return populatedMsg;
  }
}

module.exports = new GroupBookingService();


