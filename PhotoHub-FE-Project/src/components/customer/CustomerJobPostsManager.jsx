import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Plus,
  Image,
  X,
  Upload,
  MapPin,
  DollarSign,
  Calendar,
  Grid,
  FileText,
  Trash2,
  Lock,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Users,
  MessageSquare,
  Star,
  Check,
} from "lucide-react";
import { customerJobService } from "../../services/customerJobService";
import { photographerMarketplaceService } from "../../services/photographerService";

// ─── Lightbox component for fullscreen image preview ───
function ImageLightbox({ images, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex);

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft") setCurrent((c) => (c - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setCurrent((c) => (c + 1) % images.length);
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition"
      >
        <X size={22} />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-5 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-5 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <img
        src={images[current]}
        alt={`Reference ${current + 1}`}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      <div className="absolute bottom-5 text-white/60 text-sm font-medium">
        {current + 1} / {images.length}
      </div>
    </div>
  );
}

// ─── Status Badge ───
function StatusBadge({ status }) {
  const config = {
    open: { label: "Đang mở", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: <CheckCircle size={12} /> },
    closed: { label: "Đã đóng", color: "text-slate-400 bg-slate-500/10 border-slate-500/20", icon: <Lock size={12} /> },
    completed: { label: "Hoàn thành", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", icon: <CheckCircle size={12} /> },
  };
  const c = config[status] || config.open;
  return (
    <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${c.color}`}>
      {c.icon} {c.label}
    </span>
  );
}

export default function CustomerJobPostsManager({ theme = "dark", language = "vi" }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();

  // ─── State ───
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { images, index }

  // Bids modal state
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [bidsJob, setBidsJob] = useState(null);
  const [bids, setBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    budget: "",
    style: "",
    date: "",
  });

  // Image state
  const [selectedFiles, setSelectedFiles] = useState([]);   // File objects
  const [previews, setPreviews] = useState([]);              // blob URLs for preview
  const [editingJob, setEditingJob] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const fileInputRef = useRef(null);

  const t = {
    vi: {
      title: "Quản lý Job Posts",
      subtitle: "Đăng tin tuyển nhiếp ảnh gia & upload ảnh mẫu concept",
      createBtn: "Đăng Job Post Mới",
      formTitle: "Tạo Job Post Mới",
      formSubtitle: "Mô tả chi tiết để thu hút nhiếp ảnh gia phù hợp",
      titleLabel: "Tiêu đề job",
      descLabel: "Mô tả công việc",
      locationLabel: "Địa điểm chụp",
      budgetLabel: "Ngân sách (VNĐ)",
      styleLabel: "Phong cách chụp",
      dateLabel: "Ngày chụp",
      imagesLabel: "Ảnh mẫu concept (tối đa 5 ảnh)",
      imagesHint: "Upload ảnh concept, moodboard, hoặc phong cách bạn muốn",
      chooseImages: "Chọn ảnh",
      submitBtn: "Đăng Job Post",
      cancelBtn: "Hủy",
      deleteBtn: "Xóa",
      closeBtn: "Đóng tin",
      editBtn: "Sửa tin",
      formTitleEdit: "Chỉnh sửa Job Post",
      submitBtnEdit: "Cập nhật Job Post",
      noJobs: "Bạn chưa có job post nào",
      noJobsHint: "Hãy đăng tin để tìm nhiếp ảnh gia phù hợp!",
      budget: "Ngân sách",
      style: "Phong cách",
      date: "Ngày chụp",
      refImages: "Ảnh mẫu concept",
      noImages: "Chưa có ảnh mẫu",
      deleteConfirm: "Bạn có chắc muốn xóa job post này?",
      deleteConfirmBtn: "Xóa ngay",
      closeConfirm: "Đóng job post này?",
      closeConfirmBtn: "Đóng tin",
      success: "Thành công!",
      error: "Lỗi!",
      maxImages: "Tối đa 5 ảnh mẫu",
      submitting: "Đang tải lên...",
      dragHint: "Kéo thả hoặc click để chọn",
      titlePH: "Ví dụ: Chụp ảnh cưới phong cách Hàn Quốc",
      descPH: "Mô tả chi tiết yêu cầu, concept, phong cách mong muốn...",
      locationPH: "Ví dụ: Quận 1, TP.HCM",
      budgetPH: "Ví dụ: 5000000",
      stylePH: "Ví dụ: Wedding, Portrait, Concept...",
      viewImages: "Xem ảnh mẫu",
      viewBidsBtn: "Xem báo giá",
      bidsModalTitle: "Báo giá cho job:",
      noBids: "Chưa có báo giá nào cho job post này.",
      photographerInfo: "Thông tin nhiếp ảnh gia",
      pricing: "Đề xuất chi phí",
      deliveryTime: "Thời gian bàn giao",
      proposal: "Lời ngỏ / Proposal",
      actionChat: "Nhắn tin",
      actionAccept: "Đồng ý",
      actionReject: "Từ chối",
      acceptBidConfirm: "Bạn có chắc muốn chọn nhiếp ảnh gia này?",
      acceptBidConfirmDesc: "Lựa chọn này sẽ tự động đóng job post và từ chối tất cả các báo giá khác.",
      acceptSuccess: "Đã chọn nhiếp ảnh gia thành công!",
      rejectSuccess: "Đã từ chối báo giá.",
      experienceYears: "năm kinh nghiệm",
      rating: "Đánh giá",
      statusPending: "Đang chờ",
      statusAccepted: "Đã đồng ý",
      statusRejected: "Đã từ chối",
    },
    en: {
      title: "Job Post Manager",
      subtitle: "Post photography jobs & upload reference concept images",
      createBtn: "Post New Job",
      formTitle: "Create New Job Post",
      formSubtitle: "Describe your project to attract the right photographer",
      titleLabel: "Job Title",
      descLabel: "Job Description",
      locationLabel: "Shooting Location",
      budgetLabel: "Budget (VND)",
      styleLabel: "Photography Style",
      dateLabel: "Shooting Date",
      imagesLabel: "Reference Images (max 5)",
      imagesHint: "Upload concept photos, moodboards, or style references",
      chooseImages: "Choose Images",
      submitBtn: "Post Job",
      cancelBtn: "Cancel",
      deleteBtn: "Delete",
      closeBtn: "Close Job",
      editBtn: "Edit",
      formTitleEdit: "Edit Job Post",
      submitBtnEdit: "Update Job Post",
      noJobs: "You have no job posts yet",
      noJobsHint: "Post a job to find your perfect photographer!",
      budget: "Budget",
      style: "Style",
      date: "Date",
      refImages: "Reference Images",
      noImages: "No reference images",
      deleteConfirm: "Are you sure you want to delete this job post?",
      deleteConfirmBtn: "Delete",
      closeConfirm: "Close this job post?",
      closeConfirmBtn: "Close",
      success: "Success!",
      error: "Error!",
      maxImages: "Maximum 5 images",
      submitting: "Uploading...",
      dragHint: "Drag & drop or click to choose",
      titlePH: "e.g., Korean-style Wedding Photography",
      descPH: "Describe requirements, concept, and desired style...",
      locationPH: "e.g., District 1, Ho Chi Minh City",
      budgetPH: "e.g., 5000000",
      stylePH: "e.g., Wedding, Portrait, Concept...",
      viewImages: "View Images",
      viewBidsBtn: "View Bids",
      bidsModalTitle: "Bids for job:",
      noBids: "No bids submitted for this job post yet.",
      photographerInfo: "Photographer Info",
      pricing: "Proposed Price",
      deliveryTime: "Delivery Time",
      proposal: "Proposal",
      actionChat: "Chat",
      actionAccept: "Accept",
      actionReject: "Reject",
      acceptBidConfirm: "Are you sure you want to select this photographer?",
      acceptBidConfirmDesc: "This will automatically close the job post and reject all other bids.",
      acceptSuccess: "Photographer selected successfully!",
      rejectSuccess: "Bid rejected.",
      experienceYears: "years exp",
      rating: "Rating",
      statusPending: "Pending",
      statusAccepted: "Accepted",
      statusRejected: "Rejected",
    },
  }[language];

  // ─── Helpers ───
  const cardClass = `border rounded-3xl p-6 transition-all duration-300 ${
    isDark
      ? "bg-[#121214]/80 border-white/[0.06] hover:border-white/[0.12]"
      : "bg-white border-slate-100 shadow-md hover:shadow-lg"
  }`;

  const inputClass = `w-full rounded-2xl px-4 py-3.5 outline-none border font-medium text-sm transition-all duration-200 ${
    isDark
      ? "bg-[#09090b] border-white/5 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500 focus:bg-white shadow-sm"
  }`;

  const labelClass = `block text-xs font-bold uppercase tracking-wider mb-1.5 ${
    isDark ? "text-slate-500" : "text-slate-500"
  }`;

  // ─── Fetch jobs on mount ───
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await customerJobService.getMyJobPosts();
      setJobs(res.data || []);
    } catch (err) {
      console.error(err);
      // Nếu token hết hạn hoặc không có quyền, không crash UI
      if (err.response?.status === 401 || err.response?.status === 403) {
        setJobs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Image selection ───
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
    e.target.value = "";
  };

  const addFiles = (files) => {
    const currentTotal = (existingImages ? existingImages.length : 0) + selectedFiles.length;
    const remaining = 5 - currentTotal;
    if (remaining <= 0) {
      Swal.fire({ icon: "warning", title: t.error, text: t.maxImages, timer: 2000, showConfirmButton: false });
      return;
    }
    const toAdd = files.slice(0, remaining);
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setSelectedFiles((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePreview = (idx) => {
    const existingCount = existingImages ? existingImages.length : 0;
    if (idx < existingCount) {
      setExistingImages((prev) => prev.filter((_, i) => i !== idx));
      setPreviews((prev) => prev.filter((_, i) => i !== idx));
    } else {
      const fileIdx = idx - existingCount;
      URL.revokeObjectURL(previews[idx]);
      setSelectedFiles((prev) => prev.filter((_, i) => i !== fileIdx));
      setPreviews((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  // ─── Drag-and-drop ───
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    addFiles(files);
  };

  // ─── Form submission ───
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { title, description, location, budget, style, date } = form;
    if (!title || !description || !location || !budget || !style || !date) {
      Swal.fire({ icon: "warning", title: t.error, text: language === "vi" ? "Vui lòng điền đầy đủ tất cả các trường." : "Please fill in all required fields.", background: isDark ? "#09090b" : "#fff", color: isDark ? "#fff" : "#000" });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      selectedFiles.forEach((file) => formData.append("referenceImages", file));

      if (editingJob) {
        formData.append("existingImages", JSON.stringify(existingImages));
      }

      let res;
      if (editingJob) {
        res = await customerJobService.updateJobPost(editingJob._id, formData);
      } else {
        res = await customerJobService.createJobPost(formData);
      }

      if (res.success) {
        Swal.fire({
          icon: "success",
          title: t.success,
          text: editingJob
            ? (language === "vi" ? "Cập nhật Job Post thành công!" : "Job post updated successfully!")
            : (language === "vi" ? "Job post đã được đăng thành công!" : "Job post created successfully!"),
          background: isDark ? "#09090b" : "#fff",
          color: isDark ? "#fff" : "#000",
          timer: 2000,
          showConfirmButton: false
        });
        resetForm();
        fetchJobs();
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: t.error, text: err.response?.data?.message || err.message, background: isDark ? "#09090b" : "#fff", color: isDark ? "#fff" : "#000" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ title: "", description: "", location: "", budget: "", style: "", date: "" });
    previews.forEach((url) => {
      if (typeof url === "string" && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
    setSelectedFiles([]);
    setPreviews([]);
    setExistingImages([]);
    setEditingJob(null);
    setShowForm(false);
  };

  // ─── Delete ───
  const handleDelete = async (job) => {
    const result = await Swal.fire({
      icon: "warning",
      title: t.deleteConfirm,
      showCancelButton: true,
      confirmButtonText: t.deleteConfirmBtn,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      background: isDark ? "#09090b" : "#fff",
      color: isDark ? "#fff" : "#000",
    });
    if (!result.isConfirmed) return;

    try {
      await customerJobService.deleteJobPost(job._id);
      setJobs((prev) => prev.filter((j) => j._id !== job._id));
      if (selectedJob?._id === job._id) setSelectedJob(null);
      Swal.fire({ icon: "success", title: t.success, timer: 1500, showConfirmButton: false, background: isDark ? "#09090b" : "#fff" });
    } catch (err) {
      Swal.fire({ icon: "error", title: t.error, text: err.response?.data?.message || err.message, background: isDark ? "#09090b" : "#fff", color: isDark ? "#fff" : "#000" });
    }
  };

  // ─── Close job ───
  const handleClose = async (job) => {
    const result = await Swal.fire({
      icon: "question",
      title: t.closeConfirm,
      showCancelButton: true,
      confirmButtonText: t.closeConfirmBtn,
      confirmButtonColor: "#06b6d4",
      background: isDark ? "#09090b" : "#fff",
      color: isDark ? "#fff" : "#000",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await customerJobService.closeJobPost(job._id);
      setJobs((prev) => prev.map((j) => (j._id === job._id ? res.data : j)));
      if (selectedJob?._id === job._id) setSelectedJob(res.data);
    } catch (err) {
      Swal.fire({ icon: "error", title: t.error, text: err.response?.data?.message || err.message, background: isDark ? "#09090b" : "#fff", color: isDark ? "#fff" : "#000" });
    }
  };

  // ─── Edit job ───
  const handleEdit = (job) => {
    setForm({
      title: job.title || "",
      description: job.description || "",
      location: job.location || "",
      budget: job.budget || "",
      style: job.style || "",
      date: job.date ? new Date(job.date).toISOString().split("T")[0] : "",
    });
    setExistingImages(job.referenceImages || []);
    setPreviews(job.referenceImages || []);
    setSelectedFiles([]);
    setEditingJob(job);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── View Bids ───
  const handleViewBids = async (job) => {
    setBidsJob(job);
    setShowBidsModal(true);
    setLoadingBids(true);
    try {
      const res = await customerJobService.getBidsForJobPost(job._id);
      setBids(res.data || []);
    } catch (err) {
      console.error(err);
      setBids([]);
    } finally {
      setLoadingBids(false);
    }
  };

  const handleAcceptBid = async (bid) => {
    const result = await Swal.fire({
      title: t.acceptBidConfirm,
      text: t.acceptBidConfirmDesc,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t.actionAccept,
      cancelButtonText: t.cancelBtn,
      confirmButtonColor: "#06b6d4",
      cancelButtonColor: "#6b7280",
      background: isDark ? "#09090b" : "#fff",
      color: isDark ? "#fff" : "#000",
    });
    if (!result.isConfirmed) return;

    try {
      await customerJobService.acceptBid(bidsJob._id, bid._id);
      Swal.fire({
        icon: "success",
        title: t.success,
        text: t.acceptSuccess,
        timer: 1500,
        showConfirmButton: false,
        background: isDark ? "#09090b" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
      setShowBidsModal(false);
      fetchJobs();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: t.error,
        text: err.response?.data?.message || err.message,
        background: isDark ? "#09090b" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
    }
  };

  const handleRejectBid = async (bid) => {
    const result = await Swal.fire({
      title: language === "vi" ? "Từ chối báo giá này?" : "Reject this bid?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t.actionReject,
      cancelButtonText: t.cancelBtn,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      background: isDark ? "#09090b" : "#fff",
      color: isDark ? "#fff" : "#000",
    });
    if (!result.isConfirmed) return;

    try {
      await customerJobService.rejectBid(bidsJob._id, bid._id);
      Swal.fire({
        icon: "success",
        title: t.success,
        text: t.rejectSuccess,
        timer: 1500,
        showConfirmButton: false,
        background: isDark ? "#09090b" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
      const res = await customerJobService.getBidsForJobPost(bidsJob._id);
      setBids(res.data || []);
      fetchJobs();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: t.error,
        text: err.response?.data?.message || err.message,
        background: isDark ? "#09090b" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
    }
  };

  const handleContactPhotographer = async (photographerUserId) => {
    try {
      const res = await photographerMarketplaceService.createConversation(
        photographerUserId,
        null,
        bidsJob._id
      );
      if (res && res.success) {
        navigate("/chat");
      } else {
        throw new Error("Cannot open conversation");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: t.error,
        text: err.response?.data?.message || err.message || "Failed to contact photographer.",
        background: isDark ? "#09090b" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
    }
  };

  // ─── RENDER ───
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t.title}</h2>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>{t.subtitle}</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setSelectedJob(null); }}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-bold px-5 py-3 rounded-2xl transition shadow-lg shadow-cyan-500/20 active:scale-[0.97]"
        >
          <Plus size={18} />
          {t.createBtn}
        </button>
      </div>

      {/* ── CREATE FORM ── */}
      {showForm && (
        <div className={`${cardClass} border-cyan-500/30`}>
          <div className="mb-6">
            <h3 className="text-xl font-black tracking-tight">
              {editingJob ? t.formTitleEdit : t.formTitle}
            </h3>
            <p className={`text-sm mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>{t.formSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title + Style */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t.titleLabel}</label>
                <div className="relative">
                  <FileText size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder={t.titlePH}
                    className={`${inputClass} pl-10`}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t.styleLabel}</label>
                <div className="relative">
                  <Grid size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={form.style}
                    onChange={(e) => setForm({ ...form, style: e.target.value })}
                    placeholder={t.stylePH}
                    className={`${inputClass} pl-10`}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Location + Date + Budget */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>{t.locationLabel}</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder={t.locationPH}
                    className={`${inputClass} pl-10`}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t.dateLabel}</label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="date"
                    value={form.date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={`${inputClass} pl-10`}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t.budgetLabel}</label>
                <div className="relative">
                  <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    min="0"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder={t.budgetPH}
                    className={`${inputClass} pl-10`}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>{t.descLabel}</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t.descPH}
                rows={4}
                className={`${inputClass} resize-none leading-relaxed`}
                required
              />
            </div>

            {/* ── REFERENCE IMAGES UPLOAD (Core of UC20) ── */}
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-2">
                  <Image size={13} />
                  {t.imagesLabel}
                </span>
              </label>
              <p className={`text-xs mb-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{t.imagesHint}</p>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                  isDark
                    ? "border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/[0.03]"
                    : "border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/50"
                }`}
              >
                <Upload size={28} className={`mx-auto mb-2 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
                <p className={`text-sm font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t.dragHint}</p>
                <p className={`text-xs mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                  JPG, PNG, WEBP · {previews.length}/5
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpg,image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Preview grid */}
              {previews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                  {previews.map((url, i) => (
                    <div key={i} className="relative group aspect-square">
                      <img
                        src={url}
                        alt={`Preview ${i + 1}`}
                        className="w-full h-full object-cover rounded-xl border border-white/10 shadow-md group-hover:brightness-75 transition"
                      />
                      <button
                        type="button"
                        onClick={() => removePreview(i)}
                        className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-lg"
                      >
                        <X size={12} />
                      </button>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <span className="text-[10px] text-white font-bold bg-black/50 px-2 py-0.5 rounded-full">{i + 1}</span>
                      </div>
                    </div>
                  ))}
                  {previews.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center transition ${
                        isDark ? "border-white/10 hover:border-cyan-500/40 text-slate-600 hover:text-cyan-500" : "border-slate-200 hover:border-cyan-400 text-slate-400"
                      }`}
                    >
                      <Plus size={20} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-black px-6 py-3.5 rounded-2xl transition shadow-lg shadow-cyan-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    {editingJob ? t.submitBtnEdit : t.submitBtn}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className={`px-6 py-3.5 rounded-2xl font-bold transition ${
                  isDark ? "bg-white/5 hover:bg-white/10 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {t.cancelBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── JOB POSTS LIST ── */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className={`${cardClass} flex flex-col items-center justify-center py-20 text-center border-dashed border-2`}>
          <AlertCircle size={40} className="mb-3 opacity-30" />
          <p className="font-bold text-lg opacity-50">{t.noJobs}</p>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>{t.noJobsHint}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div
              key={job._id}
              className={`${cardClass} cursor-pointer ${
                selectedJob?._id === job._id ? "border-cyan-500/40 bg-cyan-500/[0.03]" : ""
              }`}
              onClick={() => setSelectedJob(selectedJob?._id === job._id ? null : job)}
            >
              {/* Job card header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-extrabold text-lg tracking-tight leading-snug">{job.title}</h3>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className={`text-sm leading-relaxed line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {job.description}
                  </p>
                </div>
                <span className="font-black text-2xl text-emerald-400 shrink-0">
                  {Number(job.budget).toLocaleString("vi-VN")}₫
                </span>
              </div>

              {/* Meta info chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                  <MapPin size={12} className="text-cyan-500" /> {job.location}
                </span>
                <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                  <Grid size={12} className="text-cyan-500" /> {job.style}
                </span>
                <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                  <Calendar size={12} className="text-cyan-500" />
                  {new Date(job.date).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>

              {/* ── Reference Images section ── */}
              {job.referenceImages && job.referenceImages.length > 0 ? (
                <div className="mt-2">
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                    {t.refImages} ({job.referenceImages.length})
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {job.referenceImages.slice(0, 4).map((url, idx) => (
                      <div
                        key={idx}
                        className="relative w-16 h-16 group cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightbox({ images: job.referenceImages, index: idx });
                        }}
                      >
                        <img
                          src={url}
                          alt={`Ref ${idx + 1}`}
                          className="w-16 h-16 object-cover rounded-xl border border-white/10 shadow group-hover:scale-105 transition-transform"
                        />
                        {idx === 3 && job.referenceImages.length > 4 && (
                          <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                            <span className="text-white font-black text-sm">+{job.referenceImages.length - 4}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightbox({ images: job.referenceImages, index: 0 });
                      }}
                      className={`w-16 h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-xs font-bold gap-1 transition ${
                        isDark ? "border-white/10 text-slate-500 hover:border-cyan-500/40 hover:text-cyan-500" : "border-slate-200 text-slate-400 hover:border-cyan-400 hover:text-cyan-500"
                      }`}
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <p className={`text-xs mt-2 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                  <Image size={12} className="inline mr-1" />
                  {t.noImages}
                </p>
              )}

              {/* Action buttons */}
              {job.status === "open" && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-white/[0.04]">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleViewBids(job); }}
                    className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white shadow-md active:scale-[0.97]"
                  >
                    <Users size={13} />
                    {t.viewBidsBtn}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(job); }}
                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition ${
                      isDark ? "bg-white/5 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400" : "bg-slate-100 hover:bg-cyan-50 text-slate-500 hover:text-cyan-600"
                    }`}
                  >
                    <FileText size={13} />
                    {t.editBtn}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClose(job); }}
                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition ${
                      isDark ? "bg-white/5 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400" : "bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-600"
                    }`}
                  >
                    <Lock size={13} />
                    {t.closeBtn}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(job); }}
                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition ${
                      isDark ? "bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400" : "bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600"
                    }`}
                  >
                    <Trash2 size={13} />
                    {t.deleteBtn}
                  </button>
                </div>
              )}
              {job.status !== "open" && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-white/[0.04]">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(job); }}
                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition ${
                      isDark ? "bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400" : "bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600"
                    }`}
                  >
                    <Trash2 size={13} />
                    {t.deleteBtn}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* ── BIDS LIST MODAL ── */}
      {showBidsModal && bidsJob && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setShowBidsModal(false)}
          />

          <div className={`relative w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden border transition-all duration-300 flex flex-col ${
            isDark ? "bg-[#121214] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDark ? "border-white/5" : "border-slate-100"
            }`}>
              <div>
                <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <Users size={20} className="text-cyan-500" />
                  {t.bidsModalTitle} <span className="text-cyan-500 font-extrabold">{bidsJob.title}</span>
                </h3>
                <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {bids.length} {language === "vi" ? "báo giá đề xuất" : "proposals"}
                </p>
              </div>
              <button
                onClick={() => setShowBidsModal(false)}
                className={`rounded-full p-2 transition ${
                  isDark ? "hover:bg-white/10 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingBids ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-500">
                    {language === "vi" ? "Đang tải danh sách báo giá..." : "Loading proposals..."}
                  </p>
                </div>
              ) : bids.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <AlertCircle size={40} className="opacity-20 text-cyan-500" />
                  <p className="font-bold text-lg opacity-60">{t.noBids}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bids.map((bid) => {
                    const isAccepted = bid.status === "accepted";
                    const isRejected = bid.status === "rejected";
                    const photoName = bid.photographerProfile?.displayName || bid.photographerId?.fullName || "Photographer";
                    const avatarUrl = bid.photographerId?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256";
                    const avgRating = bid.photographerProfile?.averageRating || 0;
                    const expYears = bid.photographerProfile?.experienceYears || 0;

                    return (
                      <div
                        key={bid._id}
                        className={`border rounded-2xl p-5 transition-all duration-300 ${
                          isAccepted
                            ? (isDark ? "bg-emerald-500/[0.04] border-emerald-500/40 shadow-lg shadow-emerald-500/5" : "bg-emerald-50/30 border-emerald-500/30 shadow-md")
                            : isRejected
                            ? "opacity-60 bg-transparent border-dashed border-white/5"
                            : (isDark ? "bg-[#16161a]/60 border-white/[0.05] hover:border-white/[0.1]" : "bg-slate-50/50 border-slate-200/80 hover:bg-slate-50")
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          {/* Photographer Profile */}
                          <div className="flex items-center gap-3.5 min-w-[240px]">
                            <img
                              src={avatarUrl}
                              alt={photoName}
                              className="w-14 h-14 rounded-full object-cover border-2 border-cyan-500/30"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256";
                              }}
                            />
                            <div>
                              <h4 className="font-extrabold text-base tracking-tight leading-snug">
                                {photoName}
                              </h4>
                              {/* Rating & Exp */}
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="flex items-center gap-0.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                  <Star size={11} className="fill-amber-400 text-amber-400" />
                                  {avgRating.toFixed(1)}
                                </span>
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                  isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-600"
                                }`}>
                                  {expYears} {t.experienceYears}
                                </span>
                              </div>
                              {bid.photographerId?.phoneNumber && (
                                <p className="text-xs text-slate-500 mt-1.5 font-medium">
                                  {bid.photographerId.phoneNumber}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Bid Proposal Details */}
                          <div className="flex-1 space-y-2">
                            {/* Proposal Letter */}
                            <div className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                              <p className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-0.5">
                                {t.proposal}
                              </p>
                              <p className="whitespace-pre-line">{bid.proposal}</p>
                            </div>

                            {/* Price & Time */}
                            <div className="flex flex-wrap gap-4 pt-2 border-t border-white/[0.04]">
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                  {t.pricing}
                                </span>
                                <span className="font-black text-lg text-emerald-400">
                                  {bid.price.toLocaleString("vi-VN")}₫
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                  {t.deliveryTime}
                                </span>
                                <span className={`font-bold text-sm flex items-center gap-1.5 mt-0.5 ${
                                  isDark ? "text-slate-300" : "text-slate-700"
                                }`}>
                                  <Clock size={13} className="text-cyan-500" />
                                  {bid.estimatedTime}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 self-center md:self-start w-full sm:w-auto md:w-36">
                            {/* Status Badge */}
                            {bid.status !== "pending" && (
                              <div className="text-center py-1">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                  isAccepted
                                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                    : "text-red-400 bg-red-500/10 border-red-500/20"
                                }`}>
                                  {isAccepted ? <CheckCircle size={10} /> : <X size={10} />}
                                  {isAccepted ? t.statusAccepted : t.statusRejected}
                                </span>
                              </div>
                            )}

                            {/* Action buttons (only active if job is open and bid is pending) */}
                            {bidsJob.status === "open" && bid.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleAcceptBid(bid)}
                                  className="w-full flex items-center justify-center gap-1.5 text-xs font-black px-4 py-2.5 rounded-xl transition bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-md active:scale-[0.97]"
                                >
                                  <Check size={13} />
                                  {t.actionAccept}
                                </button>
                                <button
                                  onClick={() => handleRejectBid(bid)}
                                  className={`w-full flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition border ${
                                    isDark
                                      ? "border-red-500/20 hover:bg-red-500/10 text-red-400"
                                      : "border-red-200 hover:bg-red-50 text-red-600"
                                  }`}
                                >
                                  <X size={13} />
                                  {t.actionReject}
                                </button>
                              </>
                            )}

                            {/* Contact/Chat button */}
                            {bid.photographerId?._id && (
                              <button
                                onClick={() => handleContactPhotographer(bid.photographerId._id)}
                                className={`w-full flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition border ${
                                  isDark
                                    ? "border-cyan-500/20 hover:bg-cyan-500/10 text-cyan-400"
                                    : "border-cyan-200 hover:bg-cyan-50 text-cyan-600"
                                }`}
                              >
                                <MessageSquare size={13} />
                                {t.actionChat}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-4 border-t text-right ${
              isDark ? "border-white/5 bg-[#17171a]" : "border-slate-100 bg-slate-50"
            }`}>
              <button
                onClick={() => setShowBidsModal(false)}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${
                  isDark ? "bg-white/5 hover:bg-white/10 text-slate-300" : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                }`}
              >
                {language === "vi" ? "Đóng" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
