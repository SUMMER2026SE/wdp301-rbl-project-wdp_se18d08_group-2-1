import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { authService } from "../services/authService";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage({
    language = "vi",
    theme = "dark"
}) {
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";
    const token = location.state?.token || "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const isDark = theme === "dark";

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Mật khẩu xác nhận không khớp"
            });
            return;
        }

        try {
            setLoading(true);

            const result = await authService.resetPassword({
                email,
                token,
                newPassword
            });

            if (result.success) {
                await Swal.fire({
                    icon: "success",
                    title: "Thành công",
                    text: "Mật khẩu đã được cập nhật"
                });

                navigate("/login");
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Thất bại",
                    text: result.message
                });
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-500 ease-in-out ${isDark ? "bg-[#050508]" : "bg-slate-100"
                }`}
        >
            <div
                className={`w-full max-w-md p-8 rounded-3xl transition-all duration-500 ease-in-out ${isDark
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-900"
                    }`}
            >
                <h1 className="text-3xl font-bold text-center mb-2">
                    Đặt lại mật khẩu
                </h1>

                <p className="text-center mb-6 text-slate-400">
                    OTP đã được gửi tới email của bạn
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label>Email</label>
                        <input
                            value={email}
                            disabled
                            className="w-full mt-2 px-4 py-3 rounded-xl border bg-gray-100 text-black"
                        />
                    </div>

                    <div className="mb-4">
                        <label>Mật khẩu mới</label>

                        <div className="relative mt-2">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border text-black pr-12 transition-all duration-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                required
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label>Xác nhận mật khẩu</label>

                        <div className="relative mt-2">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border text-black pr-12 transition-all duration-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                required
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-cyan-500 text-white transition-all duration-300 hover:bg-cyan-400 hover:scale-[1.02]"
                    >
                        {loading
                            ? "Đang xử lý..."
                            : "Đổi mật khẩu"}
                    </button>
                </form>
            </div>
        </div>
    );
}