/**
 * CreateGroupModal.jsx
 *
 * Modal cho Leader tạo nhóm chụp ảnh chung (UC96).
 * - Fetch danh sách packages (concepts)
 * - Nhập cấu hình: minMembers, maxMembers, expireTime, note
 * - Gọi API POST /api/group-bookings
 */

import React, { useState, useEffect } from "react";
import { X, Camera, Users, Clock, FileText, Loader2, Info } from "lucide-react";
import Swal from "sweetalert2";
import axios from "axios";
import { groupBookingService } from "../../services/groupBookingService";

const API_BASE = "http://localhost:3000/api";

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
  const [submitting, setSubmitting] = useState(false);

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

  const inputCls = `w-full rounded-2xl px-4 py-3.5 outline-none border transition-all focus:border-orange-500 text-sm ${
    isDark
      ? "bg-slate-900 border-slate-700 text-white"
      : "bg-slate-50 border-slate-200 text-slate-900"
  }`;
  const labelCls = `text-xs font-bold tracking-wider uppercase mb-1.5 block ${
    isDark ? "text-slate-400" : "text-slate-600"
  }`;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl ${
          isDark ? "bg-[#0b0f19] border-white/10" : "bg-white border-slate-200"
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
            className={`p-2 rounded-xl border transition-all ${
              isDark ? "border-white/5 hover:bg-white/5 text-slate-400 hover:text-white" : "border-slate-200 hover:bg-slate-50 text-slate-500"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2 px-6 pt-4">
          {[1, 2].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`h-2 flex-1 rounded-full transition-all ${
                s <= step
                  ? "bg-gradient-to-r from-orange-500 to-amber-500"
                  : isDark ? "bg-white/10" : "bg-slate-200"
              }`} />
            </div>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {/* ── Step 1: Chọn Concept ── */}
          {step === 1 && (
            <div>
              <label className={labelCls}>
                <Camera size={12} className="inline mr-1.5" />
                Chọn Concept / Gói chụp ảnh <span className="text-rose-500">*</span>
              </label>

              {packagesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-orange-400" />
                  <span className="ml-3 text-slate-400 text-sm">Đang tải danh sách gói...</span>
                </div>
              ) : packages.length === 0 ? (
                <div className={`text-center py-8 rounded-2xl border ${
                  isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50"
                }`}>
                  <Camera size={32} className="mx-auto text-slate-500 mb-2" />
                  <p className="text-slate-500 text-sm">Không tìm thấy gói dịch vụ nào</p>
                </div>
              ) : (
                <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-1">
                  {packages.map((pkg) => (
                    <button
                      key={pkg._id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        selectedPackage?._id === pkg._id
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
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                isDark ? "bg-white/[0.06] text-slate-400" : "bg-slate-200 text-slate-500"
                              }`}>
                                {pkg.locationType}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-lg font-black text-orange-400">
                            {(pkg.price || 0).toLocaleString("vi-VN")}
                            <span className="text-xs ml-0.5">đ</span>
                          </p>
                        </div>
                      </div>
                    </button>
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
                <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                  isDark ? "border-orange-500/20 bg-orange-500/5" : "border-orange-200 bg-orange-50"
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
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-400 hover:text-orange-400 transition-colors underline shrink-0"
                  >
                    Đổi concept
                  </button>
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
              <div className={`p-4 rounded-2xl border ${
                isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50"
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
                        className={`text-center p-2.5 rounded-xl ${
                          isDark ? "bg-white/[0.05]" : "bg-white border border-slate-200"
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
                      className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        form.expireHours === preset.hours
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
                  className={`flex-1 py-3.5 rounded-2xl font-bold text-sm border transition-all ${
                    isDark
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
    </div>
  );
}
