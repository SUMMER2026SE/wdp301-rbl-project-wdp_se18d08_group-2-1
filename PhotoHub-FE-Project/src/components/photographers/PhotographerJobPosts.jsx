import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Search, MapPin, Grid, DollarSign, Calendar, Info, Send, Clock, User, AlertCircle, Image, X, ChevronLeft, ChevronRight } from "lucide-react";
import { photographerMarketplaceService } from "../../services/photographerService";
import SubmitBidModal from "./SubmitBidModal";

export default function PhotographerJobPosts({ theme = "dark", language = "vi" }) {
  const isDark = theme === "dark";
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [lightbox, setLightbox] = useState(null); // { images, index }

  // Filter states
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [style, setStyle] = useState("");
  const [date, setDate] = useState("");

  const t = {
    vi: {
      title: "Marketplace Job Posts",
      searchBtn: "Tìm kiếm",
      locationPH: "Lọc theo thành phố...",
      stylePH: "Phong cách (Wedding, Concept...)",
      budgetPH: "Ngân sách tối thiểu...",
      datePH: "Ngày chụp...",
      noJobs: "Không tìm thấy job posts nào phù hợp",
      client: "Khách hàng:",
      dateLabel: "Ngày chụp:",
      budgetLabel: "Ngân sách:",
      styleLabel: "Phong cách:",
      locationLabel: "Địa điểm:",
      viewDetails: "Xem chi tiết",
      submitBid: "Gửi báo giá",
      description: "Mô tả công việc:",
      error: "Đã xảy ra lỗi",
    },
    en: {
      title: "Marketplace Job Posts",
      searchBtn: "Search",
      locationPH: "Filter by location...",
      stylePH: "Style (Wedding, Concept...)",
      budgetPH: "Minimum budget...",
      datePH: "Date...",
      noJobs: "No job posts matching criteria",
      client: "Client:",
      dateLabel: "Date:",
      budgetLabel: "Budget:",
      styleLabel: "Style:",
      locationLabel: "Location:",
      viewDetails: "View Details",
      submitBid: "Submit Bid",
      description: "Description:",
      error: "An error occurred",
    },
  }[language];

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (location.trim()) params.location = location;
      if (budget.trim()) params.budget = budget;
      if (style.trim()) params.style = style;
      if (date) params.date = date;

      const res = await photographerMarketplaceService.getJobPosts(params);
      setJobs(res.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleBidSuccess = () => {
    setShowBidModal(false);
    setSelectedJob(null);
    fetchJobs();
  };

  // ── Lightbox keyboard nav ──
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e) => {
      if (e.key === "ArrowLeft")
        setLightbox((lb) => ({ ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length }));
      if (e.key === "ArrowRight")
        setLightbox((lb) => ({ ...lb, index: (lb.index + 1) % lb.images.length }));
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black tracking-tight">{t.title}</h2>
      </div>

      {/* Filters Form */}
      <form
        onSubmit={handleSearch}
        className={`p-5 rounded-3xl border grid grid-cols-1 md:grid-cols-5 gap-4 items-end ${
          isDark ? "bg-[#121214]/60 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
        }`}
      >
        <div className="group">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
            {t.locationLabel}
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t.locationPH}
              className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm outline-none border font-medium transition-all ${
                isDark
                  ? "bg-[#09090b] border-white/5 focus:border-cyan-500 text-white"
                  : "bg-slate-50 border-slate-200 focus:border-cyan-500 focus:bg-white text-slate-900"
              }`}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
            {t.styleLabel}
          </label>
          <div className="relative">
            <Grid className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder={t.stylePH}
              className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm outline-none border font-medium transition-all ${
                isDark
                  ? "bg-[#09090b] border-white/5 focus:border-cyan-500 text-white"
                  : "bg-slate-50 border-slate-200 focus:border-cyan-500 focus:bg-white text-slate-900"
              }`}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
            {t.budgetLabel}
          </label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder={t.budgetPH}
              className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm outline-none border font-medium transition-all ${
                isDark
                  ? "bg-[#09090b] border-white/5 focus:border-cyan-500 text-white"
                  : "bg-slate-50 border-slate-200 focus:border-cyan-500 focus:bg-white text-slate-900"
              }`}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
            {t.dateLabel}
          </label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm outline-none border font-medium transition-all ${
                isDark
                  ? "bg-[#09090b] border-white/5 focus:border-cyan-500 text-white"
                  : "bg-slate-50 border-slate-200 focus:border-cyan-500 focus:bg-white text-slate-900"
              }`}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-bold tracking-wide py-3.5 rounded-2xl transition shadow-lg shadow-cyan-500/10"
        >
          {t.searchBtn}
        </button>
      </form>

      {/* Main content grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div
          className={`p-16 rounded-3xl border flex flex-col items-center justify-center text-center ${
            isDark ? "bg-[#121214]/40 border-white/5" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <AlertCircle className="text-slate-500 mb-3 opacity-60 animate-pulse" size={36} />
          <p className="font-extrabold text-slate-500">{t.noJobs}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* JobList */}
          <div className="md:col-span-2 space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {jobs.map((job) => (
              <div
                key={job._id}
                onClick={() => setSelectedJob(job)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer relative group ${
                  selectedJob?._id === job._id
                    ? "border-cyan-500 bg-cyan-500/5 shadow-lg shadow-cyan-500/5"
                    : isDark
                    ? "bg-[#121214]/80 border-white/[0.06] hover:border-white/[0.12] hover:bg-[#151518]"
                    : "bg-white border-slate-100 shadow-md hover:bg-slate-50/50 hover:border-slate-200"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-extrabold text-lg tracking-tight group-hover:text-cyan-400 transition">
                    {job.title}
                  </h3>
                  <span className="font-black text-emerald-400 text-lg">${job.budget}</span>
                </div>

                {job.matchScore !== undefined && (
                  <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-cyan-300">
                      {job.matchScore}% fit
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 ${job.availability?.available ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-red-500/20 bg-red-500/10 text-red-300"}`}>
                      {job.availability?.available ? "Available" : "Conflict"}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-slate-500 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-cyan-500" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Grid size={13} className="text-cyan-500" />
                    <span className="capitalize">{job.style}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Calendar size={13} className="text-cyan-500" />
                    <span>{new Date(job.date).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>
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
                  <h3 className="font-black text-xl leading-snug">{selectedJob.title}</h3>
                  <div className="h-[2px] bg-slate-200 dark:bg-white/[0.04]" />

                  <div className="space-y-3 text-sm text-slate-500">
                    {selectedJob.matchScore !== undefined && (
                      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs text-cyan-200">
                        <div className="font-black text-cyan-300">{selectedJob.matchScore}% personalized fit</div>
                        <div className="mt-1">{selectedJob.availability?.reason}</div>
                      </div>
                    )}
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

                  {/* ── Reference Images (UC20) ── */}
                  {selectedJob.referenceImages && selectedJob.referenceImages.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Image size={12} />
                        {language === "vi" ? "Ảnh mẫu concept" : "Reference Images"}
                        <span className="font-normal normal-case">({selectedJob.referenceImages.length})</span>
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedJob.referenceImages.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square cursor-pointer group"
                            onClick={() => setLightbox({ images: selectedJob.referenceImages, index: idx })}
                          >
                            <img
                              src={url}
                              alt={`Ref ${idx + 1}`}
                              className="w-full h-full object-cover rounded-xl border border-white/10 group-hover:scale-105 group-hover:brightness-90 transition-all duration-200 shadow-md"
                            />
                            {idx === 2 && selectedJob.referenceImages.length > 3 && (
                              <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                                <span className="text-white font-black text-sm">+{selectedJob.referenceImages.length - 3}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 italic">
                        {language === "vi" ? "Click ảnh để xem fullscreen" : "Click image to view fullscreen"}
                      </p>
                    </div>
                  )}
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

      {/* ── Lightbox (UC20 reference images) ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition"
          >
            <X size={22} />
          </button>
          {lightbox.images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox((lb) => ({ ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length })); }}
                className="absolute left-5 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox((lb) => ({ ...lb, index: (lb.index + 1) % lb.images.length })); }}
                className="absolute right-5 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
          <img
            src={lightbox.images[lightbox.index]}
            alt={`Reference ${lightbox.index + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-5 text-white/60 text-sm font-medium">
            {lightbox.index + 1} / {lightbox.images.length}
          </div>
        </div>
      )}
    </div>
  );
}
