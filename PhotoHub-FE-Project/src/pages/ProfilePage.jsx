import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
    Camera,
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Shield,
    Lock,
    Save,
    MessageSquare,
    Gift,
} from "lucide-react";

import Swal from "sweetalert2";
import { profileService } from "../services/profileService";
import CustomerBookingList from "../booking/CustomerBookingList";
import PhotographerChat from "../components/photographers/PhotographerChat";
import CustomerJobPostsManager from "../components/customer/CustomerJobPostsManager";
import CustomerLoyalty from "../components/customer/CustomerLoyalty";

export default function ProfilePage({
    language = "vi",
    theme = "dark",
    onToggleLanguage,
    onToggleTheme
}) {
    const isDark = theme === "dark";

    const text = {
        vi: {
            personalInfo: "Thông tin cá nhân",
            fullName: "Họ và tên",
            phone: "Số điện thoại",
            gender: "Giới tính",
            male: "Nam",
            female: "Nữ",
            selectGender: "Chọn giới tính",
            dob: "Ngày sinh",
            address: "Địa chỉ",
            save: "Lưu thay đổi",
            changePassword: "Đổi mật khẩu",
            currentPassword: "Mật khẩu hiện tại",
            newPassword: "Mật khẩu mới",
            updatePassword: "Cập nhật mật khẩu",
            notUpdated: "Chưa cập nhật",
            loading: "Đang tải...",
        },
        en: {
            personalInfo: "Personal Information",
            fullName: "Full Name",
            phone: "Phone Number",
            gender: "Gender",
            male: "Male",
            female: "Female",
            selectGender: "Select gender",
            dob: "Date of Birth",
            address: "Address",
            save: "Save Changes",
            changePassword: "Change Password",
            currentPassword: "Current Password",
            newPassword: "New Password",
            updatePassword: "Update Password",
            notUpdated: "Not updated",
            loading: "Loading...",
        },
    };

    const t = text[language];
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    const [formData, setFormData] = useState({
        fullName: "",
        phoneNumber: "",
        address: "",
        gender: "",
        dateOfBirth: "",
    });

    const routeLocation = useLocation();
    const [activeTab, setActiveTab] = useState("info");
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
    }, [activeTab]);
    const [initialConvId, setInitialConvId] = useState(null);

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
    });

    useEffect(() => {
        if (routeLocation.state?.activeTab) {
            setActiveTab(routeLocation.state.activeTab);
            if (routeLocation.state.activeConvId) {
                setInitialConvId(routeLocation.state.activeConvId);
            }
        }
    }, [routeLocation]);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const result = await profileService.getProfile();
            if (result.success) {
                setUser(result.data);
                setFormData({
                    fullName: result.data.fullName || "",
                    phoneNumber: result.data.phoneNumber || "",
                    address: result.data.address || "",
                    gender: result.data.gender || "",
                    dateOfBirth: result.data.dateOfBirth
                        ? result.data.dateOfBirth.split("T")[0]
                        : "",
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value,
        });
    };

    const handleUpdateProfile = async () => {
        const errors = validateForm();

        if (errors.length > 0) {
            Swal.fire({
                icon: "error",
                title: language === "vi" ? "Lỗi validate" : "Validation Error",
                text: errors[0],
                background: isDark ? "#0f172a" : "#fff",
                color: isDark ? "#fff" : "#000",
            });
            return;
        }

        const result = await profileService.updateProfile(formData);

        if (result.success) {
            setUser(result.data);
            localStorage.setItem("user", JSON.stringify(result.data));
            window.dispatchEvent(new Event("storage_user_changed"));

            Swal.fire({
                icon: "success",
                title: language === "vi" ? "Thành công" : "Success",
                text: result.message,
                background: isDark ? "#0f172a" : "#fff",
                color: isDark ? "#fff" : "#000",
            });
        } else {
            Swal.fire({
                icon: "error",
                title: language === "vi" ? "Lỗi" : "Error",
                text: result.message,
                background: isDark ? "#0f172a" : "#fff",
                color: isDark ? "#fff" : "#000",
            });
        }
    };

    const handleUploadAvatar = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const result = await profileService.uploadAvatar(file);

        if (result.success) {
            setUser(result.data);
            localStorage.setItem("user", JSON.stringify(result.data));
            window.dispatchEvent(new Event("storage_user_changed"));

            Swal.fire({
                icon: "success",
                title: language === "vi" ? "Cập nhật ảnh đại diện" : "Avatar Updated",
                text: result.message,
                background: isDark ? "#0f172a" : "#fff",
                color: isDark ? "#fff" : "#000",
            });
        }
    };

    const handleChangePassword = async () => {
        const result = await profileService.changePassword(passwordData);

        if (result.success) {
            Swal.fire({
                icon: "success",
                title: language === "vi" ? "Thành công" : "Success",
                text: result.message,
                background: isDark ? "#0f172a" : "#fff",
                color: isDark ? "#fff" : "#000",
            });

            setPasswordData({
                currentPassword: "",
                newPassword: "",
            });
        } else {
            Swal.fire({
                icon: "error",
                title: language === "vi" ? "Lỗi" : "Error",
                text: result.message,
                background: isDark ? "#0f172a" : "#fff",
                color: isDark ? "#fff" : "#000",
            });
        }
    };

    // --- FIX CLASS HELPERS CHO LIGHT MODE TRẮNG FULL ---
    const labelClass = `text-sm font-medium transition-colors ${isDark ? "text-slate-400" : "text-slate-700"}`;

    // Đổi từ bg-[#0f172a] (Dark) sang bg-slate-50 hoặc bg-white (Light) thay vì bị trong suốt hoặc dính nền tối
    const inputClass = `w-full rounded-2xl pl-12 pr-4 py-4 outline-none border transition ${isDark
        ? "bg-[#0f172a] border-white/10 text-white focus:border-orange-500"
        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-orange-500 focus:bg-white shadow-sm"
        }`;

    const selectClass = `w-full rounded-2xl pl-12 pr-4 py-4 outline-none border transition appearance-none ${isDark
        ? "bg-[#0f172a] border-white/10 text-white focus:border-orange-500"
        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-orange-500 focus:bg-white shadow-sm"
        }`;

    const iconClass = `absolute left-4 top-4 transition-colors ${isDark ? "text-slate-500" : "text-slate-400"}`;

    if (loading) {
        return (
            <div
                className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? "bg-[#020617] text-white" : "bg-white text-slate-900"
                    }`}
            >
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>{t.loading}</span>
                </div>
            </div>
        );
    }

    const validateForm = () => {
        const errors = [];

        // PHONE: 10 số
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(formData.phoneNumber)) {
            errors.push(
                language === "vi"
                    ? "Số điện thoại phải đúng 10 số"
                    : "Phone number must be exactly 10 digits"
            );
        }

        // DATE OF BIRTH
        if (formData.dateOfBirth) {
            const dob = new Date(formData.dateOfBirth);
            const today = new Date();

            // không tương lai
            if (dob > today) {
                errors.push(
                    language === "vi"
                        ? "Ngày sinh không được là tương lai"
                        : "Date of birth cannot be in the future"
                );
            }

            // >= 12 tuổi
            const age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            const realAge =
                monthDiff < 0 ||
                    (monthDiff === 0 && today.getDate() < dob.getDate())
                    ? age - 1
                    : age;

            if (realAge < 12) {
                errors.push(
                    language === "vi"
                        ? "Bạn phải từ 12 tuổi trở lên"
                        : "You must be at least 12 years old"
                );
            }
        }

        return errors;
    };

    return (
        <div
            className={`min-h-screen px-6 pt-32 pb-10 transition-colors duration-300 relative ${isDark ? "bg-[#020617] text-white" : "bg-white text-slate-900"
                }`}
        >


            <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
                {/* LEFT SIDEBAR */}
                <div className={`rounded-3xl p-6 border h-fit transition-all ${isDark ? "bg-white/5 border-white/10" : "bg-slate-50/50 border-slate-200/80 shadow-sm"
                    }`}>
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <img
                                src={
                                    user?.avatar
                                        ? user.avatar.startsWith("http")
                                            ? user.avatar                                  // Cloudinary URL đầy đủ
                                            : `http://localhost:3000${user.avatar}`        // Đường dẫn local cũ
                                        : "https://i.pravatar.cc/300"                     // Fallback
                                }
                                alt="avatar"
                                className="w-36 h-36 rounded-full object-cover border-4 border-orange-400"
                            />
                            <label className="absolute bottom-0 right-0 bg-orange-500 p-3 rounded-full cursor-pointer hover:bg-orange-400 transition text-white shadow-lg">
                                <Camera size={18} />
                                <input type="file" hidden accept="image/*" onChange={handleUploadAvatar} />
                            </label>
                        </div>

                        <h2 className="mt-5 text-2xl font-bold transition-colors text-center">
                            {user?.fullName || t.notUpdated}
                        </h2>
                        <p className={`transition-colors text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            {user?.email}
                        </p>

                        <div className="mt-6 w-full space-y-3">
                            <div className={`flex items-center gap-3 p-3 rounded-xl transition ${isDark ? "bg-white/5" : "bg-slate-100"
                                }`}>
                                <Mail size={18} className={isDark ? "text-slate-400" : "text-slate-500"} />
                                <span className="text-sm truncate">{user?.email}</span>
                            </div>

                            <div className={`flex items-center gap-3 p-3 rounded-xl transition ${isDark ? "bg-white/5" : "bg-slate-100"
                                }`}>
                                <Phone size={18} className={isDark ? "text-slate-400" : "text-slate-500"} />
                                <span className="text-sm">{user?.phoneNumber || t.notUpdated}</span>
                            </div>

                            <div className={`flex items-center gap-3 p-3 rounded-xl transition ${isDark ? "bg-white/5" : "bg-slate-100"
                                }`}>
                                <Shield size={18} className={isDark ? "text-slate-400" : "text-slate-500"} />
                                <span className="text-sm capitalize">{user?.role || t.notUpdated}</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 w-full space-y-2">
                            <button
                                onClick={() => setActiveTab("info")}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition ${
                                    activeTab === "info"
                                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                        : isDark
                                        ? "hover:bg-white/5 text-slate-400 hover:text-white"
                                        : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <User size={18} />
                                {language === "vi" ? "Thông tin cá nhân" : "Personal Profile"}
                            </button>
                            
                            <button
                                onClick={() => setActiveTab("bookings")}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition ${
                                    activeTab === "bookings"
                                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                        : isDark
                                        ? "hover:bg-white/5 text-slate-400 hover:text-white"
                                        : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Calendar size={18} />
                                {language === "vi" ? "Lịch sử đặt lịch" : "My Bookings"}
                            </button>

                            <button
                                onClick={() => setActiveTab("chat")}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition ${
                                    activeTab === "chat"
                                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                        : isDark
                                        ? "hover:bg-white/5 text-slate-400 hover:text-white"
                                        : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <MessageSquare size={18} />
                                {language === "vi" ? "Trò chuyện" : "Chat Messages"}
                            </button>

                            {user?.role === "customer" && (
                                <button
                                    onClick={() => setActiveTab("loyalty")}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition ${
                                        activeTab === "loyalty"
                                            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                            : isDark
                                            ? "hover:bg-white/5 text-slate-400 hover:text-white"
                                            : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    <Gift size={18} />
                                    {language === "vi" ? "Điểm thưởng & Quà tặng" : "Loyalty Rewards"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT CONTENT */}
                <div className="lg:col-span-2 space-y-8">
                    {activeTab === "info" ? (
                        <>
                            {/* PROFILE FORM */}
                            <div className={`border rounded-3xl p-8 transition-all ${isDark ? "bg-white/5 border-white/10" : "bg-slate-50/50 border-slate-200/80 shadow-sm"
                                }`}>
                        <h2 className="text-2xl font-bold mb-6 transition-colors">
                            {t.personalInfo}
                        </h2>

                        <div className="grid md:grid-cols-2 gap-5">
                            {/* Full Name */}
                            <div>
                                <label className={labelClass}>{t.fullName}</label>
                                <div className="relative mt-2">
                                    <User className={iconClass} size={18} />
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className={labelClass}>{t.phone}</label>
                                <div className="relative mt-2">
                                    <Phone className={iconClass} size={18} />
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* Gender */}
                            <div>
                                <label className={labelClass}>{t.gender}</label>
                                <div className="relative mt-2">
                                    <User className={iconClass} size={18} />
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className={selectClass}
                                    >
                                        <option value="">{t.selectGender}</option>
                                        <option value="male">{t.male}</option>
                                        <option value="female">{t.female}</option>
                                    </select>
                                </div>
                            </div>

                            {/* DOB */}
                            <div>
                                <label className={labelClass}>{t.dob}</label>
                                <div className="relative mt-2">
                                    <Calendar className={iconClass} size={18} />
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="md:col-span-2">
                                <label className={labelClass}>{t.address}</label>
                                <div className="relative mt-2">
                                    <MapPin className={iconClass} size={18} />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleUpdateProfile}
                            className="mt-6 flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-6 py-3 rounded-2xl font-semibold transition shadow-md shadow-orange-500/20"
                        >
                            <Save size={18} />
                            {t.save}
                        </button>
                    </div>

                    {/* PASSWORD FORM */}
                    <div className={`border rounded-3xl p-8 transition-all ${isDark ? "bg-white/5 border-white/10" : "bg-slate-50/50 border-slate-200/80 shadow-sm"
                        }`}>
                        <h2 className="text-2xl font-bold mb-6 transition-colors">
                            {t.changePassword}
                        </h2>

                        <div className="space-y-5">
                            {/* Current Password */}
                            <div>
                                <label className={labelClass}>{t.currentPassword}</label>
                                <div className="relative mt-2">
                                    <Lock className={iconClass} size={18} />
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label className={labelClass}>{t.newPassword}</label>
                                <div className="relative mt-2">
                                    <Lock className={iconClass} size={18} />
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleChangePassword}
                            className="mt-6 bg-purple-500 hover:bg-purple-400 text-white px-6 py-3 rounded-2xl font-semibold transition shadow-md shadow-purple-500/20"
                        >
                            {t.updatePassword}
                        </button>
                    </div>
                        </>
                    ) : activeTab === "bookings" ? (
                        <div className="animate-fadeIn">
                            <CustomerBookingList theme={theme} language={language} />
                        </div>
                    ) : activeTab === "loyalty" ? (
                        <div className="animate-fadeIn">
                            <CustomerLoyalty theme={theme} language={language} />
                        </div>
                    ) : (
                        <div className="animate-fadeIn">
                            <PhotographerChat theme={theme} language={language} initialActiveConvId={initialConvId} />
                        </div>
                    )}

                    {(() => {
                        const apiRole = user?.role;
                        const localUser = JSON.parse(localStorage.getItem("user") || "{}");
                        const localRole = localUser?.role;
                        const effectiveRole = apiRole || localRole;
                        return effectiveRole === "customer" ? (
                            <div className={`border rounded-3xl p-8 transition-all ${
                                isDark ? "bg-white/5 border-white/10" : "bg-slate-50/50 border-slate-200/80 shadow-sm"
                            }`}>
                                <CustomerJobPostsManager theme={theme} language={language} />
                            </div>
                        ) : null;
                    })()}
                </div>
            </div>
        </div>
    );
}