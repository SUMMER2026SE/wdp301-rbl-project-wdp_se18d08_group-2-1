import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  CreditCard,
  Eye,
  Loader2,
  MapPin,
  Sparkles,
  X,
  Users,
} from "lucide-react";
import { photographerService } from "../services/photographerService";
import { getPhotographerPackages, getPackageDetail } from "../services/photographerPackageService";
import { subscriptionService } from "../services/subscriptionService";
import Swal from "sweetalert2";

const formatMoney = (value) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0));

const resolveAvatar = (avatar) => {
  if (!avatar) return "";
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return `https://wdp301-rbl-project-wdp-se18d08-group-2-1.onrender.com${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
};

const resolveImageUrl = (image) => {
  const raw = typeof image === "string" ? image : image?.imageUrl || image?.secure_url || image?.url || "";
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `https://wdp301-rbl-project-wdp-se18d08-group-2-1.onrender.com${raw}`;
  return `https://wdp301-rbl-project-wdp-se18d08-group-2-1.onrender.com/${raw}`;
};

const normalizePlanStatus = (plan) => String(plan?.status || "ACTIVE").toUpperCase();
const isPlanBookable = (plan) => normalizePlanStatus(plan) === "ACTIVE" && plan?.subscriptionPackageActive !== false;

export default function SubscriptionPage({ language = "vi", theme = "dark" }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const photographerId = searchParams.get("photographerId") || "";
  const planIdFromQuery = searchParams.get("planId") || "";

  const [selectedPhotographer, setSelectedPhotographer] = useState(null);
  const [monthlyPackages, setMonthlyPackages] = useState([]);
  const [featuredPhotographers, setFeaturedPhotographers] = useState([]);
  const [subscriptionPackages, setSubscriptionPackages] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedPlanDetail, setSelectedPlanDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showPlanDetailModal, setShowPlanDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [purchasingPlanId, setPurchasingPlanId] = useState("");
  const [error, setError] = useState("");

  const t = useMemo(
    () =>
    ({
      vi: {
        eyebrow: "Hội viên PhotoHub",
        title: "Hợp đồng tháng theo từng photographer",
        subtitle:
          "Mỗi photographer có hợp đồng tháng riêng. Trang này đóng vai trò giới thiệu và dẫn người dùng tới đúng photographer để xem gói phù hợp.",
        stepsTitle: "Luồng hợp lý",
        step1: "Chọn photographer",
        step2: "Xem hợp đồng tháng riêng",
        step3: "Mở hồ sơ hoặc tiếp tục ký hợp đồng",
        selected: "Photographer đang xem",
        monthlyPlans: "Hợp đồng tháng công khai",
        featured: "Photographer nổi bật",
        openProfile: "Mở hồ sơ",
        viewPlans: "Xem hợp đồng tháng",
        explore: "Khám phá photographer",
        loginHint: "Nếu gói tháng chưa hiện ra, hãy đăng nhập để xem dữ liệu công khai của photographer.",
        emptyPlans: "Photographer này chưa có hợp đồng tháng công khai.",
        noPhotographer:
          "Chưa chọn photographer nào. Hãy vào danh sách nhiếp ảnh gia để chọn người phù hợp rồi xem gói tháng của họ.",
        backToList: "Xem danh sách nhiếp ảnh gia",
      },
      en: {
        eyebrow: "PhotoHub Membership",
        title: "Monthly contracts are tied to each photographer",
        subtitle:
          "This page is an entry point, not a global package catalog. Pick a photographer to see their recurring contract and continue from there.",
        stepsTitle: "Recommended flow",
        step1: "Choose a photographer",
        step2: "View their monthly contract",
        step3: "Open the profile or continue the contract",
        selected: "Current photographer",
        monthlyPlans: "Public monthly contracts",
        featured: "Featured photographers",
        openProfile: "Open profile",
        viewPlans: "View monthly contract",
        explore: "Explore photographers",
        loginHint: "If plans are missing, sign in to view the photographer's public data.",
        emptyPlans: "This photographer does not have a public monthly contract yet.",
        noPhotographer: "No photographer selected yet. Open the photographer list and choose one to continue.",
        backToList: "Browse photographers",
      },
    }[language] || {}),
    [language]
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        if (photographerId) {
          const [photographerRes, packagesRes, subscriptionRes] = await Promise.all([
            photographerService.getPhotographerDetail(photographerId),
            getPhotographerPackages(photographerId, { packageType: "MONTHLY" }),
            subscriptionService.getPackages().catch(() => ({ data: [] })),
          ]);
          if (!mounted) return;
          setSelectedPhotographer(photographerRes?.data || photographerRes?.photographer || photographerRes || null);

          const plans =
            packagesRes?.data?.data ||
            packagesRes?.data ||
            packagesRes?.packages ||
            [];
          const list = Array.isArray(plans) ? plans : [];

          const subscriptionList =
            subscriptionRes?.data?.data ||
            subscriptionRes?.data ||
            subscriptionRes?.packages ||
            [];
          const normalizedSubscriptions = Array.isArray(subscriptionList) ? subscriptionList : [];
          setSubscriptionPackages(normalizedSubscriptions);

          const enriched = list.map((item) => {
            const matched = normalizedSubscriptions.find(
              (sp) => String(sp?.metadata?.sourcePackageId || "") === String(item._id)
            );
            return {
              ...item,
              subscriptionPackageId: matched?._id || "",
              subscriptionPackageActive: Boolean(matched) && matched?.isActive !== false,
              previewImages: Array.isArray(item.images) ? item.images : [],
            };
          });

          setMonthlyPackages(enriched);
          setSelectedPlanId(
            planIdFromQuery && enriched.some((plan) => String(plan._id) === String(planIdFromQuery))
              ? planIdFromQuery
              : (enriched[0]?._id || "")
          );
        } else {
          const topRes = await photographerService.getTopPhotographers(4);
          if (!mounted) return;
          const list = Array.isArray(topRes?.data) ? topRes.data : topRes?.data?.data || [];
          setFeaturedPhotographers(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || "Failed to load membership data");
      } finally {
        if (mounted) setLoading(false);
        if (mounted) setPackagesLoading(false);
      }
    };

    setPackagesLoading(Boolean(photographerId));
    load();

    return () => {
      mounted = false;
    };
  }, [photographerId, planIdFromQuery]);

  const selectedPlan = selectedPlanDetail || monthlyPackages.find((item) => String(item._id) === String(selectedPlanId)) || monthlyPackages[0] || null;
  const selectedPlanImages = Array.isArray(selectedPlan?.images) && selectedPlan.images.length > 0
    ? selectedPlan.images
    : Array.isArray(selectedPlan?.previewImages)
      ? selectedPlan.previewImages
      : [];
  const openPlans = useMemo(() => monthlyPackages.filter((plan) => isPlanBookable(plan)), [monthlyPackages]);
  const closedPlans = useMemo(() => monthlyPackages.filter((plan) => !isPlanBookable(plan)), [monthlyPackages]);

  useEffect(() => {
    if (!selectedPlanId && monthlyPackages.length > 0) {
      const firstOpen = monthlyPackages.find((plan) => isPlanBookable(plan));
      setSelectedPlanId(firstOpen?._id || monthlyPackages[0]._id);
    }
  }, [monthlyPackages, selectedPlanId]);

  useEffect(() => {
    let mounted = true;

    const loadDetail = async () => {
      if (!selectedPlanId) {
        setSelectedPlanDetail(null);
        return;
      }

      const localPlan = monthlyPackages.find((item) => String(item._id) === String(selectedPlanId));
      if (!localPlan) {
        setSelectedPlanDetail(null);
        return;
      }

      setDetailLoading(true);
      try {
        const res = await getPackageDetail(selectedPlanId);
        if (!mounted) return;
        setSelectedPlanDetail(res?.data?.data || res?.data || res || localPlan);
      } catch (_error) {
        if (!mounted) return;
        setSelectedPlanDetail(localPlan);
      } finally {
        if (mounted) setDetailLoading(false);
      }
    };

    loadDetail();

    return () => {
      mounted = false;
    };
  }, [selectedPlanId, monthlyPackages]);

  const handlePurchasePlan = async (plan) => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: language === "vi" ? "Cần đăng nhập" : "Login required",
        text: language === "vi" ? "Hãy đăng nhập để đăng ký gói tháng." : "Please sign in to subscribe to a monthly plan.",
        confirmButtonColor: "#f97316",
      }).then((result) => {
        if (result.isConfirmed) navigate("/login");
      });
      return;
    }

    if (!isPlanBookable(plan)) {
      Swal.fire({
        icon: "info",
        title: language === "vi" ? "Gói đã đóng" : "Plan closed",
        text: language === "vi" ? "Gói tháng này đã đóng nên không thể đặt nữa." : "This monthly plan is closed and cannot be purchased.",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    const resolvedPhotographerId = plan?.photographerId || selectedPhotographer?._id || photographerId;
    const resolvedSubscriptionPackageId =
      plan?.subscriptionPackageId ||
      subscriptionPackages.find((sp) => String(sp?.metadata?.sourcePackageId || "") === String(plan?._id))?._id ||
      "";
    if (!resolvedSubscriptionPackageId || !resolvedPhotographerId) {
      Swal.fire({
        icon: "warning",
        title: language === "vi" ? "Thiếu thông tin" : "Missing info",
        text: language === "vi" ? "Không xác định được gói đăng ký tương ứng." : "Unable to resolve the matching subscription package.",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    setPurchasingPlanId(plan._id);
    try {
      const startDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const res = await subscriptionService.createSubscription({
        packageId: resolvedSubscriptionPackageId,
        photographerId: resolvedPhotographerId,
        startDate,
        commitmentMonths: Number(plan.commitmentMonths || 1),
        sessionsPerMonth: Number(plan.sessionsPerMonth || 1),
        autoRenew: true,
        preferredSchedule: [],
      });

      const data = res?.data || res;
      const orderCode = data?.payment?.orderCode;
      const checkoutUrl = data?.paymentLink?.checkoutUrl || data?.paymentLink?.paymentLink || data?.paymentLink?.checkout_url || data?.paymentLink?.payment_link || data?.paymentLink?.url;
      const provider = data?.paymentLink?.provider;

      Swal.fire({
        icon: "success",
        title: language === "vi" ? "Đã tạo đăng ký" : "Subscription created",
        text: language === "vi" ? "Đang chuyển sang thanh toán..." : "Redirecting to payment...",
        confirmButtonColor: "#f97316",
      });

      if (provider === "MOCK" && orderCode) {
        navigate(`/payment/result?orderCode=${orderCode}&source=subscription&mock=true`);
        return;
      }

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      if (orderCode) {
        navigate(`/payment/result?orderCode=${orderCode}&source=subscription`);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: language === "vi" ? "Không thể tạo đăng ký" : "Unable to subscribe",
        text: err.response?.data?.message || err.message,
        confirmButtonColor: "#f97316",
      });
    } finally {
      setPurchasingPlanId("");
    }
  };

  const renderPhotographerCard = (photographer) => {
    const avatar = resolveAvatar(photographer?.user?.avatar || photographer?.avatar);
    return (
      <div
        key={photographer._id}
        className={`rounded-[28px] border p-5 shadow-lg transition hover:-translate-y-1 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-orange-100 bg-white shadow-orange-100/60"
          }`}
      >
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 overflow-hidden rounded-2xl bg-orange-500/10">
            {avatar ? (
              <img src={avatar} alt={photographer.displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-black text-orange-500">
                {(photographer.displayName || "P").charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-black text-slate-900 dark:text-white">{photographer.displayName}</p>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <MapPin size={14} />
              <span className="truncate">{photographer.location || "Vietnam"}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <Camera size={16} className="text-orange-500" />
          <span>{photographer.averageRating?.toFixed?.(1) || photographer.averageRating || "0.0"}</span>
          <span className="text-slate-400">•</span>
          <span>{photographer.completedBookings || 0} bookings</span>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/photographers/${photographer._id}`)}
            className="flex-1 rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm font-bold text-orange-600 transition hover:border-orange-400 hover:bg-orange-500 hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            {t.openProfile}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/subscriptions?photographerId=${photographer._id}`)}
            className="flex-1 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:brightness-110"
          >
            {t.viewPlans}
          </button>
        </div>
      </div>
    );
  };

  const renderPlanCard = (pkg) => {
    const bookable = isPlanBookable(pkg);
    const statusLabel = bookable
      ? (language === "vi" ? "Đang mở" : "Open")
      : (language === "vi" ? "Đã đóng" : "Closed");
    const statusClass = bookable
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-300 dark:border-emerald-500/20"
      : "bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-300 dark:border-white/10";

    return (
      <div
        key={pkg._id}
        className={`rounded-[24px] border p-5 transition hover:-translate-y-1 ${String(selectedPlanId) === String(pkg._id) ? "border-orange-400 bg-orange-50/70 shadow-lg shadow-orange-500/10 dark:bg-orange-500/10" : isDark ? "border-white/10 bg-black/20" : "border-orange-100 bg-orange-50/40"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">
              {pkg.code || "PLAN"}
            </p>
            <h4 className="mt-1 break-words text-xl font-black">{pkg.title}</h4>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${statusClass}`}>
              {statusLabel}
            </span>
            <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-black text-orange-600">
              VNĐ {formatMoney(pkg.price)}
            </span>
          </div>
        </div>

        <p className={`mt-3 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          {pkg.description || t.emptyPlans}
        </p>

        {Array.isArray(pkg.previewImages) && pkg.previewImages.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {pkg.previewImages.slice(0, 3).map((img, index) => {
              const url = resolveImageUrl(img);
              if (!url) return null;
              return (
                <img
                  key={`${pkg._id}-${index}`}
                  src={url}
                  alt={pkg.title}
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-orange-200 dark:ring-white/10"
                />
              );
            })}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500 dark:text-slate-300">
          <span className={`rounded-full px-3 py-1 ${isDark ? "bg-white/5" : "bg-white"}`}>
            {pkg.commitmentMonths || 1} {language === "vi" ? "tháng cam kết" : "months commitment"}
          </span>
          <span className={`rounded-full px-3 py-1 ${isDark ? "bg-white/5" : "bg-white"}`}>
            {pkg.sessionsPerMonth || 1} {language === "vi" ? "buổi/tháng" : "sessions/month"}
          </span>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedPlanId(pkg._id);
              setShowPlanDetailModal(true);
            }}
            className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-bold transition ${String(selectedPlanId) === String(pkg._id) ? "border-orange-500 bg-orange-500 text-white" : "border-orange-200 bg-white text-orange-600 hover:border-orange-400 hover:bg-orange-50 dark:border-white/10 dark:bg-white/5 dark:text-white"}`}
          >
            <span className="inline-flex items-center gap-2">
              <Eye size={16} />
              {language === "vi" ? "Xem chi tiết" : "View details"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handlePurchasePlan(pkg)}
            disabled={!bookable || purchasingPlanId === pkg._id}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${bookable
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-500/20 hover:brightness-110"
                : "border border-slate-200 bg-slate-100 text-slate-500 shadow-none dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              }`}
          >
            {purchasingPlanId === pkg._id ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CreditCard size={16} />
            )}
            {bookable ? (language === "vi" ? "Đăng ký" : "Subscribe") : (language === "vi" ? "Đã đóng" : "Closed")}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen px-4 pb-16 pt-28 transition-colors duration-300 ${isDark ? "bg-[#050816] text-white" : "bg-[#fffaf6] text-slate-900"}`}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className={`overflow-hidden rounded-[32px] border p-8 shadow-2xl ${isDark ? "border-white/10 bg-white/[0.03]" : "border-orange-100 bg-white shadow-orange-100/60"}`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-orange-500">
              <Sparkles size={14} />
              {t.eyebrow}
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${isDark ? "bg-white/5 text-slate-300" : "bg-orange-50 text-slate-600"}`}>
              <Users size={14} className="text-emerald-500" />
              Photographer-specific
            </span>
          </div>

          <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">{t.title}</h1>
          <p className={`mt-3 max-w-4xl text-sm leading-7 sm:text-base ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            {t.subtitle}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { title: t.step1, description: language === "vi" ? "Vào trang Nhiếp ảnh gia để chọn đúng người phù hợp." : "Browse photographers and pick the right one." },
              { title: t.step2, description: language === "vi" ? "Gói tháng nằm trên hồ sơ từng photographer, không phải catalog chung." : "Monthly plans live on each photographer profile." },
              { title: t.step3, description: language === "vi" ? "Từ hồ sơ, bạn mở gói tháng hoặc quay về đặt lịch chụp." : "From the profile, continue to plan details or booking." },
            ].map((item) => (
              <div
                key={item.title}
                className={`rounded-[24px] border p-5 ${isDark ? "border-white/10 bg-black/20" : "border-orange-100 bg-orange-50/50"}`}
              >
                <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">{item.title}</p>
                <p className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {photographerId ? (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className={`rounded-[32px] border p-6 shadow-xl ${isDark ? "border-white/10 bg-white/[0.03]" : "border-orange-100 bg-white"}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">{t.selected}</p>
                  <h2 className="mt-2 text-2xl font-black">{selectedPhotographer?.displayName || "Photographer"}</h2>
                  <p className={`mt-2 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {selectedPhotographer?.bio || t.noPhotographer}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/photographers/${photographerId}`)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-bold text-orange-600 transition hover:border-orange-400 hover:bg-orange-500 hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  {t.openProfile}
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="mt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-black">{t.monthlyPlans}</h3>
                  {packagesLoading && <Loader2 className="animate-spin text-orange-500" size={18} />}
                </div>

                {error ? (
                  <div className={`rounded-2xl border p-4 text-sm ${isDark ? "border-red-500/20 bg-red-500/10 text-red-200" : "border-red-100 bg-red-50 text-red-700"}`}>
                    {error}
                  </div>
                ) : loading || packagesLoading ? (
                  <div className={`rounded-2xl border border-dashed p-6 text-sm ${isDark ? "border-white/10 text-slate-400" : "border-orange-200 text-slate-500"}`}>
                    {language === "vi" ? "Đang tải gói tháng..." : "Loading monthly plans..."}
                  </div>
                ) : monthlyPackages.length > 0 ? (
                  <div className="space-y-6">
                    {openPlans.length > 0 && (
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-sm font-black uppercase tracking-[0.18em] text-emerald-500">
                            {language === "vi" ? "Có thể đặt" : "Bookable plans"}
                          </h4>
                          <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            {language === "vi" ? "Đang mở bán" : "Open for purchase"}
                          </span>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          {openPlans.map(renderPlanCard)}
                        </div>
                      </div>
                    )}

                    {closedPlans.length > 0 && (
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                            {language === "vi" ? "Đã đóng" : "Closed plans"}
                          </h4>
                          <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                            {language === "vi" ? "Không thể đặt" : "Not bookable"}
                          </span>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          {closedPlans.map(renderPlanCard)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`rounded-2xl border border-dashed p-6 text-sm ${isDark ? "border-white/10 text-slate-400" : "border-orange-200 text-slate-500"}`}>
                    {t.emptyPlans}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className={`rounded-[32px] border p-6 shadow-xl ${isDark ? "border-white/10 bg-white/[0.03]" : "border-orange-100 bg-white"}`}>
                <h3 className="text-lg font-black">{t.loginHint}</h3>
                <p className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{t.noPhotographer}</p>
                <Link
                  to="/photographers"
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm font-bold text-orange-600 transition hover:border-orange-400 hover:bg-orange-500 hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  {t.backToList}
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className={`rounded-[32px] border p-6 shadow-xl ${isDark ? "border-white/10 bg-white/[0.03]" : "border-orange-100 bg-white"}`}>
                <h3 className="mb-4 text-lg font-black">{t.explore}</h3>
                <div className="space-y-4">
                  {featuredPhotographers.map((photographer) => renderPhotographerCard(photographer))}
                </div>

                {selectedPlan && (
                  <div className={`mt-5 rounded-[24px] border p-5 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-orange-100 bg-orange-50/40"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">
                          {language === "vi" ? "Gói đang chọn" : "Selected plan"}
                        </p>
                        <h4 className="mt-1 text-xl font-black">{selectedPlan.title}</h4>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                        <CheckCircle2 size={14} />
                        {language === "vi" ? "Sẵn sàng đăng ký" : "Ready to subscribe"}
                      </span>
                    </div>
                    <p className={`mt-3 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      {selectedPlan.description || t.emptyPlans}
                    </p>
                    {detailLoading && (
                      <div className={`mt-4 rounded-2xl border border-dashed p-4 text-sm ${isDark ? "border-white/10 text-slate-400" : "border-orange-200 text-slate-500"}`}>
                        {language === "vi" ? "Đang tải ảnh chi tiết..." : "Loading detail images..."}
                      </div>
                    )}
                    {!detailLoading && Array.isArray(selectedPlan.images || selectedPlan.previewImages) && (selectedPlan.images || selectedPlan.previewImages).length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {(selectedPlan.images || selectedPlan.previewImages).slice(0, 3).map((img, index) => {
                          const url = resolveImageUrl(img);
                          if (!url) return null;
                          return (
                            <div key={`${selectedPlan._id}-preview-${index}`} className="overflow-hidden rounded-2xl bg-white dark:bg-white/5">
                              <img src={url} alt={selectedPlan.title} className="h-28 w-full object-cover" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-200">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{language === "vi" ? "Giá" : "Price"}</div>
                        <div className="mt-1 text-lg font-black text-orange-600 dark:text-orange-300">{formatMoney(selectedPlan.price)} VNĐ</div>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-200">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{language === "vi" ? "Cam kết" : "Commitment"}</div>
                        <div className="mt-1 text-lg font-black">{selectedPlan.commitmentMonths || 1} {language === "vi" ? "tháng" : "months"}</div>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-200">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{language === "vi" ? "Buổi/tháng" : "Sessions/mo"}</div>
                        <div className="mt-1 text-lg font-black">{selectedPlan.sessionsPerMonth || 1}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePurchasePlan(selectedPlan)}
                      disabled={purchasingPlanId === selectedPlan._id}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {purchasingPlanId === selectedPlan._id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <CreditCard size={16} />
                      )}
                      {language === "vi" ? "Đăng ký gói tháng này" : "Subscribe to this plan"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className={`rounded-[32px] border p-6 shadow-xl ${isDark ? "border-white/10 bg-white/[0.03]" : "border-orange-100 bg-white"}`}>
              <h2 className="text-2xl font-black">{t.featured}</h2>
              <p className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                {language === "vi"
                  ? "Chọn photographer phù hợp trước, sau đó mở gói tháng riêng của họ."
                  : "Pick a photographer first, then open their monthly plan."}
              </p>
              <Link
                to="/photographers"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:brightness-110"
              >
                {t.backToList}
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {featuredPhotographers.map((photographer) => renderPhotographerCard(photographer))}
            </div>
          </div>
        )}

        {showPlanDetailModal && selectedPlan && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
            onClick={() => setShowPlanDetailModal(false)}
          >
            <div
              className={`relative w-full max-w-4xl overflow-hidden rounded-[32px] border shadow-2xl ${isDark ? "border-white/10 bg-[#09111f] text-white" : "border-orange-100 bg-white text-slate-900"
                }`}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowPlanDetailModal(false)}
                className={`absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${isDark
                    ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                    : "border-orange-100 bg-white text-slate-700 hover:bg-orange-50"
                  }`}
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                <div className={`p-6 sm:p-8 ${isDark ? "bg-white/[0.03]" : "bg-orange-50/40"}`}>
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-orange-600">
                      {selectedPlan.code || "PLAN"}
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                      {language === "vi" ? "Xem chi tiết gói tháng" : "Monthly plan details"}
                    </span>
                  </div>

                  <h3 className="mt-4 text-2xl font-black sm:text-3xl">{selectedPlan.title}</h3>
                  <p className={`mt-3 text-sm leading-7 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {selectedPlan.description || t.emptyPlans}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className={`rounded-2xl border px-4 py-3 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-orange-100 bg-white"}`}>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{language === "vi" ? "Giá" : "Price"}</div>
                      <div className="mt-1 text-lg font-black text-orange-500">{formatMoney(selectedPlan.price)} VNĐ</div>
                    </div>
                    <div className={`rounded-2xl border px-4 py-3 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-orange-100 bg-white"}`}>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{language === "vi" ? "Cam kết" : "Commitment"}</div>
                      <div className="mt-1 text-lg font-black">{selectedPlan.commitmentMonths || 1} {language === "vi" ? "tháng" : "months"}</div>
                    </div>
                    <div className={`rounded-2xl border px-4 py-3 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-orange-100 bg-white"}`}>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{language === "vi" ? "Buổi/tháng" : "Sessions/mo"}</div>
                      <div className="mt-1 text-lg font-black">{selectedPlan.sessionsPerMonth || 1}</div>
                    </div>
                  </div>

                  {detailLoading ? (
                    <div className={`mt-6 rounded-2xl border border-dashed p-5 text-sm ${isDark ? "border-white/10 text-slate-400" : "border-orange-200 text-slate-500"}`}>
                      {language === "vi" ? "Đang tải ảnh chi tiết..." : "Loading detail images..."}
                    </div>
                  ) : selectedPlanImages.length > 0 ? (
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {selectedPlanImages.map((img, index) => {
                        const url = resolveImageUrl(img);
                        if (!url) return null;
                        return (
                          <a
                            key={`${selectedPlan._id}-modal-${index}`}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                          >
                            <img
                              src={url}
                              alt={`${selectedPlan.title} ${index + 1}`}
                              className="h-36 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-40"
                            />
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={`mt-6 rounded-2xl border border-dashed p-5 text-sm ${isDark ? "border-white/10 text-slate-400" : "border-orange-200 text-slate-500"}`}>
                      {language === "vi" ? "Chưa có ảnh chi tiết cho gói này." : "No detail images for this plan yet."}
                    </div>
                  )}
                </div>

                <div className={`flex flex-col justify-between gap-6 p-6 sm:p-8 ${isDark ? "bg-black/20" : "bg-white"}`}>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">
                      {language === "vi" ? "Tóm tắt" : "Summary"}
                    </p>
                    <p className={`mt-3 text-sm leading-7 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      {language === "vi"
                        ? "Bạn đang xem đúng gói tháng của photographer này. Nếu thấy phù hợp, có thể đăng ký ngay hoặc mở hồ sơ để xem thêm phong cách chụp."
                        : "You are viewing this photographer's monthly plan. Subscribe now or open the profile to explore more work."}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPlanDetailModal(false);
                        handlePurchasePlan(selectedPlan);
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:brightness-110"
                    >
                      <CreditCard size={16} />
                      {language === "vi" ? "Đăng ký gói này" : "Subscribe now"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPlanDetailModal(false);
                        navigate(`/photographers/${photographerId}`);
                      }}
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition ${isDark
                          ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                          : "border-orange-200 bg-white text-orange-600 hover:border-orange-400 hover:bg-orange-50"
                        }`}
                    >
                      <ArrowRight size={16} />
                      {language === "vi" ? "Mở hồ sơ photographer" : "Open photographer profile"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
