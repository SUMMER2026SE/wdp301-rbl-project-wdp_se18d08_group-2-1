import { useState, useRef, useEffect } from "react";
import {
  WandSparkles,
  Upload,
  DollarSign,
  Send,
  Camera,
  MapPin,
  Star,
  Award,
  ChevronRight,
  User,
  Bot,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Swal from "sweetalert2";
import { aiRecommendService } from "../services/aiRecommendService";
import PhotographerDrawer from "../components/photographers/PhotographerDrawer";

export default function AiSearchPage({ language = "vi", theme = "dark" }) {
  const isDark = theme === "dark";
  const fileInputRef = useRef(null);

  // States
  const [messages, setMessages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(false);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPhotographerId, setSelectedPhotographerId] = useState(null);

  const t = {
    vi: {
      botWelcome:
        "Xin chào! Tôi là **Trợ lý AI của PhotoHub**. Hãy gửi cho tôi một hình ảnh tham chiếu về phong cách chụp mà bạn mong muốn, và (tùy chọn) đặt ngân sách tối đa. Tôi sẽ quét hàng ngàn portfolio của các nhiếp ảnh gia để tìm ra người phù hợp nhất với bạn!",
      imagePrompt: "Tải lên phong cách của bạn",
      budgetPrompt: "Ngân sách tối đa (VNĐ)",
    budgetPlaceholder: "Không giới hạn",
      limitLabel: "Số kết quả",
      btnSend: "Tìm kiếm",
      btnSending: "Đang phân tích phong cách...",
      userMessageLabel: "Đã yêu cầu tìm kiếm nhiếp ảnh gia khớp phong cách:",
      aiResponseLabel: "Dưới đây là các nhiếp ảnh gia phù hợp nhất mà tôi tìm thấy dành cho bạn:",
      matchScore: "Độ phù hợp",
      experience: "Kinh nghiệm",
      viewProfile: "Xem hồ sơ",
      unlimited: "Không giới hạn",
      errorSearch: "Rất tiếc, tôi gặp lỗi khi phân tích hình ảnh này. Bạn hãy thử lại hoặc thử hình ảnh khác nhé.",
      scanning: "Đang trích xuất đặc trưng thị giác...",
      vectorMatching: "Đang đối chiếu vector trên MongoDB Atlas...",
    },
    en: {
      botWelcome:
        "Hello! I am your **PhotoHub AI Assistant**. Send me a reference image of the photography style you desire, and (optional) set a maximum budget. I will scan thousands of photographer portfolios to find the perfect match for you!",
      imagePrompt: "Upload your style",
      budgetPrompt: "Maximum Budget (USD/VNĐ)",
      budgetPlaceholder: "Unlimited",
      limitLabel: "Results",
      btnSend: "Search",
      btnSending: "Analyzing style...",
      userMessageLabel: "Requested photographer matchmaking for style:",
      aiResponseLabel: "Here are the best matching photographers I found for you:",
      matchScore: "Match score",
      experience: "Exp",
      viewProfile: "View Profile",
      unlimited: "Unlimited",
      errorSearch: "Sorry, I encountered an error analyzing this image. Please try again with another image.",
      scanning: "Extracting visual features...",
      vectorMatching: "Matching vectors on MongoDB Atlas...",
    },
  }[language] || {
    vi: {},
    en: {},
  };

  // Initialize chatbot conversation
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        sender: "bot",
        text: t.botWelcome,
        timestamp: new Date(),
      },
    ]);
  }, [language]);

  const handleFileChange = (e) => {
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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu ảnh mẫu",
        text: language === "vi" ? "Vui lòng đính kèm một hình ảnh mẫu để phân tích." : "Please upload a reference image to analyze.",
        background: isDark ? "#09090b" : "#fff",
        color: isDark ? "#fff" : "#000",
        confirmButtonColor: "#06b6d4",
      });
      return;
    }

    const currentPreview = previewUrl;
    const currentBudget = maxBudget;
    const currentFile = selectedFile;

    // 1. Append User Message
    const userMsgId = `user_${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      sender: "user",
      text: `${t.userMessageLabel} ${currentBudget ? Number(currentBudget).toLocaleString() + " VNĐ" : t.unlimited}`,
      image: currentPreview,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Clear input panel immediately
    setSelectedFile(null);
    setPreviewUrl("");
    setMaxBudget("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // 2. Add loading AI Message
    const botLoadingId = `bot_load_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: botLoadingId,
        sender: "bot",
        isLoading: true,
        timestamp: new Date(),
      },
    ]);

    setLoading(true);

    try {
      // 3. Call search API
      const res = await aiRecommendService.searchByImage(
        currentFile,
        currentBudget ? Number(currentBudget) : null,
        limit
      );

      // Remove loading message & append actual results
      setMessages((prev) => prev.filter((m) => m.id !== botLoadingId));

      if (res.success && res.data?.results) {
        if (res.data.results.length === 0) {
          setMessages((prev) => [
            ...prev,
            {
              id: `bot_res_${Date.now()}`,
              sender: "bot",
              text: language === "vi" ? "Không tìm thấy photographer phù hợp với bạn." : "No matching photographers found for you.",
              timestamp: new Date(),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `bot_res_${Date.now()}`,
              sender: "bot",
              text: t.aiResponseLabel,
              results: res.data.results,
              timestamp: new Date(),
            },
          ]);
        }
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      console.error("AI Search Error:", err);
      setMessages((prev) => prev.filter((m) => m.id !== botLoadingId));
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: "bot",
          text: t.errorSearch,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (photographerId) => {
    setSelectedPhotographerId(photographerId);
    setDrawerOpen(true);
  };

  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `http://localhost:3000${url}`;
  };

  return (
    <div
      className={`min-h-screen pt-28 pb-6 px-4 flex flex-col justify-between transition-colors duration-300 ${
        isDark ? "bg-[#020617] text-white" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 dark:bg-orange-500/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/[0.02] rounded-full blur-3xl pointer-events-none" />

      {/* Main Chat Interface */}
      <div className="flex-1 max-w-4xl w-full mx-auto flex flex-col bg-white/40 dark:bg-slate-950/40 border border-slate-200/50 dark:border-zinc-800/80 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-md relative">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-200/50 dark:border-zinc-800/80 flex items-center justify-between bg-white/20 dark:bg-slate-950/20">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-lg shadow-orange-500/5">
              <WandSparkles className="h-5 w-5 animate-pulse" />
            </span>
            <div>
              <h1 className="text-base font-black tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-zinc-200 dark:to-zinc-400">
                PhotoHub AI Assistant
              </h1>
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                Active Matchmaker
              </p>
            </div>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-[400px] max-h-[550px] relative">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar Icon */}
              <div
                className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center border transition-all
                  ${
                    msg.sender === "user"
                      ? "bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-800"
                      : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                  }
                `}
              >
                {msg.sender === "user" ? <User size={18} /> : <Bot size={18} />}
              </div>

              {/* Message content */}
              <div className="space-y-3 max-w-[85%]">
                <div
                  className={`rounded-3xl p-4 text-sm font-medium leading-relaxed shadow-md border
                    ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white border-transparent"
                        : "bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-200"
                    }
                  `}
                >
                  <p>{msg.text}</p>

                  {/* Render User Attached Image */}
                  {msg.image && (
                    <div className="mt-3 rounded-2xl overflow-hidden max-w-[240px] border border-white/20 shadow-md">
                      <img src={msg.image} alt="Ref style" className="w-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Render AI Scanning loader */}
                {msg.isLoading && (
                  <div className="rounded-3xl p-5 border border-orange-500/10 bg-orange-500/[0.02] flex flex-col gap-4 max-w-[320px] shadow-lg">
                    {/* Visual scan pulse */}
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-orange-500/20 bg-slate-900 flex items-center justify-center text-orange-400">
                      <Camera size={32} className="opacity-40 animate-pulse" />
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,1)] animate-scanLine" />
                    </div>
                    <div className="space-y-2 text-xs font-semibold tracking-wide text-orange-400">
                      <p className="flex items-center gap-2">
                        <RefreshCw size={12} className="animate-spin" />
                        {t.scanning}
                      </p>
                      <p className="flex items-center gap-2">
                        <Sparkles size={12} className="animate-pulse" />
                        {t.vectorMatching}
                      </p>
                    </div>
                  </div>
                )}

                {/* Render Match Results list */}
                {msg.results && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {msg.results.map((result) => {
                      const { photographer: pg, portfolio: port } = result;
                      return (
                        <div
                          key={pg._id}
                          className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-500/20 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-purple-500/20"
                        >
                          {/* Image matching style */}
                          <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-zinc-950">
                            <img
                              src={getFullUrl(port.image_url)}
                              alt={pg.displayName}
                              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                            />
                            {/* Match percent badge */}
                            <div className="absolute top-3 left-3 flex items-center gap-1 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-black text-white shadow-md shadow-orange-500/20">
                              <Sparkles size={12} />
                              {port.match_percent}% Match
                            </div>
                          </div>

                          {/* Info */}
                          <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">
                                {pg.displayName}
                              </h4>
                              {pg.location && (
                                <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mt-1">
                                  <MapPin size={10} />
                                  {pg.location}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                              <span className="flex items-center gap-1 bg-amber-500/5 border border-amber-500/10 px-2 py-1 rounded-lg text-amber-500">
                                <Star size={11} className="fill-amber-500" />
                                {pg.averageRating ? pg.averageRating.toFixed(1) : "5.0"}
                              </span>
                              <span className="flex items-center gap-1 bg-emerald-500/5 border border-emerald-500/10 px-2 py-1 rounded-lg text-emerald-500">
                                <Award size={11} />
                                {pg.experienceYears || 0} {language === "vi" ? "năm" : "yrs"}
                              </span>
                            </div>

                            <button
                              onClick={() => handleOpenDrawer(pg._id)}
                              className="w-full flex items-center justify-center gap-1 rounded-2xl bg-slate-100 hover:bg-orange-500 dark:bg-zinc-800 hover:dark:bg-orange-500 py-2.5 text-xs font-bold text-slate-700 hover:text-white dark:text-zinc-200 transition-colors"
                            >
                              {t.viewProfile}
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Panel */}
        <form
          onSubmit={handleSend}
          className="p-4 border-t border-slate-200/50 dark:border-zinc-800/80 bg-white/20 dark:bg-slate-950/20 flex flex-col gap-3"
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Image Upload Input */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <div
                onClick={triggerFileSelect}
                className={`border border-dashed rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer transition-all duration-300
                  ${
                    previewUrl
                      ? "border-orange-500 bg-orange-500/[0.02] text-orange-400"
                      : "border-slate-200 dark:border-zinc-800 hover:border-orange-500 hover:bg-slate-50 dark:hover:bg-zinc-900/40 text-slate-500"
                  }
                `}
              >
                {previewUrl ? (
                  <div className="h-8 w-8 rounded-lg overflow-hidden shrink-0 border border-orange-500/20">
                    <img src={previewUrl} alt="Upload preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <Upload size={16} />
                )}
                <span className="text-xs font-bold truncate">
                  {selectedFile ? selectedFile.name : t.imagePrompt}
                </span>
              </div>
            </div>

          {/* Budget Input */}
            <div className="w-full sm:w-44 relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="number"
                min="0"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="w-full rounded-2xl pl-10 pr-4 py-3 outline-none border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:bg-white dark:focus:bg-[#030303] transition-all"
                placeholder={t.budgetPlaceholder}
              />
            </div>

            {/* Limit selector */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 whitespace-nowrap">{t.limitLabel}:</span>
              <div className="flex rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                {[3, 5, 8, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setLimit(n)}
                    className={`px-3 py-2.5 text-xs font-black transition-all ${
                      limit === n
                        ? "bg-orange-500 text-white"
                        : "text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={loading || !selectedFile}
              className={`rounded-2xl p-3.5 flex items-center justify-center font-bold transition-all shadow-md shadow-orange-500/10 select-none
                ${
                  !selectedFile || loading
                    ? "bg-slate-100 dark:bg-zinc-900 text-slate-400 border border-slate-200 dark:border-zinc-800 cursor-not-allowed shadow-none"
                    : "bg-orange-500 hover:bg-orange-600 text-white active:scale-95"
                }
              `}
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Drawer */}
      <PhotographerDrawer
        photographerId={selectedPhotographerId}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        language={language}
      />
    </div>
  );
}
