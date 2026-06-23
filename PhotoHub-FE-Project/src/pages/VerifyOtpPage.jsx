import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { authService } from "../services/authService";

export default function VerifyOtpPage({
    language = "vi",
    theme = "dark"
}) {
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";

    const [otp, setOtp] = useState("");

    const isDark = theme === "dark";
    const [loading, setLoading] = useState(false)

    const handleVerify = async (e) => {
        e.preventDefault();

        if (!otp.trim()) {
            return Swal.fire({
                icon: "error",
                title: language === "vi" ? "Lỗi" : "Error",
                text: language === "vi"
                    ? "Vui lòng nhập OTP"
                    : "Please enter OTP"
            });
        }

        try {
            setLoading(true);

            const result = await authService.verifyResetOTP({
                email,
                token: otp
            });

            if (result.success) {
                await Swal.fire({
                    icon: "success",
                    title: language === "vi"
                        ? "Xác thực thành công"
                        : "Verification Successful",
                    text: result.message || (
                        language === "vi"
                            ? "OTP hợp lệ"
                            : "OTP is valid"
                    )
                });

                navigate("/reset-password", {
                    state: {
                        email,
                        token: otp
                    }
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: language === "vi"
                        ? "OTP không hợp lệ"
                        : "Invalid OTP",
                    text: result.message
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
                        : "Something went wrong")
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`min-h-screen flex items-center justify-center px-4 transition-all duration-700 ${isDark ? "bg-[#050508]" : "bg-slate-100"
                }`}
        >
            <div
                className={`w-full max-w-md p-8 rounded-3xl transition-all duration-700 ${isDark
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-900"
                    }`}
            >
                <h1 className="text-3xl font-bold text-center mb-2">
                    {language === "vi"
                        ? "Xác thực OTP"
                        : "Verify OTP"}
                </h1>

                <p className="text-center mb-6 text-slate-400">
                    {email}
                </p>

                <form onSubmit={handleVerify}>
                    <input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="OTP"
                        className="w-full px-4 py-3 rounded-xl border mb-6 text-black"
                    />

                    <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-cyan-500 text-white"
                    >
                        {language === "vi"
                            ? "Tiếp tục"
                            : "Continue"}
                    </button>
                </form>
            </div>
        </div>
    );
}