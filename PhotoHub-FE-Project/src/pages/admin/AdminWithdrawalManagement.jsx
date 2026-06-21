import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { Coins, Check, X, ShieldAlert, ArrowRight, Wallet, User } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminWithdrawalManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReq, setSelectedReq] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    fetchWithdrawals();
  }, [page]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await adminService.getPendingWithdrawals({ page, limit: 10 });
      if (res.success) {
        setRequests(res.data.requests || []);
        setTotalPages(res.data.pagination?.pages || 1);
      } else {
        Swal.fire("Lỗi", res.message || "Không thể tải yêu cầu rút tiền", "error");
      }
    } catch (e) {
      console.error(e);
      Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReq = (req) => {
    setSelectedReq(req);
    setAdminNote("");
  };

  const handleApprove = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận duyệt?",
      text: "Phê duyệt yêu cầu này và đổi trạng thái thành APPROVED. Hệ thống sẽ tiến hành gửi thông báo.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Duyệt yêu cầu",
      cancelButtonText: "Hủy",
      background: "#1e293b",
      color: "#f8fafc"
    });

    if (result.isConfirmed) {
      try {
        const res = await adminService.approveWithdrawal(id, adminNote);
        if (res.success) {
          Swal.fire("Thành công", "Yêu cầu đã được phê duyệt thành công!", "success");
          fetchWithdrawals();
          setSelectedReq(null);
        } else {
          Swal.fire("Thất bại", res.message || "Duyệt yêu cầu thất bại", "error");
        }
      } catch (e) {
        Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
      }
    }
  };

  const handleReject = async (id) => {
    if (!adminNote) {
      Swal.fire("Lỗi", "Vui lòng nhập lý do từ chối vào ô ghi chú!", "warning");
      return;
    }

    const result = await Swal.fire({
      title: "Xác nhận từ chối?",
      text: "Từ chối yêu cầu rút tiền này. Nhiếp ảnh gia sẽ nhận được thông báo với lý do.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Từ chối",
      cancelButtonText: "Hủy",
      background: "#1e293b",
      color: "#f8fafc"
    });

    if (result.isConfirmed) {
      try {
        const res = await adminService.rejectWithdrawal(id, adminNote);
        if (res.success) {
          Swal.fire("Thành công", "Yêu cầu đã bị từ chối!", "success");
          fetchWithdrawals();
          setSelectedReq(null);
        } else {
          Swal.fire("Thất bại", res.message || "Từ chối thất bại", "error");
        }
      } catch (e) {
        Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
      }
    }
  };

  const handleMarkPaid = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận đã chuyển khoản?",
      text: "Hành động này sẽ TRỪ TIỀN trong ví của nhiếp ảnh gia và lưu lịch sử giao dịch. Không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      confirmButtonText: "Xác nhận đã thanh toán",
      cancelButtonText: "Hủy",
      background: "#1e293b",
      color: "#f8fafc"
    });

    if (result.isConfirmed) {
      try {
        const res = await adminService.markPaidWithdrawal(id, adminNote);
        if (res.success) {
          Swal.fire("Thành công", "Đã trừ tiền ví và hoàn tất yêu cầu thanh toán!", "success");
          fetchWithdrawals();
          setSelectedReq(null);
        } else {
          Swal.fire("Thất bại", res.message || "Thao tác thất bại", "error");
        }
      } catch (e) {
        Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
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
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Coins className="h-6 w-6 text-cyan-400" />
          Duyệt yêu cầu Rút tiền
        </h1>
        <p className="text-slate-400 text-sm mt-1">Phê duyệt và giải quyết các yêu cầu rút tiền mặt từ ví khả dụng của Nhiếp ảnh gia.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* List request table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md overflow-x-auto">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Danh sách yêu cầu rút tiền PENDING</h2>
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 rounded-l-xl">Nhiếp ảnh gia</th>
                <th className="py-3 px-3">Tài khoản Ngân hàng</th>
                <th className="py-3 px-3 text-center">Yêu cầu rút</th>
                <th className="py-3 px-3 text-center">Thực nhận</th>
                <th className="py-3 px-3 text-center rounded-r-xl">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-cyan-500 mx-auto"></div>
                  </td>
                </tr>
              ) : requests.length > 0 ? (
                requests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-800/10 transition">
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-white">{r.photographer?.displayName}</div>
                      <div className="text-xs text-slate-500">{r.photographer?.user?.email}</div>
                    </td>
                    <td className="py-3.5 px-3 text-xs">
                      <div className="text-slate-200">{r.bankName || r.bankInfo?.bankName}</div>
                      <div className="text-slate-400 font-mono">{r.bankAccountNumber || r.bankInfo?.accountNumber}</div>
                    </td>
                    <td className="py-3.5 px-3 text-center text-rose-400 font-semibold">{formatCurrency(r.amount)}</td>
                    <td className="py-3.5 px-3 text-center text-cyan-400 font-bold">{formatCurrency(r.finalAmount || r.amount)}</td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => handleSelectReq(r)}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Kiểm duyệt
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-500">Không có yêu cầu rút tiền nào đang chờ duyệt.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/80">
              <span className="text-xs text-slate-500">Trang {page} / {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Trước
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Audit details side panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-cyan-400" />
            Chi tiết Yêu cầu
          </h2>

          {selectedReq ? (
            <div className="space-y-4 text-sm">
              {/* Bank Details */}
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2">
                <span className="text-cyan-400 font-bold text-xs uppercase block">Thông tin thụ hưởng</span>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Ngân hàng:</span><span className="text-white font-bold">{selectedReq.bankName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Số tài khoản:</span><span className="text-white font-mono">{selectedReq.bankAccountNumber}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Tên thụ hưởng:</span><span className="text-white uppercase font-semibold">{selectedReq.bankAccountName}</span></div>
                  <div className="flex justify-between border-t border-slate-900 pt-1 mt-1"><span className="text-slate-500">Số tiền rút:</span><span className="text-rose-400 font-bold">{formatCurrency(selectedReq.amount)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Phí sàn (10%):</span><span className="text-slate-400">{formatCurrency(selectedReq.commission)}</span></div>
                  <div className="flex justify-between text-base border-t border-slate-900 pt-1.5 mt-1.5"><span className="text-slate-400 font-bold">Thực nhận:</span><span className="text-cyan-400 font-black">{formatCurrency(selectedReq.finalAmount || selectedReq.amount)}</span></div>
                </div>
              </div>

              {/* Security validations */}
              <div className="space-y-2 pt-2">
                <span className="text-slate-400 text-xs font-bold block">Điều kiện kiểm duyệt:</span>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-300">Số dư ví hiện tại: </span>
                    <span className="text-emerald-400 font-bold ml-auto">{formatCurrency(selectedReq.wallet?.balance)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-300">Không có khiếu nại đang tranh chấp:</span>
                    <span className="text-emerald-400 font-semibold ml-auto">Đạt</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-300">Lịch đặt liên quan đã hoàn thành:</span>
                    <span className="text-emerald-400 font-semibold ml-auto">Đạt</span>
                  </div>
                </div>
              </div>

              {/* Note input */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Ghi chú quản trị viên (Bắt buộc khi từ chối):</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Nhập ghi chú hoặc lý do từ chối..."
                  className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleApprove(selectedReq._id)}
                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 font-bold transition text-xs"
                  >
                    <Check className="h-4 w-4" />
                    Phê duyệt
                  </button>
                  <button
                    onClick={() => handleReject(selectedReq._id)}
                    className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl py-2.5 font-bold transition text-xs"
                  >
                    <X className="h-4 w-4" />
                    Từ chối
                  </button>
                </div>
                <button
                  onClick={() => handleMarkPaid(selectedReq._id)}
                  className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl py-2.5 font-bold transition text-xs"
                >
                  <Coins className="h-4 w-4" />
                  Xác nhận đã chuyển khoản (Mark Paid)
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-xs text-center py-12">Chọn nút "Kiểm duyệt" bên danh sách để xem chi tiết và thực thi phê duyệt/chuyển khoản.</p>
          )}
        </div>
      </div>
    </div>
  );
}
