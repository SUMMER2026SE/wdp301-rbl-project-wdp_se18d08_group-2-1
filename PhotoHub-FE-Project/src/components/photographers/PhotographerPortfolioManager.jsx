import { useEffect, useState, useRef } from "react";
import { Image as ImageIcon, Plus, DollarSign, FileText, Upload, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";
import { aiRecommendService } from "../../services/aiRecommendService";

export default function PhotographerPortfolioManager({ photographerId, language = "vi", theme = "dark" }) {
  const isDark = theme === "dark";
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [pricePackage, setPricePackage] = useState("");
  const [caption, setCaption] = useState("");

  const fileInputRef = useRef(null);

  const t = {
    vi: {
      title: "Quản lý Portfolio Cá Nhân",
      subtitle: "Tải lên và quản lý tác phẩm của bạn để AI lập chỉ mục phục vụ việc khớp phong cách với khách hàng",
      uploadTitle: "Đăng tác phẩm mới",
      dragDrop: "Kéo thả hoặc Click để tải ảnh lên",
      supportTypes: "Chấp nhận JPEG, PNG, WebP, GIF (Tối đa 10MB)",
      captionLabel: "Mô tả bức ảnh (Caption)",
      captionPlaceholder: "Ví dụ: Bộ ảnh chân dung nghệ thuật chụp tại studio...",
      priceLabel: "Giá trị gói chụp áp dụng (VNĐ)",
      pricePlaceholder: "Nhập số tiền gói chụp mẫu",
      btnUpload: "Tải tác phẩm lên Portfolio",
      btnUploading: "Đang xử lý & phân tích AI...",
      galleryTitle: "Bộ Sưu Tập Tác Phẩm",
      emptyGallery: "Bạn chưa đăng tải tác phẩm nào lên Portfolio.",
      successUpload: "Đã tải tác phẩm và phân tích AI thành công!",
      errorUpload: "Không thể tải lên portfolio. Hãy thử lại.",
      validationError: "Vui lòng nhập đầy đủ hình ảnh và giá gói dịch vụ.",
      packagePrice: "Gói:",
    },
    en: {
      title: "Personal Portfolio Manager",
      subtitle: "Upload and manage your creative works so AI can index them for matchmaking with client styles",
      uploadTitle: "Upload New Creative Piece",
      dragDrop: "Drag & drop or Click to upload reference image",
      supportTypes: "JPEG, PNG, WebP, GIF supported (Max 10MB)",
      captionLabel: "Photo Description (Caption)",
      captionPlaceholder: "e.g., Artistic studio portrait shoot...",
      priceLabel: "Applicable Package Value (USD / VNĐ)",
      pricePlaceholder: "Enter package cost",
      btnUpload: "Publish to Portfolio",
      btnUploading: "AI Indexing & Uploading...",
      galleryTitle: "Your Creative Gallery",
      emptyGallery: "No portfolio pieces uploaded yet.",
      successUpload: "Portfolio piece published & AI indexed successfully!",
      errorUpload: "Failed to upload portfolio piece. Please try again.",
      validationError: "Please select an image and enter a package price.",
      packagePrice: "Pkg:",
    },
  }[language] || {
    vi: {},
    en: {},
  };

  useEffect(() => {
    if (photographerId) {
      loadPortfolios();
    }
  }, [photographerId]);

  const loadPortfolios = async () => {
    try {
      setLoading(true);
      const res = await aiRecommendService.getPortfolios(photographerId);
      if (res.success) {
        setPortfolios(res.data?.portfolios || []);
      }
    } catch (err) {
      console.error("Error loading portfolios:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !pricePackage) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu thông tin",
        text: t.validationError,
        background: isDark ? "#09090b" : "#fff",
        color: isDark ? "#fff" : "#000",
        confirmButtonColor: "#06b6d4",
      });
      return;
    }

    try {
      setUploading(true);
      const res = await aiRecommendService.uploadPortfolioItem(
        selectedFile,
        Number(pricePackage),
        caption
      );

      if (res.success) {
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: t.successUpload,
          background: isDark ? "#09090b" : "#fff",
          color: isDark ? "#fff" : "#000",
          confirmButtonColor: "#06b6d4",
          timer: 2000,
        });

        // Reset form
        setSelectedFile(null);
        setPreviewUrl("");
        setPricePackage("");
        setCaption("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Refresh list
        loadPortfolios();
      }
    } catch (err) {
      console.error("Upload error:", err);
      Swal.fire({
        icon: "error",
        title: "Thất bại",
        text: err.response?.data?.message || t.errorUpload,
        background: isDark ? "#09090b" : "#fff",
        color: isDark ? "#fff" : "#000",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setUploading(false);
    }
  };

  const cardClass = `border rounded-3xl p-6 backdrop-blur-md transition-all duration-300 ${isDark
      ? "bg-[#121214]/80 border-white/[0.06] shadow-2xl shadow-black/40"
      : "bg-white border-slate-100 shadow-md shadow-slate-100/50"
    }`;

  const inputClass = `w-full rounded-2xl pl-12 pr-4 py-3 outline-none border font-medium transition-all duration-300 ${isDark
      ? "bg-[#09090b] border-white/5 text-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 focus:bg-[#030303]"
      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white shadow-sm"
    }`;

  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `http://localhost:3000${url}`;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black tracking-tight">{t.title}</h2>
        <p className="text-sm font-medium text-slate-400 dark:text-zinc-500">{t.subtitle}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        {/* Left column: Upload Form */}
        <div className={`${cardClass} md:col-span-1 space-y-6`}>
          <h3 className="text-lg font-bold border-b border-slate-200 dark:border-white/[0.06] pb-3">
            {t.uploadTitle}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[180px]
                ${previewUrl
                  ? "border-cyan-500/40 bg-cyan-500/[0.02]"
                  : "border-slate-300 dark:border-zinc-700 hover:border-cyan-500 hover:bg-slate-50 dark:hover:bg-zinc-800/20"
                }
              `}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-inner">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Upload size={24} className="text-white" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
                    <ImageIcon size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">{t.dragDrop}</p>
                    <p className="text-xs text-slate-400 mt-1">{t.supportTypes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Price Package */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                {t.priceLabel}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="number"
                  min="0"
                  value={pricePackage}
                  onChange={(e) => setPricePackage(e.target.value)}
                  className={inputClass}
                  placeholder={t.pricePlaceholder}
                  required
                />
              </div>
            </div>

            {/* Caption */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                {t.captionLabel}
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className={inputClass}
                  placeholder={t.captionPlaceholder}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading}
              className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold tracking-wide transition-all duration-300 shadow-lg
                ${uploading
                  ? "bg-cyan-500/20 text-cyan-400 cursor-not-allowed border border-cyan-500/10"
                  : "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white shadow-cyan-500/20 hover:scale-[1.01] active:scale-[0.99]"
                }
              `}
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  {t.btnUploading}
                </>
              ) : (
                <>
                  <Plus size={18} />
                  {t.btnUpload}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right column: Gallery List */}
        <div className={`${cardClass} md:col-span-2 space-y-6`}>
          <h3 className="text-lg font-bold border-b border-slate-200 dark:border-white/[0.06] pb-3">
            {t.galleryTitle}
          </h3>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="aspect-[4/3] rounded-2xl bg-slate-100 dark:bg-zinc-900 animate-pulse" />
              ))}
            </div>
          ) : portfolios.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl">
              <ImageIcon size={32} className="mx-auto text-slate-400 mb-3 opacity-60" />
              <p className="text-sm font-semibold text-slate-400 dark:text-zinc-500">{t.emptyGallery}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {portfolios.map((item) => (
                <div
                  key={item._id}
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/50 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950 transition-all duration-300 hover:shadow-lg"
                >
                  <img
                    src={getFullUrl(item.image_url)}
                    alt={item.caption || "Portfolio item"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Info Overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-6 flex flex-col justify-end text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {item.caption && (
                      <p className="text-xs font-bold line-clamp-1 mb-1">{item.caption}</p>
                    )}
                    <p className="text-[10px] font-semibold text-cyan-300 flex items-center gap-1">
                      <DollarSign size={10} />
                      {t.packagePrice} {item.price_package?.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
