/**
 * CreateGroupModal.jsx
 *
 * Modal cho Leader tạo nhóm chụp ảnh chung (UC96).
 * - Fetch danh sách packages (concepts)
 * - Nhập cấu hình: minMembers, maxMembers, expireTime, note
 * - Gọi API POST /api/group-bookings
 */

import React, { useState, useEffect } from "react";
import { X, Camera, Users, Clock, FileText, Loader2, Info, Eye, Percent, BadgeCheck, Search } from "lucide-react";
import Swal from "sweetalert2";
import axios from "axios";
import { groupBookingService } from "../../services/groupBookingService";

const API_BASE = "https://photo-hub-be-project.vercel.app/api";

// ── Preset expire options ─────────────────────────────────────────────────────
const EXPIRE_PRESETS = [
  { label: "3 giờ", hours: 3 },
  { label: "6 giờ", hours: 6 },
  { label: "12 giờ", hours: 12 },
  { label: "24 giờ", hours: 24 },
];

export default function CreateGroupModal({ isDark, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: chọn concept, 2: cấu hình nhóm
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [previewPackage, setPreviewPackage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Tính ngày mai làm mặc định cho shootDate
  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const [form, setForm] = useState({
    minMembers: 2,
    maxMembers: 10,
    expireHours: 24,
    note: "",
    shootDate: getTomorrowString(),
    shootStartTime: "09:00",
  });

  // Fetch group packages (isGroupPackage=true) từ tất cả photographers
  useEffect(() => {
    const fetchPackages = async () => {
      setPackagesLoading(true);
      try {
        // GET /api/packages — public, trả về tất cả package nhóm ACTIVE
        const res = await axios.get(`${API_BASE}/packages`);
        const data = res.data;
        // ApiResponse: { success, data: [...] }
        // Thử các cấu trúc khác nhau
        const raw = data?.data;
        let list = [];
        if (Array.isArray(raw)) {
          list = raw;                        // { data: [...] }  ← cấu trúc đúng
        } else if (Array.isArray(raw?.data)) {
          list = raw.data;                   // { data: { data: [...] } }
        } else if (Array.isArray(data)) {
          list = data;                       // [...] trực tiếp
        }
        setPackages(list);
        console.log("[CreateGroup] Group packages loaded:", list.length);

      } catch (err) {
        console.error("[CreateGroup] Fetch group packages:", err.message);
        setPackages([]);
      } finally {
        setPackagesLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const filteredPackages = packages.filter((pkg) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const title = (pkg.title || "").toLowerCase();
    const desc = (pkg.description || "").toLowerCase();
    const photographerName = (
      pkg.photographer?.displayName ||
      pkg.photographer?.user?.fullName ||
      ""
    ).toLowerCase();
    return title.includes(q) || desc.includes(q) || photographerName.includes(q);
  });

  const handleSubmit = async () => {
    if (!selectedPackage) return;

    const expireTime = new Date(
      Date.now() + form.expireHours * 60 * 60 * 1000
    ).toISOString();

    if (Number(form.minMembers) < 2 || Number(form.minMembers) > 10) {
      Swal.fire({ icon: "warning", title: "Lỗi", text: "Số thành viên tối thiểu phải từ 2 đến 10 người", background: isDark ? "#0f172a" : "#fff", color: isDark ? "#fff" : "#000" });
      return;
    }
    if (Number(form.maxMembers) < Number(form.minMembers) || Number(form.maxMembers) > 10) {
      Swal.fire({ icon: "warning", title: "Lỗi", text: "Số thành viên tối đa phải từ 2 đến 10 người và lớn hơn hoặc bằng số tối thiểu", background: isDark ? "#0f172a" : "#fff", color: isDark ? "#fff" : "#000" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await groupBookingService.createGroup({
        conceptId: selectedPackage._id,
        minMembers: Number(form.minMembers),
        maxMembers: Number(form.maxMembers),
        expireTime,
        shootDate: form.shootDate,
        shootStartTime: form.shootStartTime,
        note: form.note.trim() || undefined,
      });
      if (res.success) {
        onSuccess(res.data);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Không thể tạo nhóm",
        text: err.response?.data?.message || err.message,
        background: isDark ? "#0f172a" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = `w-full rounded-2xl px-4 py-3.5 outline-none border transition-all focus:border-orange-500 text-sm ${isDark
    ? "bg-slate-900 border-slate-700 text-white"
    : "bg-slate-50 border-slate-200 text-slate-900"
    }`;
  const labelCls = `text-xs font-bold tracking-wider uppercase mb-1.5 block ${isDark ? "text-slate-400" : "text-slate-600"
    }`;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-4 py-8"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl my-auto ${isDark ? "bg-[#0b0f19] border-white/10" : "bg-white border-slate-200"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/[0.06]">
          <div>
            <h2 className={`text-xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>
              Tạo Nhóm Chụp Ảnh Chung
            </h2>
            <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              Bước {step}/2 — {step === 1 ? "Chọn concept chụp ảnh" : "Cấu hình nhóm"}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-all ${isDark ? "border-white/5 hover:bg-white/5 text-slate-400 hover:text-white" : "border-slate-200 hover:bg-slate-50 text-slate-500"
              }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2 px-6 pt-4">
          {[1, 2].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`h-2 flex-1 rounded-full transition-all ${s <= step
                ? "bg-gradient-to-r from-orange-500 to-amber-500"
                : isDark ? "bg-white/10" : "bg-slate-200"
                }`} />
            </div>
          ))}
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* ── Step 1: Chọn Concept ── */}
          {step === 1 && (
            <div>
              <label className={labelCls}>
                <Camera size={12} className="inline mr-1.5" />
                Chọn Concept / Gói chụp ảnh <span className="text-rose-500">*</span>
              </label>

              {/* Thanh tìm kiếm gói chụp */}
              <div className="relative mb-3.5">
                <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                <input
                  type="text"
                  placeholder="Tìm kiếm gói chụp theo tên, mô tả hoặc nhiếp ảnh gia..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded-2xl pl-10 pr-9 py-2.5 outline-none border transition-all focus:border-orange-500 text-sm ${
                    isDark
                      ? "bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-500/20 transition-all ${
                      isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Xóa từ khóa"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {packagesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-orange-400" />
                  <span className="ml-3 text-slate-400 text-sm">Đang tải danh sách gói...</span>
                </div>
              ) : filteredPackages.length === 0 ? (
                <div className={`text-center py-8 rounded-2xl border ${isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50"
                  }`}>
                  <Camera size={32} className="mx-auto text-slate-500 mb-2" />
                  <p className="text-slate-500 text-sm">
                    {searchQuery.trim()
                      ? `Không tìm thấy gói dịch vụ phù hợp với từ khóa "${searchQuery}"`
                      : "Không tìm thấy gói dịch vụ nào"}
                  </p>
                  {searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="mt-3 px-3 py-1.5 text-xs font-bold text-orange-400 hover:underline"
                    >
                      Xóa tìm kiếm
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {filteredPackages.map((pkg) => (
                    <div
                      key={pkg._id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${selectedPackage?._id === pkg._id
                        ? "border-orange-500 bg-orange-500/10 shadow-md shadow-orange-500/10"
                        : isDark
                          ? "border-white/10 bg-white/[0.03] hover:border-orange-500/40"
                          : "border-slate-200 bg-slate-50 hover:border-orange-400/50"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                            {pkg.title}
                          </p>
                          {pkg.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{pkg.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {pkg.durationHours > 0 && (
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock size={11} />
                                {pkg.durationHours}h
                              </span>
                            )}
                            {pkg.locationType && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-white/[0.06] text-slate-400" : "bg-slate-200 text-slate-500"
                                }`}>
                                {pkg.locationType}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-right flex flex-col items-end gap-1.5">
                          <p className="text-lg font-black text-orange-400">
                            {(pkg.price || 0).toLocaleString("vi-VN")}
                            <span className="text-xs ml-0.5">đ</span>
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewPackage(pkg);
                            }}
                            className="text-xs text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1 font-bold transition-all px-2 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20"
                          >
                            <Eye size={12} /> Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-5">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedPackage}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition-all"
                >
                  Tiếp theo →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Cấu hình nhóm ── */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Selected concept summary */}
              {selectedPackage && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isDark ? "border-orange-500/20 bg-orange-500/5" : "border-orange-200 bg-orange-50"
                  }`}>
                  <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                    <Camera size={18} className="text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                      {selectedPackage.title}
                    </p>
                    <p className="text-xs text-orange-400 font-bold">
                      Giá gốc: {(selectedPackage.price || 0).toLocaleString("vi-VN")}đ/người
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewPackage(selectedPackage)}
                      className="text-xs text-orange-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <Eye size={13} /> Chi tiết
                    </button>
                    <span className="text-slate-500">•</span>
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs text-slate-400 hover:text-orange-400 transition-colors underline"
                    >
                      Đổi concept
                    </button>
                  </div>
                </div>
              )}

              {/* Members Config */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    <Users size={12} className="inline mr-1.5" />
                    Tối thiểu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={5}
                    value={form.minMembers}
                    onChange={(e) => setForm((p) => ({ ...p, minMembers: e.target.value }))}
                    className={inputCls}
                  />
                  <p className="text-xs text-slate-500 mt-1">Nhóm chốt khi đủ số này</p>
                </div>
                <div>
                  <label className={labelCls}>
                    <Users size={12} className="inline mr-1.5" />
                    Tối đa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={form.minMembers}
                    max={10}
                    value={form.maxMembers}
                    onChange={(e) => setForm((p) => ({ ...p, maxMembers: e.target.value }))}
                    className={inputCls}
                  />
                  <p className="text-xs text-slate-500 mt-1">Giới hạn slot trong nhóm</p>
                </div>
              </div>

              {/* Discount Preview */}
              <div className={`p-4 rounded-2xl border ${isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50"
                }`}>
                <div className="flex items-center gap-2 mb-3">
                  <Info size={14} className="text-orange-400" />
                  <span className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Giá ước tính theo số thành viên
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { members: "1 người", pct: 0 },
                    { members: "2 người", pct: 10 },
                    { members: "3-4 người", pct: 15 },
                    { members: "≥5 người", pct: 20 },
                  ].map((tier) => {
                    const price = selectedPackage
                      ? Math.round(selectedPackage.price * (1 - tier.pct / 100))
                      : 0;
                    return (
                      <div
                        key={tier.members}
                        className={`text-center p-2.5 rounded-xl ${isDark ? "bg-white/[0.05]" : "bg-white border border-slate-200"
                          }`}
                      >
                        <p className="text-xs text-slate-500">{tier.members}</p>
                        <p className="text-sm font-black text-orange-400">
                          -{tier.pct}%
                        </p>
                        <p className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                          {price.toLocaleString("vi-VN")}đ
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expire Time */}
              <div>
                <label className={labelCls}>
                  <Clock size={12} className="inline mr-1.5" />
                  Thời gian hết hạn <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPIRE_PRESETS.map((preset) => (
                    <button
                      key={preset.hours}
                      onClick={() => setForm((p) => ({ ...p, expireHours: preset.hours }))}
                      className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${form.expireHours === preset.hours
                        ? "border-orange-500 bg-orange-500/15 text-orange-400"
                        : isDark
                          ? "border-white/10 bg-white/[0.04] text-slate-400 hover:border-orange-500/40"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-400/40"
                        }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lịch chụp cố định */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    <Clock size={12} className="inline mr-1.5" />
                    Ngày chụp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={getTomorrowString()}
                    value={form.shootDate}
                    onChange={(e) => setForm((p) => ({ ...p, shootDate: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    <Clock size={12} className="inline mr-1.5" />
                    Giờ chụp <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.shootStartTime}
                    onChange={(e) => setForm((p) => ({ ...p, shootStartTime: e.target.value }))}
                    className={inputCls}
                  >
                    {["07:00", "08:00", "09:00", "10:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map((t) => (
                      <option key={t} value={t} className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className={labelCls}>
                  <FileText size={12} className="inline mr-1.5" />
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                  rows={2}
                  placeholder="Mô tả thêm về nhóm của bạn, yêu cầu đặc biệt..."
                  maxLength={500}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className={`flex-1 py-3.5 rounded-2xl font-bold text-sm border transition-all ${isDark
                    ? "border-white/10 text-slate-400 hover:bg-white/[0.05]"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  ← Quay lại
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-2 flex-grow px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang tạo nhóm...
                    </>
                  ) : (
                    "🚀 Tạo nhóm ngay"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Package Detail Modal Overlay */}
      {previewPackage && (
        <PackageDetailModal
          isDark={isDark}
          pkg={previewPackage}
          onClose={() => setPreviewPackage(null)}
        />
      )}
    </div>
  );
}

// ─── Package Detail Modal Component ──────────────────────────────────────────

function PackageDetailModal({ isDark, pkg, onClose }) {
  if (!pkg) return null;

  const photographer = pkg.photographer || {};
  const photographerUser = photographer.user || {};
  const displayName = photographer.displayName || photographerUser.fullName || "Nhiếp ảnh gia";
  const avatar = photographerUser.avatar || photographer.avatar || photographer.avatarUrl || null;
  const basePrice = pkg.price || 0;

  const discountTiers = [
    { members: "1 người", pct: 0, icon: "👤" },
    { members: "2 người", pct: 10, icon: "👥" },
    { members: "3–4 người", pct: 15, icon: "👪" },
    { members: "≥5 người", pct: 20, icon: "🎉" },
  ];

  return (
    <div
      className="fixed inset-0 z-[160] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${isDark ? "bg-[#0b0f19] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b shrink-0 ${isDark ? "border-white/[0.07]" : "border-slate-100"}`}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Camera size={17} className="text-white" />
            </div>
            <div>
              <p className={`text-sm font-black ${isDark ? "text-white" : "text-slate-900"}`}>Chi tiết gói chụp</p>
              <p className="text-xs text-slate-400">Gói chụp nhóm</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-all ${isDark ? "border-white/[0.07] hover:bg-white/[0.06] text-slate-400 hover:text-white" : "border-slate-200 hover:bg-slate-50 text-slate-500"
              }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Photographer info */}
          <div className={`p-4 rounded-2xl border ${isDark ? "border-white/[0.07] bg-white/[0.02]" : "border-slate-100 bg-slate-50"}`}>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-br from-orange-500/30 to-amber-500/20 flex items-center justify-center border-2 border-orange-500/20">
                {avatar ? (
                  <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-black text-orange-400">{displayName[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-base font-black ${isDark ? "text-white" : "text-slate-900"}`}>{displayName}</p>
                  {photographer.verificationStatus === "VERIFIED" && (
                    <BadgeCheck size={16} className="text-sky-400 shrink-0" />
                  )}
                </div>
                {photographer.location && (
                  <p className="text-xs text-slate-400 mt-0.5">{photographer.location}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {photographer.averageRating > 0 && (
                    <span className="text-xs font-bold text-amber-400">⭐ {Number(photographer.averageRating).toFixed(1)}</span>
                  )}
                  {photographer.completedBookings > 0 && (
                    <span className="text-xs text-slate-400">{photographer.completedBookings} buổi chụp</span>
                  )}
                  {photographer.experienceYears > 0 && (
                    <span className="text-xs text-slate-400">{photographer.experienceYears} năm kinh nghiệm</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Package Title & Description */}
          <div>
            <h3 className={`text-lg font-black mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
              {pkg.title}
            </h3>
            {pkg.description && (
              <p className={`text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {pkg.description}
              </p>
            )}
          </div>

          {/* Package Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3.5 rounded-2xl ${isDark ? "bg-white/[0.04]" : "bg-slate-50"}`}>
              <p className="text-xs text-slate-400 mb-1">Giá gốc/người</p>
              <p className="text-xl font-black text-orange-400">
                {basePrice.toLocaleString("vi-VN")}
                <span className="text-xs ml-0.5">đ</span>
              </p>
            </div>
            {pkg.durationHours > 0 && (
              <div className={`p-3.5 rounded-2xl ${isDark ? "bg-white/[0.04]" : "bg-slate-50"}`}>
                <p className="text-xs text-slate-400 mb-1">Thời lượng</p>
                <p className={`text-xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>{pkg.durationHours}h</p>
              </div>
            )}
            {pkg.numberOfPhotos > 0 && (
              <div className={`p-3.5 rounded-2xl ${isDark ? "bg-white/[0.04]" : "bg-slate-50"}`}>
                <p className="text-xs text-slate-400 mb-1">Số ảnh bàn giao</p>
                <p className={`text-lg font-black ${isDark ? "text-white" : "text-slate-900"}`}>{pkg.numberOfPhotos} ảnh</p>
              </div>
            )}
            {pkg.editedPhotos > 0 && (
              <div className={`p-3.5 rounded-2xl ${isDark ? "bg-white/[0.04]" : "bg-slate-50"}`}>
                <p className="text-xs text-slate-400 mb-1">Ảnh chỉnh sửa</p>
                <p className={`text-lg font-black ${isDark ? "text-white" : "text-slate-900"}`}>{pkg.editedPhotos} ảnh</p>
              </div>
            )}
          </div>

          {pkg.locationType && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl w-fit ${isDark ? "bg-white/[0.05] text-slate-300" : "bg-slate-100 text-slate-700"}`}>
              <span className="text-xs font-semibold">Địa điểm: {pkg.locationType}</span>
            </div>
          )}

          {/* Package Image Gallery */}
          <PackageImageGallery images={pkg.images} isDark={isDark} />

          {/* Group Discount Tiers */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Percent size={15} className="text-orange-400" />
              <h4 className={`text-sm font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                Chính sách giảm giá nhóm
              </h4>
            </div>
            <div className="space-y-2">
              {discountTiers.map((tier) => {
                const price = Math.round(basePrice * (1 - tier.pct / 100));
                return (
                  <div
                    key={tier.members}
                    className={`flex items-center justify-between p-3 rounded-2xl border ${tier.pct > 0
                      ? isDark ? "border-orange-500/20 bg-orange-500/5" : "border-orange-200 bg-orange-50"
                      : isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-slate-100 bg-slate-50"
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{tier.icon}</span>
                      <div>
                        <p className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{tier.members}</p>
                        {tier.pct > 0 && <p className="text-[11px] font-bold text-orange-400">Giảm {tier.pct}%</p>}
                      </div>
                    </div>
                    <p className={`text-sm font-black ${tier.pct > 0 ? "text-orange-400" : isDark ? "text-slate-300" : "text-slate-700"}`}>
                      {price.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {photographer.bio && (
            <div className={`p-3.5 rounded-2xl ${isDark ? "bg-white/[0.04]" : "bg-slate-50"}`}>
              <p className="text-xs font-bold text-slate-400 mb-1">Giới thiệu nhiếp ảnh gia</p>
              <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>{photographer.bio}</p>
            </div>
          )}

          {photographer.equipment && (
            <div className={`p-3.5 rounded-2xl ${isDark ? "bg-white/[0.04]" : "bg-slate-50"}`}>
              <p className="text-xs font-bold text-slate-400 mb-1">Thiết bị</p>
              <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>{photographer.equipment}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t shrink-0 ${isDark ? "border-white/[0.07]" : "border-slate-100"}`}>
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-2xl font-bold text-sm transition-all ${isDark ? "bg-white/[0.07] text-white hover:bg-white/[0.1]" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Package Image Gallery Component ─────────────────────────────────────────

function PackageImageGallery({ images = [], isDark }) {
  const [showAll, setShowAll] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const formattedImages = (Array.isArray(images) ? images : [])
    .map((img) => (typeof img === "string" ? img : img?.imageUrl || img?.url || img?.secure_url || ""))
    .filter(Boolean);

  if (formattedImages.length === 0) return null;

  const visibleImages = showAll ? formattedImages : formattedImages.slice(0, 3);
  const remainingCount = formattedImages.length - 3;

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-bold text-slate-400">Hình ảnh mẫu gói chụp ({formattedImages.length})</p>

      <div className="grid grid-cols-3 gap-2">
        {visibleImages.map((url, idx) => {
          const isLastInPreview = !showAll && idx === 2 && remainingCount > 0;
          return (
            <div
              key={idx}
              onClick={() => {
                if (isLastInPreview) {
                  setShowAll(true);
                } else {
                  setSelectedImage(url);
                }
              }}
              className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group bg-slate-800 border border-white/10"
            >
              <img
                src={url}
                alt={`Package preview ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {isLastInPreview && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-1">
                  <span className="text-sm font-black">+{remainingCount}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Xem thêm</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {formattedImages.length > 3 && showAll && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className={`w-full py-2 rounded-xl border text-xs font-bold transition-all ${isDark ? "border-white/10 text-slate-400 hover:text-white hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
        >
          Thu gọn ảnh
        </button>
      )}

      {/* Lightbox Overlay */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
            <img src={selectedImage} alt="Large preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-all"
            >
              <X size={22} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


