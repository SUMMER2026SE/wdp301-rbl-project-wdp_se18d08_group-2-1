import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Landmark, CreditCard, User, AlertCircle, RefreshCw, Send, DollarSign, Clock, HelpCircle } from "lucide-react";
import { photographerMarketplaceService } from "../../services/photographerService";

export default function WithdrawMoney({ theme = "dark", language = "vi" }) {
  const isDark = theme === "dark";
  const [balance, setBalance] = useState(0);
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
      amountLabel: "Số tiền muốn rút ($)",
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
      amountLabel: "Amount to Withdraw ($)",
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Payout Form */}
      <div className="lg:col-span-1 space-y-6">
        <div
          className={`p-6 rounded-3xl border ${
            isDark ? "bg-[#121214]/60 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-md">{t.withdrawForm}</h3>
            <button onClick={fetchData} className="text-slate-500 hover:text-cyan-400">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Balance Display */}
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/10 mb-6 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t.balance}</p>
            <h2 className="text-3xl font-black text-cyan-400 mt-1">${balance}</h2>
          </div>

          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                {t.amountLabel}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 200"
                  max={balance}
                  min="1"
                  className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm outline-none border font-medium transition-all ${
                    isDark
                      ? "bg-[#09090b] border-white/5 focus:border-cyan-500 text-white"
                      : "bg-slate-50 border-slate-200 focus:border-cyan-500 focus:bg-white text-slate-900"
                  }`}
                  required
                />
              </div>
            </div>

            {/* Calculations preview */}
            {requestedNum > 0 && (
              <div className="p-3.5 rounded-2xl bg-white/[0.02] dark:border-white/[0.03] border text-xs space-y-2 text-slate-500 font-semibold">
                <div className="flex justify-between">
                  <span>{t.commission}</span>
                  <span>-${commValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-cyan-400 font-bold border-t border-slate-200 dark:border-white/[0.04] pt-2">
                  <span>{t.payout}</span>
                  <span>+${payoutValue.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                {t.bankName}
              </label>
              <div className="relative">
                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Vietcombank"
                  className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm outline-none border font-medium transition-all ${
                    isDark
                      ? "bg-[#09090b] border-white/5 focus:border-cyan-500 text-white"
                      : "bg-slate-50 border-slate-200 focus:border-cyan-500 focus:bg-white text-slate-900"
                  }`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                {t.accountNumber}
              </label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 1029384849"
                  className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm outline-none border font-medium transition-all ${
                    isDark
                      ? "bg-[#09090b] border-white/5 focus:border-cyan-500 text-white"
                      : "bg-slate-50 border-slate-200 focus:border-cyan-500 focus:bg-white text-slate-900"
                  }`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                {t.accountName}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  placeholder="e.g. NGUYEN VAN A"
                  className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm outline-none border font-medium transition-all ${
                    isDark
                      ? "bg-[#09090b] border-white/5 focus:border-cyan-500 text-white"
                      : "bg-slate-50 border-slate-200 focus:border-cyan-500 focus:bg-white text-slate-900"
                  }`}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || balance <= 0 || !amount}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-black py-4 rounded-2xl transition shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              {submitting ? t.submitting : t.submitBtn}
            </button>
          </form>
        </div>
      </div>

      {/* Withdraw History Log */}
      <div className="lg:col-span-2 space-y-6">
        <div
          className={`p-6 rounded-3xl border flex-1 flex flex-col ${
            isDark ? "bg-[#121214]/60 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <h3 className="font-extrabold text-md mb-6">{t.historyTitle}</h3>

          {requests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-20 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
              <Clock size={36} className="mb-2 opacity-50" />
              <p className="text-sm font-semibold">{t.noHistory}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.04] text-slate-500 font-bold uppercase tracking-wider">
                    <th className="pb-3">{t.date}</th>
                    <th className="pb-3">{t.bank}</th>
                    <th className="pb-3 text-right">{t.amount}</th>
                    <th className="pb-3 text-right">{t.finalAmount}</th>
                    <th className="pb-3 text-center">{t.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02]">
                  {requests.map((r) => (
                    <tr key={r._id} className="text-slate-300">
                      <td className="py-4 text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <div className="font-bold">{r.bankInfo?.bankName}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {r.bankInfo?.accountNumber} - {r.bankInfo?.accountName}
                        </div>
                      </td>
                      <td className="py-4 text-right font-bold">${r.amount}</td>
                      <td className="py-4 text-right font-black text-cyan-400">
                        ${r.finalAmount}
                      </td>
                      <td className="py-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                            r.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : r.status === "pending"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
