import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { LineChart, DollarSign, Wallet, ShieldAlert, BarChart3 } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminRevenueForecast() {
  const [forecast, setForecast] = useState({
    currentMonthRevenue: 0,
    projectedRevenue: 0,
    pendingPayouts: 0,
    estimatedCommission: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const res = await adminService.getRevenueForecast();
      if (res.success) {
        setForecast(res.data);
      } else {
        Swal.fire("Lỗi", res.message || "Không thể tải dự báo tài chính", "error");
      }
    } catch (e) {
      console.error(e);
      Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LineChart className="h-6 w-6 text-cyan-400" />
            Dự báo Doanh thu & Dòng tiền (Revenue Forecast)
          </h1>
          <p className="text-slate-400 text-sm mt-1">Tổng quan về doanh thu thực tế, doanh thu dự kiến trong tháng, số dư ký quỹ giữ hộ và hoa hồng ước tính.</p>
        </div>
        <button
          onClick={fetchForecast}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition text-sm"
        >
          Làm mới tài chính
        </button>
      </div>

      {loading ? (
        <div className="text-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500 mx-auto"></div>
          <p className="text-slate-500 text-xs mt-3">Đang tổng hợp số liệu tài chính...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metrics card grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Current Month Revenue */}
            <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-md">
              <div className="flex justify-between items-center text-emerald-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Doanh thu thực tế (Tháng này)</span>
                <DollarSign className="h-5 w-5" />
              </div>
              <p className="text-2xl font-black mt-2 text-white">{formatCurrency(forecast.currentMonthRevenue)}</p>
              <div className="text-[10px] text-emerald-500 mt-2">Dựa trên các giao dịch DEPOSIT và FINAL thành công.</div>
            </div>

            {/* Projected Revenue */}
            <div className="p-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 backdrop-blur-md">
              <div className="flex justify-between items-center text-cyan-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Doanh thu dự kiến (Tháng này)</span>
                <BarChart3 className="h-5 w-5" />
              </div>
              <p className="text-2xl font-black mt-2 text-white">{formatCurrency(forecast.projectedRevenue)}</p>
              <div className="text-[10px] text-cyan-500 mt-2">Tổng giá trị các đơn đặt chụp đang hoạt động lên lịch trong tháng.</div>
            </div>

            {/* Pending Payouts */}
            <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 backdrop-blur-md">
              <div className="flex justify-between items-center text-rose-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tiền cọc giữ hộ (Hold balance)</span>
                <Wallet className="h-5 w-5" />
              </div>
              <p className="text-2xl font-black mt-2 text-white">{formatCurrency(forecast.pendingPayouts)}</p>
              <div className="text-[10px] text-rose-500 mt-2">Các khoản ký quỹ đặt cọc giữ hộ chưa giải ngân (Escrow).</div>
            </div>

            {/* Estimated Commission */}
            <div className="p-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 backdrop-blur-md">
              <div className="flex justify-between items-center text-yellow-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hoa hồng dự kiến thu về (Platform)</span>
                <ShieldAlert className="h-5 w-5" />
              </div>
              <p className="text-2xl font-black mt-2 text-white">{formatCurrency(forecast.estimatedCommission)}</p>
              <div className="text-[10px] text-yellow-500 mt-2">Tổng số tiền hoa hồng (Commission PENDING) chuẩn bị thu từ các booking.</div>
            </div>
          </div>

          {/* Breakdown / Explanation Panel */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Phân tích Chi tiết Dòng tiền</h2>
            <div className="text-sm text-slate-300 space-y-3">
              <p>
                Hệ thống PhotoHub vận hành theo cơ chế <strong>Ký quỹ (Escrow) bảo mật</strong>. Khi khách hàng đặt lịch chụp:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
                <li>Khách hàng thanh toán tiền cọc (Deposit), khoản tiền này được chuyển vào ví ký quỹ của hệ thống và hiển thị ở cột <strong className="text-rose-400">Tiền cọc giữ hộ</strong>.</li>
                <li>Sau khi lịch chụp hoàn thành thành công và khách hàng duyệt album, tiền ký quỹ sẽ được giải ngân vào ví khả dụng của Photographer sau khi trừ hoa hồng chiết khấu sàn.</li>
                <li>Phần trăm hoa hồng chiết khấu đó sẽ chuyển từ trạng thái PENDING sang COLLECTED và ghi nhận là doanh thu của nền tảng.</li>
              </ul>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span>Ước lượng Tỷ trọng Hoa hồng khả dụng thực tế:</span>
                <span className="text-cyan-400 font-bold">~ 10% Tổng Doanh thu dự kiến</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
