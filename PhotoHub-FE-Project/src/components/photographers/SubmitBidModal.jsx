import React, { useState } from "react";
import { X, Send, Clock, DollarSign, FileText } from "lucide-react";
import Swal from "sweetalert2";
import { photographerMarketplaceService } from "../../services/photographerService";

export default function SubmitBidModal({ jobPostId, onClose, onSuccess, theme = "dark" }) {
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    proposal: "",
    price: "",
    estimatedTime: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { proposal, price, estimatedTime } = formData;

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
        jobPostId,
        proposal: proposal.trim(),
        price: Number(price),
        estimatedTime: estimatedTime.trim(),
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

  const inputClass = `w-full rounded-xl pl-10 pr-4 py-3 outline-none border font-medium transition-all duration-300 ${
    isDark
      ? "bg-[#09090b] border-white/5 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/5"
  }`;

  const labelClass = `text-xs font-semibold uppercase tracking-wider mb-1.5 block ${
    isDark ? "text-slate-400" : "text-slate-600"
  }`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 relative border transition-colors duration-300 ${
          isDark
            ? "bg-[#121214] border-white/5 text-white shadow-2xl shadow-black"
            : "bg-white border-slate-100 text-slate-900 shadow-xl"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
            isDark ? "hover:bg-white/5 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
          }`}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div className="mb-6">
          <h3 className="text-xl font-bold tracking-tight">Gửi Đề Xuất Báo Giá</h3>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Điền các chi tiết và mức chi phí mong muốn để gửi cho khách hàng.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Proposal / Cover Letter */}
          <div>
            <label className={labelClass}>Thư Đề Xuất / Giới Thiệu Bản Thân</label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
              <textarea
                name="proposal"
                value={formData.proposal}
                onChange={handleChange}
                rows={4}
                placeholder="Hãy giới thiệu kinh nghiệm của bạn phù hợp thế nào với dự án này..."
                className={`w-full rounded-xl pl-10 pr-4 py-3 outline-none border font-medium transition-all duration-300 ${
                  isDark
                    ? "bg-[#09090b] border-white/5 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                    : "bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/5"
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Price Proposal */}
            <div>
              <label className={labelClass}>Mức Chi Phí ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
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
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
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

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-white/5 mt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-3 rounded-xl font-bold transition-all ${
                isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              {loading ? "Đang gửi..." : "Gửi báo giá"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
