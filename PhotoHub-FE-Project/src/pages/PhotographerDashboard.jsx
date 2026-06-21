import React, { useEffect, useState, useRef } from "react";
import {
    Camera,
    User,
    MapPin,
    Calendar,
    Shield,
    Lock,
    Save,
    Briefcase,
    Layers,
    DollarSign,
    Users,
    Star,
    CheckCircle,
    Info,
    Globe,
    Grid,
    TrendingUp,
    Phone,
    Home,
    MessageSquare,
    Wallet,
    UploadCloud,
    CreditCard
} from "lucide-react";
import Swal from "sweetalert2";
import { photographerService } from "../services/photographerService";
// Import profileService để xử lý upload avatar
import { profileService } from "../services/profileService";

// Import photographer marketplace sub-components
import PhotographerBookingCalendar from "../components/photographers/PhotographerBookingCalendar";
import PhotographerJobPosts from "../components/photographers/PhotographerJobPosts";
import PhotographerRecommendedJobs from "../components/photographers/PhotographerRecommendedJobs";
import PhotographerChat from "../components/photographers/PhotographerChat";
import PhotographerRevenueDashboard from "../components/photographers/PhotographerRevenueDashboard";
import WithdrawMoney from "../components/photographers/WithdrawMoney";
import PhotographerPortfolioManager from "../components/photographers/PhotographerPortfolioManager";
import PhotographerPackages from "../components/photographers/PhotographerPackages";
import PhotographerBookingList from "../booking/PhotographerBookingList";

export default function PhotographerDashboard({
    language = "vi",
    theme = "dark",
    onToggleLanguage,
    onToggleTheme
}) {
    const isDark = theme === "dark";
    const [activeTab, setActiveTab] = useState("profile");
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
    }, [activeTab]);
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [uploadingIdCard, setUploadingIdCard] = useState(false);

    const frontIdRef = useRef(null);
    const backIdRef = useRef(null);

    const [frontFile, setFrontFile] = useState(null);
    const [backFile, setBackFile] = useState(null);
    const [frontPreview, setFrontPreview] = useState(null);
    const [backPreview, setBackPreview] = useState(null);
    const [zoomImage, setZoomImage] = useState(null);


    // Dùng ref để kích hoạt click vào input file ẩn
    const fileInputRef = useRef(null);

    const [photographerData, setPhotographerData] = useState({
        _id: "",
        UUID: "",
        user: {
            _id: "",
            email: "",
            avatar: "",
            phone: "",    // Bổ sung trường Phone cá nhân
            address: ""   // Bổ sung trường Địa chỉ cá nhân
        },
        displayName: "",
        location: "",
        experienceYears: 0,
        equipment: "",
        bio: "",
        styles: [],
        socialLinks: {
            instagram: "",
            facebook: ""
        },
        averageRating: 0,
        completedBookings: 0,
        totalReviews: 0,
        totalEarnings: 0,
        hourlyRate: 0,
        verificationStatus: "UNVERIFIED",
        isFeatured: false,
        isAvailable: true,
    });

    // --- DICTIONARY ---
    const text = {
        vi: {
            dashboard: "Bảng điều khiển",
            profile: "Hồ sơ Nhiếp ảnh",
            calendar: "Lịch làm việc",
            customers: "Khách hàng của tôi",
            stats: "Thống kê tổng quan",
            save: "Cập nhật thay đổi",
            notUpdated: "Chưa thiết lập",
            loading: "Hệ thống đang lưu...",
            fetching: "Đang tải dữ liệu hồ sơ...",
            phoneLabel: "Số điện thoại cá nhân",
            addressLabel: "Địa chỉ liên hệ",
            infoSystem: "Thông tin mã hóa hệ thống (Chỉ đọc)",
            infoService: "Cấu hình dịch vụ & Studio",
            infoPersonal: "Thông tin liên hệ cá nhân",
            stylesLabel: "Phong cách chuyên biệt (Cách nhau bằng dấu phẩy)",
            socialLabel: "Mạng xã hội tích hợp",
            successTitle: "Thành công",
            errorTitle: "Thất bại",
            successUpdate: "Hồ sơ của bạn đã được cập nhật thành công!",
            successCreate: "Chào mừng! Hồ sơ nhiếp ảnh gia đã được khởi tạo!",
            errorFetch: "Không thể kết nối hoặc tải thông tin hồ sơ.",
            rating: "Đánh giá",
            bookings: "Lượt chụp",
            reviews: "Phản hồi",
            earnings: "Doanh thu",
            photographerId: "Định danh Nhiếp ảnh",
            uuid: "Chuỗi UUID",
            userIdRef: "Liên kết tài khoản gốc",
            displayName: "Nghệ danh / Tên hiển thị",
            location: "Khu vực / Thành phố hoạt động",
            experienceYears: "Số năm kinh nghiệm thực chiến",
            hourlyRate: "Mức chi phí theo giờ ($/h)",
            equipment: "Hệ thống thiết bị sử dụng chính",
            equipmentPlaceholder: "Ví dụ: Sony A7IV, Lens 24-70mm f2.8 GM II",
            stylesPlaceholder: "Wedding, Portrait, Streetlife, Concept, Dark Fantasy...",
            bio: "Tiểu sử & Giới thiệu bản thân (Bio)",
            bioPlaceholder: "Hãy viết điều gì đó ấn tượng để thu hút khách hàng đặt lịch...",
            availableToggle: "Sẵn sàng nhận lịch chụp (Kích hoạt trên ứng dụng)",
            verificationLabel: "Trạng thái kiểm duyệt:",
            unverified: "Chưa xác minh",
            verified: "Đã xác minh",
            rejected: "Bị từ chối",
            calendarComingSoon: "Tính năng quản lý lịch chụp đang được đồng bộ hóa thời gian thực...",
            customersComingSoon: "Danh sách khách hàng đã đặt lịch và lịch sử giao dịch sẽ xuất hiện tại đây.",
            avatarSuccess: "Cập nhật ảnh đại diện thành công!",
            avatarError: "Không thể upload ảnh đại diện mới.",
            jobs: "Chợ việc làm",
            recommendations: "Gợi ý việc làm AI",
            chat: "Trò chuyện",
            revenue: "Doanh thu",
            withdraw: "Rút tiền payout",
            idVerificationTitle: "Xác minh danh tính (CCCD)",
            frontIdLabel: "Mặt trước CCCD",
            backIdLabel: "Mặt sau CCCD",
            uploadVeriBtn: "Gửi yêu cầu xác minh",
            uploadingVeri: "Đang tải hồ sơ xác minh...",
            veriSuccess: "Hồ sơ xác minh đã được gửi, vui lòng chờ hệ thống kiểm duyệt!",
            veriError: "Không thể upload hồ sơ xác minh.",
            portfolio: "Quản lý Portfolio"
        },
        en: {
            dashboard: "Dashboard",
            profile: "Creator Profile",
            calendar: "Shooting Schedule",
            customers: "My Customers",
            stats: "Overview Analytics",
            save: "Save Changes",
            notUpdated: "Not configured",
            loading: "Synchronizing...",
            fetching: "Fetching profile data...",
            phoneLabel: "Personal Phone Number",
            addressLabel: "Contact Address",
            infoSystem: "Encrypted System Metadata (Read-only)",
            infoService: "Service & Studio Configurations",
            infoPersonal: "Personal Identity Details",
            stylesLabel: "Specialized Styles (Separated by commas)",
            socialLabel: "Integrated Social Links",
            successTitle: "Success",
            errorTitle: "Error",
            successUpdate: "Your photographer profile has been updated!",
            successCreate: "Welcome! Your creator profile has been initialized!",
            errorFetch: "Failed to establish connection or fetch profile data.",
            rating: "Rating",
            bookings: "Bookings",
            reviews: "Reviews",
            earnings: "Earnings",
            photographerId: "Photographer ID",
            uuid: "UUID Token",
            userIdRef: "Origin User Ref",
            displayName: "Creative Stage Name",
            location: "Active Location / City",
            experienceYears: "Years of Active Experience",
            hourlyRate: "Hourly Rate Base ($/h)",
            equipment: "Primary Gear & Equipment Set",
            equipmentPlaceholder: "e.g., Sony A7IV, Lens 24-70mm f2.8 GM II",
            stylesPlaceholder: "Wedding, Portrait, Streetlife, Concept, Dark Fantasy...",
            bio: "Creative Biography & Personal Info (Bio)",
            bioPlaceholder: "Tell your unique story to attract potential clients...",
            availableToggle: "Open for bookings (Activate live on marketplace)",
            verificationLabel: "Identity Verification:",
            unverified: "Unverified",
            verified: "Verified",
            rejected: "Rejected",
            calendarComingSoon: "Schedule management features are being synchronized in real-time...",
            customersComingSoon: "Your client lists and booking historical logs will appear here.",
            avatarSuccess: "Avatar updated successfully!",
            avatarError: "Failed to upload new avatar.",
            jobs: "Job Marketplace",
            recommendations: "AI Recommendations",
            chat: "Live Chat",
            revenue: "Revenue",
            withdraw: "Withdraw Money",
            idVerificationTitle: "Identity Verification (ID Card)",
            frontIdLabel: "Front of ID Card",
            backIdLabel: "Back of ID Card",
            uploadVeriBtn: "Submit Verification Request",
            uploadingVeri: "Uploading verification profiles...",
            veriSuccess: "Verification profiles submitted successfully! Please wait for approval.",
            veriError: "Failed to upload verification profiles.",
            portfolio: "Portfolio Management"
        }
    };

    const t = text[language];


    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await photographerService.getMyPhotographerProfile();
                const data = res?.data || res;
                console.log("Fetched photographer profile data:", data);

                if (data && data._id) {
                    setPhotographerData({
                        ...data,
                        user: data.user || {},
                        styles: data.styles || [],
                        socialLinks: data.socialLinks || {
                            instagram: "",
                            facebook: ""
                        }
                    });

                    const BACKEND_URL = "http://localhost:3000";

                    if (data.verification?.documentFrontUrl) {
                        setFrontPreview(
                            BACKEND_URL + data.verification.documentFrontUrl
                        );
                    }

                    if (data.verification?.documentBackUrl) {
                        setBackPreview(
                            BACKEND_URL + data.verification.documentBackUrl
                        );
                    }

                    setIsEditMode(true);
                } else {
                    setIsEditMode(false);
                }
            } catch (error) {
                console.error("Error fetching photographer profile:", error);
                Swal.fire({
                    icon: "error",
                    title: t.errorTitle,
                    text: t.errorFetch,
                    background: isDark ? "#09090b" : "#fff",
                    color: isDark ? "#fff" : "#000",
                    confirmButtonColor: "#06b6d4",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [language]);

    // --- HÀM XỬ LÝ UPLOAD AVATAR ---
    const handleAvatarClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Hàm render URL chuẩn hóa từ Backend
    const getAvatarUrl = () => {
        const rawAvatar = typeof photographerData.user === "object" ? photographerData.user?.avatar : null;

        if (!rawAvatar) return null;

        // Nếu là link tuyệt đối (đã có http:// hoặc https://) thì giữ nguyên
        if (rawAvatar.startsWith("http://") || rawAvatar.startsWith("https://")) {
            return rawAvatar;
        }

        // Nếu là đường dẫn tương đối từ server, nối thêm BACKEND_URL
        // Đảm bảo xử lý chuẩn dấu gạch chéo đầu chuỗi
        const BACKEND_URL = "http://localhost:3000"; // <--- Đổi thành URL backend thực tế của bạn
        const cleanPath = rawAvatar.startsWith("/") ? rawAvatar : `/${rawAvatar}`;

        return `${BACKEND_URL}${cleanPath}`;
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingAvatar(true);
        try {
            const res = await profileService.uploadAvatar(file);
            const responseData = res?.data || res;

            // Tùy theo cấu trúc API trả về, lấy trường avatar URL mới (ví dụ: responseData.avatar hoặc responseData.user.avatar)
            const newAvatarUrl = responseData?.avatar || responseData?.user?.avatar || responseData?.url;

            if (newAvatarUrl) {
                setPhotographerData(prev => ({
                    ...prev,
                    user: typeof prev.user === "object" && prev.user !== null
                        ? { ...prev.user, avatar: newAvatarUrl }
                        : { avatar: newAvatarUrl }
                }));

                Swal.fire({
                    icon: "success",
                    title: t.successTitle,
                    text: t.avatarSuccess,
                    background: isDark ? "#09090b" : "#fff",
                    color: isDark ? "#fff" : "#000",
                    confirmButtonColor: "#06b6d4",
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error("Error uploading avatar:", error);
            Swal.fire({
                icon: "error",
                title: t.errorTitle,
                text: t.avatarError,
                background: isDark ? "#09090b" : "#fff",
                color: isDark ? "#fff" : "#000",
                confirmButtonColor: "#ef4444",
            });
        } finally {
            setUploadingAvatar(false);
        }
    };

    // --- HÀM XỬ LÝ CHỌN FILE CCCD & PREVIEW ---
    const handleFrontIdChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFrontFile(file);
            setFrontPreview(URL.createObjectURL(file));
        }
    };

    const handleBackIdChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBackFile(file);
            setBackPreview(URL.createObjectURL(file));
        }
    };

    // --- HÀM SUBMIT UPLOAD CCCD LÊN SERVER ---
    const handleUploadVerification = async () => {
        if (!frontFile) {
            Swal.fire({
                icon: "warning",
                title: t.errorTitle,
                text: "Vui lòng chọn mặt trước CCCD.",
                background: isDark ? "#09090b" : "#fff",
                color: isDark ? "#fff" : "#000",
                confirmButtonColor: "#ef4444",
            });
            return;
        }

        setUploadingIdCard(true);
        try {
            await photographerService.uploadVerification(frontFile, backFile);

            Swal.fire({
                icon: "success",
                title: t.successTitle,
                text: t.veriSuccess,
                background: isDark ? "#09090b" : "#fff",
                color: isDark ? "#fff" : "#000",
                confirmButtonColor: "#06b6d4",
            });

            // Sau khi upload thành công, có thể chuyển trạng thái tạm thời chờ duyệt 
            setPhotographerData(prev => ({ ...prev, verificationStatus: "PENDING" }));
        } catch (error) {
            console.error("Error uploading verification identity:", error);
            Swal.fire({
                icon: "error",
                title: t.errorTitle,
                text: error?.response?.data?.message || t.veriError,
                background: isDark ? "#09090b" : "#fff",
                color: isDark ? "#fff" : "#000",
                confirmButtonColor: "#ef4444",
            });
        } finally {
            setUploadingIdCard(false);
        }
    };
    // --- UI HELPER CLASSES ---
    const labelClass = `text-xs font-semibold tracking-wider uppercase mb-1.5 block transition-colors ${isDark ? "text-slate-500" : "text-slate-500"}`;

    const inputClass = `w-full rounded-xl pl-10 pr-4 py-3 outline-none border font-medium transition-all duration-300 ${isDark
        ? "bg-[#09090b] border-white/5 text-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:bg-[#030303]"
        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 focus:bg-white shadow-sm"
        }`;

    const disabledInputClass = `w-full rounded-xl pl-10 pr-4 py-3 outline-none border font-mono text-xs transition-all ${isDark
        ? "bg-white/[0.02] border-white/5 text-slate-500 cursor-not-allowed opacity-60"
        : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
        }`;

    const iconClass = `absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isDark ? "text-slate-600 group-focus-within:text-orange-500" : "text-slate-400 group-focus-within:text-orange-500"}`;

    const cardClass = `border rounded-2xl p-5 backdrop-blur-md transition-all duration-300 ${isDark
        ? "bg-[#121214]/80 border-white/[0.06] hover:border-white/[0.1] shadow-xl shadow-black/40"
        : "bg-white border-slate-100 shadow-sm shadow-slate-100/50"
        }`;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPhotographerData({
            ...photographerData,
            [name]: type === "checkbox" ? checked : value
        });
    };

    const handleNestedChange = (parent, field, value) => {
        setPhotographerData({
            ...photographerData,
            [parent]: { ...photographerData[parent], [field]: value }
        });
    };

    const handleStylesChange = (e) => {
        setPhotographerData({
            ...photographerData,
            styles: e.target.value.split(",").map(s => s.trim())
        });
    };

    // --- MAIN API SAVE ACTION ---
    const handleSaveProfile = async () => {
        // ==========================================
        // KHU VỰC VALIDATION - KIỂM TRA DỮ LIỆU ĐẦU VÀO
        // ==========================================

        // 1. Kiểm tra các trường thông tin cá nhân của User
        const phoneNumber = photographerData.user?.phoneNumber?.trim() || "";
        const address = photographerData.user?.address?.trim() || "";

        // 2. Kiểm tra các trường thông tin của Photographer Studio
        const displayName = photographerData.displayName?.trim() || "";
        const location = photographerData.location?.trim() || "";
        const equipment = photographerData.equipment?.trim() || "";
        const bio = photographerData.bio?.trim() || "";
        const hourlyRate = photographerData.hourlyRate;
        const experienceYears = photographerData.experienceYears;
        const styles = photographerData.styles || [];

        // Định nghĩa hàm hiện thông báo lỗi nhanh
        const showValidationError = (message) => {
            Swal.fire({
                icon: "warning",
                title: t.errorTitle,
                text: message,
                background: isDark ? "#09090b" : "#fff",
                color: isDark ? "#fff" : "#000",
                confirmButtonColor: "#ef4444",
            });
        };

        // --- CHECK TRỐNG: Tất cả các trường bắt buộc (Ngoại trừ socialLinks) ---
        if (!phoneNumber || !address || !displayName || !location || !equipment || !bio) {
            showValidationError("Vui lòng điền đầy đủ tất cả các thông tin text bắt buộc.");
            return; // Dừng hàm ngay lập tức
        }

        if (hourlyRate === undefined || hourlyRate === null || hourlyRate === "" || Number(hourlyRate) <= 0) {
            showValidationError("Vui lòng nhập mức chi phí theo giờ hợp lệ (lớn hơn 0).");
            return;
        }

        if (experienceYears === undefined || experienceYears === null || experienceYears === "" || Number(experienceYears) < 0) {
            showValidationError("Vui lòng nhập số năm kinh nghiệm hợp lệ.");
            return;
        }

        if (styles.length === 0 || styles.every(s => s === "")) {
            showValidationError("Vui lòng nhập ít nhất một phong cách chụp chuyên biệt.");
            return;
        }

        // --- CHECK ĐỊNH DẠNG: Số điện thoại phải đúng 10 số đầu số Việt Nam ---
        // Regex này kiểm tra: Bắt đầu bằng số 0, theo sau là 9 chữ số (Tổng cộng 10 số)
        const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
        if (!phoneRegex.test(phoneNumber)) {
            showValidationError("Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số (Ví dụ: 0912345678).");
            return; // Dừng hàm ngay lập tức
        }

        // ==========================================
        // KHU VỰC GỌI API (Chỉ chạy khi đã PASS hết các validate trên)
        // ==========================================
        setLoading(true);
        try {
            // 1. Chạy API cập nhật thông tin cá nhân của User (Phone, Address)
            const userUpdatePayload = {
                phoneNumber: phoneNumber,
                address: address
            };

            const userRes = await profileService.updateProfile(userUpdatePayload);

            if (userRes?.status === 400 || userRes?.error || userRes?.success === false) {
                throw new Error(userRes?.message || "Số điện thoại đã tồn tại hoặc dữ liệu không hợp lệ.");
            }

            const freshUserData = userRes?.data || userRes;

            // 2. Chạy API cập nhật/tạo mới thông tin Photographer Studio
            let photoRes;
            if (isEditMode) {
                photoRes = await photographerService.updatePhotographerProfile(photographerData._id, photographerData);
            } else {
                photoRes = await photographerService.createPhotographerProfile(photographerData);
            }

            if (photoRes?.status === 400 || photoRes?.error || photoRes?.success === false) {
                throw new Error(photoRes?.message || "Không thể cập nhật hồ sơ Studio.");
            }

            const freshPhotoData = photoRes?.data || photoRes;

            // 3. Hợp nhất kết quả trả về của cả 2 API vào State chính
            if (freshPhotoData) {
                setPhotographerData({
                    ...freshPhotoData,
                    user: {
                        ...(freshPhotoData.user || {}),
                        phoneNumber: freshUserData?.phoneNumber || freshPhotoData.user?.phoneNumber,
                        address: freshUserData?.address || freshPhotoData.user?.address
                    },
                    styles: freshPhotoData.styles || [],
                    socialLinks: freshPhotoData.socialLinks || { instagram: "", facebook: "" }
                });
                setIsEditMode(true);
            }

            Swal.fire({
                icon: "success",
                title: t.successTitle,
                text: t.successUpdate,
                background: isDark ? "#09090b" : "#fff",
                color: isDark ? "#fff" : "#000",
                confirmButtonColor: "#06b6d4",
            });

        } catch (error) {
            console.error("Critical error during profile synchronization:", error);
            const serverErrorMessage = error?.response?.data?.message || error?.message || "Process failed!";

            Swal.fire({
                icon: "error",
                title: t.errorTitle,
                text: serverErrorMessage,
                background: isDark ? "#09090b" : "#fff",
                color: isDark ? "#fff" : "#000",
                confirmButtonColor: "#ef4444",
            });
        } finally {
            setLoading(false);
        }
    };

    // Lấy link avatar an toàn từ Object user lồng nhau
    const avatarUrl = getAvatarUrl();

    const canEditVerification =
        photographerData.verificationStatus !== "VERIFIED";
    return (
        <div className={`min-h-screen pt-28 pb-16 transition-colors duration-500 ${isDark ? "bg-[#030303] text-white" : "bg-slate-50 text-slate-900"}`}>
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-4 gap-8">

                {/* 1. LEFT SIDEBAR - GLOW CARD */}
                <div className="lg:col-span-1">
                    <div className={`${cardClass} sticky top-28 overflow-hidden group`}>
                        <div className="absolute -top-12 -left-12 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-500"></div>

                        <div className="flex flex-col items-center relative z-10 mb-8 pb-6 border-b border-slate-200 dark:border-white/[0.06]">

                            {/* INPUT FILE ẨN PHỤC VỤ UPLOAD AVATAR */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />

                            {/* AVATAR WRAPPER WITH HOVER OVERLAY EFFECT */}
                            <div
                                onClick={handleAvatarClick}
                                className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-500 p-[2px] mb-4 shadow-xl shadow-orange-500/10 relative overflow-hidden cursor-pointer group/avatar"
                            >
                                <div className="w-full h-full rounded-[22px] bg-[#09090b] flex items-center justify-center text-orange-500 overflow-hidden relative">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt={photographerData.displayName}
                                            className="w-full h-full object-cover transition duration-300 group-hover/avatar:scale-110"
                                        />
                                    ) : (
                                        <User size={38} className={uploadingAvatar ? "animate-spin" : ""} />
                                    )}

                                    {/* Lớp phủ Hover hiệu ứng mờ mịn kiểu Cyberpunk / Netflix */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1">
                                        <Camera size={18} className="text-white animate-pulse" />
                                        <span className="text-[9px] text-white font-bold tracking-wider uppercase">Upload</span>
                                    </div>

                                    {/* Hiển thị Trạng thái Đang tải file lên */}
                                    {uploadingAvatar && (
                                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <h3 className="font-bold text-xl tracking-tight text-center">{photographerData.displayName || "Creator Artist"}</h3>
                            <span
                                className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${photographerData.verificationStatus === "VERIFIED"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : photographerData.verificationStatus === "REJECTED"
                                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    }`}
                            >
                                {
                                    photographerData.verificationStatus === "VERIFIED"
                                        ? t.verified
                                        : photographerData.verificationStatus === "REJECTED"
                                            ? t.rejected
                                            : t.unverified
                                }
                            </span>
                        </div>

                        <nav className="space-y-1.5 relative z-10">
                            {[
                                { id: "profile", label: t.profile, icon: User },
                                { id: "portfolio", label: "Portfolio", icon: Layers },
                                { id: "packages", label: "Packages", icon: CreditCard },
                                { id: "bookings", label: language === "vi" ? "Yêu cầu đặt lịch" : "Booking Requests", icon: CheckCircle },
                                { id: "calendar", label: t.calendar, icon: Calendar },
                                { id: "jobs", label: t.jobs, icon: Briefcase },
                                { id: "recommendations", label: t.recommendations, icon: TrendingUp },
                                { id: "chat", label: t.chat, icon: MessageSquare },
                                { id: "revenue", label: t.revenue, icon: DollarSign },
                                { id: "withdraw", label: t.withdraw, icon: Wallet },
                            ].map((tab) => {
                                const IconComponent = tab.icon;
                                const isSelected = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${isSelected
                                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/10 transform translate-x-1"
                                            : isDark
                                                ? "hover:bg-white/[0.04] text-slate-400 hover:text-white"
                                                : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        <IconComponent size={18} className={isSelected ? "stroke-[2.5px]" : "opacity-70"} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* 2. RIGHT CONTENT AREA */}
                <div className="lg:col-span-3 space-y-8">

                    {/* STATS GRID */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: t.rating, val: `${photographerData.averageRating}/5`, icon: Star, color: "from-amber-500 to-orange-500 shadow-amber-500/5" },
                            { label: t.bookings, val: photographerData.completedBookings, icon: CheckCircle, color: "from-green-500 to-emerald-500 shadow-emerald-500/5" },
                            { label: t.reviews, val: photographerData.totalReviews, icon: Briefcase, color: "from-purple-500 to-indigo-500 shadow-purple-500/5" },
                            { label: t.earnings, val: `$${photographerData.totalEarnings}`, icon: DollarSign, color: "from-orange-500 to-amber-500 shadow-orange-500/5" }
                        ].map((stat, i) => (
                            <div key={i} className={`${cardClass} !p-4 flex items-center gap-3.5 relative overflow-hidden group hover:-translate-y-1 shadow-md ${stat.color}`}>
                                <div className="p-2.5 rounded-xl bg-slate-500/5 dark:bg-white/[0.03] text-orange-500 group-hover:scale-110 transition-transform duration-300">
                                    <stat.icon size={20} className="text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">{stat.label}</p>
                                    <p className="font-black text-xl tracking-tight mt-0.5">{stat.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* DYNAMIC TAB SWITCHER */}
                    {activeTab === "profile" && (
                        <div className="space-y-8 animate-fadeIn">

                            {/* BLOCK 1: SYSTEM SECURE INFO */}
                            <div className={cardClass}>
                                <div className="flex items-center gap-2.5 mb-6 text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-white/[0.06] pb-3">
                                    <Lock size={16} className="text-purple-500" />
                                    <h3 className="text-xs font-bold uppercase tracking-widest">{t.infoSystem}</h3>
                                </div>
                                <div className="grid md:grid-cols-3 gap-5">
                                    {[
                                        { label: t.photographerId, val: photographerData._id, icon: Info },
                                        { label: t.uuid, val: photographerData.UUID, icon: Shield },
                                        { label: t.userIdRef, val: photographerData.user?._id || photographerData.user, icon: User }
                                    ].map((sys, idx) => (
                                        <div key={idx} className="group">
                                            <label className={labelClass}>{sys.label}</label>
                                            <div className="relative mt-1.5">
                                                <sys.icon className={iconClass} size={16} />
                                                <input type="text" value={sys.val || t.notUpdated} disabled className={disabledInputClass} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* NEW BLOCK: PERSONAL IDENTITY AND SECURITY FIELDS (Chỉnh sửa Phone & Address của User, Email chỉ đọc) */}
                            <div className={cardClass}>
                                <div className="flex items-center gap-2.5 mb-6 text-orange-500 border-b border-slate-200 dark:border-white/[0.06] pb-3">
                                    <User size={18} className="text-orange-500" />
                                    <h3 className="text-sm font-bold tracking-tight text-slate-800 dark:text-zinc-200">{t.infoPersonal}</h3>
                                </div>

                                {/* Đổi grid từ md:grid-cols-2 sang md:grid-cols-3 để chứa thêm cột Email */}
                                <div className="grid md:grid-cols-3 gap-6">

                                    {/* Email Field (Chỉ đọc - Khóa không cho sửa) */}
                                    <div>
                                        <label className={labelClass}>Địa chỉ Email</label>
                                        <div className="relative mt-1.5 opacity-80">
                                            <Globe className={iconClass} size={18} />
                                            <input
                                                type="email"
                                                value={photographerData.user?.email || ""}
                                                disabled
                                                className={disabledInputClass}
                                                placeholder="example@gmail.com"
                                            />
                                        </div>
                                    </div>

                                    {/* Phone Field */}
                                    <div>
                                        <label className={labelClass}>{t.phoneLabel}</label>
                                        <div className="relative mt-1.5 group">
                                            <Phone className={iconClass} size={18} />
                                            <input
                                                type="text"
                                                value={photographerData.user?.phoneNumber || ""}
                                                onChange={(e) => handleNestedChange("user", "phoneNumber", e.target.value)}
                                                className={inputClass}
                                                placeholder={t.phonePlaceholder}
                                            />
                                        </div>
                                    </div>

                                    {/* Address Field */}
                                    <div>
                                        <label className={labelClass}>{t.addressLabel}</label>
                                        <div className="relative mt-1.5 group">
                                            <Home className={iconClass} size={18} />
                                            <input
                                                type="text"
                                                value={photographerData.user?.address || ""}
                                                onChange={(e) => handleNestedChange("user", "address", e.target.value)}
                                                className={inputClass}
                                                placeholder={t.addressPlaceholder}
                                            />
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* CCCD VERIFICATION BLOCK */}
                            <div className={cardClass}>
                                <div className="flex items-center gap-2.5 mb-6 text-orange-500 border-b border-slate-200 dark:border-white/[0.06] pb-3">
                                    <CreditCard size={18} className="text-orange-500" />
                                    <h3 className="text-sm font-bold tracking-tight text-slate-800 dark:text-zinc-200">
                                        {t.idVerificationTitle}
                                    </h3>

                                    {photographerData.verificationStatus === "VERIFIED" && (
                                        <span className="ml-auto px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            VERIFIED
                                        </span>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">

                                    {/* FRONT CCCD */}
                                    <div>
                                        <label className={labelClass}>
                                            {t.frontIdLabel}
                                            {photographerData.verificationStatus !== "VERIFIED" && (
                                                <span className="text-rose-500"> *</span>
                                            )}
                                        </label>

                                        <input
                                            type="file"
                                            ref={frontIdRef}
                                            onChange={handleFrontIdChange}
                                            accept="image/*"
                                            className="hidden"
                                        />

                                        <div
                                            onClick={() => {
                                                if (canEditVerification) {
                                                    frontIdRef.current?.click();
                                                }
                                            }}
                                            className={`mt-1.5 border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center min-h-[140px] transition-all relative overflow-hidden ${canEditVerification
                                                ? "cursor-pointer"
                                                : "cursor-default"
                                                } ${isDark
                                                    ? "border-white/10 bg-[#09090b] hover:border-orange-500/50"
                                                    : "border-slate-300 bg-slate-50 hover:border-orange-500"
                                                }`}
                                        >
                                            {frontPreview ? (
                                                <img
                                                    src={frontPreview}
                                                    alt="Front ID Preview"
                                                    className="w-full h-full max-h-36 object-contain cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();

                                                        if (canEditVerification) {
                                                            frontIdRef.current?.click();
                                                        } else {
                                                            setZoomImage(frontPreview);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="text-center space-y-2">
                                                    <UploadCloud
                                                        size={32}
                                                        className="mx-auto text-slate-400"
                                                    />
                                                    <span className="text-xs text-slate-400 block">
                                                        Click để chọn ảnh mặt trước
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* BACK CCCD */}
                                    <div>
                                        <label className={labelClass}>
                                            {t.backIdLabel}
                                            {photographerData.verificationStatus !== "VERIFIED"}
                                            <span className="text-rose-500"> *</span>
                                        </label>

                                        <input
                                            type="file"
                                            ref={backIdRef}
                                            onChange={handleBackIdChange}
                                            accept="image/*"
                                            className="hidden"
                                        />

                                        <div
                                            onClick={() => {
                                                if (canEditVerification) {
                                                    backIdRef.current?.click();
                                                }
                                            }}
                                            className={`mt-1.5 border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center min-h-[140px] transition-all relative overflow-hidden ${canEditVerification
                                                ? "cursor-pointer"
                                                : "cursor-default"
                                                } ${isDark
                                                    ? "border-white/10 bg-[#09090b] hover:border-orange-500/50"
                                                    : "border-slate-300 bg-slate-50 hover:border-orange-500"
                                                }`}
                                        >
                                            {backPreview ? (
                                                <img
                                                    src={backPreview}
                                                    alt="Back ID Preview"
                                                    className="w-full h-full max-h-36 object-contain cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();

                                                        if (canEditVerification) {
                                                            backIdRef.current?.click();
                                                        } else {
                                                            setZoomImage(backPreview);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="text-center space-y-2">
                                                    <UploadCloud
                                                        size={32}
                                                        className="mx-auto text-slate-400"
                                                    />
                                                    <span className="text-xs text-slate-400 block">
                                                        Click để chọn ảnh mặt sau
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* NÚT GỬI XÁC MINH CHỈ HIỆN KHI CHƯA VERIFIED */}
                                {photographerData.verificationStatus !== "VERIFIED" && (
                                    <div className="flex justify-end mt-5">
                                        <button
                                            onClick={handleUploadVerification}
                                            disabled={
                                                uploadingIdCard ||
                                                !frontFile ||
                                                !backFile
                                            }
                                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white px-5 py-2 rounded-xl font-bold text-xs tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-orange-500/10"
                                        >
                                            <CreditCard
                                                size={16}
                                                className={
                                                    uploadingIdCard
                                                        ? "animate-spin"
                                                        : ""
                                                }
                                            />
                                            {uploadingIdCard
                                                ? t.uploadingVeri
                                                : t.uploadVeriBtn}
                                        </button>
                                    </div>
                                )}
                            </div>
                            {/* BLOCK 2: STUDIO MAIN SERVICE */}
                            <div className={`${cardClass} relative overflow-hidden`}>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/[0.02] rounded-full blur-3xl pointer-events-none"></div>

                                <div className="flex items-center gap-2.5 mb-6 border-b border-slate-200 dark:border-white/[0.06] pb-3">
                                    <Layers size={18} className="text-orange-500" />
                                    <h3 className="text-lg font-bold tracking-tight">{t.infoService}</h3>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="group">
                                        <label className={labelClass}>{t.displayName}</label>
                                        <div className="relative mt-1.5">
                                            <User className={iconClass} size={18} />
                                            <input type="text" name="displayName" value={photographerData.displayName || ""} onChange={handleChange} className={inputClass} />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className={labelClass}>{t.location}</label>
                                        <div className="relative mt-1.5">
                                            <MapPin className={iconClass} size={18} />
                                            <input type="text" name="location" value={photographerData.location || ""} onChange={handleChange} className={inputClass} />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className={labelClass}>{t.experienceYears}</label>
                                        <div className="relative mt-1.5">
                                            <Briefcase className={iconClass} size={18} />
                                            <input type="number" name="experienceYears" value={photographerData.experienceYears || 0} onChange={handleChange} className={inputClass} />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className={labelClass}>{t.hourlyRate}</label>
                                        <div className="relative mt-1.5">
                                            <DollarSign className={iconClass} size={18} />
                                            <input type="number" name="hourlyRate" value={photographerData.hourlyRate || 0} onChange={handleChange} className={inputClass} />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 group">
                                        <label className={labelClass}>{t.equipment}</label>
                                        <div className="relative mt-1.5">
                                            <Camera className={iconClass} size={18} />
                                            <input type="text" name="equipment" value={photographerData.equipment || ""} onChange={handleChange} className={inputClass} placeholder={t.equipmentPlaceholder} />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 group">
                                        <label className={labelClass}>{t.stylesLabel}</label>
                                        <div className="relative mt-1.5">
                                            <Grid className={iconClass} size={18} />
                                            <input type="text" value={photographerData.styles ? photographerData.styles.join(", ") : ""} onChange={handleStylesChange} className={inputClass} placeholder={t.stylesPlaceholder} />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className={labelClass}>{t.bio}</label>
                                        <textarea name="bio" value={photographerData.bio || ""} onChange={handleChange} rows={4} placeholder={t.bioPlaceholder} className={`w-full rounded-xl p-3.5 mt-1.5 outline-none border font-medium transition-all duration-300 ${isDark ? "bg-[#09090b] border-white/5 text-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:bg-[#030303]" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 focus:bg-white shadow-sm"
                                            }`} />
                                    </div>
                                </div>

                                {/* INTEGRATED SOCIAL MEDIA */}
                                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/[0.06]">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">{t.socialLabel}</h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="group">
                                            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500">Instagram URL</label>
                                            <div className="relative mt-1.5">
                                                <Globe className={iconClass} size={18} />
                                                <input type="text" value={photographerData.socialLinks?.instagram || ""} onChange={(e) => handleNestedChange("socialLinks", "instagram", e.target.value)} className={inputClass} placeholder="instagram.com/username" />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500">Facebook URL</label>
                                            <div className="relative mt-1.5">
                                                <Globe className={iconClass} size={18} />
                                                <input type="text" value={photographerData.socialLinks?.facebook || ""} onChange={(e) => handleNestedChange("socialLinks", "facebook", e.target.value)} className={inputClass} placeholder="facebook.com/username" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* TOGGLE ACCOUNT AVAILABILITY */}
                                <div className="mt-8 flex flex-wrap gap-6 items-center justify-between border-t border-slate-200 dark:border-white/[0.06] pt-6">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" name="isAvailable" checked={photographerData.isAvailable ?? true} onChange={handleChange} className="w-4 h-4 rounded accent-orange-500 cursor-pointer transition" />
                                        <span className={`text-sm font-semibold select-none ${isDark ? "text-slate-300 group-hover:text-white" : "text-slate-700 group-hover:text-black"}`}>
                                            {t.availableToggle}
                                        </span>
                                    </label>

                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3 bg-slate-500/5 dark:bg-white/[0.02] px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/[0.04]">

                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                {t.verificationLabel}
                                            </span>

                                            <span
                                                className={`text-xs font-black tracking-widest uppercase ${photographerData.verificationStatus === "VERIFIED"
                                                    ? "text-emerald-400"
                                                    : photographerData.verificationStatus === "REJECTED"
                                                        ? "text-red-400"
                                                        : photographerData.verificationStatus === "PENDING"
                                                            ? "text-yellow-400"
                                                            : "text-amber-400"
                                                    }`}
                                            >
                                                {photographerData.verificationStatus === "VERIFIED"
                                                    ? t.verified
                                                    : photographerData.verificationStatus === "REJECTED"
                                                        ? t.rejected
                                                        : photographerData.verificationStatus === "PENDING"
                                                            ? t.unverified
                                                            : t.unverified}
                                            </span>
                                        </div>

                                        {photographerData.verification?.status === "REJECTED" &&
                                            photographerData.verification?.adminNote && (
                                                <div className="max-w-md bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                                    <p className="text-xs font-bold text-red-400 uppercase mb-1">
                                                        {t.rejectionReason}
                                                    </p>

                                                    <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                                                        {photographerData.verification.adminNote}
                                                    </p>
                                                </div>
                                            )}
                                    </div>
                                </div>

                                {/* SAVE BUTTON */}
                                <div className="flex justify-end mt-8">
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={loading}
                                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl font-bold tracking-wide transition-all duration-300 shadow-md shadow-orange-500/10 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <Save size={18} className={loading ? "animate-spin" : ""} />
                                        {loading ? t.loading : t.save}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PORTFOLIO TAB */}
                    {activeTab === "portfolio" && (
                        <PhotographerPortfolioManager
                            photographerId={photographerData._id}
                            language={language}
                            theme={theme}
                        />
                    )}

                    {/* PACKAGES TAB */}
                    {activeTab === "packages" && (
                        <PhotographerPackages theme={theme} language={language} />
                    )}

                    {/* CALENDAR TAB */}
                    {activeTab === "calendar" && (
                        <PhotographerBookingCalendar theme={theme} />
                    )}

                    {/* BOOKINGS TAB */}
                    {activeTab === "bookings" && (
                        <PhotographerBookingList theme={theme} language={language} />
                    )}

                    {/* JOBS TAB */}
                    {activeTab === "jobs" && (
                        <PhotographerJobPosts theme={theme} />
                    )}

                    {/* RECOMMENDATIONS TAB */}
                    {activeTab === "recommendations" && (
                        <PhotographerRecommendedJobs theme={theme} />
                    )}

                    {/* CHAT TAB */}
                    {activeTab === "chat" && (
                        <PhotographerChat theme={theme} />
                    )}

                    {/* REVENUE TAB */}
                    {activeTab === "revenue" && (
                        <PhotographerRevenueDashboard theme={theme} onNavigateToWithdraw={() => setActiveTab("withdraw")} />
                    )}

                    {/* WITHDRAW TAB */}
                    {activeTab === "withdraw" && (
                        <WithdrawMoney theme={theme} />
                    )}

                </div>
            </div>
            {zoomImage && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-6"
                    onClick={() => setZoomImage(null)}
                >
                    <img
                        src={zoomImage}
                        alt="CCCD"
                        className="max-w-[95vw] max-h-[95vh] object-contain rounded-xl shadow-2xl"
                    />
                </div>
            )}
        </div>

    );
}