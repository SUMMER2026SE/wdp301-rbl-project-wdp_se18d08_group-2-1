import React, { useState } from "react";
import { X, UploadCloud, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { photographerMarketplaceService } from "../../services/photographerService";

export default function UploadFinalAlbum({ bookingId, onClose, onSuccess, theme = "dark", language = "vi" }) {
  const isDark = theme === "dark";
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const t = {
    vi: {
      title: "Tải Lên Album Hoàn Thiện",
      description: "Chọn và tải lên toàn bộ ảnh chất lượng cao để gửi cho khách hàng.",
      dragDrop: "Kéo và thả ảnh tại đây hoặc click để chọn",
      maxSize: "Chấp nhận ảnh chất lượng cao (tối đa 300MB mỗi ảnh, tối đa 200 ảnh)",
      filesSelected: "ảnh đã chọn",
      uploadBtn: "Tải lên album",
      uploading: "Đang tải lên...",
      success: "Album đã được tải lên và lưu thành công!",
      error: "Tải lên thất bại",
      noFiles: "Vui lòng chọn ít nhất một tệp ảnh.",
      cancel: "Hủy bỏ",
      clearAll: "Xóa tất cả",
    },
    en: {
      title: "Upload Final Album",
      description: "Select and upload all high-resolution images to deliver to the client.",
      dragDrop: "Drag & drop images here, or click to browse",
      maxSize: "Supports high-quality images (up to 300MB each, up to 200 images)",
      filesSelected: "images selected",
      uploadBtn: "Upload Album",
      uploading: "Uploading...",
      success: "Album uploaded and saved successfully!",
      error: "Upload failed",
      noFiles: "Please select at least one image file.",
      cancel: "Cancel",
      clearAll: "Clear all",
    },
  }[language];

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length !== files.length) {
      Swal.fire("Warning", "Chỉ chấp nhận các file ảnh.", "warning");
    }

    const newFiles = [...selectedFiles, ...imageFiles];
    setSelectedFiles(newFiles);

    const newPreviews = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      Swal.fire("Warning", t.noFiles, "warning");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("bookingId", bookingId);
    selectedFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      await photographerMarketplaceService.uploadAlbum(formData, (pct) => {
        setUploadProgress(pct);
      });

      // Cleanup Object URLs
      previews.forEach((url) => URL.revokeObjectURL(url));

      await Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: t.success,
        confirmButtonColor: "#f97316",
      });

      if (typeof onSuccess === "function") onSuccess();
      if (typeof onClose === "function") onClose();
    } catch (err) {
      console.error("[UploadFinalAlbum] Error:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Lỗi không xác định. Vui lòng thử lại.";
      Swal.fire({
        icon: "error",
        title: t.error,
        text: errMsg,
        confirmButtonColor: "#f97316",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        className={`relative max-w-lg w-full rounded-2xl p-5 border transition-colors duration-300 ${
          isDark
            ? "bg-[#121214] border-white/5 text-white"
            : "bg-white border-slate-200 text-slate-900"
        } shadow-2xl`}
      >
        <button
          onClick={() => !uploading && typeof onClose === "function" && onClose()}
          disabled={uploading}
          className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
        >
          <X size={18} />
        </button>

        <h3 className="text-lg font-bold tracking-tight">{t.title}</h3>
        <p className={`text-[11px] mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {t.description}
        </p>

        <div className="space-y-4">
          {/* Upload Dropzone */}
          <label
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition ${
              uploading ? "opacity-50 pointer-events-none" : ""
            } ${
              isDark
                ? "border-white/10 hover:border-orange-500 bg-[#09090b]/40 hover:bg-[#09090b]/80"
                : "border-slate-200 hover:border-orange-500 bg-slate-50 hover:bg-slate-100/50"
            }`}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <UploadCloud size={32} className="text-orange-500 mb-2 animate-pulse" />
            <p className="text-xs font-bold text-center">{t.dragDrop}</p>
            <p className="text-[10px] text-slate-500 mt-1">{t.maxSize}</p>
          </label>

          {/* Selected Files Count */}
          {selectedFiles.length > 0 && (
            <div className="flex justify-between items-center text-xs font-semibold px-1">
              <span>
                {selectedFiles.length} {t.filesSelected}
              </span>
              <button
                type="button"
                onClick={() => {
                  previews.forEach((url) => URL.revokeObjectURL(url));
                  setSelectedFiles([]);
                  setPreviews([]);
                }}
                disabled={uploading}
                className="text-red-500 hover:text-red-400 disabled:opacity-40"
              >
                {t.clearAll}
              </button>
            </div>
          )}

          {/* Previews Grid */}
          {previews.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-[160px] overflow-y-auto pr-1">
              {previews.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-lg overflow-hidden group border border-white/5"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-orange-400 animate-pulse">
                  {t.uploading} ({uploadProgress}%)
                </span>
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                  {selectedFiles.length} ảnh
                </span>
              </div>
              <div
                className={`w-full rounded-full h-2.5 overflow-hidden ${
                  isDark ? "bg-white/10" : "bg-slate-200"
                }`}
              >
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className={`text-[10px] text-center ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Vui lòng không đóng cửa sổ này trong khi đang tải lên...
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-white/5 mt-4">
            <button
              type="button"
              onClick={() => !uploading && typeof onClose === "function" && onClose()}
              disabled={uploading}
              className={`px-4 py-2 rounded-xl font-bold transition text-xs disabled:opacity-40 ${
                isDark
                  ? "bg-white/5 hover:bg-white/10 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition shadow-md shadow-orange-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <UploadCloud size={14} />
              {uploading ? t.uploading : t.uploadBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
