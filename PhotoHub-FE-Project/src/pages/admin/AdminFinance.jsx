import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { DollarSign, Check, X, ShieldAlert, Award, FileText } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminFinance() {
  const [activeTab, setActiveTab] = useState("withdrawals"); // withdrawals or transactions
  
  // States for Withdraw requests
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [withdrawStatus, setWithdrawStatus] = useState("PENDING");
  const [withdrawPage, setWithdrawPage] = useState(1);
  const [withdrawTotalPages, setWithdrawTotalPages] = useState(1);
  const [selectedWithdraw, setSelectedWithdraw] = useState(null);

  // States for Transactions
  const [payments, setPayments] = useState([]);
  const [paymentType, setPaymentType] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentTotalPages, setPaymentTotalPages] = useState(1);

  useEffect(() => {
    if (activeTab === "withdrawals") {
      fetchWithdrawRequests();
    } else {
      fetchPayments();
    }
  }, [activeTab, withdrawStatus, withdrawPage, paymentType, paymentStatus, paymentPage]);

  const fetchWithdrawRequests = async () => {
    try {
      const res = await adminService.getWithdrawRequests({
        status: withdrawStatus,
        page: withdrawPage,
        limit: 10
      });
      if (res.success) {
        setWithdrawRequests(res.data.requests);
        setWithdrawTotalPages(res.data.pagination.pages);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await adminService.getPayments({
        paymentType,
        status: paymentStatus,
        page: paymentPage,
        limit: 10
      });
      if (res.success) {
        setPayments(res.data.payments);
        setPaymentTotalPages(res.data.pagination.pages);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Duyệt yêu cầu rút tiền (Chờ chuyển)
  const handleApproveWithdraw = async (id) => {
    const result = await Swal.fire({
      title: "Phê duyệt yêu cầu rút tiền?",
      text: "Xác nhận yêu cầu hợp lệ và chuẩn bị chuyển khoản ngân hàng.",
      input: "text",
      inputPlaceholder: "Ghi chú phê duyệt...",
      showCancelButton: true,
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
      background: "#1e293b",
      color: "#f8fafc"
    });

    if (result.isConfirmed) {
      try {
        const res = await adminService.approveWithdrawRequest(id, result.value || "Hồ sơ đủ điều kiện");
        if (res.success) {
          Swal.fire("Thành công", "Đã phê duyệt yêu cầu rút tiền!", "success");
          fetchWithdrawRequests();
          setSelectedWithdraw(null);
        } else {
          Swal.fire("Lỗi", res.message || "Xử lý thất bại", "error");
        }
      } catch (e) {
        Swal.fire("Lỗi", "Không thể kết nối máy chủ", "error");
      }
    }
  };

  // Từ chối yêu cầu rút tiền
  const handleRejectWithdraw = async (id) => {
    const result = await Swal.fire({
      title: "Từ chối yêu cầu rút tiền?",
      text: "Nhập lý do cụ thể từ chối rút tiền của đối tác.",
      input: "text",
      inputPlaceholder: "Lý do từ chối (bắt buộc)...",
      inputValidator: (value) => {
        if (!value) return "Bạn phải cung cấp lý do từ chối!";
      },
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Từ chối",
      cancelButtonText: "Hủy",
      background: "#1e293b",
      color: "#f8fafc"
    });

    if (result.isConfirmed) {
      try {
        const res = await adminService.rejectWithdrawRequest(id, result.value);
        if (res.success) {
          Swal.fire("Đã từ chối", "Đã gửi thông báo từ chối rút tiền!", "success");
          fetchWithdrawRequests();
          setSelectedWithdraw(null);
        } else {
          Swal.fire("Lỗi", res.message || "Từ chối thất bại", "error");
        }
      } catch (e) {
        Swal.fire("Lỗi", "Không thể kết nối máy chủ", "error");
      }
    }
  };

  // Đánh dấu đã chuyển khoản thành công (Khấu trừ ví thực tế)
  const handleMarkPaidWithdraw = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận đã chuyển khoản?",
      text: "Xác nhận bạn đã chuyển tiền ngân hàng cho đối tác. Hệ thống sẽ chính thức trừ tiền trong số dư ví khả dụng của photographer!",
      icon: "warning",
      input: "text",
      inputPlaceholder: "Mã giao dịch ngân hàng / ghi chú chuyển khoản...",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      confirmButtonText: "Đã chuyển khoản thành công",
      cancelButtonText: "Hủy",
      background: "#1e293b",
      color: "#f8fafc"
    });

    if (result.isConfirmed) {
      try {
        const res = await adminService.markPaidWithdrawRequest(id, result.value || "Đã tất toán rút tiền");
        if (res.success) {
          Swal.fire("Thành công", "Đã giải ngân tất toán yêu cầu và trừ tiền ví!", "success");
          fetchWithdrawRequests();
          setSelectedWithdraw(null);
        } else {
          Swal.fire("Lỗi", res.message || "Tất toán thất bại", "error");
        }
      } catch (e) {
        Swal.fire("Lỗi", "Không thể kết nối máy chủ", "error");
      }
    }
  };

  // Xác nhận giao dịch thủ công (Payments)
  const handleConfirmPayment = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận thanh toán thủ công?",
      text: "Xác nhận đã nhận tiền giao dịch này qua tài khoản ngân hàng hoặc tiền mặt.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Xác nhận thành công",
      cancelButtonText: "Hủy",
      background: "#1e293b",
      color: "#f8fafc"
    });

    if (result.isConfirmed) {
      try {
        const res = await adminService.confirmPayment(id, "Admin xác nhận thanh toán thủ công");
        if (res.success) {
          Swal.fire("Thành công", "Đã xác nhận giao dịch thành công!", "success");
          fetchPayments();
        } else {
          Swal.fire("Thất bại", res.message || "Xác nhận thất bại", "error");
        }
      } catch (e) {
        Swal.fire("Lỗi", "Không thể kết nối máy chủ", "error");
      }
    }
  };

  // Hoàn tiền giao dịch (Payments)
  const handleRefundPayment = async (id, maxAmount) => {
    const { value: formValues } = await Swal.fire({
      title: "Xử lý hoàn tiền giao dịch",
      html:
        `<p class="text-xs text-slate-400 mb-2">Số tiền hoàn tối đa: ${formatCurrency(maxAmount)}</p>` +
        `<input id="swal-refund-amount" type="number" class="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white mb-4" value="${maxAmount}" max="${maxAmount}" placeholder="Nhập số tiền hoàn..."/>` +
        '<input id="swal-refund-note" class="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" placeholder="Ghi chú hoàn tiền (bắt buộc)..."/>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Hoàn tiền",
      cancelButtonText: "Hủy",
      background: "#1e293b",
      color: "#f8fafc",
      preConfirm: () => {
        return {
          amount: parseFloat(document.getElementById("swal-refund-amount").value),
          note: document.getElementById("swal-refund-note").value
        };
      }
    });

    if (formValues) {
      if (!formValues.note) {
        Swal.fire("Lỗi", "Bạn phải cung cấp lý do hoàn tiền!", "error");
        return;
      }
      if (formValues.amount <= 0 || formValues.amount > maxAmount) {
        Swal.fire("Lỗi", "Số tiền hoàn không hợp lệ!", "error");
        return;
      }

      try {
        const res = await adminService.refundPayment(id, formValues.amount, formValues.note);
        if (res.success) {
          Swal.fire("Thành công", "Giao dịch đã được hoàn tiền thành công!", "success");
          fetchPayments();
        } else {
          Swal.fire("Thất bại", res.message || "Lỗi xử lý hoàn tiền", "error");
        }
      } catch (e) {
        Swal.fire("Lỗi", "Không thể kết nối máy chủ", "error");
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Quản lý Tài chính & Ví tiền</h1>
        <p className="text-slate-400 text-sm mt-1">Kiểm soát dòng tiền giao dịch, cọc ký quỹ (Escrow) và phê duyệt các yêu cầu rút tiền của Photographer.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab("withdrawals")}
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition ${
            activeTab === "withdrawals"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Yêu cầu Rút tiền
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition ${
            activeTab === "transactions"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Lịch sử Giao dịch
        </button>
      </div>

      {/* Rút tiền Tab */}
      {activeTab === "withdrawals" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Table requests */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-400 font-medium">Lọc theo trạng thái yêu cầu rút:</span>
              <select 
                value={withdrawStatus} 
                onChange={(e) => { setWithdrawStatus(e.target.value); setWithdrawPage(1); setSelectedWithdraw(null); }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Đang chờ duyệt (PENDING)</option>
                <option value="APPROVED">Đã duyệt - Chờ chuyển khoản (APPROVED)</option>
                <option value="PAID">Đã thanh toán tất toán (PAID)</option>
                <option value="REJECTED">Bị từ chối (REJECTED)</option>
              </select>
            </div>

            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 rounded-l-xl">Nhiếp ảnh gia</th>
                  <th className="py-3 px-3">Số tiền rút</th>
                  <th className="py-3 px-3">Ngày yêu cầu</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3 text-center rounded-r-xl">Xem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {withdrawRequests.length > 0 ? (
                  withdrawRequests.map((r) => {
                    let badgeColor = "text-yellow-500 bg-yellow-500/10";
                    if (r.status === "APPROVED") badgeColor = "text-blue-400 bg-blue-500/10";
                    if (r.status === "PAID") badgeColor = "text-emerald-400 bg-emerald-500/10";
                    if (r.status === "REJECTED") badgeColor = "text-red-400 bg-red-500/10";

                    return (
                      <tr key={r._id} className="hover:bg-slate-800/10 transition">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{r.photographer?.displayName}</div>
                          <div className="text-[11px] text-slate-500">{r.photographer?.user?.email}</div>
                        </td>
                        <td className="py-3 px-3 text-cyan-400 font-bold">{formatCurrency(r.amount)}</td>
                        <td className="py-3 px-3 text-slate-400">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setSelectedWithdraw(r)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-500">Không có yêu cầu rút tiền nào.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {withdrawTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/80">
                <span className="text-xs text-slate-500">Trang {withdrawPage} / {withdrawTotalPages}</span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={withdrawPage === 1}
                    onClick={() => setWithdrawPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-semibold transition"
                  >
                    Trước
                  </button>
                  <button
                    disabled={withdrawPage === withdrawTotalPages}
                    onClick={() => setWithdrawPage(p => Math.min(withdrawTotalPages, p + 1))}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-semibold transition"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Side Panel: Request details & Actions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 mb-4">Chi tiết yêu cầu rút tiền</h2>
            {selectedWithdraw ? (
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-slate-400 text-xs">Đối tác yêu cầu:</span>
                  <p className="text-white font-semibold text-base mt-0.5">{selectedWithdraw.photographer?.displayName}</p>
                  <p className="text-slate-500 text-xs">{selectedWithdraw.photographer?.user?.email}</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Thông tin tài khoản ngân hàng</span>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <span className="text-white font-semibold">{selectedWithdraw.bankName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <span className="text-cyan-400 font-mono font-semibold">{selectedWithdraw.bankAccountNumber}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Tên thụ hưởng:</span>
                    <span className="text-white font-semibold">{selectedWithdraw.bankAccountName}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-xs">Số tiền rút:</span>
                  <span className="text-cyan-400 text-lg font-bold">{formatCurrency(selectedWithdraw.amount)}</span>
                </div>

                {/* Wallets check balance if known */}
                {selectedWithdraw.wallet && (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Số dư khả dụng hiện tại trong ví:</span>
                    <span className="font-bold text-white">{formatCurrency(selectedWithdraw.wallet.balance)}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-4 border-t border-slate-800/80">
                  {selectedWithdraw.status === "PENDING" && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleApproveWithdraw(selectedWithdraw._id)}
                        className="flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl py-2.5 font-bold transition text-xs"
                      >
                        <Check className="h-4 w-4" />
                        Duyệt yêu cầu
                      </button>
                      <button
                        onClick={() => handleRejectWithdraw(selectedWithdraw._id)}
                        className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl py-2.5 font-bold transition text-xs"
                      >
                        <X className="h-4 w-4" />
                        Từ chối
                      </button>
                    </div>
                  )}

                  {selectedWithdraw.status === "APPROVED" && (
                    <button
                      onClick={() => handleMarkPaidWithdraw(selectedWithdraw._id)}
                      className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 font-bold transition text-xs"
                    >
                      <Check className="h-4 w-4" />
                      Xác nhận đã chuyển khoản (Tất toán)
                    </button>
                  )}

                  {selectedWithdraw.status === "PAID" && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
                      <p className="font-bold">✓ Đã tất toán thành công</p>
                      <p className="text-[11px] text-slate-400 mt-1">Ghi chú đối soát: {selectedWithdraw.adminNote}</p>
                    </div>
                  )}

                  {selectedWithdraw.status === "REJECTED" && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                      <p className="font-bold">✗ Đã bị từ chối</p>
                      <p className="text-[11px] text-slate-400 mt-1">Lý do: {selectedWithdraw.adminNote}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-xs text-center py-12">Chọn nút "Chi tiết" ở yêu cầu rút tiền để bắt đầu duyệt.</p>
            )}
          </div>

        </div>
      )}

      {/* Giao dịch Tab */}
      {activeTab === "transactions" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md overflow-x-auto">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <span className="text-xs text-slate-400 font-medium">Lọc lịch sử thanh toán:</span>
            <div className="flex items-center gap-3">
              <select 
                value={paymentType} 
                onChange={(e) => { setPaymentType(e.target.value); setPaymentPage(1); }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="">Tất cả loại giao dịch</option>
                <option value="DEPOSIT">Tiền đặt cọc (DEPOSIT)</option>
                <option value="FINAL">Thanh toán đợt cuối (FINAL)</option>
                <option value="REFUND">Hoàn tiền (REFUND)</option>
                <option value="WITHDRAW">Rút tiền (WITHDRAW)</option>
              </select>

              <select 
                value={paymentStatus} 
                onChange={(e) => { setPaymentStatus(e.target.value); setPaymentPage(1); }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý (PENDING)</option>
                <option value="SUCCESS">Thành công (SUCCESS)</option>
                <option value="FAILED">Thất bại (FAILED)</option>
                <option value="REFUNDED">Đã hoàn tiền (REFUNDED)</option>
              </select>
            </div>
          </div>

          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 rounded-l-xl">Mã hợp đồng / Giao dịch</th>
                <th className="py-3 px-3">Bên gửi</th>
                <th className="py-3 px-3">Bên nhận</th>
                <th className="py-3 px-3">Phân loại</th>
                <th className="py-3 px-3">Số tiền</th>
                <th className="py-3 px-3">Trạng thái</th>
                <th className="py-3 px-3 text-center rounded-r-xl">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {payments.length > 0 ? (
                payments.map((p) => {
                  let statusColor = "text-yellow-500 bg-yellow-500/10";
                  if (p.status === "SUCCESS") statusColor = "text-emerald-400 bg-emerald-500/10";
                  if (p.status === "REFUNDED") statusColor = "text-purple-400 bg-purple-500/10";
                  if (p.status === "FAILED") statusColor = "text-red-400 bg-red-500/10";

                  return (
                    <tr key={p._id} className="hover:bg-slate-800/10 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-300 text-xs font-mono">{p._id}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Booking: {p.booking?._id || "Không có (Rút/Nổi bật)"}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-xs">{p.sender?.fullName || "-"}</td>
                      <td className="py-3 px-3 text-slate-400 text-xs">{p.receiver?.fullName || "-"}</td>
                      <td className="py-3 px-3 text-slate-300 text-xs font-semibold">{p.paymentType}</td>
                      <td className="py-3 px-3 font-bold text-cyan-400">{formatCurrency(p.amount)}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex gap-1 justify-center">
                          {p.status === "PENDING" && (
                            <button
                              onClick={() => handleConfirmPayment(p._id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition"
                            >
                              Xác nhận
                            </button>
                          )}
                          
                          {p.status === "SUCCESS" && (p.paymentType === "DEPOSIT" || p.paymentType === "FINAL") && (
                            <button
                              onClick={() => handleRefundPayment(p._id, p.amount)}
                              className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] font-bold transition border border-red-500/20"
                            >
                              Hoàn tiền
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500">Không tìm thấy giao dịch nào.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {paymentTotalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/80">
              <span className="text-xs text-slate-500">Trang {paymentPage} / {paymentTotalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={paymentPage === 1}
                  onClick={() => setPaymentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Trước
                </button>
                <button
                  disabled={paymentPage === paymentTotalPages}
                  onClick={() => setPaymentPage(p => Math.min(paymentTotalPages, p + 1))}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
