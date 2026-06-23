import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { Eye, ShieldAlert, CalendarRange, Clock } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [status, page]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await adminService.getBookings({
        status,
        page,
        limit: 10
      });
      if (res.success) {
        setBookings(res.data.bookings);
        setTotalPages(res.data.pagination.pages);
        console.log(res.data.bookings)
      } else {
        Swal.fire("Lỗi", res.message || "Không thể tải danh sách lịch đặt", "error");
      }
    } catch (e) {
      console.error(e);
      Swal.fire("Lỗi kết nối", "Không thể kết nối đến máy chủ", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId) => {
    const { value: formValues } = await Swal.fire({
      title: "Cập nhật trạng thái Booking",
      html:
        '<select id="swal-status" class="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white mb-4">' +
        '  <option value="PENDING">PENDING</option>' +
        '  <option value="ACCEPTED">ACCEPTED</option>' +
        '  <option value="DEPOSIT_PAID">DEPOSIT_PAID</option>' +
        '  <option value="IN_PROGRESS">IN_PROGRESS</option>' +
        '  <option value="COMPLETED">COMPLETED</option>' +
        '  <option value="CANCELLED">CANCELLED</option>' +
        '  <option value="DISPUTED">DISPUTED</option>' +
        "</select>" +
        '<input id="swal-note" class="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" placeholder="Nhập lý do thay đổi..."/>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Cập nhật",
      cancelButtonText: "Hủy",
      background: "#1e293b",
      color: "#f8fafc",
      preConfirm: () => {
        return {
          status: document.getElementById("swal-status").value,
          note: document.getElementById("swal-note").value
        };
      }
    });

    if (formValues) {
      if (!formValues.note) {
        Swal.fire("Lỗi", "Bạn phải nhập lý do thay đổi trạng thái!", "error");
        return;
      }
      try {
        const res = await adminService.updateBookingStatus(bookingId, formValues.status, formValues.note);
        if (res.success) {
          Swal.fire("Thành công", "Đã cập nhật trạng thái đặt lịch!", "success");
          fetchBookings();
          if (selectedBooking && selectedBooking.booking._id === bookingId) {
            handleViewDetails(bookingId);
          }
        } else {
          Swal.fire("Lỗi", res.message || "Cập nhật thất bại", "error");
        }
      } catch (e) {
        Swal.fire("Lỗi", "Không thể kết nối đến máy chủ", "error");
      }
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await adminService.getBookingById(id);
      if (res.success) {
        setSelectedBooking(res.data);
      } else {
        Swal.fire("Lỗi", "Không thể tải chi tiết lịch đặt", "error");
      }
    } catch (e) {
      Swal.fire("Lỗi", "Không thể kết nối đến máy chủ", "error");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Quản lý Lịch đặt chụp</h1>
        <p className="text-slate-400 text-sm mt-1">Giám sát các dịch vụ kết nối giữa Khách hàng và Nhiếp ảnh gia.</p>
      </div>

      {/* Filter options */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
        <span className="text-sm text-slate-400 font-medium">Lọc theo trạng thái hợp đồng:</span>
        <select 
          value={status} 
          onChange={(e) => { setStatus(e.target.value); setPage(1); setSelectedBooking(null); }}
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ nhiếp ảnh gia đồng ý (PENDING)</option>
          <option value="ACCEPTED">Đã đồng ý - Chờ đặt cọc (ACCEPTED)</option>
          <option value="DEPOSIT_PAID">Đã cọc - Chờ chụp (DEPOSIT_PAID)</option>
          <option value="IN_PROGRESS">Đang tiến hành chụp (IN_PROGRESS)</option>
          <option value="COMPLETED">Đã hoàn thành chụp (COMPLETED)</option>
          <option value="CANCELLED">Đã hủy lịch (CANCELLED)</option>
          <option value="DISPUTED">Đang có tranh chấp (DISPUTED)</option>
        </select>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Table list */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 rounded-l-xl">Khách hàng</th>
                <th className="py-3 px-3">Nhiếp ảnh gia</th>
                <th className="py-3 px-3">Tổng tiền</th>
                <th className="py-3 px-3">Trạng thái</th>
                <th className="py-3 px-3 text-center rounded-r-xl">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-orange-500 mx-auto"></div>
                  </td>
                </tr>
              ) : bookings.length > 0 ? (
                bookings.map((b) => {
                  let statusColor = "text-orange-400 bg-orange-500/10";
                  if (b.status === "COMPLETED") statusColor = "text-emerald-400 bg-emerald-500/10";
                  if (b.status === "CANCELLED") statusColor = "text-red-400 bg-red-500/10";
                  if (b.status === "DISPUTED") statusColor = "text-orange-400 bg-orange-500/10 animate-pulse";
                  if (b.status === "DEPOSIT_PAID") statusColor = "text-blue-400 bg-blue-500/10";

                  return (
                    <tr key={b._id} className="hover:bg-slate-800/10 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{b.customer?.fullName || "Khách hàng"}</div>
                        <div className="text-[11px] text-slate-500">{b.customer?.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{b.photographer?.displayName || "Nhiếp ảnh gia"}</div>
                        <div className="text-[11px] text-slate-500">{b.photographer?.user?.email}</div>
                      </td>
                      <td className="py-3 px-3 text-orange-400 font-bold">{formatCurrency(b.price)}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleViewDetails(b._id)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleUpdateStatus(b._id)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-yellow-500 rounded-lg transition"
                            title="Đổi trạng thái đặc biệt"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-500">Không tìm thấy lịch đặt nào.</td>
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

        {/* Detailed panel view */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 mb-4">Chi tiết Lịch đặt chụp</h2>
          
          {selectedBooking ? (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2 text-orange-400 font-bold">
                <CalendarRange className="h-4.5 w-4.5" />
                Hợp đồng: {selectedBooking.booking._id}
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-slate-400 text-xs">Thời gian & Địa điểm hẹn:</span>
                <p className="text-white font-medium">Hẹn lúc: {new Date(selectedBooking.booking.bookingDate).toLocaleString("vi-VN")}</p>
                <p className="text-slate-400">Thời lượng chụp: {selectedBooking.booking.durationHours} giờ</p>
                <p className="text-slate-400">Địa chỉ: {selectedBooking.booking.photographer?.location || "Ngoại cảnh tự chọn"}</p>
              </div>

              {/* Financial Breakdowns */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400 text-xs uppercase font-bold tracking-wide">Chi tiết tài chính</span>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tổng giá trị hợp đồng:</span>
                  <span className="text-white font-semibold">{formatCurrency(selectedBooking.booking.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ký quỹ đặt cọc (Deposit):</span>
                  <span className="text-orange-400 font-bold">{formatCurrency(selectedBooking.booking.depositAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tỷ lệ chiết khấu hệ thống:</span>
                  <span className="text-white">{(selectedBooking.booking.commissionRate * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tiền hoa hồng sàn (Commission):</span>
                  <span className="text-yellow-500 font-bold">{formatCurrency(selectedBooking.booking.commissionAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Photographer thực nhận (Payout):</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(selectedBooking.booking.photographerPayout)}</span>
                </div>
              </div>

              {/* Transactions log */}
              {selectedBooking.payments?.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 text-xs uppercase font-bold tracking-wide">Lịch sử thanh toán</span>
                  <div className="space-y-2 mt-2">
                    {selectedBooking.payments.map((p, i) => (
                      <div key={i} className="flex justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs">
                        <div>
                          <p className="text-white font-semibold">{p.paymentType} ({p.paymentMethod})</p>
                          <p className="text-slate-500 mt-0.5">{new Date(p.createdAt).toLocaleDateString("vi-VN")}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-400">{formatCurrency(p.amount)}</p>
                          <p className={`font-semibold ${p.status === "SUCCESS" ? "text-emerald-400" : "text-yellow-500"}`}>{p.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking status logs */}
              {selectedBooking.booking.statusLogs?.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 text-xs uppercase font-bold tracking-wide">Nhật ký thay đổi trạng thái</span>
                  <div className="space-y-2 mt-2 max-h-36 overflow-y-auto">
                    {selectedBooking.booking.statusLogs.map((log, i) => (
                      <div key={i} className="text-xs bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <div className="flex justify-between text-slate-400 font-semibold">
                          <span className="text-orange-400">{log.status}</span>
                          <span>{new Date(log.updatedAt).toLocaleString("vi-VN")}</span>
                        </div>
                        <p className="text-slate-300 mt-1 italic">"{log.note || "Không có ghi chú"}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dispute Warning */}
              {selectedBooking.dispute && (
                <div className="p-3 bg-red-950/20 border border-red-800/60 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-red-400">⚠️ Đang có khiếu nại tranh chấp cho lịch này</p>
                  <p className="text-slate-300">Tiêu đề: {selectedBooking.dispute.title}</p>
                  <p className="text-slate-300">Trạng thái tranh chấp: <span className="font-bold text-yellow-500">{selectedBooking.dispute.status}</span></p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500 text-xs text-center py-12">Chọn biểu tượng con mắt ở danh sách để xem chi tiết lịch đặt.</p>
          )}
        </div>

      </div>

    </div>
  );
}
