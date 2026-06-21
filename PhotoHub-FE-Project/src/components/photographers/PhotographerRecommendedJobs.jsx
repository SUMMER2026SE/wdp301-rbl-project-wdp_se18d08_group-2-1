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
    <div className="space-y-5">
      {/* Header Info */}
      <div className="relative overflow-hidden p-5 rounded-2xl border border-orange-500/10 bg-gradient-to-r from-orange-500/5 to-amber-500/5 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2.5 mb-2">
          <Sparkles className="text-orange-500 animate-pulse" size={22} />
          <h2 className="text-xl font-black tracking-tight">{t.title}</h2>
        </div>
        <p className="text-[11px] text-slate-500 max-w-2xl font-medium leading-relaxed">{t.subtitle}</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : recommendations.length === 0 ? (
        <div
          className={`p-10 rounded-2xl border flex flex-col items-center justify-center text-center ${
            isDark ? "bg-[#121214]/40 border-white/5" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <AlertCircle className="text-slate-500 mb-3 opacity-60 animate-bounce" size={32} />
          <p className="font-extrabold text-slate-500 max-w-sm leading-relaxed text-sm">{t.noMatch}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {/* Recommended Jobs List */}
          <div className="md:col-span-2 space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
            {recommendations.map((job) => (
              <div
                key={job._id}
                onClick={() => setSelectedJob(job)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex justify-between items-center ${
                  selectedJob?._id === job._id
                    ? "border-orange-500 bg-orange-500/5 shadow-md shadow-orange-500/5"
                    : isDark
                    ? "bg-[#121214]/80 border-white/[0.06] hover:border-white/[0.12] hover:bg-[#151518]"
                    : "bg-white border-slate-100 shadow-md hover:bg-slate-50/50 hover:border-slate-200"
                }`}
              >
                <div className="space-y-1.5 flex-1 pr-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-base tracking-tight group-hover:text-orange-500 transition">
                      {job.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-y-1 text-[11px] text-slate-500 mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-orange-500" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Grid size={12} className="text-orange-500" />
                      <span className="capitalize">{job.style}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign size={12} className="text-emerald-400 font-extrabold" />
                      <span className="font-bold text-emerald-400">${job.budget}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-orange-500" />
                      <span>{new Date(job.date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {/* Score Circle Progress Indicator */}
                <div className="flex flex-col items-center gap-1 ml-4">
                  <div className="relative flex items-center justify-center">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="19"
                        className="stroke-slate-300 dark:stroke-white/5 fill-transparent"
                        strokeWidth="3"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="19"
                        className={`fill-transparent transition-all duration-1000 ${
                          job.matchScore >= 80
                            ? "stroke-emerald-400"
                            : job.matchScore >= 50
                            ? "stroke-amber-400"
                            : "stroke-slate-400"
                        }`}
                        strokeWidth="3"
                        strokeDasharray={2 * Math.PI * 19}
                        strokeDashoffset={getStrokeDashOffset(job.matchScore)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-black">{job.matchScore}%</span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider text-center">
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
                className={`p-4 rounded-2xl border h-full flex flex-col justify-between space-y-4 ${
                  isDark ? "bg-[#09090b] border-white/5" : "bg-slate-50 border-slate-100"
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-lg leading-snug">{selectedJob.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${getScoreColor(
                        selectedJob.matchScore
                      )}`}
                    >
                      {selectedJob.matchScore}% match
                    </span>
                  </div>

                  <div className="h-[2px] bg-slate-200 dark:bg-white/[0.04]" />

                  <div className="space-y-2.5 text-[13px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <User size={15} className="text-orange-500" />
                      <span>
                        <strong>{t.client}</strong> {selectedJob.customer?.fullName || selectedJob.customer?.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-orange-500" />
                      <span>
                        <strong>{t.locationLabel}</strong> {selectedJob.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Grid size={15} className="text-orange-500" />
                      <span className="capitalize">
                        <strong>{t.styleLabel}</strong> {selectedJob.style}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-orange-500" />
                      <span>
                        <strong>{t.dateLabel}</strong> {new Date(selectedJob.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign size={15} className="text-emerald-400 font-extrabold" />
                      <span>
                        <strong>{t.budgetLabel}</strong>{" "}
                        <span className="font-bold text-emerald-400">${selectedJob.budget}</span>
                      </span>
                    </div>
                  </div>

                  {selectedJob.matchBreakdown && (
                    <div className="rounded-xl border border-orange-500/15 bg-orange-500/5 p-2.5 text-xs">
                      <h4 className="mb-1.5 font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">Fit breakdown</h4>
                      {Object.entries(selectedJob.matchBreakdown).map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-3 py-0.5 text-slate-400">
                          <span className="capitalize">{key}</span>
                          <span className="font-bold text-slate-200">{value.score ?? "-"} pts</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {t.description}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                      {selectedJob.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowBidModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black py-3 rounded-xl transition shadow-md shadow-orange-500/10 active:scale-[0.98]"
                >
                  <Send size={15} />
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
