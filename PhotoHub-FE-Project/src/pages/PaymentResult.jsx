import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { photographerMarketplaceService } from "../services/photographerService";

export default function PaymentResult({ theme = "dark", language = "vi" }) {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState({ status: "checking", message: "" });
  const isDark = theme === "dark";
  const bookingId = searchParams.get("bookingId");
  const orderCode = searchParams.get("orderCode");
  const cancelled =
    searchParams.get("cancelled") === "true" ||
    searchParams.get("canceled") === "true" ||
    searchParams.get("cancel") === "true";

  const t = {
    vi: {
      checking: "Đang kiểm tra thanh toán...",
      success: "Thanh toán thành công",
      pending: "Chưa ghi nhận thanh toán",
      cancelled: "Bạn đã hủy thanh toán",
      missing: "Thiếu thông tin booking để kiểm tra thanh toán.",
      paid: "Booking đã được xác nhận và tiền đang được giữ an toàn trong ví ký quỹ.",
      notPaid: "Nếu bạn đã thanh toán, vui lòng đợi vài giây rồi tải lại trang.",
      back: "Quay lại trang chủ",
      dashboard: "Về dashboard",
    },
    en: {
      checking: "Checking payment...",
      success: "Payment successful",
      pending: "Payment not confirmed yet",
      cancelled: "Payment was cancelled",
      missing: "Missing booking information for payment verification.",
      paid: "Booking is confirmed and funds are safely held in escrow.",
      notPaid: "If you already paid, wait a few seconds and refresh this page.",
      back: "Back home",
      dashboard: "Go to dashboard",
    },
  }[language];

  useEffect(() => {
    const sync = async () => {
      if (cancelled) {
        setState({ status: "cancelled", message: t.cancelled });
        return;
      }

      if (!bookingId) {
        setState({ status: "error", message: t.missing });
        return;
      }

      try {
        const res = await photographerMarketplaceService.syncBookingPaymentStatus(bookingId, orderCode);
        if (res.data?.paid) {
          setState({ status: "success", message: t.paid });
        } else {
          setState({ status: "pending", message: t.notPaid });
        }
      } catch (error) {
        setState({
          status: "error",
          message: error.response?.data?.message || error.message || t.notPaid,
        });
      }
    };

    sync();
  }, [bookingId, cancelled, orderCode, t.cancelled, t.missing, t.notPaid, t.paid]);

  const Icon = state.status === "success" ? CheckCircle : state.status === "checking" ? Clock : XCircle;
  const title =
    state.status === "checking"
      ? t.checking
      : state.status === "success"
        ? t.success
        : state.status === "cancelled"
          ? t.cancelled
          : t.pending;

  return (
    <main className={`min-h-screen px-5 py-28 ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-950"}`}>
      <section
        className={`mx-auto flex max-w-xl flex-col items-center rounded-2xl border p-8 text-center shadow-sm ${
          isDark ? "border-white/10 bg-slate-900" : "border-slate-200 bg-white"
        }`}
      >
        <Icon
          size={54}
          className={
            state.status === "success"
              ? "text-emerald-500"
              : state.status === "checking"
                ? "text-cyan-500"
                : "text-rose-500"
          }
        />
        <h1 className="mt-5 text-2xl font-black">{title}</h1>
        <p className={`mt-3 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>{state.message}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/" className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-600">
            {t.back}
          </Link>
          <Link
            to="/photographerProfile"
            className={`rounded-xl border px-5 py-3 text-sm font-bold ${
              isDark ? "border-white/10 text-white hover:bg-white/5" : "border-slate-200 text-slate-800 hover:bg-slate-100"
            }`}
          >
            {t.dashboard}
          </Link>
        </div>
      </section>
    </main>
  );
}
