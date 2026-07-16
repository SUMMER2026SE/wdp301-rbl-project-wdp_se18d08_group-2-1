/**
 * GroupDetailPage.jsx
 *
 * Trang chi tiết nhóm — hiển thị đầy đủ thông tin nhóm, danh sách thành viên,
 * và các hành động: thanh toán (UC98), mời bạn (UC99), rời nhóm (UC100), hủy nhóm (UC104).
 *
 * Route: /group-booking/:groupId
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Users,
  Clock,
  Tag,
  Crown,
  Share2,
  LogOut,
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  ArrowLeft,
  Camera,
  Percent,
  Info,
  BadgeCheck,
  AlertTriangle,
  UserMinus,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";
import Swal from "sweetalert2";
import { groupBookingService } from "../../services/groupBookingService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getToken = () => localStorage.getItem("token");
const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

function formatDate(iso) {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatTimeLeft(expireTime) {
  const diff = new Date(expireTime).getTime() - Date.now();
  if (diff <= 0) return "Đã hết hạn";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)} ngày ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} phút`;
}

const STATUS_CONFIG = {
  PENDING: { label: "Đang mở", icon: <Clock size={14} />, cls: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  CONFIRMED: { label: "Đã chốt thành công", icon: <CheckCircle size={14} />, cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  CANCELED: { label: "Đã hủy", icon: <XCircle size={14} />, cls: "text-rose-400 bg-rose-400/10 border-rose-400/30" },
};

const PAYMENT_BADGE = {
  PAID: { label: "Đã đặt cọc", cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  PENDING: { label: "Chờ thanh toán", cls: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  REFUNDED: { label: "Đã hoàn tiền", cls: "text-sky-400 bg-sky-400/10 border-sky-400/20" },
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, max, isDark }) {
  const pct = Math.min((current / max) * 100, 100);
  return (
    <div className={`h-3 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-slate-200"}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 transition-all duration-700 relative"
        style={{ width: `${pct}%` }}
      >
        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
      </div>
    </div>
  );
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

function InviteModal({ isDark, groupCode, inviteData, onClose }) {
  const [copiedField, setCopiedField] = useState(null);
  const inviteUrl = `${window.location.origin}/group-booking?code=${encodeURIComponent(groupCode)}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedField("link");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(groupCode);
    setCopiedField("code");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const shareToInstalledApps = async () => {
    const shareData = {
      title: "Mời bạn tham gia nhóm chụp ảnh PhotoHub",
      text: `Tham gia nhóm chụp ảnh PhotoHub với mã ${groupCode}`,
      url: inviteUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if (error.name !== "AbortError") await copyLink();
      }
      return;
    }

    await copyLink();
  };

  const shareOnSocialNetwork = (platform) => {
    const shareText = `Tham gia nhóm chụp ảnh PhotoHub (${groupCode}): ${inviteUrl}`;

    // Facebook không cho website tự ghi trực tiếp vào ô soạn bài.
    // Sao chép trước để người dùng có thể Ctrl+V nếu Facebook bỏ nội dung localhost.
    if (platform === "facebook") {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        setCopiedField("link");
        setTimeout(() => setCopiedField(null), 2000);
      }).catch(() => {});
    }

    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}&quote=${encodeURIComponent(shareText)}`,
      zalo: `https://zalo.me/share?url=${encodeURIComponent(inviteUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
    };
    window.open(urls[platform], "_blank", "noopener,noreferrer,width=720,height=640");
  };

  return (
    <div
      className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full max-w-md rounded-3xl border p-6 ${isDark ? "bg-[#0b0f19] border-white/10" : "bg-white border-slate-200"}`}>
        <h3 className={`text-lg font-black mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
          🔗 Mời bạn vào nhóm
        </h3>
        <p className={`text-sm mb-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Chia sẻ mã hoặc link bên dưới cho bạn bè
        </p>

        {/* Group Code */}
        <div className={`flex items-center justify-between p-4 rounded-2xl border mb-4 ${isDark ? "border-orange-500/30 bg-orange-500/5" : "border-orange-200 bg-orange-50"}`}>
          <div>
            <p className="text-xs text-slate-400 mb-1">Mã nhóm</p>
            <p className="text-2xl font-black font-mono tracking-widest text-orange-400">
              {groupCode}
            </p>
          </div>
          <button
            onClick={copyCode}
            aria-label="Sao chép mã nhóm"
            className="p-3 rounded-xl bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 transition-all"
          >
            {copiedField === "code" ? <CheckCircle size={18} /> : <Copy size={18} />}
          </button>
        </div>

        {/* Share Link */}
        {inviteUrl && (
          <div className={`mb-4 flex items-center gap-2 rounded-xl p-2 pl-3 ${isDark ? "bg-white/[0.05] text-slate-400" : "bg-slate-100 text-slate-600"}`}>
            <span className="min-w-0 flex-1 break-all font-mono text-xs">{inviteUrl}</span>
            <button
              type="button"
              onClick={copyLink}
              aria-label="Sao chép đường dẫn mời"
              title="Sao chép đường dẫn"
              className="shrink-0 rounded-lg bg-orange-500/15 p-2.5 text-orange-400 transition-all hover:bg-orange-500/25"
            >
              {copiedField === "link" ? <CheckCircle size={17} /> : <Copy size={17} />}
            </button>
          </div>
        )}

        {/* Share Buttons */}
        {inviteData?.shareUrls && (
          <div className="grid grid-cols-2 gap-2 mb-5 sm:grid-cols-4">
            {[
              { key: "facebook", label: "Facebook", emoji: "📘", color: "from-blue-600 to-blue-700" },
              { key: "zalo", label: "Zalo", emoji: "💬", color: "from-sky-500 to-sky-600" },
              { key: "whatsapp", label: "WhatsApp", emoji: "🟢", color: "from-emerald-500 to-emerald-600" },
            ].map((platform) => (
              <button
                type="button"
                key={platform.key}
                onClick={() => shareOnSocialNetwork(platform.key)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl bg-gradient-to-b ${platform.color} text-white text-xs font-bold hover:opacity-90 transition-all`}
              >
                <span className="text-lg">{platform.emoji}</span>
                {platform.label}
              </button>
            ))}
            <button
              type="button"
              onClick={shareToInstalledApps}
              className="flex flex-col items-center gap-1 rounded-xl bg-gradient-to-b from-orange-500 to-amber-600 py-2.5 text-xs font-bold text-white transition-all hover:opacity-90"
            >
              <Share2 size={18} />
              Chia sẻ khác
            </button>
          </div>
        )}

        {inviteData?.remainingSlots !== undefined && (
          <p className="text-xs text-center text-slate-500">
            Còn <strong className="text-orange-400">{inviteData.remainingSlots}</strong> slot trống
          </p>
        )}

        <button
          onClick={onClose}
          className={`w-full mt-4 py-3 rounded-2xl text-sm font-bold transition-all ${isDark ? "bg-white/[0.07] text-white hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GroupDetailPage({ theme = "dark", language = "vi" }) {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDark = theme === "dark";

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  const user = getUser();
  const userId = user?._id || user?.id;
  const isLoggedIn = !!getToken();

  // ── Fetch Group Detail ────────────────────────────────────────────────────
  const fetchGroup = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await groupBookingService.getGroupDetail(groupId);
      if (res.success) setGroup(res.data);
    } catch (err) {
      console.error("[GroupDetail] fetch:", err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup(true);
  }, [fetchGroup]);

  // ── Realtime Socket.IO Connection ─────────────────────────────────────────
  useEffect(() => {
    if (!groupId) return;

    const socket = io("http://localhost:3000");

    socket.on("connect", () => {
      console.log(`[Socket] Connected to group room: group:${groupId}`);
      socket.emit("join-group-room", groupId);
    });

    // Nhận sự kiện cập nhật nhóm từ backend
    socket.on("group-updated", (data) => {
      console.log("[Socket] Received group-updated:", data);
      // Tải lại dữ liệu (ẩn loading spinner để tránh gián đoạn trải nghiệm)
      fetchGroup(false);

      if (data.message) {
        Swal.fire({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true,
          icon: "info",
          title: data.message,
          background: isDark ? "#0f172a" : "#ffffff",
          color: isDark ? "#f8fafc" : "#0f172a",
          customClass: {
            popup: "shadow-2xl border border-orange-500/20 rounded-2xl",
          },
        });
      }
    });

    socket.on("group-price-updated", (data) => {
      console.log("[Socket] Received group-price-updated:", data);
      fetchGroup(false);
    });

    socket.on("group-confirmed", (data) => {
      console.log("[Socket] Received group-confirmed:", data);
      fetchGroup(false);
      Swal.fire({
        icon: "success",
        title: "Nhóm đã chốt!",
        text: data.message || "Nhóm chụp ảnh chung của bạn đã chốt thành công!",
        background: isDark ? "#0f172a" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
    });

    return () => {
      socket.emit("leave-group-room", groupId);
      socket.disconnect();
      console.log(`[Socket] Disconnected from group room: group:${groupId}`);
    };
  }, [groupId, fetchGroup, isDark]);

  // ── Realtime Countdown Timer ──────────────────────────────────────────────
  useEffect(() => {
    if (!group || group.status !== "PENDING" || !group.expireTime) {
      setTimeLeft("");
      return;
    }

    // Cập nhật ngay lập tức
    setTimeLeft(formatTimeLeft(group.expireTime));

    const timer = setInterval(() => {
      const formatted = formatTimeLeft(group.expireTime);
      setTimeLeft(formatted);

      if (formatted === "Đã hết hạn") {
        clearInterval(timer);
        // Tải lại để cập nhật trạng thái CANCELED từ backend cron
        fetchGroup(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [group, fetchGroup]);

  // ── Sync payment status từ PayOS redirect ────────────────────────────────
  useEffect(() => {
    const orderCode = searchParams.get("orderCode");
    const canceled = searchParams.get("canceled");
    if (orderCode && isLoggedIn) {
      groupBookingService
        .syncPaymentStatus(groupId, orderCode, canceled === "true")
        .then(() => fetchGroup(false))
        .catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-orange-400" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <XCircle size={48} className="text-rose-400" />
        <p className="text-slate-400">Không tìm thấy nhóm</p>
        <button onClick={() => navigate("/group-booking")} className="text-orange-400 hover:underline text-sm">
          ← Quay về trang Group Booking
        </button>
      </div>
    );
  }

  const concept = group.concept || {};
  const photographer = group.photographer || {};
  const members = group.members || [];
  const paidCount = group.currentMemberCount || 0;
  const maxMembers = group.maxMembers || 1;
  const minMembers = group.minMembers || 2;
  const status = STATUS_CONFIG[group.status] || STATUS_CONFIG.PENDING;
  const myMembership = group.myMembership;
  const isLeader = userId && String(group.leader?._id || group.leader) === String(userId);
  const isMember = !!myMembership;
  const hasPaid = myMembership?.paymentStatus === "PAID";
  const isGroupPending = group.status === "PENDING";

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handlePay = async () => {
    setActionLoading(true);
    try {
      const res = await groupBookingService.createPaymentLink(groupId);
      if (res.success) {
        if (res.data?.alreadyPaid) {
          Swal.fire({ icon: "info", title: "Đã thanh toán", text: "Bạn đã đặt cọc thành công rồi!", background: isDark ? "#0f172a" : "#fff", color: isDark ? "#fff" : "#000" });
          return;
        }
        const paymentUrl = res.data?.checkoutUrl || res.data?.paymentLink;
        if (paymentUrl) window.location.href = paymentUrl;
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Lỗi thanh toán", text: err.response?.data?.message || err.message, background: isDark ? "#0f172a" : "#fff", color: isDark ? "#fff" : "#000" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleInvite = async () => {
    setActionLoading(true);
    try {
      const res = await groupBookingService.getInviteLink(groupId);
      if (res.success) {
        setInviteData(res.data);
        setShowInviteModal(true);
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Lỗi", text: err.response?.data?.message || err.message, background: isDark ? "#0f172a" : "#fff", color: isDark ? "#fff" : "#000" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: isLeader ? "Bạn là Leader!" : "Rời nhóm?",
      html: isLeader
        ? `<p style="font-size:14px;">Nếu bạn rời, thành viên kế tiếp sẽ được bổ nhiệm làm Leader.<br/>Nếu không có ai, nhóm sẽ bị hủy và tiền sẽ được hoàn.</p>`
        : `<p style="font-size:14px;">Bạn có chắc muốn rời nhóm? ${hasPaid ? "Tiền đặt cọc sẽ được hoàn vào ví PhotoHub của bạn." : ""}</p>`,
      showCancelButton: true,
      confirmButtonText: "Rời nhóm",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
      background: isDark ? "#0f172a" : "#fff",
      color: isDark ? "#fff" : "#000",
    });
    if (!confirm.isConfirmed) return;

    setActionLoading(true);
    try {
      const res = await groupBookingService.leaveGroup(groupId);
      if (res.success) {
        Swal.fire({ icon: "success", title: "Đã rời nhóm", text: res.data?.message || "Rời nhóm thành công", background: isDark ? "#0f172a" : "#fff", color: isDark ? "#fff" : "#000" });
        navigate("/group-booking");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Lỗi", text: err.response?.data?.message || err.message, background: isDark ? "#0f172a" : "#fff", color: isDark ? "#fff" : "#000" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Hủy nhóm?",
      html: `<p style="font-size:14px;">Toàn bộ thành viên sẽ nhận được hoàn tiền 100% vào ví PhotoHub.<br/>Hành động này <strong>không thể hoàn tác</strong>.</p>`,
      showCancelButton: true,
      confirmButtonText: "Hủy nhóm",
      cancelButtonText: "Không",
      confirmButtonColor: "#ef4444",
      background: isDark ? "#0f172a" : "#fff",
      color: isDark ? "#fff" : "#000",
    });
    if (!confirm.isConfirmed) return;

    setActionLoading(true);
    try {
      const res = await groupBookingService.cancelGroup(groupId);
      if (res.success) {
        Swal.fire({ icon: "success", title: "Đã hủy nhóm", text: `Đã hoàn tiền cho ${res.data?.refundedCount || 0} thành viên`, background: isDark ? "#0f172a" : "#fff", color: isDark ? "#fff" : "#000" });
        navigate("/group-booking");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Lỗi", text: err.response?.data?.message || err.message, background: isDark ? "#0f172a" : "#fff", color: isDark ? "#fff" : "#000" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferLeader = async (newLeaderId, newLeaderName) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Chuyển Trưởng nhóm?",
      html: `<p style="font-size:14px;">Bạn có chắc muốn chuyển quyền Trưởng nhóm cho <strong>${newLeaderName}</strong>?<br/>Sau khi chuyển, bạn sẽ trở thành thành viên thường và không thể hủy nhóm được nữa.</p>`,
      showCancelButton: true,
      confirmButtonText: "Xác nhận chuyển",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#f59e0b",
      background: isDark ? "#0f172a" : "#fff",
      color: isDark ? "#fff" : "#000",
    });
    if (!confirm.isConfirmed) return;

    setActionLoading(true);
    try {
      const res = await groupBookingService.transferLeader(groupId, newLeaderId);
      if (res.success) {
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: res.message || "Đã chuyển quyền Trưởng nhóm thành công!",
          background: isDark ? "#0f172a" : "#fff",
          color: isDark ? "#fff" : "#000",
        });
        fetchGroup(false);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Thất bại",
        text: err.response?.data?.message || err.message,
        background: isDark ? "#0f172a" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleKickMember = async (targetUserId, targetUserName, wasPaid) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Trục xuất thành viên?",
      html: `<p style="font-size:14px;">Bạn có chắc muốn trục xuất <strong>${targetUserName}</strong> khỏi nhóm?<br/>
      ${wasPaid ? '<strong class="text-orange-400">Tiền đặt cọc của thành viên này sẽ được hoàn vào ví PhotoHub của họ.</strong>' : ""}</p>`,
      showCancelButton: true,
      confirmButtonText: "Trục xuất",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
      background: isDark ? "#0f172a" : "#fff",
      color: isDark ? "#fff" : "#000",
    });
    if (!confirm.isConfirmed) return;

    setActionLoading(true);
    try {
      const res = await groupBookingService.kickMember(groupId, targetUserId);
      if (res.success) {
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: res.message || "Đã trục xuất thành viên thành công!",
          background: isDark ? "#0f172a" : "#fff",
          color: isDark ? "#fff" : "#000",
        });
        fetchGroup(false);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Thất bại",
        text: err.response?.data?.message || err.message,
        background: isDark ? "#0f172a" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLock = async () => {
    const isLockedCurrent = !!group.isLocked;
    const confirm = await Swal.fire({
      icon: "question",
      title: isLockedCurrent ? "Mở khóa đăng ký?" : "Khóa đăng ký nhóm?",
      html: isLockedCurrent
        ? `<p style="font-size:14px;">Thành viên mới sẽ có thể đăng ký tham gia nhóm bình thường.</p>`
        : `<p style="font-size:14px;">Khi đã khóa, <strong>không ai có thể tham gia nhóm</strong> này nữa.<br/>Bạn vẫn có thể mở khóa lại sau đó.</p>`,
      showCancelButton: true,
      confirmButtonText: isLockedCurrent ? "Mở khóa" : "Khóa nhóm",
      cancelButtonText: "Hủy",
      confirmButtonColor: isLockedCurrent ? "#10b981" : "#f59e0b",
      background: isDark ? "#0f172a" : "#fff",
      color: isDark ? "#fff" : "#000",
    });
    if (!confirm.isConfirmed) return;

    setActionLoading(true);
    try {
      const res = await groupBookingService.toggleLockGroup(groupId, !isLockedCurrent);
      if (res.success) {
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: res.message || "Thao tác thành công!",
          background: isDark ? "#0f172a" : "#fff",
          color: isDark ? "#fff" : "#000",
        });
        fetchGroup(false);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Thất bại",
        text: err.response?.data?.message || err.message,
        background: isDark ? "#0f172a" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ─── JSX ───────────────────────────────────────────────────────────────

  const sectionCls = `rounded-3xl border p-5 ${isDark ? "bg-white/[0.03] border-white/10" : "bg-white border-slate-200"}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8 min-h-screen">
      {/* Back button */}
      <button
        onClick={() => navigate("/group-booking")}
        className={`flex items-center gap-2 text-sm font-semibold mb-6 transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
      >
        <ArrowLeft size={16} />
        Danh sách nhóm
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left Column ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <div className={sectionCls}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center flex-wrap gap-2 mb-3">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${status.cls}`}>
                    {status.icon}
                    {status.label}
                  </div>
                  {group.isLocked && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold bg-amber-500/10 border-amber-500/30 text-amber-400">
                      <Lock size={12} />
                      Đã khóa đăng ký
                    </div>
                  )}
                </div>
                <h1 className={`text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                  {concept.title || "Nhóm chụp ảnh"}
                </h1>
                <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {concept.durationHours ? `${concept.durationHours}h • ` : ""}
                  {concept.locationType || ""}
                </p>
              </div>

              {/* Group Code */}
              <div className={`shrink-0 text-center px-4 py-3 rounded-2xl border ${isDark ? "border-orange-500/30 bg-orange-500/5" : "border-orange-200 bg-orange-50"}`}>
                <p className="text-xs text-slate-400 mb-1">Mã nhóm</p>
                <p className="text-xl font-black font-mono tracking-widest text-orange-400">
                  {group.groupCode}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-orange-400" />
                  <span className={isDark ? "text-slate-300" : "text-slate-700"}>
                    <strong className={isDark ? "text-white" : "text-slate-900"}>{paidCount}</strong>
                    /{maxMembers} thành viên đã đặt cọc
                  </span>
                </div>
                <span className={`text-xs font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Tối thiểu: {minMembers}
                </span>
              </div>
              <ProgressBar current={paidCount} max={maxMembers} isDark={isDark} />
              <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Cần thêm{" "}
                <strong className="text-orange-400">
                  {Math.max(0, minMembers - paidCount)}
                </strong>{" "}
                thành viên để chốt nhóm
              </p>
            </div>

            {/* Pricing block */}
            <div className={`flex items-center justify-between p-4 rounded-2xl ${isDark ? "bg-white/[0.04]" : "bg-slate-50"}`}>
              <div>
                <p className="text-xs text-slate-400">Giá gốc/người</p>
                <p className={`text-sm line-through ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {(group.basePrice || 0).toLocaleString("vi-VN")}đ
                </p>
              </div>
              {group.discountPercent > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-sm font-bold">
                  <Percent size={14} />
                  -{group.discountPercent}% mỗi người
                </div>
              )}
              <div className="text-right">
                <p className="text-xs text-slate-400">Giá hiện tại/người</p>
                <p className="text-2xl font-black text-orange-400">
                  {(group.currentPrice || 0).toLocaleString("vi-VN")}
                  <span className="text-sm ml-0.5">đ</span>
                </p>
                <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Tiết kiệm{" "}
                  <strong className="text-emerald-400">
                    {((group.basePrice || 0) - (group.currentPrice || 0)).toLocaleString("vi-VN")}đ
                  </strong>
                </p>
              </div>
            </div>

            {/* Time left */}
            {isGroupPending && group.expireTime && (
              <div className={`flex items-center gap-2 mt-3 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                <Clock size={14} className="shrink-0" />
                <span>
                  Hết hạn sau:{" "}
                  <strong className="text-amber-400">{timeLeft}</strong>
                  {" "}({formatDate(group.expireTime)})
                </span>
              </div>
            )}

            {/* Note */}
            {group.note && (
              <div className={`mt-4 p-3 rounded-xl text-sm ${isDark ? "bg-white/[0.04] text-slate-400" : "bg-slate-50 text-slate-600"}`}>
                <span className="font-semibold text-slate-300 mr-2">📝 Ghi chú:</span>
                {group.note}
              </div>
            )}
          </div>

          {/* ── Member List ── */}
          <div className={sectionCls}>
            <h2 className={`text-base font-black mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              Danh sách thành viên ({members.length})
            </h2>
            <div className="space-y-3">
              {members.map((member) => {
                const isThisLeader = member.role === "LEADER";
                const payBadge = PAYMENT_BADGE[member.paymentStatus] || PAYMENT_BADGE.PENDING;
                const memberUser = member.user || {};
                return (
                  <div
                    key={member._id}
                    className={`flex items-center gap-3 p-3 rounded-2xl border ${isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-slate-100 bg-slate-50"}`}
                  >
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-orange-500/30 to-amber-500/20 flex items-center justify-center">
                      {memberUser.avatar ? (
                        <img src={memberUser.avatar} alt={memberUser.fullName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg font-black text-orange-400">
                          {(memberUser.fullName || "?")[0].toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                          {memberUser.fullName || "Thành viên"}
                        </p>
                        {isThisLeader && (
                          <Crown size={13} className="text-amber-400 shrink-0" />
                        )}
                      </div>
                      <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {(member.depositAmount || 0).toLocaleString("vi-VN")}đ đặt cọc
                      </p>
                    </div>

                    <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${payBadge.cls}`}>
                      {payBadge.label}
                    </span>

                    {/* Action chuyển leader */}
                    {isLeader && !isThisLeader && isGroupPending && (
                      <button
                        onClick={() => handleTransferLeader(memberUser._id || memberUser.id, memberUser.fullName)}
                        title="Chuyển quyền Trưởng nhóm"
                        className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-all shrink-0 ml-1"
                      >
                        <Crown size={16} />
                      </button>
                    )}

                    {/* Action trục xuất (Kick) */}
                    {isLeader && !isThisLeader && isGroupPending && member.paymentStatus !== "PAID" && (
                      <button
                        onClick={() => handleKickMember(memberUser._id || memberUser.id, memberUser.fullName, false)}
                        title="Trục xuất thành viên"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0 ml-1"
                      >
                        <UserMinus size={16} />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Empty slots */}
              {Array.from({ length: maxMembers - members.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className={`flex items-center gap-3 p-3 rounded-2xl border border-dashed ${isDark ? "border-white/[0.08] opacity-40" : "border-slate-300 opacity-40"}`}
                >
                  <div className="h-10 w-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center">
                    <Users size={14} className="text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-500">Slot trống</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Column: Actions ── */}
        <div className="space-y-4">
          {/* My Status Card */}
          {isMember && (
            <div className={sectionCls}>
              <h3 className={`text-sm font-black mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                Trạng thái của bạn
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>Vai trò</span>
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    {myMembership.role === "LEADER" ? (
                      <><Crown size={14} /> Leader</>
                    ) : (
                      <><BadgeCheck size={14} /> Thành viên</>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>Thanh toán</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${PAYMENT_BADGE[myMembership.paymentStatus]?.cls || ""}`}>
                    {PAYMENT_BADGE[myMembership.paymentStatus]?.label || "--"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>Đặt cọc</span>
                  <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {(myMembership.depositAmount || 0).toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isLoggedIn && isMember && isGroupPending && (
            <div className={`${sectionCls} space-y-3`}>
              <h3 className={`text-sm font-black mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                Hành động
              </h3>

              {/* Pay Button */}
              {!hasPaid && (
                <button
                  onClick={handlePay}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                  Thanh toán đặt cọc
                </button>
              )}

              {hasPaid && (
                <div className="flex items-center gap-2 py-3 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
                  <CheckCircle size={16} />
                  Đã đặt cọc thành công
                </div>
              )}

              {/* Invite Button */}
              <button
                onClick={handleInvite}
                disabled={actionLoading || paidCount >= maxMembers}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark
                    ? "border-white/10 text-white hover:bg-white/[0.06]"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                Mời bạn bè
              </button>

              {/* Lock/Unlock Button (chỉ cho Leader) */}
              {isLeader && isGroupPending && (
                <button
                  onClick={handleToggleLock}
                  disabled={actionLoading}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-bold transition-all disabled:opacity-50 ${
                    group.isLocked
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                  }`}
                >
                  {group.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                  {group.isLocked ? "Mở khóa đăng ký" : "Khóa đăng ký nhóm"}
                </button>
              )}

              {/* Leave / Cancel */}
              {isLeader ? (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-rose-400 text-sm font-bold border border-rose-400/20 bg-rose-400/5 hover:bg-rose-400/10 transition-all disabled:opacity-40"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Hủy nhóm & hoàn tiền
                </button>
              ) : (
                <button
                  onClick={handleLeave}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-slate-400 text-sm font-bold border border-white/[0.06] hover:bg-white/[0.05] transition-all disabled:opacity-40"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                  Rời nhóm
                </button>
              )}
            </div>
          )}

          {/* Confirmed State */}
          {group.status === "CONFIRMED" && (
            <div className={`${sectionCls} text-center space-y-3`}>
              <CheckCircle size={40} className="mx-auto text-emerald-400 mb-1" />
              <p className={`font-black text-base ${isDark ? "text-white" : "text-slate-900"}`}>
                Nhóm đã chốt thành công! 🎉
              </p>
              <p className="text-sm text-slate-400">
                Lịch hẹn chụp ảnh chính thức đã được gửi tới Photographer.
              </p>
              <button
                onClick={() => navigate("/profile", { state: { activeTab: "bookings" } })}
                className="mt-2 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all"
              >
                Xem danh sách lịch hẹn (Booking)
              </button>
              {group.confirmedAt && (
                <p className="text-xs text-slate-500">
                  Chốt lúc: {formatDate(group.confirmedAt)}
                </p>
              )}
            </div>
          )}

          {/* Canceled State */}
          {group.status === "CANCELED" && (
            <div className={`${sectionCls} text-center`}>
              <XCircle size={40} className="mx-auto text-rose-400 mb-3" />
              <p className={`font-black text-base ${isDark ? "text-white" : "text-slate-900"}`}>
                Nhóm đã bị hủy
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Tiền đặt cọc đã được hoàn vào ví PhotoHub của bạn.
              </p>
            </div>
          )}

          {/* Concept info mini */}
          <div className={`${sectionCls} space-y-2`}>
            <h3 className={`text-xs font-black uppercase tracking-wider mb-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Thông tin concept
            </h3>
            {photographer?.user?.fullName && (
              <div className="flex items-center gap-2 text-sm">
                <Camera size={14} className="text-orange-400 shrink-0" />
                <span className={isDark ? "text-slate-300" : "text-slate-700"}>
                  NAG: <strong>{photographer.displayName || photographer.user.fullName}</strong>
                </span>
              </div>
            )}
            {concept.durationHours > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-slate-400 shrink-0" />
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                  {concept.durationHours} giờ chụp
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Tag size={14} className="text-slate-400 shrink-0" />
              <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                Mã: <strong className="font-mono text-orange-400">{group.groupCode}</strong>
              </span>
            </div>
            {group.shootDate && (
              <div className="flex items-center gap-2 text-sm border-t border-white/[0.06] pt-2.5 mt-1">
                <Clock size={14} className="text-orange-400 shrink-0" />
                <span className={isDark ? "text-slate-300" : "text-slate-700"}>
                  Ngày chụp: <strong>{new Date(group.shootDate).toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </span>
              </div>
            )}
            {group.shootStartTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-orange-400 shrink-0" />
                <span className={isDark ? "text-slate-300" : "text-slate-700"}>
                  Giờ chụp: <strong>{group.shootStartTime}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          isDark={isDark}
          groupCode={group.groupCode}
          inviteData={inviteData}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}
