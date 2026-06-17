import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Sparkles, MapPin, Grid, DollarSign, Calendar, Send, AlertCircle, Info, User } from "lucide-react";
import { photographerMarketplaceService } from "../../services/photographerService";
import SubmitBidModal from "./SubmitBidModal";

export default function PhotographerRecommendedJobs({ theme = "dark", language = "vi" }) {
  const isDark = theme === "dark";
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);

  const t = {
    vi: {
      title: "Recommended Jobs For You",
      subtitle: "Gợi ý việc làm phù hợp dựa trên phong cách, địa điểm và định giá dịch vụ của bạn.",
      loading: "Đang phân tích và gợi ý...",
      noMatch: "Chưa tìm thấy đề xuất phù hợp. Hãy thử cập nhật hồ sơ để nhận kết quả tốt hơn!",
      matchScore: "Độ phù hợp",
      client: "Khách hàng:",
      dateLabel: "Ngày chụp:",
      budgetLabel: "Ngân sách:",
      styleLabel: "Phong cách:",
      locationLabel: "Địa điểm:",
      viewDetails: "Chọn công việc để xem chi tiết đề xuất",
      submitBid: "Gửi báo giá ngay",
      description: "Mô tả công việc:",
      error: "Đã xảy ra lỗi",
    },
    en: {
      title: "Recommended Jobs For You",
      subtitle: "Smart job matching based on your creative styles, location, and service pricing.",
      loading: "Analyzing job posts...",
      noMatch: "No matching job posts found. Update your profile styles and rates to improve matching!",
      matchScore: "Match Score",
      client: "Client:",
      dateLabel: "Date:",
      budgetLabel: "Budget:",
      styleLabel: "Style:",
      locationLabel: "Location:",
      viewDetails: "Select a job post to view recommendation details",
      submitBid: "Submit Bid Now",
      description: "Description:",
      error: "An error occurred",
    },
  }[language];

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await photographerMarketplaceService.getRecommendations();
      setRecommendations(res.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleBidSuccess = () => {
    setShowBidModal(false);
    setSelectedJob(null);
    fetchRecommendations();
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
    if (score >= 50) return "text-amber-400 border-amber-500/20 bg-amber-500/5";
    return "text-slate-400 border-slate-500/20 bg-slate-500/5";
  };

  const getStrokeDashOffset = (score) => {
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    return circumference - (score / 100) * circumference;
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="relative overflow-hidden p-6 rounded-3xl border border-cyan-500/10 bg-gradient-to-r from-cyan-500/5 to-purple-600/5 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="text-cyan-400 animate-pulse" size={24} />
          <h2 className="text-2xl font-black tracking-tight">{t.title}</h2>
        </div>
        <p className="text-xs text-slate-500 max-w-2xl font-medium leading-relaxed">{t.subtitle}</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : recommendations.length === 0 ? (
        <div
          className={`p-16 rounded-3xl border flex flex-col items-center justify-center text-center ${
            isDark ? "bg-[#121214]/40 border-white/5" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <AlertCircle className="text-slate-500 mb-3 opacity-60 animate-bounce" size={36} />
          <p className="font-extrabold text-slate-500 max-w-sm leading-relaxed">{t.noMatch}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Recommended Jobs List */}
          <div className="md:col-span-2 space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {recommendations.map((job) => (
              <div
                key={job._id}
                onClick={() => setSelectedJob(job)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer relative group flex justify-between items-center ${
                  selectedJob?._id === job._id
                    ? "border-cyan-500 bg-cyan-500/5 shadow-lg shadow-cyan-500/5"
                    : isDark
                    ? "bg-[#121214]/80 border-white/[0.06] hover:border-white/[0.12] hover:bg-[#151518]"
                    : "bg-white border-slate-100 shadow-md hover:bg-slate-50/50 hover:border-slate-200"
                }`}
              >
                <div className="space-y-2 flex-1 pr-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-lg tracking-tight group-hover:text-cyan-400 transition">
                      {job.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-y-1 text-xs text-slate-500 mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-cyan-500" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Grid size={13} className="text-cyan-500" />
                      <span className="capitalize">{job.style}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign size={13} className="text-emerald-400 font-extrabold" />
                      <span className="font-bold text-emerald-400">${job.budget}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-cyan-500" />
                      <span>{new Date(job.date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {/* Score Circle Progress Indicator */}
                <div className="flex flex-col items-center gap-1.5 ml-4">
                  <div className="relative flex items-center justify-center">
                    <svg className="w-14 h-14 transform -rotate-90">
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        className="stroke-slate-300 dark:stroke-white/5 fill-transparent"
                        strokeWidth="3.5"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        className={`fill-transparent transition-all duration-1000 ${
                          job.matchScore >= 80
                            ? "stroke-emerald-400"
                            : job.matchScore >= 50
                            ? "stroke-amber-400"
                            : "stroke-slate-400"
                        }`}
                        strokeWidth="3.5"
                        strokeDasharray={2 * Math.PI * 22}
                        strokeDashoffset={getStrokeDashOffset(job.matchScore)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-black">{job.matchScore}%</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">
                    {t.matchScore}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Job Details Panel */}
          <div className="md:col-span-1">
            {selectedJob ? (
              <div
                className={`p-6 rounded-3xl border h-full flex flex-col justify-between space-y-6 ${
                  isDark ? "bg-[#09090b] border-white/5" : "bg-slate-50 border-slate-100"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-xl leading-snug">{selectedJob.title}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black border uppercase ${getScoreColor(
                        selectedJob.matchScore
                      )}`}
                    >
                      {selectedJob.matchScore}% match
                    </span>
                  </div>

                  <div className="h-[2px] bg-slate-200 dark:bg-white/[0.04]" />

                  <div className="space-y-3 text-sm text-slate-500">
                    <div className="flex items-center gap-2.5">
                      <User size={16} className="text-cyan-500" />
                      <span>
                        <strong>{t.client}</strong> {selectedJob.customer?.fullName || selectedJob.customer?.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MapPin size={16} className="text-cyan-500" />
                      <span>
                        <strong>{t.locationLabel}</strong> {selectedJob.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Grid size={16} className="text-cyan-500" />
                      <span className="capitalize">
                        <strong>{t.styleLabel}</strong> {selectedJob.style}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Calendar size={16} className="text-cyan-500" />
                      <span>
                        <strong>{t.dateLabel}</strong> {new Date(selectedJob.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <DollarSign size={16} className="text-emerald-400 font-extrabold" />
                      <span>
                        <strong>{t.budgetLabel}</strong>{" "}
                        <span className="font-bold text-emerald-400">${selectedJob.budget}</span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {t.description}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      {selectedJob.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowBidModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-black py-4 rounded-2xl transition shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
                >
                  <Send size={16} />
                  {t.submitBid}
                </button>
              </div>
            ) : (
              <div
                className={`p-6 rounded-3xl border h-full flex flex-col items-center justify-center text-center text-slate-500 border-dashed border-2 dark:border-white/10`}
              >
                <Info size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-medium">{t.viewDetails}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Bid Modal */}
      {showBidModal && selectedJob && (
        <SubmitBidModal
          job={selectedJob}
          onClose={() => setShowBidModal(false)}
          onSuccess={handleBidSuccess}
          theme={theme}
          language={language}
        />
      )}
    </div>
  );
}
