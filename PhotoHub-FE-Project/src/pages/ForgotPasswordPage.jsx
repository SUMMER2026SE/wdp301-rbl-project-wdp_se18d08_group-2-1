import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ArrowRight } from "lucide-react";
import { authService } from "../services/authService";

const copy = {
    en: {
        title: "Forgot Password",
        subtitle: "Enter your email to receive an OTP code.",
        email: "Email Address",
        sendOtp: "Send OTP",
        backLogin: "Back to Login"
    },
    vi: {
        title: "Quên mật khẩu",
        subtitle: "Nhập email để nhận mã OTP.",
        email: "Địa chỉ Email",
        sendOtp: "Gửi OTP",
        backLogin: "Quay lại đăng nhập"
    }
};

export default function ForgotPasswordPage({
    language = "vi",
    theme = "dark"
}) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const t = copy[language] || copy.vi;
    const isDark = theme === "dark";

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            const result = await authService.forgotPassword(email);

            if (result.success) {
                await Swal.fire({
                    icon: "success",
                    title: language === "vi"
                        ? "OTP đã được gửi"
                        : "OTP Sent",
                    text:
                        result.message ||
                        (language === "vi"
                            ? "Vui lòng kiểm tra email"
                            : "Please check your email"),
                    background: isDark ? "#0f172a" : "#fff",
                    color: isDark ? "#fff" : "#0f172a",
                    confirmButtonColor: "#06b6d4"
                });

                navigate("/verify-otp", {
                    state: { email }
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: result.message,
                    background: isDark ? "#0f172a" : "#fff",
                    color: isDark ? "#fff" : "#0f172a",
                    confirmButtonColor: "#ef4444"
                });
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text:
                    error.message ||
                    (language === "vi"
                        ? "Có lỗi xảy ra"
                        : "Something went wrong"),
                background: isDark ? "#0f172a" : "#fff",
                color: isDark ? "#fff" : "#0f172a",
                confirmButtonColor: "#ef4444"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`min-h-screen flex items-center justify-center px-4 relative overflow-hidden
    transition-all duration-700 ease-in-out
    ${isDark
                    ? "bg-[#050508]"
                    : "bg-slate-100"
                }`}
        >
            {/* Glow Effect */}
            <div
                className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
                style={{
                    top: "-100px",
                    left: "-100px",
                    background:
                        "radial-gradient(circle, #8b5cf6 0%, transparent 70%)"
                }}
            />

            <div
                className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
                style={{
                    bottom: "-100px",
                    right: "-100px",
                    background:
                        "radial-gradient(circle, #06b6d4 0%, transparent 70%)"
                }}
            />

            <div
                className={`
                    w-full max-w-md p-8 rounded-3xl backdrop-blur-xl
    border shadow-2xl
    transition-all duration-700 ease-in-out
                    ${isDark
                        ? "bg-slate-900/70 border-white/10 text-white"
                        : "bg-white/90 border-slate-200 text-slate-900"
                    }
                `}
            >
                <div className="text-center mb-8">
                    <div
                        className={`
                            inline-block px-4 py-2 rounded-full text-xs font-semibold tracking-wider mb-4
                            ${isDark
                                ? "border border-white/10 text-slate-400"
                                : "border border-slate-200 text-slate-500"
                            }
                        `}
                    >
                        PASSWORD RECOVERY
                    </div>

                    <h1 className="text-3xl font-bold mb-3">
                        {t.title}
                    </h1>

                    <p
                        className={
                            isDark
                                ? "text-slate-400"
                                : "text-slate-500"
                        }
                    >
                        {t.subtitle}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label
                            className={`block mb-2 text-sm font-medium ${isDark
                                ? "text-slate-300"
                                : "text-slate-700"
                                }`}
                        >
                            {t.email}
                        </label>

                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                            className={`
                                w-full px-4 py-3 rounded-xl outline-none transition-all
                                ${isDark
                                    ? "bg-slate-800 border border-slate-700 text-white"
                                    : "bg-white border border-slate-300 text-slate-900"
                                }
                            `}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        {loading
                            ? language === "vi"
                                ? "Đang gửi..."
                                : "Sending..."
                            : t.sendOtp}

                        <ArrowRight size={18} />
                    </button>
                </form>

                <div className="text-center mt-6">
                    <Link
                        to="/login"
                        className="text-cyan-500 hover:text-cyan-400 font-medium"
                    >
                        {t.backLogin}
                    </Link>
                </div>
            </div>
        </div>
    );
}