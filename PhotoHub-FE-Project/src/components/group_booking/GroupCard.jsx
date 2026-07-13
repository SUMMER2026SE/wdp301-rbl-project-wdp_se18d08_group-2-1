/**
 * GroupCard.jsx
 *
 * Card hiển thị thông tin tóm tắt một nhóm chụp ảnh.
 * Dùng trong cả Discover list và My Groups list.
 *
 * Props:
 *   group      — GroupBooking object
 *   isDark     — boolean
 *   cardBg     — Tailwind className chuỗi
 *   onViewDetail — () => void
 *   onJoin     — () => void | null (null = ẩn nút)
 *   mode       — "discover" | "my"
 *   userId     — current user ID (để hiện badge Leader)
 */

import React from "react";
import {
  Users,
  Clock,
  Tag,
  Crown,
  ChevronRight,
  Percent,
  UserCheck,
  BadgeCheck,
  Camera,
} from "lucide-react";

const STATUS_CONFIG = {
  PENDING: { label: "Đang mở", cls: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  CONFIRMED: { label: "Đã chốt", cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  CANCELED: { label: "Đã hủy", cls: "text-rose-400 bg-rose-400/10 border-rose-400/30" },
};

function formatTimeLeft(expireTime) {
  const now = Date.now();
  const diff = new Date(expireTime).getTime() - now;
  if (diff <= 0) return "Đã hết hạn";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)} ngày`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} phút`;
}

function ProgressBar({ current, max, isDark }) {
  const pct = Math.min((current / max) * 100, 100);
  return (
    <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-slate-200"}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function GroupCard({
  group,
  isDark,
  cardBg,
  onViewDetail,
  onJoin,
  mode = "discover",
  userId,
}) {
  const status = STATUS_CONFIG[group.status] || STATUS_CONFIG.PENDING;
  const paidCount = group.currentMemberCount || 0;
  const maxMembers = group.maxMembers || 1;
  const minMembers = group.minMembers || 2;
  const discount = group.discountPercent || 0;
  const concept = group.concept || {};
  const timeLeft = group.expireTime ? formatTimeLeft(group.expireTime) : "--";
  const isLeader = userId && String(group.leader?._id || group.leader) === String(userId);
  const myMembership = group.myMembership;
  const alreadyJoined = !!myMembership;
  const registeredCount = group.registeredCount !== undefined ? group.registeredCount : paidCount;

  return (
    <div
      className={`relative rounded-3xl border p-5 flex flex-col gap-4 transition-all duration-300 cursor-pointer group ${cardBg}`}
      onClick={onViewDetail}
    >
      {/* Status badge & Badges */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${status.cls}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {status.label}
        </span>
        <div className="flex items-center gap-2">
          {discount > 0 && (
            <div className="flex items-center gap-1 text-orange-400 text-xs font-bold bg-orange-500/10 border border-orange-500/25 px-2.5 py-1 rounded-full">
              <Percent size={12} />
              -{discount}% mỗi người
            </div>
          )}
          {isLeader && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <Crown size={12} />
              Leader
            </div>
          )}
        </div>
      </div>

      {/* Concept Info */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Camera size={14} className="text-orange-400 shrink-0" />
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Concept
          </span>
        </div>
        <h3
          className={`text-base font-black leading-snug ${
            isDark ? "text-white" : "text-slate-900"
          } group-hover:text-orange-400 transition-colors`}
        >
          {concept.title || "Concept chụp ảnh"}
        </h3>
        <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
          {concept.durationHours ? `${concept.durationHours}h • ` : ""}
          {concept.locationType || ""}
        </p>
      </div>

      {/* Group Code */}
      <div className="flex items-center gap-2">
        <Tag size={13} className="text-slate-400 shrink-0" />
        <span
          className={`text-sm font-mono font-black tracking-widest ${
            isDark ? "text-orange-300" : "text-orange-600"
          }`}
        >
          {group.groupCode}
        </span>
      </div>

      {/* Member Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-slate-400" />
            <span className={isDark ? "text-slate-400" : "text-slate-500"}>
              Đã cọc: <strong className={isDark ? "text-white" : "text-slate-800"}>{paidCount}</strong> / {maxMembers}
              {registeredCount > paidCount && (
                <span className="text-orange-400 ml-1 font-semibold">({registeredCount} đăng ký)</span>
              )}
            </span>
          </div>
          <span className={`font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Tối thiểu: {minMembers}
          </span>
        </div>
        <ProgressBar current={registeredCount} max={maxMembers} isDark={isDark} />
      </div>

      {/* Pricing */}
      <div className={`flex items-end gap-2 p-3 rounded-2xl ${
        isDark ? "bg-white/[0.04]" : "bg-slate-50"
      }`}>
        <div className="flex-1">
          <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            Giá gốc
          </p>
          <p className={`text-sm line-through ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {(group.basePrice || 0).toLocaleString("vi-VN")}đ
          </p>
        </div>
        <div className="text-right">
          <p className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Giá hiện tại / người
          </p>
          <p className="text-xl font-black text-orange-400">
            {(group.currentPrice || 0).toLocaleString("vi-VN")}
            <span className="text-xs ml-0.5 font-bold">đ</span>
          </p>
        </div>
      </div>

      {/* Time left */}
      {group.status === "PENDING" && (
        <div className={`flex items-center gap-2 text-xs font-semibold ${
          isDark ? "text-slate-500" : "text-slate-400"
        }`}>
          <Clock size={13} className="shrink-0" />
          Còn lại: <span className="text-amber-400">{timeLeft}</span>
        </div>
      )}

      {/* Lịch chụp cố định */}
      {(group.shootDate || group.shootStartTime) && (
        <div className={`flex items-center gap-2 text-xs font-bold ${
          isDark ? "text-slate-400" : "text-slate-600"
        } border-t border-white/[0.06] pt-2.5 mt-1`}>
          <Clock size={13} className="text-orange-400 shrink-0" />
          Lịch chụp: <span className="text-orange-400 font-black">
            {group.shootDate ? new Date(group.shootDate).toLocaleDateString("vi-VN", { day: 'numeric', month: 'numeric' }) : ""} vào lúc {group.shootStartTime || ""}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-white/[0.06]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail();
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            isDark
              ? "bg-white/[0.06] text-white hover:bg-white/10"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Chi tiết
          <ChevronRight size={14} />
        </button>

        {mode === "discover" && onJoin && !alreadyJoined && group.status === "PENDING" && paidCount < maxMembers && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onJoin();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:brightness-110 active:scale-95 transition-all"
          >
            <UserCheck size={14} />
            Tham gia
          </button>
        )}

        {alreadyJoined && (
          <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20">
            <BadgeCheck size={14} />
            Đã tham gia
          </div>
        )}
      </div>
    </div>
  );
}
