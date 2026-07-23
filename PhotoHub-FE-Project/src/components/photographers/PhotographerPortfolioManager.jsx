import { useEffect, useState, useRef } from "react";
import {
  Plus, DollarSign, FileText, Upload, Trash2,
  ArrowLeft, Image as ImageIcon, Tag, Layers, CheckCircle2,
  X, Eye, BookImage, Grid3X3, Loader2
} from "lucide-react";
import Swal from "sweetalert2";
import { aiRecommendService } from "../../services/aiRecommendService";

// ────────────────────────────────────────────────────────────────────────────
// VIEW STATES: "list" | "create" | "detail"
// ────────────────────────────────────────────────────────────────────────────

export default function PhotographerPortfolioManager({ photographerId, language = "vi", theme = "dark" }) {
  const isDark = theme === "dark";

  // ── Global state ──────────────────────────────────────────────────────────
  const [view, setView] = useState("list"); // "list" | "create" | "detail"
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumImages, setAlbumImages] = useState([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  // ── Categories & StyleTags ────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [styleTags, setStyleTags] = useState([]);

  // ── Create album form state ───────────────────────────────────────────────
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumDescription, setAlbumDescription] = useState("");
  const [albumPrice, setAlbumPrice] = useState("");
  const [albumCategory, setAlbumCategory] = useState("");
  const [albumStyleTags, setAlbumStyleTags] = useState([]);
  const [albumCoverFile, setAlbumCoverFile] = useState(null);
  const [albumCoverPreview, setAlbumCoverPreview] = useState("");
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const coverInputRef = useRef(null);

  // ── Upload image to album ─────────────────────────────────────────────────
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef(null);

  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://wdp301-rbl-project-wdp-se18d08-group-2-1.onrender.com${url}`;
  };

  // ── Load initial data ─────────────────────────────────────────────────────
  useEffect(() => {
    if (photographerId) {
      loadAlbums();
      loadCommonData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photographerId]);

  const loadCommonData = async () => {
    try {
      const [catRes, tagRes] = await Promise.all([
        aiRecommendService.getCategories(),
        aiRecommendService.getStyleTags(),
      ]);
      if (catRes?.data) setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      if (tagRes?.data) setStyleTags(Array.isArray(tagRes.data) ? tagRes.data : []);
    } catch (e) {
      console.error("Lỗi tải danh mục/thẻ:", e);
    }
  };

  const loadAlbums = async () => {
    try {
      setLoadingAlbums(true);
      const res = await aiRecommendService.getAlbumsByPhotographer(photographerId);
      if (res.success) setAlbums(res.data?.albums || []);
    } catch (e) {
      console.error("Lỗi tải albums:", e);
    } finally {
      setLoadingAlbums(false);
    }
  };

  const openAlbum = async (album) => {
    try {
      setLoadingDetail(true);
      setSelectedAlbum(album);
      setView("detail");
      const res = await aiRecommendService.getAlbumDetail(album._id);
      if (res.success) {
        setSelectedAlbum(res.data.album);
        setAlbumImages(res.data.images || []);
      }
    } catch (e) {
      console.error("Lỗi tải chi tiết album:", e);
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── Create album submit ───────────────────────────────────────────────────
  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!albumTitle.trim() || !albumPrice) {
      Swal.fire({ icon: "warning", title: "Thiếu thông tin", text: "Vui lòng nhập Tiêu đề và Giá gói.", background: isDark ? "#09090b" : "#fff", color: isDark ? "#fff" : "#000", confirmButtonColor: "#ff6b3b" });
      return;
    }
    try {
      setCreatingAlbum(true);
      const formData = new FormData();
      formData.append("title", albumTitle.trim());
      formData.append("description", albumDescription.trim());
      formData.append("price_package", Number(albumPrice));
      if (albumCategory) formData.append("category", albumCategory);
      albumStyleTags.forEach(tid => formData.append("styleTags[]", tid));
      if (albumCoverFile) formData.append("coverImage", albumCoverFile);

      const res = await aiRecommendService.createAlbum(formData);
      if (res.success) {
        Swal.fire({ icon: "success", title: "Tạo Album thành công!", timer: 1800, showConfirmButton: false, background: isDark ? "#09090b" : "#fff", color: isDark ? "#fff" : "#000" });
        resetCreateForm();
        setView("list");
        loadAlbums();
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Thất bại", text: err.response?.data?.message || "Không thể tạo album.", background: isDark ? "#09090b" : "#fff", color: isDark ? "#fff" : "#000", confirmButtonColor: "#ef4444" });
    } finally {
      setCreatingAlbum(false);
    }
  };

  const resetCreateForm = () => {
    setAlbumTitle(""); setAlbumDescription(""); setAlbumPrice("");
    setAlbumCategory(""); setAlbumStyleTags([]);
    setAlbumCoverFile(null); setAlbumCoverPreview("");
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  // ── Upload image to album ─────────────────────────────────────────────────
  const handleUploadImage = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      Swal.fire({ icon: "warning", title: "Chưa chọn ảnh", text: "Vui lòng chọn ảnh để tải lên.", background: isDark ? "#09090b" : "#fff", color: isDark ? "#fff" : "#000", confirmButtonColor: "#ff6b3b" });
      return;
    }
    try {
      setUploading(true);
      const res = await aiRecommendService.uploadImageToAlbum(selectedAlbum._id, uploadFile, uploadCaption);
      if (res.success) {
        Swal.fire({ icon: "success", title: "Upload thành công!", text: "AI đã phân tích và lập chỉ mục ảnh.", timer: 1800, showConfirmButton: false, background: isDark ? "#09090b" : "#fff", color: isDark ? "#fff" : "#000" });
        setUploadFile(null); setUploadPreview(""); setUploadCaption("");
        if (imageInputRef.current) imageInputRef.current.value = "";
        // Reload album detail
        const detail = await aiRecommendService.getAlbumDetail(selectedAlbum._id);
        if (detail.success) setAlbumImages(detail.data.images || []);
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Upload thất bại", text: err.response?.data?.message || "Không thể tải ảnh lên.", background: isDark ? "#09090b" : "#fff", color: isDark ? "#fff" : "#000", confirmButtonColor: "#ef4444" });
    } finally {
      setUploading(false);
    }
  };

  // ── Delete album ──────────────────────────────────────────────────────────
  const handleDeleteAlbum = async () => {
    const result = await Swal.fire({
      icon: "warning", title: "Xóa Album?",
      text: `Album "${selectedAlbum.title}" và toàn bộ ảnh sẽ bị xóa vĩnh viễn.`,
      showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280",
      confirmButtonText: "Xóa vĩnh viễn", cancelButtonText: "Hủy",
      background: isDark ? "#09090b" : "#fff", color: isDark ? "#fff" : "#000",
    });
    if (!result.isConfirmed) return;
    try {
      await aiRecommendService.deleteAlbum(selectedAlbum._id);
      Swal.fire({ icon: "success", title: "Đã xóa Album!", timer: 1500, showConfirmButton: false, background: isDark ? "#09090b" : "#fff", color: isDark ? "#fff" : "#000" });
      setSelectedAlbum(null); setAlbumImages([]);
      setView("list"); loadAlbums();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Lỗi xóa album", text: err.response?.data?.message || "Thử lại sau.", background: isDark ? "#09090b" : "#fff", color: isDark ? "#fff" : "#000" });
    }
  };

  // ── Delete image ──────────────────────────────────────────────────────────
  const handleDeleteImage = async (imageId) => {
    const result = await Swal.fire({
      icon: "warning", title: "Xóa ảnh này?", text: "Hành động này không thể hoàn tác.",
      showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280",
      confirmButtonText: "Xóa", cancelButtonText: "Hủy",
      background: isDark ? "#09090b" : "#fff", color: isDark ? "#fff" : "#000",
    });
    if (!result.isConfirmed) return;
    try {
      await aiRecommendService.deletePortfolioImage(imageId);
      setAlbumImages(prev => prev.filter(img => img._id !== imageId));
    } catch (err) {
      Swal.fire({ icon: "error", title: "Lỗi", text: err.response?.data?.message || "Không thể xóa ảnh.", background: isDark ? "#09090b" : "#fff", color: isDark ? "#fff" : "#000" });
    }
  };

  // ── Style helpers ─────────────────────────────────────────────────────────
  const card = `border rounded-3xl p-5 backdrop-blur-md transition-all duration-300 ${isDark ? "bg-[#121214]/80 border-white/[0.06] shadow-2xl shadow-black/40" : "bg-white border-slate-100 shadow-md"}`;
  const inputCls = `w-full rounded-2xl pl-4 pr-4 py-2.5 outline-none border font-medium transition-all duration-300 ${isDark ? "bg-[#09090b] border-white/5 text-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 focus:bg-white"}`;

  const toggleStyleTag = (id) => {
    setAlbumStyleTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (view === "list") return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Quản lý Album Portfolio</h2>
          <p className="text-sm font-medium text-slate-400 dark:text-zinc-500 mt-1">
            Tạo và quản lý các album tác phẩm để AI lập chỉ mục phục vụ tìm kiếm thông minh
          </p>
        </div>
        <button
          onClick={() => { resetCreateForm(); setView("create"); }}
          className="flex items-center gap-2 rounded-2xl px-5 py-2.5 font-bold text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <Plus size={16} /> Tạo Album Mới
        </button>
      </div>

      {/* Album Grid */}
      {loadingAlbums ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(n => (
            <div key={n} className={`${card} animate-pulse`}>
              <div className="aspect-[16/9] rounded-2xl bg-slate-200 dark:bg-zinc-800 mb-4" />
              <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded-full w-2/3 mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-full w-1/2" />
            </div>
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className={`${card} text-center py-20`}>
          <div className="flex flex-col items-center gap-4">
            <div className="p-5 rounded-3xl bg-orange-500/10">
              <BookImage size={40} className="text-orange-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-700 dark:text-zinc-200">Chưa có Album nào</p>
              <p className="text-sm text-slate-400 dark:text-zinc-500 mt-1">Tạo album đầu tiên để bắt đầu quản lý tác phẩm</p>
            </div>
            <button
              onClick={() => setView("create")}
              className="flex items-center gap-2 mt-2 rounded-2xl px-5 py-2.5 font-bold text-sm border-2 border-dashed border-orange-500/40 text-orange-500 hover:bg-orange-500/10 transition-all"
            >
              <Plus size={16} /> Tạo Album đầu tiên
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {albums.map(album => (
            <div
              key={album._id}
              onClick={() => openAlbum(album)}
              className={`${card} cursor-pointer hover:-translate-y-1 hover:shadow-xl group overflow-hidden p-0`}
            >
              {/* Cover Image */}
              <div className="relative aspect-[16/9] overflow-hidden rounded-t-3xl bg-slate-100 dark:bg-zinc-900">
                {album.coverImageUrl ? (
                  <img
                    src={getFullUrl(album.coverImageUrl)}
                    alt={album.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <Grid3X3 size={32} className="text-slate-300 dark:text-zinc-700" />
                  </div>
                )}
                {/* Image count badge */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-white text-xs font-bold">
                  <ImageIcon size={10} /> {album.imageCount || 0} ảnh
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="font-black text-base text-slate-900 dark:text-white truncate">{album.title}</h3>
                {album.description && (
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">{album.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  {album.category?.name && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-orange-500 dark:text-orange-400 bg-orange-500/10 rounded-full px-2.5 py-1">
                      <Tag size={10} /> {album.category.name}
                    </span>
                  )}
                  <span className="ml-auto text-sm font-black text-orange-500">
                    {album.price_package?.toLocaleString()} VNĐ
                  </span>
                </div>
                {album.styleTags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {album.styleTags.slice(0, 3).map(tag => (
                      <span key={tag._id || tag} className="text-[10px] font-semibold rounded-full bg-purple-500/10 text-purple-500 dark:text-purple-400 px-2 py-0.5">
                        #{tag.name || tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: CREATE ALBUM VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (view === "create") return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => { resetCreateForm(); setView("list"); }}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all"
        >
          <ArrowLeft size={15} /> Quay lại
        </button>
        <div>
          <h2 className="text-xl font-black">Tạo Album Mới</h2>
          <p className="text-xs text-slate-400 dark:text-zinc-500">Điền thông tin album trước, sau đó tải ảnh vào</p>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Left: Cover image upload */}
        <div className={`${card} md:col-span-2 space-y-4`}>
          <h3 className="font-black text-base border-b border-slate-100 dark:border-white/[0.06] pb-3">Ảnh bìa Album</h3>
          <div
            onClick={() => coverInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f?.type.startsWith("image/")) {
                setAlbumCoverFile(f);
                const reader = new FileReader();
                reader.onloadend = () => setAlbumCoverPreview(reader.result);
                reader.readAsDataURL(f);
              }
            }}
            className={`border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[220px] ${albumCoverPreview ? "border-orange-500/40 bg-orange-500/[0.02]" : "border-slate-300 dark:border-zinc-700 hover:border-orange-500 hover:bg-orange-500/5"}`}
          >
            <input type="file" ref={coverInputRef} onChange={e => {
              const f = e.target.files[0];
              if (!f) return;
              setAlbumCoverFile(f);
              const reader = new FileReader();
              reader.onloadend = () => setAlbumCoverPreview(reader.result);
              reader.readAsDataURL(f);
            }} accept="image/*" className="hidden" />
            {albumCoverPreview ? (
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
                <img src={albumCoverPreview} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Upload size={20} className="text-white" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 p-6">
                <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400"><ImageIcon size={28} /></div>
                <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">Kéo thả hoặc Click</p>
                <p className="text-xs text-slate-400">JPEG, PNG, WebP (tối đa 10MB)</p>
              </div>
            )}
          </div>
          {albumCoverPreview && (
            <button onClick={() => { setAlbumCoverFile(null); setAlbumCoverPreview(""); if (coverInputRef.current) coverInputRef.current.value = ""; }}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-red-500 border border-red-500/20 hover:bg-red-500/10 transition-all">
              <X size={13} /> Xóa ảnh bìa
            </button>
          )}
        </div>

        {/* Right: Form fields */}
        <div className={`${card} md:col-span-3 space-y-5`}>
          <h3 className="font-black text-base border-b border-slate-100 dark:border-white/[0.06] pb-3">Thông tin Album</h3>
          <form onSubmit={handleCreateAlbum} className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">Tiêu đề Album *</label>
              <input type="text" value={albumTitle} onChange={e => setAlbumTitle(e.target.value)}
                className={inputCls} placeholder="VD: Bộ ảnh cưới phong cách Hàn Quốc..." required />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">Mô tả Album</label>
              <textarea value={albumDescription} onChange={e => setAlbumDescription(e.target.value)}
                className={`${inputCls} resize-none h-20`} placeholder="Giới thiệu ngắn về album này..." />
            </div>

            {/* Price & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">Giá gói tham khảo (VNĐ) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input type="number" min="0" value={albumPrice} onChange={e => setAlbumPrice(e.target.value)}
                    className={`${inputCls} pl-9`} placeholder="5000000" required />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">Danh mục chụp</label>
                <select value={albumCategory} onChange={e => setAlbumCategory(e.target.value)}
                  className={`${inputCls} cursor-pointer`}>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Style Tags */}
            {styleTags.length > 0 && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  <Layers size={11} className="inline mr-1" /> Phong cách chụp (chọn nhiều)
                </label>
                <div className="flex flex-wrap gap-2">
                  {styleTags.map(tag => (
                    <button type="button" key={tag._id}
                      onClick={() => toggleStyleTag(tag._id)}
                      className={`rounded-full px-3 py-1 text-xs font-bold border transition-all duration-200 ${albumStyleTags.includes(tag._id)
                        ? "bg-purple-500 border-purple-500 text-white shadow-sm shadow-purple-500/30"
                        : "border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-purple-400 hover:text-purple-500"}`}>
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={creatingAlbum}
              className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold tracking-wide transition-all duration-300 shadow-lg mt-2 ${creatingAlbum
                ? "bg-orange-500/20 text-orange-400 cursor-not-allowed border border-orange-500/10"
                : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.99]"}`}
            >
              {creatingAlbum ? (<><Loader2 size={16} className="animate-spin" /> Đang tạo Album...</>) : (<><CheckCircle2 size={16} /> Tạo Album</>)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: ALBUM DETAIL VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setSelectedAlbum(null); setAlbumImages([]); setView("list"); }}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all shrink-0"
          >
            <ArrowLeft size={15} /> Danh sách Album
          </button>
          <div>
            <h2 className="text-xl font-black truncate">{selectedAlbum?.title}</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              {albumImages.length} ảnh &bull; {selectedAlbum?.price_package?.toLocaleString()} VNĐ
            </p>
          </div>
        </div>
        <button onClick={handleDeleteAlbum}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-red-500 border border-red-500/20 hover:bg-red-500/10 transition-all shrink-0">
          <Trash2 size={15} /> Xóa Album
        </button>
      </div>

      {/* Album meta tags */}
      <div className="flex flex-wrap gap-2 items-center">
        {selectedAlbum?.category?.name && (
          <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-500/10 rounded-full px-3 py-1 border border-orange-500/20">
            <Tag size={10} /> {selectedAlbum.category.name}
          </span>
        )}
        {selectedAlbum?.styleTags?.map(tag => (
          <span key={tag._id || tag} className="text-xs font-bold rounded-full bg-purple-500/10 text-purple-500 dark:text-purple-400 px-3 py-1 border border-purple-500/20">
            #{tag.name || tag}
          </span>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* Left: Upload form */}
        <div className={`${card} space-y-5`}>
          <h3 className="font-black text-base border-b border-slate-100 dark:border-white/[0.06] pb-3">
            Thêm ảnh vào Album
          </h3>
          <form onSubmit={handleUploadImage} className="space-y-4">
            <div
              onClick={() => imageInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f?.type.startsWith("image/")) {
                  setUploadFile(f);
                  const reader = new FileReader();
                  reader.onloadend = () => setUploadPreview(reader.result);
                  reader.readAsDataURL(f);
                }
              }}
              className={`border-2 border-dashed rounded-2xl cursor-pointer transition-all min-h-[160px] flex items-center justify-center ${uploadPreview ? "border-orange-500/40" : "border-slate-300 dark:border-zinc-700 hover:border-orange-500 hover:bg-orange-500/5"}`}
            >
              <input type="file" ref={imageInputRef} onChange={e => {
                const f = e.target.files[0];
                if (!f) return;
                setUploadFile(f);
                const reader = new FileReader();
                reader.onloadend = () => setUploadPreview(reader.result);
                reader.readAsDataURL(f);
              }} accept="image/*" className="hidden" />
              {uploadPreview ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                  <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Upload size={18} className="text-white" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 p-6 text-center">
                  <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-400"><ImageIcon size={24} /></div>
                  <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">Kéo thả hoặc Click</p>
                  <p className="text-xs text-slate-400">AI sẽ tự động phân tích ảnh</p>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
                <FileText size={10} className="inline mr-1" /> Mô tả ảnh (Caption)
              </label>
              <input type="text" value={uploadCaption} onChange={e => setUploadCaption(e.target.value)}
                className={inputCls} placeholder="VD: Ảnh chân dung buổi chiều..." />
            </div>

            <button type="submit" disabled={uploading}
              className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-bold text-sm transition-all duration-300 ${uploading
                ? "bg-orange-500/20 text-orange-400 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-lg shadow-orange-500/25 hover:scale-[1.01]"}`}
            >
              {uploading ? (<><Loader2 size={15} className="animate-spin" /> AI đang phân tích...</>) : (<><Upload size={15} /> Upload ảnh</>)}
            </button>
          </form>
        </div>

        {/* Right: Images grid */}
        <div className={`${card} md:col-span-2 space-y-5`}>
          <h3 className="font-black text-base border-b border-slate-100 dark:border-white/[0.06] pb-3">
            Bộ sưu tập <span className="text-orange-500 ml-1">({albumImages.length})</span>
          </h3>

          {loadingDetail ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(n => <div key={n} className="aspect-square rounded-xl bg-slate-100 dark:bg-zinc-900 animate-pulse" />)}
            </div>
          ) : albumImages.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl">
              <ImageIcon size={28} className="mx-auto text-slate-300 dark:text-zinc-700 mb-3" />
              <p className="text-sm font-semibold text-slate-400 dark:text-zinc-500">Chưa có ảnh nào trong album</p>
              <p className="text-xs text-slate-400 dark:text-zinc-600 mt-1">Tải ảnh lên từ form bên trái</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {albumImages.map(img => (
                <div key={img._id} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800">
                  <img
                    src={getFullUrl(img.image_url)}
                    alt={img.caption || "Album image"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    <button onClick={() => setLightboxImg(getFullUrl(img.image_url))}
                      className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-all">
                      <Eye size={15} />
                    </button>
                    <button onClick={() => handleDeleteImage(img._id)}
                      className="h-9 w-9 rounded-full bg-red-500/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {img.caption && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-[10px] font-semibold text-white/90 truncate">{img.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Fullscreen" className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain select-none"
            onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
