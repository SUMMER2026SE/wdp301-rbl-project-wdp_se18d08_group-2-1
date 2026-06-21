import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Send, DollarSign, Clock, FileText, X, Sparkles, CheckCircle } from "lucide-react";
import { photographerMarketplaceService } from "../../services/photographerService";

export default function EditBidModal({ bid, onClose, onSuccess, theme = "dark", language = "vi" }) {
  const isDark = theme === "dark";
  const [proposal, setProposal] = useState("");
  const [price, setPrice] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState(null);

  const t = {
    vi: {
      title: "Chỉnh Sửa Báo Giá",
      proposalLabel: "Mô tả đề xuất công việc",
      priceLabel: "Giá đề xuất của bạn ($)",
      timeLabel: "Thời gian hoàn thành ước tính",
      submitBtn: "Cập nhật báo giá",
      submitting: "Đang lưu...",
      error: "Đã xảy ra lỗi",
      success: "Báo giá đã được cập nhật thành công!",
      requiredFields: "Vui lòng nhập đầy đủ các trường thông tin bắt buộc.",
    },
    en: {
      title: "Edit Proposal & Bid",
      proposalLabel: "Proposal Description",
      priceLabel: "Your Proposed Price ($)",
      timeLabel: "Estimated Completion Time",
      submitBtn: "Update Bid",
      submitting: "Updating...",
      error: "An error occurred",
      success: "Your bid has been updated successfully!",
      requiredFields: "Please fill in all required fields.",
    },
  }[language];

  useEffect(() => {
    if (bid) {
      setProposal(bid.proposal || "");
      setPrice(bid.price || "");
      setEstimatedTime(bid.estimatedTime || "");
    }
  }, [bid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proposal.trim() || !price || !estimatedTime.trim()) {
      Swal.fire("Warning", t.requiredFields, "warning");
      return;
    }

    setSubmitting(true);
    try {
      await photographerMarketplaceService.updateBid(bid._id, {
        proposal,
        price: Number(price),
        estimatedTime,
      });

      Swal.fire("Success", t.success, "success");
      onSuccess();
    } catch (err) {
      console.error(err);
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const res = await photographerMarketplaceService.optimizeBid(bid._id);
      setOptimization(res.data || null);
    } catch (err) {
      console.error(err);
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    } finally {
      setOptimizing(false);
    }
  };

  const applyOptimization = () => {
    if (!optimization) return;
    setProposal(optimization.suggestedProposal || proposal);
    setPrice(optimization.suggestedPrice || price);
    setEstimatedTime(optimization.suggestedEstimatedTime || estimatedTime);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        className={`relative max-w-lg w-full rounded-2xl p-5 border ${
          isDark ? "bg-[#121214] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
        } shadow-2xl`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-red-500 transition-colors"
        >
          <X size={18} />
        </button>

        <h3 className="text-lg font-black mb-4">{t.title}</h3>

        <button
          type="button"
          onClick={handleOptimize}
          disabled={optimizing}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-xs font-bold text-orange-600 dark:text-orange-400 transition hover:bg-orange-500/15 disabled:opacity-50"
        >
          <Sparkles size={14} />
          {optimizing ? "Analyzing bid..." : "Analyze and optimize before deadline"}
        </button>

        {optimization && (
          <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-200">
            <div className="mb-2 font-black text-amber-300">Current bid score: {optimization.currentScore}%</div>
            {(optimization.suggestions || []).map((item, index) => (
              <div key={index} className="flex gap-2 py-0.5">
                <CheckCircle size={12} className="mt-0.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
            <button
              type="button"
              onClick={applyOptimization}
              className="mt-2.5 rounded bg-amber-500 px-2.5 py-1.5 text-[10px] font-black text-black transition hover:bg-amber-400"
            >
              Apply suggested version
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
              {t.proposalLabel}
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 text-slate-500" size={16} />
              <textarea
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                rows={3}
                className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none border font-medium transition-all ${
                  isDark
                    ? "bg-[#09090b] border-white/5 focus:border-orange-500"
                    : "bg-slate-50 border-slate-200 focus:border-orange-500 focus:bg-white"
                }`}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
                {t.priceLabel}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={`w-full rounded-xl pl-10 pr-4 py-2 outline-none border font-medium transition-all ${
                    isDark
                      ? "bg-[#09090b] border-white/5 focus:border-orange-500"
                      : "bg-slate-50 border-slate-200 focus:border-orange-500 focus:bg-white"
                  }`}
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
                {t.timeLabel}
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  className={`w-full rounded-xl pl-10 pr-4 py-2 outline-none border font-medium transition-all ${
                    isDark
                      ? "bg-[#09090b] border-white/5 focus:border-orange-500"
                      : "bg-slate-50 border-slate-200 focus:border-orange-500 focus:bg-white"
                  }`}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/[0.04] mt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl font-bold transition text-xs ${
                isDark ? "hover:bg-white/5 text-slate-400" : "hover:bg-slate-100 text-slate-500"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition shadow-md shadow-orange-500/10 disabled:opacity-40"
            >
              <Send size={14} />
              {submitting ? t.submitting : t.submitBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
