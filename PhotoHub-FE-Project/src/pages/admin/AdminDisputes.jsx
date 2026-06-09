import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { AlertTriangle, Eye, Check, X, ShieldAlert, Heart } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("OPEN"); // Mặc định lọc các khiếu nại OPEN
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDispute, setSelectedDispute] = useState(null);

  // Resolution states
  const [resolutionType, setResolutionType] = useState("REFUND_FULL");
  const [refundAmount, setRefundAmount] = useState(0);
  const [releaseAmount, setReleaseAmount] = useState(0);
  const [resolutionNote, setResolutionNote] = useState("");

  useEffect(() => {
    fetchDisputes();
  }, [status, page]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await adminService.getDisputes({
        status,
        page,
        limit: 10
      });
      if (res.success) {
        setDisputes(res.data.disputes);
        setTotalPages(res.data.pagination.pages);
      } else {
        Swal.fire("Lỗi", res.message || "Không thể tải danh sách tranh chấp", "error");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await adminService.getDisputeById(id);
      if (res.success) {
        setSelectedDispute(res.data);
        // Autofill default values based on escrow amount
        const escrow = res.data.dispute.booking?.depositAmount || 0;
        setRefundAmount(escrow);
        setReleaseAmount(0);
        setResolutionNote("");
        setResolutionType("REFUND_FULL");
      } else {
        Swal.fire("Lỗi", "Không thể lấy chi tiết tranh chấp", "error");
      }
    } catch (e) {
      Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
    }
  };

  const handleInvestigate = async (id) => {
    try {
      const res = await adminService.investigateDispute(id);
      if (res.success) {
        Swal.fire("Đã cập nhật", "Bắt đầu tiến hành điều tra tranh chấp!", "success");
        fetchDisputes();
        handleViewDetails(id);
      } else {
        Swal.fire("Lỗi", res.message || "Thao tác thất bại", "error");
      }
    } catch (e) {
      Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNote) {
      Swal.fire("Lỗi", "Vui lòng nhập kết luận giải quyết (resolutionNote)", "error");
      return;
    }

    const escrow = selectedDispute.dispute.booking?.depositAmount || 0;
    if (resolutionType === "REFUND_PARTIAL" && (refundAmount + releaseAmount > escrow)) {
      Swal.fire("Lỗi", `Tổng số tiền phân bổ (${refundAmount + releaseAmount} VND) không được vượt quá số tiền ký quỹ (${escrow} VND)`, "error");
      return;
    }

    const result = await Swal.fire({
      title: "Xác nhận phán quyết?",
      text: "Hệ thống sẽ thực hiện chuyển tiền và đóng tranh chấp. Hành động này không thể thay đổi!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Đồng ý giải quyết",
      cancelButtonText: "Hủy",
      background: "#1e293b",
      color: "#f8fafc"
    });

    if (result.isConfirmed) {
      try {
        const res = await adminService.resolveDispute(selectedDispute.dispute._id, {
          resolutionType,
          refundAmount: resolutionType === "REFUND_FULL" ? escrow : (resolutionType === "RELEASE_PAYMENT" ? 0 : refundAmount),
          releaseAmount: resolutionType === "RELEASE_PAYMENT" ? escrow : (resolutionType === "REFUND_FULL" ? 0 : releaseAmount),
          resolutionNote
        });

        if (res.success) {
          Swal.fire("Thành công", "Đã xử lý tất toán tranh chấp và gửi thông báo hai bên!", "success");
          fetchDisputes();
          setSelectedDispute(null);
        } else {
          Swal.fire("Thất bại", res.message || "Lỗi xử lý", "error");
        }
      } catch (e) {
        Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
      }
    }
  };

  const handleRejectDispute = async (id) => {
    const result = await Swal.fire({
      title: "Bác bỏ tranh chấp?",
      text: "Bạn có chắc muốn bác bỏ khiếu nại này của khách hàng không?",
      input: "text",
      inputPlaceholder: "Ghi chú bác bỏ khiếu nại (bắt buộc)...",
      inputValidator: (value) => {
        if (!value) return "Bạn cần nhập lý do bác bỏ khiếu nại!";
      },
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Bác bỏ khiếu nại",
      cancelButtonText: "Hủy",
      background: "#1e293b",
      color: "#f8fafc"
    });

    if (result.isConfirmed) {
      try {
        const res = await adminService.rejectDispute(id, result.value);
        if (res.success) {
          Swal.fire("Đã đóng", "Đã bác bỏ tranh chấp thành công!", "success");
          fetchDisputes();
          setSelectedDispute(null);
        } else {
          Swal.fire("Lỗi", res.message || "Bác bỏ thất bại", "error");
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
        <h1 className="text-2xl font-bold text-white">Giải quyết Tranh chấp & Khiếu nại</h1>
        <p className="text-slate-400 text-sm mt-1">Hòa giải và ra phán quyết hoàn tiền cọc ký quỹ (Escrow) giữa Khách hàng và Nhiếp ảnh gia.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        {[
          { label: "Mới tiếp nhận", val: "OPEN" },
          { label: "Đang điều tra", val: "INVESTIGATING" },
          { label: "Đã phân xử", val: "RESOLVED" },
          { label: "Đã bác bỏ", val: "REJECTED" }
        ].map(tab => (
          <button
            key={tab.val}
            onClick={() => { setStatus(tab.val); setPage(1); setSelectedDispute(null); }}
            className={`py-3 px-1 text-sm font-semibold border-b-2 transition ${
              status === tab.val
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Table of disputes */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 rounded-l-xl">Khách hàng khiếu nại</th>
                <th className="py-3 px-3">Photographer</th>
                <th className="py-3 px-3">Số tiền ký quỹ</th>
                <th className="py-3 px-3">Ngày gửi khiếu nại</th>
                <th className="py-3 px-3 text-center rounded-r-xl">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-cyan-500 mx-auto"></div>
                  </td>
                </tr>
              ) : disputes.length > 0 ? (
                disputes.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-800/10 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{d.customer?.fullName}</div>
                      <div className="text-xs text-slate-500">{d.customer?.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{d.photographer?.displayName}</div>
                      <div className="text-xs text-slate-500">{d.photographer?.user?.email}</div>
                    </td>
                    <td className="py-3 px-3 text-cyan-400 font-bold">
                      {formatCurrency(d.booking?.depositAmount)}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{new Date(d.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleViewDetails(d._id)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-500">Không tìm thấy khiếu nại nào.</td>
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

        {/* Side Panel: Detail Resolution */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 mb-4 font-sans flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Chi tiết & Phán quyết
          </h2>

          {selectedDispute ? (
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-red-950/20 border border-red-800/30 rounded-xl space-y-1.5">
                <span className="text-red-400 font-bold text-xs uppercase">Nội dung khiếu nại</span>
                <p className="text-white font-semibold">{selectedDispute.dispute.title}</p>
                <p className="text-slate-300 text-xs italic">"{selectedDispute.dispute.description}"</p>
              </div>

              {/* Evidence Images */}
              {selectedDispute.dispute.evidenceImages?.length > 0 && (
                <div>
                  <span className="text-slate-400 text-xs">Ảnh bằng chứng khách hàng cung cấp:</span>
                  <div className="grid grid-cols-3 gap-1.5 mt-1">
                    {selectedDispute.dispute.evidenceImages.map((img, i) => (
                      <img 
                        key={i} 
                        src={img} 
                        alt="Evidence" 
                        className="h-14 w-full object-cover rounded-lg border border-slate-800 hover:scale-105 transition cursor-pointer"
                        onClick={() => Swal.fire({ imageUrl: img, imageAlt: "Bằng chứng", background: "#0f172a" })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Booking & Escrow info */}
              <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mã Booking:</span>
                  <span className="text-white font-mono">{selectedDispute.dispute.booking?._id}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-400">Tiền cọc cọc ký quỹ đang giữ:</span>
                  <span className="text-cyan-400 font-bold">{formatCurrency(selectedDispute.dispute.booking?.depositAmount)}</span>
                </div>
              </div>

              {/* Chat Log Modal link */}
              {selectedDispute.chatMessages?.length > 0 && (
                <div className="pt-2">
                  <span className="text-slate-400 text-xs font-bold block mb-1.5">Bằng chứng tin nhắn chat gần đây:</span>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-1.5 font-sans">
                    {selectedDispute.chatMessages.map((msg, i) => {
                      const isCustomer = msg.sender === selectedDispute.dispute.customer._id;
                      return (
                        <div key={i} className={`p-1.5 rounded text-[11px] ${isCustomer ? "bg-slate-900 border border-slate-800/80" : "bg-cyan-950/20 border border-cyan-800/30"}`}>
                          <span className="font-bold text-slate-400">{isCustomer ? "Customer" : "Photographer"}: </span>
                          <span className="text-slate-200">"{msg.message}"</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Resolution Form if Open or Investigating */}
              {(selectedDispute.dispute.status === "OPEN" || selectedDispute.dispute.status === "INVESTIGATING") ? (
                <form onSubmit={handleResolveSubmit} className="pt-4 border-t border-slate-800/80 space-y-3">
                  <h3 className="font-bold text-cyan-400 text-xs uppercase tracking-wider">Chọn hướng phân xử</h3>
                  
                  {/* Status update to investigate */}
                  {selectedDispute.dispute.status === "OPEN" && (
                    <button
                      type="button"
                      onClick={() => handleInvestigate(selectedDispute.dispute._id)}
                      className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-2.5 font-bold transition text-xs border border-slate-700"
                    >
                      <ShieldAlert className="h-4 w-4 text-yellow-500" />
                      Đánh dấu: Tiến hành điều tra
                    </button>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Hướng phán quyết tài chính:</label>
                    <select
                      value={resolutionType}
                      onChange={(e) => setResolutionType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="REFUND_FULL">Hoàn tiền 100% cho Khách hàng</option>
                      <option value="RELEASE_PAYMENT">Giải ngân 100% cho Photographer</option>
                      <option value="REFUND_PARTIAL">Hoàn một phần / Giải ngân một phần</option>
                    </select>
                  </div>

                  {resolutionType === "REFUND_PARTIAL" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500">Hoàn Khách hàng:</label>
                        <input
                          type="number"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500">Giải ngân Photo:</label>
                        <input
                          type="number"
                          value={releaseAmount}
                          onChange={(e) => setReleaseAmount(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Nhận định & ghi chú giải quyết:</label>
                    <textarea
                      placeholder="Nhập lập luận phân xử tranh chấp..."
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 font-bold transition text-xs"
                    >
                      <Check className="h-4 w-4" />
                      Lưu Phán quyết
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectDispute(selectedDispute.dispute._id)}
                      className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl py-2.5 font-bold transition text-xs"
                    >
                      <X className="h-4 w-4" />
                      Bác bỏ khiếu nại
                    </button>
                  </div>
                </form>
              ) : (
                <div className="pt-4 border-t border-slate-800/80 p-3 bg-slate-950 rounded-xl space-y-2">
                  <div className="flex justify-between font-bold text-xs">
                    <span className="text-slate-400">Trạng thái:</span>
                    <span className={selectedDispute.dispute.status === "RESOLVED" ? "text-emerald-400" : "text-red-400"}>
                      {selectedDispute.dispute.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Phán quyết:</span>
                    <span className="text-white font-semibold">{selectedDispute.dispute.resolutionType || "Bác bỏ khiếu nại"}</span>
                  </div>
                  {selectedDispute.dispute.status === "RESOLVED" && (
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                      <div>Hoàn customer: <span className="font-bold text-white">{formatCurrency(selectedDispute.dispute.refundAmount)}</span></div>
                      <div>Giải ngân photo: <span className="font-bold text-white">{formatCurrency(selectedDispute.dispute.releaseAmount)}</span></div>
                    </div>
                  )}
                  <div className="text-xs text-slate-400 italic pt-1 border-t border-slate-900">
                    Ghi chú phán quyết: "{selectedDispute.dispute.resolutionNote}"
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500 text-xs text-center py-12">Chọn nút "Chi tiết" ở danh sách tranh chấp để xem nội dung và ra phán quyết.</p>
          )}
        </div>

      </div>

    </div>
  );
}
