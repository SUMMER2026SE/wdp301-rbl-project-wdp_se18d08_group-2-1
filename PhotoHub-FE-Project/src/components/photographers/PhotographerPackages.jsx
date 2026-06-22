import React, { useEffect, useState } from "react";
import {
    Plus,
    Image as ImageIcon,
    Clock,
    AlertCircle,
    X,
    Sparkles,
    Check
} from "lucide-react";
import Swal from "sweetalert2";
import { createPortal } from "react-dom";

import {
    uploadImages,
    createPackage,
    getMyPackages,
    getPackageDetail,
    updatePackage,
    toggleStatusPackage,
    softDeletePackage
} from "../../services/photographerPackageService";

import { getAllCategories, getAllStyleTags } from "../../services/categoryAndStyleService";

const BACKEND_ORIGIN = "http://localhost:3000";

const resolveImageUrl = (image) => {
    if (!image) return "";
    const rawUrl = typeof image === "string"
        ? image
        : image.imageUrl || image.secure_url || image.url || "";

    if (!rawUrl) return "";
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
    if (rawUrl.startsWith("/uploads/")) return `${BACKEND_ORIGIN}${rawUrl}`;
    if (rawUrl.startsWith("/")) return `${BACKEND_ORIGIN}${rawUrl}`;
    return `${BACKEND_ORIGIN}/uploads/packages/${rawUrl}`;
};

export default function PhotographerPackages({
    theme = "light",
    language = "vi",
}) {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [availableCategories, setAvailableCategories] = useState([]);
    const [availableStyles, setAvailableStyles] = useState([]);

    // Form state
    const [openModal, setOpenModal] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [duration, setDuration] = useState("");
    const [files, setFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(null);

    // State quản lý việc chọn dữ liệu gốc từ BE
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedStyles, setSelectedStyles] = useState([]);

    // State phục vụ việc tìm kiếm các item có sẵn
    const [cateSearch, setCateSearch] = useState("");
    const [styleSearch, setStyleSearch] = useState("");
    const [showCateDropdown, setShowCateDropdown] = useState(false);
    const [showStyleDropdown, setShowStyleDropdown] = useState(false);

    const [openDrawer, setOpenDrawer] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailData, setDetailData] = useState(null);
    const [filterCategories, setFilterCategories] = useState([]);
    const [filterStyles, setFilterStyles] = useState([]);
    const [showCateFilter, setShowCateFilter] = useState(false);
    const [showStyleFilter, setShowStyleFilter] = useState(false);

    const t = {
        vi: {
            title: "Quản lý Packages",
            subtitle: "Xem, tạo mới và quản lý các gói dịch vụ nhiếp ảnh của bạn",
            create: "Tạo Package",
            empty: "Chưa có package nào",
            emptySub: "Hãy tạo gói dịch vụ đầu tiên để thu hút khách hàng tiềm năng.",
            submit: "Tạo mới",
            uploading: "Đang upload...",
            placeholderTitle: "Ví dụ: Gói chụp ảnh cưới Premium",
            placeholderDesc: "Mô tả chi tiết về dịch vụ, số lượng ảnh, địa điểm...",
            labelCategories: "DANH MỤC HỆ THỐNG",
            labelStyles: "PHONG CÁCH HỆ THỐNG",
            labelPrice: "GIÁ DỊCH VỤ (VNĐ)",
            labelDuration: "THỜI GIAN CHỤP (GIỜ)",
            labelFiles: "HÌNH ẢNH MINH HỌA",
            cancel: "Hủy bỏ",
            invalidInput: "Dữ liệu không hợp lệ",
            invalidCateOrStyle: "Bạn đã nhập Danh mục hoặc Phong cách không tồn tại trong hệ thống. Vui lòng chỉ chọn các mục có sẵn!",
            detailTitle: "Chi tiết Gói dịch vụ",
            noImages: "Không có hình ảnh minh họa",
            active: "Đang hoạt động",
            inactive: "Không hoạt động",
            edit: "Chỉnh sửa",
            save: "Lưu thay đổi",
            delete: "Xóa gói dịch vụ",
            categoryTitle: "Danh mục",
            styleTitle: "Phong cách",
        },
        en: {
            title: "Manage Packages",
            subtitle: "View, create, and manage your photography service packages",
            create: "Create Package",
            empty: "No packages yet",
            emptySub: "Create your first package to start attracting potential clients.",
            submit: "Create Now",
            uploading: "Uploading...",
            placeholderTitle: "e.g., Premium Wedding Package",
            placeholderDesc: "Detailed description of services, photos count, locations...",
            labelCategories: "SYSTEM CATEGORIES",
            labelStyles: "SYSTEM STYLES",
            labelPrice: "PRICE (VND)",
            labelDuration: "DURATION (HOURS)",
            labelFiles: "GALLERY IMAGES",
            cancel: "Cancel",
            invalidInput: "Invalid Data",
            invalidCateOrStyle: "You have typed a Category or Style that does not exist in the system. Please select from the available options only!",
            detailTitle: "Package Details",
            noImages: "No preview images available",
            active: "Active",
            inactive: "Inactive",
            edit: "Edit",
            save: "Save Changes",
            delete: "Delete Package",
            categoryTitle: "Categories",
            styleTitle: "Styles",
        },
    }[language];

    const initData = async (
        categories = filterCategories,
        styles = filterStyles
    ) => {

        setLoading(true);
        try {
            const [resPackages, resCategories, resStyles] = await Promise.all([
                getMyPackages({
                    categoryIds: categories,
                    styles: styles
                }),
                getAllCategories(),
                getAllStyleTags()
            ]);

            const actualPackagesArray = resPackages?.data?.data || [];
            setPackages(Array.isArray(actualPackagesArray) ? actualPackagesArray : []);

            // Thêm dòng log này để check data thô từ API trả về:
            console.log("⚡ [initData] Dữ liệu Packages thô từ API:", resPackages);
            console.log("⚡ [initData] Mảng packages sau khi lọc kĩ:", actualPackagesArray);

            const cateData = (resCategories?.data?.data || []).map(c => ({
                ...c,
                _id: String(c._id)
            }));

            setAvailableCategories(cateData);

            const styleData = (resStyles?.data?.data || []).map(s => ({
                ...s,
                _id: String(s._id)
            }));
            setAvailableStyles(styleData);

        } catch (err) {
            const errMsg = err.response?.data?.message || err.response?.data || err.message;
            Swal.fire("Error", typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg, "error");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        initData(filterCategories, filterStyles);
    }, [filterCategories, filterStyles]);


    // --- HÀM XỬ LÝ KHI BẤM XEM CHI TIẾT PACKAGE ---
    const handleOpenDetail = async (pkg) => {
        exitEditMode(); // reset edit mode khi mở chi tiết mới
        setSelectedPackage(pkg);
        setOpenDrawer(true);
        setLoadingDetail(true);
        setDetailData(null);

        try {
            const res = await getPackageDetail(pkg._id);

            const data = res?.data?.data || res?.data || pkg;

            setDetailData(data);
        } catch (err) {
            console.error("Lỗi lấy chi tiết gói chụp:", err);
            setDetailData(pkg);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleToggleStatus = async () => {
        try {
            const res = await toggleStatusPackage(detailData._id);

            Swal.fire("Success", "Updated status!", "success");

            setDetailData(prev => ({
                ...prev,
                status: res?.data?.status || (prev.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")
            }));

            // refresh list
            initData();
        } catch (err) {
            const errMsg = err.response?.data?.message || err.response?.data || err.message;
            Swal.fire("Error", typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg, "error");
        }
    };

    const handleDelete = async () => {
        const confirm = await Swal.fire({
            title: "Delete this package?",
            text: "This action will hide the package.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
        });

        if (!confirm.isConfirmed) return;

        try {
            await softDeletePackage(detailData._id);

            Swal.fire("Deleted!", "Package removed", "success");

            setOpenDrawer(false);
            initData();
        } catch (err) {
            const errMsg = err.response?.data?.message || err.response?.data || err.message;
            Swal.fire("Error", typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg, "error");
        }
    };


    const filteredCategories = availableCategories.filter(cate =>
        cate.name?.toLowerCase().includes(cateSearch.trim().toLowerCase())
    );

    const filteredStyles = availableStyles.filter(style =>
        style.name?.toLowerCase().includes(styleSearch.trim().toLowerCase())
    );

    const toggleCategory = (id) => {
        if (selectedCategories.includes(id)) {
            setSelectedCategories(selectedCategories.filter(item => item !== id));
        } else {
            setSelectedCategories([...selectedCategories, id]);
        }
        setCateSearch("");
    };

    const toggleStyle = (id) => {
        if (selectedStyles.includes(id)) {
            setSelectedStyles(selectedStyles.filter(item => item !== id));
        } else {
            setSelectedStyles([...selectedStyles, id]);
        }
        setStyleSearch("");
    };

    const handleSelectImages = (e) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles((prevFiles) => [...prevFiles, ...newFiles]);
        }
    };
    const resetForm = () => {
        setTitle("");
        setDescription("");
        setPrice("");
        setDuration("");

        setFiles([]);
        setExistingImages([]);

        setSelectedCategories([]);
        setSelectedStyles([]);

        setCateSearch("");
        setStyleSearch("");

        setIsEditing(false);
        setEditForm(null);
    };

    const handleSubmit = async () => {
        try {
            // validate cơ bản
            if (!title || !price || !duration) {
                Swal.fire("Warning", "Please fill required fields", "warning");
                return;
            }

            const token = localStorage.getItem("token");
            if (!token) {
                Swal.fire("Error", "Please login again", "error");
                return;
            }

            setUploading(true);

            let imageUrls = existingImages.map(resolveImageUrl);
            let newImageUrls = [];

            if (files.length > 0) {
                newImageUrls = await uploadImages(files);
            }

            const finalImages = [...imageUrls, ...newImageUrls];

            const payload = {
                title,
                description,
                price: Number(price),
                durationHours: Number(duration),
                categoryIds: selectedCategories,
                styleTagIds: selectedStyles,
                images: finalImages,
            };

            // 👉 phân biệt CREATE vs UPDATE
            if (isEditing) {
                await updatePackage(editForm._id, payload);
                Swal.fire("Success", "Updated successfully!", "success");
            } else {
                await createPackage(
                    {
                        ...payload,
                        status: "ACTIVE",
                        isFeatured: false,
                    },
                    token
                );
                Swal.fire("Success", "Created successfully!", "success");
            }

            // reset + reload
            resetForm();
            setOpenModal(false);
            exitEditMode();
            setIsEditing(false);
            setEditForm(null);
            initData();

        } catch (err) {
            console.error("Error during submit package:", err);
            const errMsg = err.response?.data?.message || err.response?.data || err.message;
            Swal.fire("Error", typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg, "error");
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = async (pkg) => {

        if (availableCategories.length === 0 || availableStyles.length === 0) {
            await initData(); // 🔥 quan trọng
        }

        setIsEditing(true);
        setEditForm(pkg);
        setOpenDrawer(false);

        setTitle(pkg.title || "");
        setDescription(pkg.description || "");
        setPrice(pkg.price || "");
        setDuration(pkg.durationHours || "");

        setSelectedCategories(
            (pkg.categories || [])
                .map(c => (c && typeof c === "object" ? String(c._id || "") : String(c)))
                .filter(id => id && id !== "undefined" && id !== "null")
        );

        setSelectedStyles(
            (pkg.styles || [])
                .map(s => (s && typeof s === "object" ? String(s._id || "") : String(s)))
                .filter(id => id && id !== "undefined" && id !== "null")
        );

        setExistingImages(pkg.images || []);
        setFiles([]);

        setOpenModal(true);
    };

    useEffect(() => {
        const handleCloseDropdowns = (e) => {
            if (!e.target.closest(".cate-dropdown-container")) {
                setShowCateDropdown(false);
            }
            if (!e.target.closest(".style-dropdown-container")) {
                setShowStyleDropdown(false);
            }
        };
        window.addEventListener("click", handleCloseDropdowns);
        return () => window.removeEventListener("click", handleCloseDropdowns);
    }, []);

    const exitEditMode = () => {
        setIsEditing(false);
        setEditForm(null);
        resetForm();
    };

    const handleOpenCreate = () => {
        resetAll();
        setOpenModal(true);
    };

    const resetAll = () => {
        setTitle("");
        setDescription("");
        setPrice("");
        setDuration("");

        setFiles([]);
        setExistingImages([]);

        setSelectedCategories([]);
        setSelectedStyles([]);

        setCateSearch("");
        setStyleSearch("");

        setIsEditing(false);
        setEditForm(null);
    };

    return (
        <div className="space-y-8 p-6 text-slate-800 dark:text-slate-100 relative max-w-7xl mx-auto">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-5">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-orange-500 dark:text-orange-400">
                        {t.title}
                    </h2>
                    <p className="text-sm mt-1 text-slate-500 dark:text-slate-400 font-medium">
                        {t.subtitle}
                    </p>
                </div>

                <button
                    onClick={handleOpenCreate}
                    className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 active:scale-95"
                >
                    <Plus size={18} />
                    <span>{t.create}</span>
                </button>
            </div>

            <div className="space-y-6 mb-8">
                {/* CATEGORY CHIPS */}
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t.categoryTitle}</h4>
                    <div className="flex flex-wrap gap-2">
                        {availableCategories.map((cate) => {
                            const selected = filterCategories.includes(cate._id);
                            return (
                                <button
                                    key={cate._id}
                                    onClick={() => {
                                        setFilterCategories(prev =>
                                            selected ? prev.filter(id => id !== cate._id) : [...prev, cate._id]
                                        );
                                    }}
                                    className={`
                            px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border
                            ${selected
                                            ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20"
                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-orange-400"}
                        `}
                                >
                                    {cate.name}
                                    {selected && <Check size={14} className="inline ml-2" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* STYLE CHIPS */}
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t.styleTitle}</h4>
                    <div className="flex flex-wrap gap-2">
                        {availableStyles.map((style) => {
                            const selected = filterStyles.includes(style._id);
                            return (
                                <button
                                    key={style._id}
                                    onClick={() => {
                                        setFilterStyles(prev =>
                                            selected ? prev.filter(id => id !== style._id) : [...prev, style._id]
                                        );
                                    }}
                                    className={`
                            px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border
                            ${selected
                                            ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400"}
                        `}
                                >
                                    {style.name}
                                    {selected && <Check size={14} className="inline ml-2" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* MAIN LIST SECTION */}
            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium text-slate-400 animate-pulse">Loading packages...</span>
                </div>
            ) : packages.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
                        <AlertCircle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">{t.empty}</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">{t.emptySub}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map((p) => {
                        const isSelected = selectedPackage?._id === p._id;
                        return (
                            <div
                                key={p._id}
                                onClick={() => handleOpenDetail(p)}
                                className={`group relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${isSelected
                                    ? "border-orange-500 bg-orange-50/30 dark:bg-orange-500/[0.02] shadow-md ring-1 ring-orange-500"
                                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#151515] hover:shadow-md"
                                    }`}
                            >
                                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                    {p.isFeatured && (
                                        <span className="flex items-center gap-0.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                            <Sparkles size={10} /> Hot
                                        </span>
                                    )}
                                    <span
                                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border
        ${p.status === "ACTIVE"
                                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                : "bg-red-500/10 text-red-500 border-red-500/20"
                                            }
    `}
                                    >
                                        {p.status === "ACTIVE" ? t.active : t.inactive}
                                    </span>
                                </div>

                                <div>
                                    <div className="pr-16">
                                        <h3 className="font-bold text-lg leading-snug line-clamp-1 group-hover:text-orange-500 transition-colors">
                                            {p.title}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        <div className="flex items-center gap-1">
                                            <Clock size={13} className="text-slate-400" />
                                            <span>{p.durationHours}h</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-emerald-500 dark:text-emerald-400 font-bold text-sm">{Number(p.price || 0).toLocaleString('vi-VN')} đ</span>
                                        </div>
                                    </div>

                                    {p.description && (
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
                                            {p.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                                    {(p.images || []).length > 0 ? (
                                        (p.images || []).slice(0, 3).map((img, i) => (
                                            <img
                                                key={i}
                                                src={resolveImageUrl(img)}
                                                alt="preview"
                                                className="w-11 h-11 rounded-lg object-cover ring-1 ring-slate-100 dark:ring-slate-800 bg-slate-100"
                                            />
                                        ))
                                    ) : (
                                        <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                            <ImageIcon size={14} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ========================================================================= */}
            {/* --- SIDEBAR DETAIL DRAWER (TRƯỢT TỪ BÊN PHẢI RA DÍNH SÁT MÀN HÌNH) --- */}
            {/* ========================================================================= */}
            <div className={`fixed inset-0 z-[120] transition-visibility duration-300 ${openDrawer ? "visible" : "invisible"}`}>
                {/* Backdrop mờ nền */}
                <div
                    className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${openDrawer ? "opacity-100" : "opacity-0"}`}
                    onClick={() => setOpenDrawer(false)}
                />

                {/* Panel Container - SỬA 'absolute' THÀNH 'fixed', thêm 'top-0 bottom-0 h-[100dvh]' */}
                <div className={`fixed top-0 bottom-0 right-0 h-[100dvh] w-full max-w-md bg-white dark:bg-[#111111] shadow-2xl flex flex-col transition-transform duration-300 ease-out transform border-l border-slate-100 dark:border-slate-900 ${openDrawer ? "translate-x-0" : "translate-x-full"}`}>

                    {/* Drawer Header */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-5 bg-orange-500 rounded-full"></div>
                            <h3 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                {t.detailTitle}
                            </h3>
                        </div>
                        <button
                            onClick={() => setOpenDrawer(false)}
                            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Drawer Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {loadingDetail ? (
                            <div className="h-full flex flex-col items-center justify-center gap-2 py-20">
                                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-medium text-slate-400">Loading details...</span>
                            </div>
                        ) : detailData ? (
                            <>
                                <div className="space-y-2">

                                    <div className="flex items-center flex-wrap gap-2">
                                        {detailData.isFeatured && (
                                            <span className="flex items-center gap-0.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                <Sparkles size={10} /> Hot
                                            </span>
                                        )}

                                        <span
                                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border
        ${detailData.status === "ACTIVE"
                                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                    : "bg-red-500/10 text-red-500 border-red-500/20"
                                                }
    `}
                                        >
                                            {detailData.status === "ACTIVE" ? t.active : t.inactive}
                                        </span>
                                    </div>

                                    {/* 👇 EDIT / VIEW TITLE */}
                                    {isEditing ? (
                                        <input
                                            value={editForm?.title || ""}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, title: e.target.value })
                                            }
                                            className="w-full text-xl font-black tracking-tight bg-transparent border border-orange-500 rounded-lg px-3 py-2 outline-none"
                                        />
                                    ) : (
                                        <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white leading-tight">
                                            {detailData.title}
                                        </h2>
                                    )}

                                </div>

                                {/* Khối Giá & Thời gian */}
                                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t.labelPrice}</span>
                                        <span className="text-xl font-black text-emerald-500 dark:text-emerald-400 flex items-center">
                                            {Number(detailData.price || 0).toLocaleString('vi-VN')} đ
                                        </span>
                                    </div>
                                    <div className="space-y-0.5 border-l border-slate-200 dark:border-slate-800 pl-4">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t.labelDuration}</span>
                                        <span className="text-xl font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                            <Clock size={16} className="text-slate-400" />{detailData.durationHours}h
                                        </span>
                                    </div>
                                </div>

                                {/* Mô tả gói */}
                                {detailData.description && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                            {t.detailTitle}
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/20 p-3.5 rounded-xl border border-slate-100/50 dark:border-slate-800/40 whitespace-pre-line">
                                            {detailData.description}
                                        </p>
                                    </div>
                                )}

                                {/* Categories */}
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    {t.categoryTitle}
                                </h4>
                                {detailData?.categories?.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {detailData.categories.map((cate) => (
                                            <span
                                                key={cate._id}
                                                className="px-2 py-1 bg-orange-500/10 text-orange-500 text-xs font-bold rounded-lg"
                                            >
                                                {cate?.name || "Unknown"}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    {t.styleTitle}
                                </h4>
                                {/* Styles */}
                                {detailData?.styles?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {detailData.styles.map((style) => (
                                            <span
                                                key={style._id}
                                                className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-lg"
                                            >
                                                {style?.name || "Unknown"}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {/* Hình ảnh Gallery */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <ImageIcon size={14} /> {t.labelFiles} ({(detailData.images || []).length})
                                    </h4>

                                    {(detailData.images || []).length > 0 ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            {(detailData.images || []).map((img, idx) => (
                                                <div key={idx} className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-slate-800 shadow-sm">
                                                    <img
                                                        src={resolveImageUrl(img)}
                                                        alt={`Gói chụp ${idx + 1}`}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/10 text-slate-400">
                                            <ImageIcon size={20} className="mb-1" />
                                            <span className="text-xs font-medium">{t.noImages}</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : null}
                    </div>
                    {/* ACTION FOOTER */}
                    <div className="border-t border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-2">

                        {/* Toggle Status Switch */}
                        <div className="flex items-center gap-2">

                            <span className="text-xs font-bold text-slate-500">
                                {detailData?.status === "ACTIVE" ? t.active : t.inactive}
                            </span>

                            <button
                                onClick={handleToggleStatus}
                                className={`relative w-11 h-6 flex items-center rounded-full transition-colors duration-300
        ${detailData?.status === "ACTIVE"
                                        ? "bg-emerald-500"
                                        : "bg-slate-400"
                                    }`}
                            >
                                <span
                                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300
            ${detailData?.status === "ACTIVE"
                                            ? "translate-x-5"
                                            : "translate-x-1"
                                        }`}
                                />
                            </button>

                        </div>

                        <div className="flex gap-2">



                            {/* Edit */}
                            <button onClick={() => handleEdit(detailData)}
                                className="px-3 py-2 rounded-lg text-xs font-bold bg-orange-500/10 text-orange-500">
                                {t.edit}
                            </button>
                            {/* Delete */}
                            <button
                                onClick={handleDelete}
                                className="px-3 py-2 rounded-lg text-xs font-bold bg-red-500/10 text-red-500"
                            >
                                {t.delete}
                            </button>

                        </div>
                    </div>
                </div>

            </div>

            {/* MODAL CREATE - ĐÃ ĐƯỢC FIX LỖI ẨN VÀ OVERLAY */}
            {openModal && createPortal(
                <div onClick={() => setOpenModal(false)} className="fixed inset-0 z-[100] w-screen h-screen bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#121212] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[85vh] my-auto">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 shrink-0">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                                {t.create}
                            </h2>
                            <button
                                onClick={() => setOpenModal(false)}
                                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body - Thêm flex-1 và overflow-y-auto để cuộn mượt nội dung bên trong */}
                        <div className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">

                            {/* Input Title */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    TITLE <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    required
                                    placeholder={t.placeholderTitle}
                                    className="w-full px-4 py-2.5 bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium placeholder-slate-400 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                                    onChange={(e) => setTitle(e.target.value)}
                                    value={title}
                                />
                            </div>

                            {/* Price & Duration */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        {t.labelPrice} <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-3 text-sm text-slate-400 font-semibold">đ</span>
                                        <input
                                            type="number"
                                            required
                                            placeholder="500"
                                            className="w-full pl-8 pr-4 py-2.5 bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium placeholder-slate-400 text-sm focus:outline-none focus:border-orange-500 transition-all"
                                            onChange={(e) => setPrice(e.target.value)}
                                            value={price}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        {t.labelDuration} <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Clock size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                                        <input
                                            type="number"
                                            required
                                            placeholder="4"
                                            className="w-full pl-9 pr-4 py-2.5 bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium placeholder-slate-400 text-sm focus:outline-none focus:border-orange-500 transition-all"
                                            onChange={(e) => setDuration(e.target.value)}
                                            value={duration}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SEARCHABLE DROPDOWN CATEGORIES */}
                            <div className="space-y-1.5 relative cate-dropdown-container">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    {t.labelCategories}
                                </label>

                                <div
                                    className="w-full min-h-[42px] px-3 py-1.5 bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center gap-1.5 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition-all cursor-text"
                                    onClick={() => {
                                        document.getElementById("search-cate-input")?.focus();
                                        setShowCateDropdown(true);
                                        setShowStyleDropdown(false);
                                    }}
                                >
                                    {availableCategories.filter(c => selectedCategories.includes(c._id)).map(cate => (
                                        <span key={cate._id} className="flex items-center gap-1 bg-orange-500 text-white text-xs font-semibold pl-2 pr-1 py-0.5 rounded-md shadow-sm">
                                            {cate.name}
                                            <button type="button" onClick={(e) => { e.stopPropagation(); toggleCategory(cate._id); }} className="hover:bg-orange-600 rounded p-0.5">
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}

                                    <input
                                        id="search-cate-input"
                                        type="text"
                                        value={cateSearch}
                                        placeholder={selectedCategories.length === 0 ? "Tìm và chọn danh mục..." : ""}
                                        className="flex-1 bg-transparent border-none outline-none text-sm font-medium min-w-[120px] placeholder-slate-400 text-slate-800 dark:text-slate-200"
                                        onClick={(e) => e.stopPropagation()}
                                        onFocus={() => {
                                            setShowCateDropdown(true);
                                            setShowStyleDropdown(false);
                                        }}
                                        onChange={(e) => setCateSearch(e.target.value)}
                                    />
                                </div>

                                {showCateDropdown && (
                                    <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 p-1.5 space-y-0.5">
                                        {filteredCategories.map((cate) => {
                                            const isSelected = selectedCategories.includes(cate._id);
                                            return (
                                                <div
                                                    key={cate._id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleCategory(cate._id);
                                                    }}
                                                    className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${isSelected
                                                        ? "bg-orange-50 dark:bg-orange-950/40 text-orange-500"
                                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                                                        }`}
                                                >
                                                    <span>{cate.name}</span>
                                                    {isSelected && <Check size={12} className="text-orange-500" />}
                                                </div>
                                            );
                                        })}
                                        {filteredCategories.length === 0 && (
                                            <div className="text-xs text-slate-400 italic p-3 text-center">Không tìm thấy danh mục nào thích hợp</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* SEARCHABLE DROPDOWN STYLES */}
                            <div className="space-y-1.5 relative style-dropdown-container">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    {t.labelStyles}
                                </label>

                                <div
                                    className="w-full min-h-[42px] px-3 py-1.5 bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center gap-1.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all cursor-text"
                                    onClick={() => {
                                        document.getElementById("search-style-input")?.focus();
                                        setShowStyleDropdown(true);
                                        setShowCateDropdown(false);
                                    }}
                                >
                                    {availableStyles.filter(s => selectedStyles.includes(s._id)).map(style => (
                                        <span key={style._id} className="flex items-center gap-1 bg-emerald-500 text-white text-xs font-semibold pl-2 pr-1 py-0.5 rounded-md shadow-sm">
                                            {style.name}
                                            <button type="button" onClick={(e) => { e.stopPropagation(); toggleStyle(style._id); }} className="hover:bg-emerald-600 rounded p-0.5">
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}

                                    <input
                                        id="search-style-input"
                                        type="text"
                                        value={styleSearch}
                                        placeholder={selectedStyles.length === 0 ? "Tìm và chọn phong cách..." : ""}
                                        className="flex-1 bg-transparent border-none outline-none text-sm font-medium min-w-[120px] placeholder-slate-400 text-slate-800 dark:text-slate-200"
                                        onClick={(e) => e.stopPropagation()}
                                        onFocus={() => {
                                            setShowStyleDropdown(true);
                                            setShowCateDropdown(false);
                                        }}
                                        onChange={(e) => setStyleSearch(e.target.value)}
                                    />
                                </div>

                                {showStyleDropdown && (
                                    <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 p-1.5 space-y-0.5">
                                        {filteredStyles.map((style) => {
                                            const isSelected = selectedStyles.includes(style._id);
                                            return (
                                                <div
                                                    key={style._id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleStyle(style._id);
                                                    }}
                                                    className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${isSelected
                                                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500"
                                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                                                        }`}
                                                >
                                                    <span>{style.name}</span>
                                                    {isSelected && <Check size={12} className="text-emerald-500" />}
                                                </div>
                                            );
                                        })}
                                        {filteredStyles.length === 0 && (
                                            <div className="text-xs text-slate-400 italic p-3 text-center">Không tìm thấy phong cách nào thích hợp</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    DESCRIPTION
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder={t.placeholderDesc}
                                    className="w-full px-4 py-2.5 bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium placeholder-slate-400 text-sm focus:outline-none focus:border-orange-500 transition-all resize-none"
                                    onChange={(e) => setDescription(e.target.value)}
                                    value={description}
                                />
                            </div>

                            {/* File Upload Box với tính năng Preview & Xóa từng ảnh */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    {t.labelFiles}
                                </label>

                                {/* Ô click/kéo thả để chọn file */}
                                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors relative cursor-pointer">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleSelectImages}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <ImageIcon className="mx-auto text-slate-400 mb-2" size={24} />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        Nhấp để chọn hoặc kéo thả hình ảnh vào đây
                                    </p>
                                    {files.length > 0 && (
                                        <p className="text-xs text-orange-500 dark:text-orange-400 font-bold mt-1.5">
                                            Đã chọn {files.length} ảnh
                                        </p>
                                    )}
                                </div>

                                {(files.length > 0 || existingImages.length > 0) && (
                                    <div className="grid grid-cols-4 gap-3 mt-3">

                                        {/* Ảnh cũ */}
                                        {existingImages.map((img, index) => (
                                            <div key={`old-${index}`} className="relative">
                                                <img
                                                    src={resolveImageUrl(img)}
                                                    alt={`existing preview ${index}`}
                                                    className="w-full h-24 rounded-lg object-cover"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setExistingImages(prev =>
                                                            prev.filter((_, i) => i !== index)
                                                        )
                                                    }
                                                    className="
                        absolute top-1 right-1
                        w-5 h-5
                        flex items-center justify-center
                        rounded-full
                        bg-red-500 text-white
                        shadow-md
                        hover:bg-red-600
                        transition
                    "
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Ảnh mới */}
                                        {files.map((file, index) => {
                                            const previewUrl = URL.createObjectURL(file);

                                            return (
                                                <div key={`new-${index}`} className="relative">
                                                    <img
                                                        src={previewUrl}
                                                        alt={`new upload preview ${index}`}
                                                        className="w-full h-24 rounded-lg object-cover"
                                                        onLoad={() => URL.revokeObjectURL(previewUrl)}
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setFiles(prev =>
                                                                prev.filter((_, i) => i !== index)
                                                            )
                                                        }
                                                        className="
                            absolute top-1 right-1
                            w-5 h-5
                            flex items-center justify-center
                            rounded-full
                            bg-red-500 text-white
                            shadow-md
                            hover:bg-red-600
                            transition
                        "
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Modal Footer - Tách biệt hẳn ra ngoài Body, luôn cố định dưới đáy */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setOpenModal(false)}
                                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                {t.cancel}
                            </button>
                            <button
                                type="button"
                                disabled={uploading}
                                onClick={handleSubmit}
                                className="px-5 py-2 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md transition disabled:opacity-50"
                            >
                                {uploading
                                    ? t.uploading
                                    : isEditing
                                        ? t.save
                                        : t.submit
                                }
                            </button>
                        </div>

                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
