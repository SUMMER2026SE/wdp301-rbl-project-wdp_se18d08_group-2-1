import React, { useState } from "react";
import { X, Send, Clock, DollarSign, FileText, Sparkles, CheckCircle } from "lucide-react";
import Swal from "sweetalert2";
import { photographerMarketplaceService } from "../../services/photographerService";

export default function SubmitBidModal({ job, jobPostId, onClose, onSuccess, theme = "dark" }) {
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(false);
  const [assistLoading, setAssistLoading] = useState(false);
  const [assistNotes, setAssistNotes] = useState([]);
  const [formData, setFormData] = useState({
    proposal: "",
    price: "",
    estimatedTime: "",
    packageName: "",
    deliverables: [],
    aiAssistance: null,
  });

  const resolvedJobPostId = jobPostId || job?._id;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { proposal, price, estimatedTime } = formData;

    if (!resolvedJobPostId) {
      Swal.fire({
        icon: "error",
        title: "Missing job",
        text: "Cannot find job id for this bid.",
        background: isDark ? "#121214" : "#fff",
        color: isDark ? "#fff" : "#000",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    if (!proposal.trim() || !price || !estimatedTime.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu thông tin",
        text: "Vui lòng điền đầy đủ tất cả các trường dữ liệu.",
        background: isDark ? "#121214" : "#fff",
        color: isDark ? "#fff" : "#000",
        confirmButtonColor: "#06b6d4",
      });
      return;
    }

    if (Number(price) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Chi phí không hợp lệ",
        text: "Mức giá đề xuất phải lớn hơn 0.",
        background: isDark ? "#121214" : "#fff",
        color: isDark ? "#fff" : "#000",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    setLoading(false);
    try {
      setLoading(true);
      await photographerMarketplaceService.submitBid({
        jobPostId: resolvedJobPostId,
        proposal: proposal.trim(),
        price: Number(price),
        estimatedTime: estimatedTime.trim(),
        packageName: formData.packageName,
        deliverables: formData.deliverables,
        aiAssistance: formData.aiAssistance,
      });

      Swal.fire({
        icon: "success",
        title: "Gửi báo giá thành công",
        text: "Hồ sơ đề xuất của bạn đã được chuyển tới khách hàng!",
        background: isDark ? "#121214" : "#fff",
        color: isDark ? "#fff" : "#000",
        confirmButtonColor: "#06b6d4",
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting bid:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi gửi báo giá",
        text: error.response?.data?.message || error.message || "Gửi báo giá thất bại.",
        background: isDark ? "#121214" : "#fff",
        color: isDark ? "#fff" : "#000",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssist = async () => {
    if (!resolvedJobPostId) return;

    setAssistLoading(true);
    try {
      const res = await photographerMarketplaceService.assistBid(resolvedJobPostId);
      const data = res.data || {};
      setFormData((prev) => ({
        ...prev,
        proposal: data.proposal || prev.proposal,
        price: data.price || prev.price,
        estimatedTime: data.estimatedTime || prev.estimatedTime,
        packageName: data.packageName || prev.packageName,
        deliverables: data.deliverables || prev.deliverables,
        aiAssistance: {
          used: true,
          suggestedPrice: data.price,
          suggestedEstimatedTime: data.estimatedTime,
          notes: data.notes || [],
        },
      }));
      setAssistNotes(data.notes || []);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Smart Assist failed",
        text: error.response?.data?.message || error.message,
        background: isDark ? "#121214" : "#fff",
        color: isDark ? "#fff" : "#000",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setAssistLoading(false);
    }
  };

  const inputClass = `w-full rounded-xl pl-10 pr-4 py-2 text-sm outline-none border font-medium transition-all duration-300 ${
    isDark
      ? "bg-[#09090b] border-white/5 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/5"
  }`;

  const labelClass = `text-[11px] font-semibold uppercase tracking-wider mb-1 block ${
    isDark ? "text-slate-400" : "text-slate-600"
  }`;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div
        className={`w-full max-w-lg rounded-2xl p-5 relative border transition-colors duration-300 ${
          isDark
            ? "bg-[#121214] border-white/5 text-white shadow-2xl shadow-black"
            : "bg-white border-slate-100 text-slate-900 shadow-xl"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${
            isDark ? "hover:bg-white/5 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
          }`}
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="mb-4">
          <h3 className="text-lg font-bold tracking-tight">Gửi Đề Xuất Báo Giá</h3>
          <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Điền các chi tiết và mức chi phí mong muốn để gửi cho khách hàng.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAssist}
          disabled={assistLoading || !resolvedJobPostId}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-xs font-bold text-orange-600 dark:text-orange-400 transition hover:bg-orange-500/15 disabled:opacity-50"
        >
          <Sparkles size={14} />
          {assistLoading ? "Generating smart proposal..." : "Generate smart proposal, price, and delivery time"}
        </button>

        {assistNotes.length > 0 && (
          <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-[11px] text-emerald-300">
            {assistNotes.map((note, index) => (
              <div key={index} className="flex gap-2 py-0.5">
                <CheckCircle size={12} className="mt-0.5 shrink-0" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Proposal / Cover Letter */}
          <div>
            <label className={labelClass}>Thư Đề Xuất / Giới Thiệu Bản Thân</label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 text-slate-500" size={16} />
              <textarea
                name="proposal"
                value={formData.proposal}
                onChange={handleChange}
                rows={3}
                placeholder="Hãy giới thiệu kinh nghiệm của bạn phù hợp thế nào với dự án này..."
                className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none border font-medium transition-all duration-300 ${
                  isDark
                    ? "bg-[#09090b] border-white/5 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                    : "bg-slate-50 border-slate-200 text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/5"
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Price Proposal */}
            <div>
              <label className={labelClass}>Mức Chi Phí ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Ví dụ: 150"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Estimated Completion Time */}
            <div>
              <label className={labelClass}>Thời Gian Thực Hiện</label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  name="estimatedTime"
                  value={formData.estimatedTime}
                  onChange={handleChange}
                  placeholder="Ví dụ: 3 ngày, 4 giờ..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {formData.packageName && (
            <div
              className={`rounded-xl border p-2.5 text-[11px] ${
                isDark
                  ? "border-white/5 bg-white/[0.03] text-slate-300"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              <div className="font-bold text-orange-500">{formData.packageName}</div>
              {formData.deliverables?.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {formData.deliverables.map((item) => (
                    <span key={item} className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[9px] font-bold text-orange-600 dark:text-orange-400">
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-2.5 justify-end pt-3 border-t border-white/5 mt-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-orange-500/10"
            >
              <Send size={14} />
              {loading ? "Đang gửi..." : "Gửi báo giá"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
