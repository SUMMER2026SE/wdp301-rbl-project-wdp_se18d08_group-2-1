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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className={`relative max-w-xl w-full rounded-3xl p-6 border ${
          isDark ? "bg-[#121214] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
        } shadow-2xl`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-red-500 transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-black mb-6">{t.title}</h3>

        <button
          type="button"
          onClick={handleOptimize}
          disabled={optimizing}
          className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/15 disabled:opacity-50"
        >
          <Sparkles size={16} />
          {optimizing ? "Analyzing bid..." : "Analyze and optimize before deadline"}
        </button>

        {optimization && (
          <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200">
            <div className="mb-2 font-black text-amber-300">Current bid score: {optimization.currentScore}%</div>
            {(optimization.suggestions || []).map((item, index) => (
              <div key={index} className="flex gap-2 py-1">
                <CheckCircle size={13} className="mt-0.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
            <button
              type="button"
              onClick={applyOptimization}
              className="mt-3 rounded-xl bg-amber-500 px-3 py-2 text-[11px] font-black text-black transition hover:bg-amber-400"
            >
              Apply suggested version
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
              {t.proposalLabel}
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 text-slate-500" size={18} />
              <textarea
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                rows={4}
                className={`w-full rounded-2xl pl-12 pr-4 py-3 outline-none border font-medium transition-all ${
                  isDark
                    ? "bg-[#09090b] border-white/5 focus:border-cyan-500"
                    : "bg-slate-50 border-slate-200 focus:border-cyan-500 focus:bg-white"
                }`}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                {t.priceLabel}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={`w-full rounded-2xl pl-12 pr-4 py-3.5 outline-none border font-medium transition-all ${
                    isDark
                      ? "bg-[#09090b] border-white/5 focus:border-cyan-500"
                      : "bg-slate-50 border-slate-200 focus:border-cyan-500 focus:bg-white"
                  }`}
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                {t.timeLabel}
              </label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  className={`w-full rounded-2xl pl-12 pr-4 py-3.5 outline-none border font-medium transition-all ${
                    isDark
                      ? "bg-[#09090b] border-white/5 focus:border-cyan-500"
                      : "bg-slate-50 border-slate-200 focus:border-cyan-500 focus:bg-white"
                  }`}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/[0.04] mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 rounded-2xl font-bold transition text-sm ${
                isDark ? "hover:bg-white/5 text-slate-400" : "hover:bg-slate-100 text-slate-500"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white px-6 py-3 rounded-2xl font-bold tracking-wide transition shadow-lg shadow-cyan-500/20 disabled:opacity-40"
            >
              <Send size={16} />
              {submitting ? t.submitting : t.submitBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
