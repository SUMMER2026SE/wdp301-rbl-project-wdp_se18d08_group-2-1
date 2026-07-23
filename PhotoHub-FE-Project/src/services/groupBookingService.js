import axios from "axios";

const API_BASE = "https://photo-hub-be-project.vercel.app/api";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

export const groupBookingService = {
  // ── UC96: Tạo nhóm ───────────────────────────────────────────────────────
  createGroup: async (data) => {
    const res = await axios.post(`${API_BASE}/group-bookings`, data, getHeaders());
    return res.data;
  },

  // ── UC98: Tham gia nhóm ──────────────────────────────────────────────────
  joinGroup: async (groupId) => {
    const res = await axios.post(
      `${API_BASE}/group-bookings/${groupId}/join`,
      {},
      getHeaders()
    );
    return res.data;
  },

  createPaymentLink: async (groupId) => {
    const res = await axios.post(
      `${API_BASE}/group-bookings/${groupId}/members/payment`,
      {},
      getHeaders()
    );
    return res.data;
  },

  syncPaymentStatus: async (groupId, orderCode, canceled = false) => {
    const res = await axios.get(
      `${API_BASE}/group-bookings/${groupId}/members/payment/status`,
      { ...getHeaders(), params: { orderCode, canceled } }
    );
    return res.data;
  },

  // ── UC99: Mời bạn bè ─────────────────────────────────────────────────────
  getInviteLink: async (groupId) => {
    const res = await axios.get(
      `${API_BASE}/group-bookings/${groupId}/invite`,
      getHeaders()
    );
    return res.data;
  },

  // ── UC100: Rời nhóm ──────────────────────────────────────────────────────
  leaveGroup: async (groupId) => {
    const res = await axios.delete(
      `${API_BASE}/group-bookings/${groupId}/leave`,
      getHeaders()
    );
    return res.data;
  },

  // ── UC104: Hủy nhóm (Leader) ─────────────────────────────────────────────
  cancelGroup: async (groupId) => {
    const res = await axios.delete(
      `${API_BASE}/group-bookings/${groupId}`,
      getHeaders()
    );
    return res.data;
  },

  // ── Queries ───────────────────────────────────────────────────────────────
  discoverGroups: async (params = {}) => {
    const res = await axios.get(`${API_BASE}/group-bookings/discover`, {
      params,
    });
    return res.data;
  },

  getMyGroups: async (params = {}) => {
    const res = await axios.get(`${API_BASE}/group-bookings/my`, {
      ...getHeaders(),
      params,
    });
    return res.data;
  },

  getGroupDetail: async (groupId) => {
    const res = await axios.get(
      `${API_BASE}/group-bookings/${groupId}`,
      getHeaders()
    );
    return res.data;
  },

  // ── Join by groupCode (public) ────────────────────────────────────────────
  joinGroupByCode: async (groupCode) => {
    const res = await axios.post(
      `${API_BASE}/group-bookings/${groupCode}/join`,
      {},
      getHeaders()
    );
    return res.data;
  },

  // ── Chuyển giao vai trò Trưởng nhóm ───────────────────────────────────────
  transferLeader: async (groupId, newLeaderId) => {
    const res = await axios.post(
      `${API_BASE}/group-bookings/${groupId}/transfer-leader`,
      { newLeaderId },
      getHeaders()
    );
    return res.data;
  },

  // ── Trục xuất thành viên khỏi nhóm ────────────────────────────────────────
  kickMember: async (groupId, targetUserId) => {
    const res = await axios.delete(
      `${API_BASE}/group-bookings/${groupId}/kick/${targetUserId}`,
      getHeaders()
    );
    return res.data;
  },

  // ── Khóa/Mở khóa đăng ký nhóm ─────────────────────────────────────────────
  toggleLockGroup: async (groupId, isLocked) => {
    const res = await axios.post(
      `${API_BASE}/group-bookings/${groupId}/toggle-lock`,
      { isLocked },
      getHeaders()
    );
    return res.data;
  },

  // ── Realtime Group Chat ───────────────────────────────────────────────────
  getGroupMessages: async (groupId) => {
    const res = await axios.get(
      `${API_BASE}/group-bookings/${groupId}/messages`,
      getHeaders()
    );
    return res.data;
  },

  sendGroupMessage: async (groupId, message) => {
    const res = await axios.post(
      `${API_BASE}/group-bookings/${groupId}/messages`,
      { message },
      getHeaders()
    );
    return res.data;
  },
};


