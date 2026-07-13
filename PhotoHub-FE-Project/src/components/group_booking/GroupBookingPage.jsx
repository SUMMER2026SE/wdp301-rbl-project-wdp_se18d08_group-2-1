/**
 * GroupBookingPage.jsx
 *
 * Trang chính cho tính năng Group Booking (Đặt lịch chung).
 * Đây là entry page — gồm 2 tab chính:
 *   1. "Khám phá nhóm" (Discover): danh sách nhóm PENDING, join bằng code
 *   2. "Nhóm của tôi" (My Groups): nhóm đã tạo hoặc tham gia
 *
 * Route: /group-booking
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Users,
  Plus,
  Compass,
  Search,
  Clock,
  Tag,
  ChevronRight,
  Sparkles,
  Lock,
  CheckCircle,
  XCircle,
  Loader2,
  Crown,
  UserCheck,
} from "lucide-react";
import Swal from "sweetalert2";
import { groupBookingService } from "../../services/groupBookingService";
import CreateGroupModal from "./CreateGroupModal";
import GroupCard from "./GroupCard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getToken = () => localStorage.getItem("token");
const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const STATUS_BADGE = {
  PENDING: { label: "Đang mở", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  CONFIRMED: { label: "Đã chốt", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  CANCELED: { label: "Đã hủy", color: "text-rose-400 bg-rose-400/10 border-rose-400/30" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GroupBookingPage({ theme = "dark", language = "vi" }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState("discover"); // "discover" | "my"
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Discover state
  const [discoverGroups, setDiscoverGroups] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverPage, setDiscoverPage] = useState(1);
  const [discoverTotal, setDiscoverTotal] = useState(0);
  const [searchCode, setSearchCode] = useState("");

  // My Groups state
  const [myGroups, setMyGroups] = useState([]);
  const [myGroupsLoading, setMyGroupsLoading] = useState(false);

  const isLoggedIn = !!getToken();
  const user = getUser();

  // ── Xử lý link mời: /group-booking?code=XYZ123 ───────────────────────────
  useEffect(() => {
    const code = searchParams.get("code");
    if (code && isLoggedIn) {
      setSearchCode(code);
      handleJoinByCode(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch Discover ────────────────────────────────────────────────────────
  const fetchDiscover = useCallback(async (page = 1) => {
    setDiscoverLoading(true);
    try {
      const res = await groupBookingService.discoverGroups({ page, limit: 9 });
      if (res.success) {
        setDiscoverGroups(res.data.groups || []);
        setDiscoverTotal(res.data.pagination?.total || 0);
        setDiscoverPage(page);
      }
    } catch (err) {
      console.error("[GroupBooking] discoverGroups:", err.message);
    } finally {
      setDiscoverLoading(false);
    }
  }, []);

  // ── Fetch My Groups ───────────────────────────────────────────────────────
  const fetchMyGroups = useCallback(async () => {
    if (!isLoggedIn) return;
    setMyGroupsLoading(true);
    try {
      const res = await groupBookingService.getMyGroups({ limit: 20 });
      if (res.success) {
        setMyGroups(res.data.groups || []);
      }
    } catch (err) {
      console.error("[GroupBooking] getMyGroups:", err.message);
    } finally {
      setMyGroupsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchDiscover(1);
  }, [fetchDiscover]);

  useEffect(() => {
    if (activeTab === "my") fetchMyGroups();
  }, [activeTab, fetchMyGroups]);

  // ── Join by code ──────────────────────────────────────────────────────────
  const handleJoinByCode = async (code) => {
    if (!isLoggedIn) {
      Swal.fire({
        icon: "warning",
        title: "Cần đăng nhập",
        text: "Vui lòng đăng nhập để tham gia nhóm chụp ảnh.",
        background: isDark ? "#0f172a" : "#fff",
        color: isDark ? "#fff" : "#000",
        confirmButtonColor: "#f97316",
      });
      return;
    }
    try {
      const res = await groupBookingService.joinGroupByCode(code.toUpperCase());
      if (res.success) {
        Swal.fire({
          icon: "success",
          title: "Tham gia thành công!",
          text: "Vui lòng thanh toán đặt cọc để giữ chỗ.",
          background: isDark ? "#0f172a" : "#fff",
          color: isDark ? "#fff" : "#000",
          confirmButtonColor: "#f97316",
        });
        navigate(`/group-booking/${res.data.member?.group || res.data.group?._id}`);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Không thể tham gia",
        text: err.response?.data?.message || err.message,
        background: isDark ? "#0f172a" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchCode.trim()) handleJoinByCode(searchCode.trim());
  };

  const handleGroupCreated = (group) => {
    setShowCreateModal(false);
    navigate(`/group-booking/${group._id}`);
  };

  // ─── UI ──────────────────────────────────────────────────────────────────

  const cardBg = isDark
    ? "bg-white/[0.03] border-white/10 hover:border-orange-500/30"
    : "bg-white border-slate-200 hover:border-orange-400/50";

  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 min-h-screen">
      {/* ── Hero Header ── */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Users size={20} className="text-white" />
            </div>
            <span className="text-xs font-bold tracking-widest uppercase text-orange-400">
              Group Booking
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-orange-100 to-orange-300 dark:from-white dark:via-orange-100 dark:to-orange-300">
            Chụp Ảnh Nhóm
          </h1>
          <p className="mt-2 text-sm text-slate-400 font-medium max-w-lg">
            Rủ bạn bè tham gia chụp ảnh cùng — càng đông, giá càng rẻ. Giảm đến{" "}
            <strong className="text-orange-400">20%</strong> khi từ 5 người trở lên.
          </p>
        </div>

        {isLoggedIn && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:brightness-110 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 transition-all duration-300"
          >
            <Plus size={18} />
            Tạo Nhóm Mới
          </button>
        )}
      </div>

      {/* ── Discount Banner ── */}
      <div className={`mb-8 rounded-3xl p-5 border flex flex-wrap gap-4 items-center justify-between ${
        isDark ? "bg-gradient-to-r from-orange-500/10 to-amber-500/5 border-orange-500/20" : "bg-orange-50 border-orange-200"
      }`}>
        <div className="flex items-center gap-3">
          <Sparkles className="text-orange-400 shrink-0" size={20} />
          <span className={`text-sm font-semibold ${isDark ? "text-orange-200" : "text-orange-800"}`}>
            Chính sách giảm giá theo nhóm:
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { members: "2 người", discount: "–10%", icon: "👥" },
            { members: "3–4 người", discount: "–15%", icon: "👪" },
            { members: "≥5 người", discount: "–20%", icon: "🎉" },
          ].map((tier) => (
            <div
              key={tier.members}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${
                isDark
                  ? "bg-white/[0.06] border-white/10 text-white"
                  : "bg-white border-orange-200 text-slate-800"
              }`}
            >
              <span>{tier.icon}</span>
              <span className="text-slate-400">{tier.members}</span>
              <span className="text-orange-400">{tier.discount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Search by Code ── */}
      <form
        onSubmit={handleSearchSubmit}
        className={`mb-8 flex gap-3 p-4 rounded-2xl border ${
          isDark ? "bg-white/[0.04] border-white/10" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex-1 relative">
          <Tag
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
            placeholder="Nhập mã nhóm (VD: AB3X7KQ)..."
            maxLength={8}
            className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none border transition-all text-sm font-mono font-bold tracking-widest focus:border-orange-500 ${
              isDark
                ? "bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
                : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
            }`}
          />
        </div>
        <button
          type="submit"
          disabled={!searchCode.trim()}
          className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold rounded-xl transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          <Search size={16} />
          Tham gia
        </button>
      </form>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-8 p-1 rounded-2xl w-fit border border-white/10 bg-white/[0.03]">
        {[
          { key: "discover", label: "Khám phá nhóm", icon: <Compass size={15} /> },
          { key: "my", label: "Nhóm của tôi", icon: <UserCheck size={15} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20"
                : isDark
                ? "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "discover" && (
        <DiscoverTab
          groups={discoverGroups}
          loading={discoverLoading}
          total={discoverTotal}
          page={discoverPage}
          onPageChange={fetchDiscover}
          onJoin={handleJoinByCode}
          navigate={navigate}
          isDark={isDark}
          cardBg={cardBg}
          isLoggedIn={isLoggedIn}
        />
      )}

      {activeTab === "my" && (
        <MyGroupsTab
          groups={myGroups}
          loading={myGroupsLoading}
          navigate={navigate}
          isDark={isDark}
          cardBg={cardBg}
          userId={user?._id || user?.id}
          onRefresh={fetchMyGroups}
        />
      )}

      {/* ── Create Group Modal ── */}
      {showCreateModal && (
        <CreateGroupModal
          isDark={isDark}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleGroupCreated}
        />
      )}
    </div>
  );
}

// ─── Discover Tab ─────────────────────────────────────────────────────────────

function DiscoverTab({ groups, loading, total, page, onPageChange, onJoin, navigate, isDark, cardBg, isLoggedIn }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-orange-400" />
      </div>
    );
  }

  if (!groups.length) {
    return (
      <div className="text-center py-20">
        <Users size={48} className="mx-auto text-slate-600 mb-4" />
        <p className="text-slate-500 font-semibold">Chưa có nhóm nào đang mở</p>
        <p className="text-slate-600 text-sm mt-1">Hãy tạo nhóm đầu tiên để rủ bạn bè!</p>
      </div>
    );
  }

  const totalPages = Math.ceil(total / 9);

  return (
    <div>
      <p className="text-sm text-slate-500 mb-5">
        Tìm thấy <strong className="text-orange-400">{total}</strong> nhóm đang mở
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <GroupCard
            key={group._id}
            group={group}
            isDark={isDark}
            cardBg={cardBg}
            onViewDetail={() => navigate(`/group-booking/${group._id}`)}
            onJoin={isLoggedIn ? () => onJoin(group._id) : null}
            mode="discover"
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`h-9 w-9 rounded-xl text-sm font-bold transition-all ${
                p === page
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md"
                  : isDark
                  ? "bg-white/[0.05] text-slate-400 hover:bg-white/10"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── My Groups Tab ────────────────────────────────────────────────────────────

function MyGroupsTab({ groups, loading, navigate, isDark, cardBg, userId, onRefresh }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-orange-400" />
      </div>
    );
  }

  if (!groups.length) {
    return (
      <div className="text-center py-20">
        <Users size={48} className="mx-auto text-slate-600 mb-4" />
        <p className="text-slate-500 font-semibold">Bạn chưa tham gia nhóm nào</p>
        <p className="text-slate-600 text-sm mt-1">Tạo nhóm mới hoặc tham gia nhóm của bạn bè!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <GroupCard
          key={group._id}
          group={group}
          isDark={isDark}
          cardBg={cardBg}
          onViewDetail={() => navigate(`/group-booking/${group._id}`)}
          mode="my"
          userId={userId}
        />
      ))}
    </div>
  );
}
