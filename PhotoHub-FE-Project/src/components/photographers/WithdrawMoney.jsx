import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Landmark, CreditCard, User, AlertCircle, RefreshCw, Send, Clock, HelpCircle } from "lucide-react";
import { photographerMarketplaceService } from "../../services/photographerService";

export default function WithdrawMoney({ theme = "dark", language = "vi" }) {
  const isDark = theme === "dark";
  const [balance, setBalance] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [blockedBookings, setBlockedBookings] = useState([]);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const t = {
    vi: {
      title: "Rút Tiền Doanh Thu",
      balance: "Số dư khả dụng:",
      withdrawForm: "Tạo Yêu Cầu Rút Tiền",
      amountLabel: "Số tiền muốn rút (VNĐ)",
      commission: "Phí hoa hồng hệ thống (10%):",
      payout: "Thực nhận:",
      bankName: "Tên ngân hàng",
      accountNumber: "Số tài khoản",
      accountName: "Tên chủ tài khoản (Không dấu)",
      submitBtn: "Gửi yêu cầu rút tiền",
      submitting: "Đang xử lý...",
      historyTitle: "Lịch Sử Yêu Cầu Rút Tiền",
      noHistory: "Chưa có giao dịch rút tiền nào",
      bank: "Ngân hàng",
      amount: "Yêu cầu",
      finalAmount: "Thực nhận",
      status: "Trạng thái",
      date: "Ngày tạo",
      error: "Đã xảy ra lỗi",
      success: "Yêu cầu rút tiền của bạn đã gửi thành công và đang chờ duyệt!",
      validationError: "Vui lòng kiểm tra lại thông tin rút tiền.",
      insufficient: "Số tiền rút vượt quá số dư khả dụng",
    },
    en: {
      title: "Withdraw Earnings",
      balance: "Available Balance:",
      withdrawForm: "Request Payout",
      amountLabel: "Amount to Withdraw (VND)",
      commission: "System Commission (10%):",
      payout: "You'll Receive:",
      bankName: "Bank Name",
      accountNumber: "Account Number",
      accountName: "Account Holder Name (Uppercase)",
      submitBtn: "Submit Payout Request",
      submitting: "Processing...",
      historyTitle: "Payout Request History",
      noHistory: "No withdrawal history available",
      bank: "Bank Details",
      amount: "Requested",
      finalAmount: "Net Payout",
      status: "Status",
      date: "Date Requested",
      error: "An error occurred",
      success: "Withdraw request submitted successfully and is pending approval!",
      validationError: "Please verify all payout fields.",
      insufficient: "Amount exceeds available balance",
    },
  }[language];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch balance details from revenue
      const revRes = await photographerMarketplaceService.getRevenue();
      setBalance(revRes.data?.withdrawableAmount || 0);
      setNetBalance(revRes.data?.netWithdrawableAmount || 0);
      setEligibleBookings(revRes.data?.eligibleBookings || []);
      setBlockedBookings(revRes.data?.blockedBookings || []);

      // Fetch request history
      const reqRes = await photographerMarketplaceService.getWithdrawRequests();
      setRequests(reqRes.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = Number(amount);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Swal.fire("Warning", t.validationError, "warning");
      return;
    }

    if (parsedAmount > balance) {
      Swal.fire("Warning", t.insufficient, "warning");
      return;
    }

    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      Swal.fire("Warning", t.validationError, "warning");
      return;
    }

    setSubmitting(true);
    try {
      await photographerMarketplaceService.requestWithdraw({
        amount: parsedAmount,
        bankInfo: {
          bankName,
          accountNumber,
          accountName,
        },
      });

      Swal.fire("Success", t.success, "success");
      
      // Clear inputs
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      
      // Refresh
      fetchData();
    } catch (err) {
      console.error(err);
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations
  const requestedNum = Number(amount) || 0;
  const commValue = requestedNum * 0.1;
  const payoutValue = Math.max(0, requestedNum - commValue);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Payout Form */}
      <div className="lg:col-span-1 space-y-4">
        <div
          className={`p-4 rounded-2xl border ${
            isDark ? "bg-[#121214]/60 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-sm">{t.withdrawForm}</h3>
            <button onClick={fetchData} className="text-slate-500 hover:text-orange-500">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Balance Display */}
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/10 mb-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t.balance}</p>
            <h2 className="text-2xl font-black text-orange-500 mt-0.5">{Number(balance || 0).toLocaleString('vi-VN')} đ</h2>
            <p className="mt-0.5 text-[10px] font-bold text-slate-500">Net after commission: {Number(netBalance || 0).toLocaleString('vi-VN')} đ</p>
          </div>

          <div className="mb-4 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs text-slate-500">
            <div className="font-bold text-emerald-500">{eligibleBookings.length} booking(s) eligible for payout</div>
            {blockedBookings.length > 0 && (
              <div className="mt-1 text-amber-300">
                {blockedBookings.length} completed booking(s) still waiting for payment, approval, or dispute resolution.
              </div>
            )}
          </div>

          <form onSubmit={handleWithdrawSubmit} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                {t.amountLabel}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">đ</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 200"
                  max={balance}
                  min="1"
                  className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none border font-medium transition-all ${
                    isDark
                      ? "bg-[#09090b] border-white/5 focus:border-orange-500 text-white"
                      : "bg-slate-50 border-slate-200 focus:border-orange-500 focus:bg-white text-slate-900"
                  }`}
                  required
                />
              </div>
            </div>

            {/* Calculations preview */}
            {requestedNum > 0 && (
              <div className="p-3 rounded-xl bg-white/[0.02] dark:border-white/[0.03] border text-xs space-y-1.5 text-slate-500 font-semibold">
                <div className="flex justify-between">
                  <span>{t.commission}</span>
                  <span>-{Number(commValue.toFixed(0)).toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-orange-500 font-bold border-t border-slate-200 dark:border-white/[0.04] pt-1.5">
                  <span>{t.payout}</span>
                  <span>+{Number(payoutValue.toFixed(0)).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                {t.bankName}
              </label>
              <div className="relative">
                <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Vietcombank"
                  className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none border font-medium transition-all ${
                    isDark
                      ? "bg-[#09090b] border-white/5 focus:border-orange-500 text-white"
                      : "bg-slate-50 border-slate-200 focus:border-orange-500 focus:bg-white text-slate-900"
                  }`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                {t.accountNumber}
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 1029384849"
                  className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none border font-medium transition-all ${
                    isDark
                      ? "bg-[#09090b] border-white/5 focus:border-orange-500 text-white"
                      : "bg-slate-50 border-slate-200 focus:border-orange-500 focus:bg-white text-slate-900"
                  }`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                {t.accountName}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  placeholder="e.g. NGUYEN VAN A"
                  className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none border font-medium transition-all ${
                    isDark
                      ? "bg-[#09090b] border-white/5 focus:border-orange-500 text-white"
                      : "bg-slate-50 border-slate-200 focus:border-orange-500 focus:bg-white text-slate-900"
                  }`}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || balance <= 0 || !amount}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black py-2.5 rounded-xl transition shadow-md shadow-orange-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={14} />
              {submitting ? t.submitting : t.submitBtn}
            </button>
          </form>
        </div>
      </div>

      {/* Withdraw History Log */}
      <div className="lg:col-span-2 space-y-4">
        <div
          className={`p-4 rounded-2xl border flex-1 flex flex-col ${
            isDark ? "bg-[#121214]/60 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <h3 className="font-extrabold text-sm mb-4">{t.historyTitle}</h3>

          {requests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-12 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
              <Clock size={28} className="mb-2 opacity-50" />
              <p className="text-xs font-semibold">{t.noHistory}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.04] text-slate-500 font-bold uppercase tracking-wider">
                    <th className="pb-2.5">{t.date}</th>
                    <th className="pb-2.5">{t.bank}</th>
                    <th className="pb-2.5 text-right">{t.amount}</th>
                    <th className="pb-2.5 text-right">{t.finalAmount}</th>
                    <th className="pb-2.5 text-center">{t.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02]">
                  {requests.map((r) => {
                    const normalizedStatus = String(r.status || "").toLowerCase();
                    return (
                    <tr key={r._id} className="text-slate-300">
                      <td className="py-3 text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-slate-300">
                        <div className="font-bold">{r.bankInfo?.bankName}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {r.bankInfo?.accountNumber} - {r.bankInfo?.accountName}
                        </div>
                      </td>
                      <td className="py-3 text-right font-bold text-slate-300">{Number(r.amount || 0).toLocaleString('vi-VN')} đ</td>
                      <td className="py-3 text-right font-black text-orange-500">
                        {Number(r.finalAmount || 0).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                            normalizedStatus === "approved" || normalizedStatus === "paid"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : normalizedStatus === "pending"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
