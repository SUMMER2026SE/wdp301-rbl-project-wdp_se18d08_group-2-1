import React, { useState } from 'react';
import { Camera, ArrowRight} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from "react-icons/fc";
import { authService } from '../services/authService';
import Swal from "sweetalert2";

const iconProps = { strokeWidth: 1.5 };

const copy = {
    en: {
        badge: "ESCROW-FIRST PHOTOGRAPHY MARKETPLACE",
        badgeSuccess: "🔒 SECURE SESSION ACTIVE",
        titleLogin: "Welcome back.",
        titleRegister: "Create Account.",
        titleOtp: "Verify Email.",
        titleLogout: "Session Management.",
        titleLogoutSub: "Security Active",
        subtitleLogin: "Enter your details to manage your creative bookings.",
        subtitleRegister: "Join PhotoHub Command Center as a creator.",
        subtitleOtp: "Enter the OTP code sent to your email to activate account.",
        subtitleLogout: "You are currently authenticated into the secure command center.",
        labelEmail: "Email Address",
        labelPassword: "Password",
        labelFullName: "Full Name",
        labelOtp: "Verification Code (OTP)",
        forgot: "Forgot?",
        btnSignIn: "Sign in securely",
        btnRegister: "Create account",
        btnVerify: "Verify and Activate",
        btnResend: "Resend OTP",
        divider: "or continue with",
        btnGoogle: "Google Account",
        labelLogged: "Logged in as:",
        btnLogout: "Logout from session",
        langLabel: "VI",
        themeLabel: "☀️"
    },
    vi: {
        badge: "SÀN THƯƠNG MẠI NHIẾP ẢNH KÝ QUỸ ĐẦU TIÊN",
        badgeSuccess: "🔒 PHIÊN ĐĂNG NHẬP ĐƯỢC BẢO MẬT",
        titleLogin: "Chào mừng trở lại.",
        titleRegister: "Đăng ký tài khoản.",
        titleOtp: "Xác thực Email.",
        titleLogout: "Quản lý phiên làm việc.",
        titleLogoutSub: "Bảo mật đang bật",
        subtitleLogin: "Nhập thông tin của bạn để quản lý lịch đặt hẹn sáng tạo.",
        subtitleRegister: "Tham gia vào Trung tâm điều khiển PhotoHub.",
        subtitleOtp: "Nhập mã OTP vừa được gửi đến email của bạn để kích hoạt.",
        subtitleLogout: "Tài khoản của bạn hiện đang được đăng nhập an toàn trên hệ thống.",
        labelEmail: "Địa chỉ Email",
        labelPassword: "Mật khẩu",
        labelFullName: "Họ và tên",
        labelOtp: "Mã xác thực (OTP)",
        forgot: "Quên?",
        btnSignIn: "Đăng nhập an toàn",
        btnRegister: "Đăng ký tài khoản",
        btnVerify: "Xác thực & Kích hoạt",
        btnResend: "Gửi lại mã",
        divider: "hoặc tiếp tục với",
        btnGoogle: "Tài khoản Google",
        labelLogged: "Đã đăng nhập bằng:",
        btnLogout: "Đăng xuất khỏi phiên",
        langLabel: "EN",
        themeLabel: "🌙"
    }
};

export default function AuthPage({ language = 'vi', theme = 'dark', onToggleLanguage, onToggleTheme }) {
    const navigate = useNavigate();

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isRegister, setIsRegister] = useState(false);
    const [step, setStep] = useState('auth'); // 'auth' hoặc 'otp'

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState("");
    const [otp, setOtp] = useState("");
    const [redirecting, setRedirecting] = useState(false);

    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    const t = copy[language] || copy.en;
    const isDark = theme === 'dark';
    const styles = getDynamicStyles(isDark);

    // XỬ LÝ ĐĂNG NHẬP & ĐĂNG KÝ
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            if (isRegister) {
                const result = await authService.register({
                    fullName,
                    email,
                    password
                });

                console.log("REGISTER RESULT:", result);

                if (result.success) {
                    setStep("otp");
                    Swal.fire({
                        icon: "success",
                        title: "Đăng ký thành công",
                        text: result.message || "Vui lòng xác thực OTP",
                        background: isDark ? "#0f172a" : "#fff",
                        color: isDark ? "#fff" : "#0f172a",
                        confirmButtonColor: "#06b6d4"
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Đăng ký thất bại",
                        text: result.message || "Có lỗi xảy ra, vui lòng thử lại",
                        background: isDark ? "#0f172a" : "#fff",
                        color: isDark ? "#fff" : "#0f172a",
                        confirmButtonColor: "#ef4444"
                    });
                }

                return;
            }

            // LUỒNG ĐĂNG NHẬP
            const result = await authService.login({
                email,
                password
            });

            console.log("Login Response:", result);

            if (result.success) {

                localStorage.setItem(
                    "token",
                    result.data.token
                );

                localStorage.setItem(
                    "user",
                    JSON.stringify(result.data.user)
                );

                window.dispatchEvent(new Event("storage_user_changed"));
                setIsLoggedIn(true);

                Swal.fire({
                    icon: "success",
                    title: "Đăng nhập thành công",
                    text: "Sẽ chuyển về trang chủ sau 5 giây.",
                    background: isDark ? "#0f172a" : "#fff",
                    color: isDark ? "#fff" : "#0f172a",
                    confirmButtonColor: "#06b6d4"
                });
                // tự chuyển sau 5 giây
                setRedirecting(true);

                setTimeout(() => {
                    navigate("/");
                }, 5000);

            } else {
                Swal.fire({
                    icon: "error",
                    title: "Đăng nhập thất bại",
                    text: result.message || "Có lỗi xảy ra, vui lòng thử lại",
                    background: isDark ? "#0f172a" : "#fff",
                    color: isDark ? "#fff" : "#0f172a",
                    confirmButtonColor: "#ef4444"
                });
            }
        } catch (err) {
            console.error("Auth Error:", err);
            alert(err.message || "Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setLoading(false);
        }
    };

    // XỬ LÝ XÁC THỰC OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const result = await authService.verifyEmail({ email, otp });
            console.log("Verify OTP Response:", result);

            alert(result.message || "Xác thực tài khoản thành công!");

            // Kích hoạt thành công -> Chuyển về màn hình đăng nhập bình thường
            setIsRegister(false);
            setStep('auth');
            setPassword('');
            setOtp('');
        } catch (err) {
            console.error("OTP Error:", err);
            alert(err.message || "Mã OTP không chính xác hoặc đã hết hạn");
        } finally {
            setLoading(false);
        }
    };

    // XỬ LÝ GỬI LẠI MÃ OTP
    const handleResendOtp = async () => {
        try {
            setResendLoading(true);
            const result = await authService.resendVerifyEmail(email);
            alert(result.message || "Đã gửi lại mã OTP mới vào Email!");
        } catch (err) {
            console.error("Resend Error:", err);
            alert(err.message || "Không thể gửi lại mã vào lúc này");
        } finally {
            setResendLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setEmail('');
        setPassword('');
    };

    return (
        <div style={styles.container}>
            {/* Background Glows */}
            <div style={styles.glowLeft}></div>
            <div style={styles.glowRight}></div>


            {/* Main Content Area */}
            <main style={styles.mainContent}>
                {!isLoggedIn ? (
                    <div style={styles.card}>
                        <div style={styles.badge}>{t.badge}</div>

                        {/* STEP 1: GIAO DIỆN LOGIN / REGISTER */}
                        {step === 'auth' && (
                            <>
                                <h2 style={styles.title}>
                                    {isRegister ? t.titleRegister : t.titleLogin} <br />
                                </h2>
                                <p style={styles.subtitle}>{isRegister ? t.subtitleRegister : t.subtitleLogin}</p>

                                <form onSubmit={handleSubmit} style={styles.form}>
                                    {isRegister && (
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>{t.labelFullName}</label>
                                            <input
                                                type="text"
                                                placeholder="John Doe"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                style={styles.input}
                                                required
                                            />
                                        </div>
                                    )}
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>{t.labelEmail}</label>
                                        <input
                                            type="email"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            style={styles.input}
                                            required
                                        />
                                    </div>

                                    <div style={styles.inputGroup}>
                                        <div style={styles.labelRow}>
                                            <label style={styles.label}>{t.labelPassword}</label>
                                            {!isRegister && <a href="#forgot" style={styles.forgotLink}>{t.forgot}</a>}
                                        </div>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            style={styles.input}
                                            required
                                        />
                                    </div>

                                    <button type="submit" style={styles.loginBtn} disabled={loading}>
                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            {loading ? "Processing..." : isRegister ? t.btnRegister : t.btnSignIn}
                                            <ArrowRight size={16} />
                                        </span>
                                    </button>
                                </form>


                                <div style={styles.dividerContainer}>
                                    <div style={styles.dividerLine}></div>
                                    <span style={styles.dividerText}>{t.divider}</span>
                                    <div style={styles.dividerLine}></div>
                                </div>

                                <button style={styles.googleBtn}>
                                    <FcGoogle size={16} style={{ marginRight: '8px' }} /> {t.btnGoogle}
                                </button>

                                <div style={styles.switchAuth}>
                                    <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                                        {isRegister ? "Already have an account?" : "Don't have an account?"}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setIsRegister(!isRegister)}
                                        style={styles.switchBtn}
                                    >
                                        {isRegister ? "Login" : "Register"}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* STEP 2: GIAO DIỆN XÁC THỰC OTP */}
                        {step === 'otp' && (
                            <>
                                <h2 style={styles.title}>
                                    {t.titleOtp} <br />
                                    <span style={styles.gradientText}>Secure Active</span>
                                </h2>
                                <p style={styles.subtitle}>{t.subtitleOtp}</p>

                                <form onSubmit={handleVerifyOtp} style={styles.form}>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>{t.labelOtp}</label>
                                        <input
                                            type="text"
                                            placeholder="Enter 6-digit code"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            style={{ ...styles.input, textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center', fontSize: '18px' }}
                                            maxLength={6}
                                            required
                                        />
                                    </div>

                                    <button type="submit" style={styles.loginBtn} disabled={loading}>
                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            {loading ? "Verifying..." : t.btnVerify}
                                            <ArrowRight size={16} />
                                        </span>
                                    </button>
                                </form>

                                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <button
                                        onClick={handleResendOtp}
                                        style={styles.switchBtn}
                                        disabled={resendLoading}
                                    >
                                        {resendLoading ? "Sending..." : t.btnResend}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStep('auth');
                                            setIsRegister(true);
                                        }}
                                        style={{ background: 'transparent', border: 'none', color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer' }}
                                    >
                                        Back to Register
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    /* --- LOGOUT STATE --- */
                    <div style={styles.card}>
                        <div style={styles.badgeSuccess}>{t.badgeSuccess}</div>
                        <h2 style={styles.title}>
                            {t.titleLogout} <br />
                            <span style={styles.gradientText2}>{t.titleLogoutSub}</span>
                        </h2>
                        <p style={styles.subtitle}>{t.subtitleLogout}</p>

                        <div style={styles.infoBox}>
                            <p style={{
                                margin: '0 0 8px 0',
                                color: isDark ? '#94a3b8' : '#64748b'
                            }}>
                                {t.labelLogged}
                            </p>

                            <p style={{
                                margin: 0,
                                color: isDark ? '#f8fafc' : '#0f172a',
                                fontWeight: '500'
                            }}>
                                {email}
                            </p>

                            {redirecting && (
                                <div style={{ marginTop: "16px" }}>
                                    <p style={{
                                        color: "#06b6d4",
                                        marginBottom: "12px",
                                        fontSize: "14px"
                                    }}>
                                        Sẽ chuyển về trang chủ sau 5 giây...
                                    </p>

                                    <button
                                        onClick={() => navigate("/")}
                                        style={{
                                            width: "100%",
                                            padding: "12px",
                                            borderRadius: "20px",
                                            border: "none",
                                            cursor: "pointer",
                                            background: "#06b6d4",
                                            color: "#fff",
                                            fontWeight: "600"
                                        }}
                                    >
                                        Về trang chủ ngay
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

const getDynamicStyles = (isDark) => ({
    container: {
        backgroundColor: isDark ? '#050508' : '#f8fafc',
        color: isDark ? '#ffffff' : '#0f172a',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background-color 0.5s ease, color 0.5s ease',
    },
    glowLeft: {
        position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px',
        background: isDark ? 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0,0,0,0) 70%)' : 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, rgba(255,255,255,0) 70%)',
        pointerEvents: 'none',
    },
    glowRight: {
        position: 'absolute', bottom: '-10%', right: '-10%', width: '600px', height: '600px',
        background: isDark ? 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, rgba(0,0,0,0) 70%)' : 'radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, rgba(255,255,255,0) 70%)',
        pointerEvents: 'none',
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px', zIndex: 10, maxWidth: '1280px', width: '100%', margin: '0 auto', boxSizing: 'border-box' },
    logoIcon: { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(15,23,42,0.08)', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' },
    logoText: { fontSize: '18px', fontWeight: '600', color: isDark ? '#fff' : '#0f172a', letterSpacing: '-0.5px' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
    langBadge: { fontSize: '12px', fontWeight: '600', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)', color: isDark ? '#fff' : '#0f172a', padding: '8px 14px', borderRadius: '9999px', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(15,23,42,0.08)', cursor: 'pointer', transition: 'all 0.3s ease' },
    themeBtn: { background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(15,23,42,0.08)', color: isDark ? '#fff' : '#0f172a', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' },
    mainContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', zIndex: 10 },
    card: { background: isDark ? 'linear-gradient(145deg, rgba(15, 15, 25, 0.7) 0%, rgba(5, 5, 10, 0.8) 100%)' : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(241, 245, 249, 0.9) 100%)', border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.06)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '440px', backdropFilter: 'blur(16px)', boxShadow: isDark ? '0 20px 50px rgba(0, 0, 0, 0.4)' : '0 20px 50px rgba(15, 23, 42, 0.06)', textAlign: 'center', transition: 'all 0.5s ease' },
    badge: { display: 'inline-block', fontSize: '10px', fontWeight: '600', letterSpacing: '1.5px', color: isDark ? '#94a3b8' : '#64748b', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(15,23,42,0.12)', padding: '6px 16px', borderRadius: '20px', marginBottom: '24px' },
    badgeSuccess: { display: 'inline-block', fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', color: isDark ? '#06b6d4' : '#0891b2', backgroundColor: isDark ? 'rgba(6, 182, 212, 0.1)' : 'rgba(6, 182, 212, 0.06)', border: isDark ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid rgba(6, 182, 212, 0.15)', padding: '6px 16px', borderRadius: '20px', marginBottom: '24px' },
    title: { fontSize: '32px', fontWeight: '700', lineHeight: '1.2', margin: '0 0 12px 0', letterSpacing: '-0.5px', color: isDark ? '#ffffff' : '#0f172a' },
    gradientText: { background: isDark ? 'linear-gradient(90deg, #c084fc 0%, #67e8f9 100%)' : 'linear-gradient(90deg, #a855f7 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    gradientText2: { background: isDark ? 'linear-gradient(90deg, #67e8f9 0%, #3b82f6 100%)' : 'linear-gradient(90deg, #06b6d4 0%, #2563eb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    subtitle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: '15px', margin: '0 0 32px 0', lineHeight: '1.5' },
    form: { textAlign: 'left' },
    inputGroup: { marginBottom: '20px' },
    labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    label: { display: 'block', fontSize: '13px', fontWeight: '500', color: isDark ? '#cbd5e1' : '#475569', marginBottom: '8px' },
    forgotLink: { fontSize: '12px', color: isDark ? '#67e8f9' : '#0891b2', textDecoration: 'none', fontWeight: '500' },
    input: { width: '100%', padding: '14px 16px', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.02)', border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)', borderRadius: '12px', color: isDark ? '#ffffff' : '#0f172a', fontSize: '15px', boxSizing: 'border-box', outline: 'none', transition: 'all 0.3s ease' },
    loginBtn: { width: '100%', padding: '14px', backgroundColor: isDark ? '#ffffff' : '#0f172a', color: isDark ? '#050508' : '#ffffff', border: 'none', borderRadius: '30px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '10px', transition: 'all 0.3s ease' },
    logoutBtn: { width: '100%', padding: '14px', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '30px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '20px', transition: 'all 0.3s ease' },
    infoBox: { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.02)', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(15,23,42,0.06)', borderRadius: '12px', padding: '16px', textAlign: 'left', fontSize: '14px' },
    dividerContainer: { display: 'flex', alignItems: 'center', margin: '24px 0' },
    dividerLine: { flex: 1, height: '1px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)' },
    dividerText: { fontSize: '12px', color: isDark ? '#64748b' : '#94a3b8', padding: '0 12px' },
    googleBtn: { width: '100%', padding: '12px', backgroundColor: 'transparent', color: isDark ? '#ffffff' : '#0f172a', border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(15, 23, 42, 0.15)', borderRadius: '30px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' },
    switchAuth: { marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '14px' },
    switchBtn: { background: 'transparent', border: 'none', color: '#06b6d4', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
});