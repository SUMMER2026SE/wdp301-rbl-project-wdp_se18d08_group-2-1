import React, { useState, useEffect } from "react";
import { 
  Gift, 
  Users, 
  History, 
  Coins, 
  Award, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { loyaltyService } from "../../services/loyaltyService";

export default function AdminLoyalty() {
  const [activeTab, setActiveTab] = useState("accounts");
  const [loading, setLoading] = useState(true);
  
  // Accounts state
  const [accounts, setAccounts] = useState([]);
  const [accountsPage, setAccountsPage] = useState(1);
  const [accountsTotalPages, setAccountsTotalPages] = useState(1);
  const [totalAccountsCount, setTotalAccountsCount] = useState(0);

  // Histories state
  const [histories, setHistories] = useState([]);
  const [historiesPage, setHistoriesPage] = useState(1);
  const [historiesTotalPages, setHistoriesTotalPages] = useState(1);

  // KPI stats
  const [kpis, setKpis] = useState({
    totalUsers: 0,
    totalPoints: 0,
    goldUsers: 0,
    platinumUsers: 0
  });

  useEffect(() => {
    if (activeTab === "accounts") {
      fetchAccounts(accountsPage);
    } else {
      fetchHistories(historiesPage);
    }
  }, [activeTab, accountsPage, historiesPage]);

  const fetchAccounts = async (page) => {
    try {
      setLoading(true);
      const res = await loyaltyService.adminGetAccounts(page, 10);
      if (res.success) {
        setAccounts(res.data.accounts);
        setAccountsTotalPages(res.data.pagination.pages || 1);
        setTotalAccountsCount(res.data.pagination.total || 0);

        // Fetch first page once to compute stats (mock/real aggregate)
        calculateKPIs(res.data.accounts, res.data.pagination.total);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách tài khoản tích điểm:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistories = async (page) => {
    try {
      setLoading(true);
      const res = await loyaltyService.adminGetHistories(page, 15);
      if (res.success) {
        setHistories(res.data.histories);
        setHistoriesTotalPages(res.data.pagination.pages || 1);
      }
    } catch (error) {
      console.error("Lỗi lấy lịch sử tích điểm của hệ thống:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateKPIs = (allAccounts, totalCount) => {
    let totalPts = 0;
    let goldCount = 0;
    let platinumCount = 0;

    allAccounts.forEach(a => {
      totalPts += (a.points || 0);
      if (a.membershipTier === "Gold") goldCount++;
      if (a.membershipTier === "Platinum") platinumCount++;
    });

    setKpis({
      totalUsers: totalCount,
      totalPoints: totalPts * (totalCount > 0 ? Math.ceil(totalCount / allAccounts.length) : 1), // scale estimate if paginated
      goldUsers: goldCount * (totalCount > 0 ? Math.ceil(totalCount / allAccounts.length) : 1),
      platinumUsers: platinumCount * (totalCount > 0 ? Math.ceil(totalCount / allAccounts.length) : 1),
    });
  };

  return (
    <div className="space-y-6 text-slate-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <Gift size={28} />
            </span>
            Chương trình Điểm thưởng & Thành viên
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Quản lý xếp hạng Gold/Platinum, tích lũy điểm thưởng từ đơn chụp và giới thiệu bạn bè.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Registered */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-orange-500/20">
            <Users size={40} />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hội viên tích điểm</p>
          <h3 className="text-3xl font-black text-white mt-2">{kpis.totalUsers.toLocaleString()}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Người dùng kích hoạt ví thưởng</p>
        </div>

        {/* Total Points circulating */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-orange-500/20">
            <Coins size={40} />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng điểm tích lũy</p>
          <h3 className="text-3xl font-black text-white mt-2">{kpis.totalPoints.toLocaleString()}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Tổng điểm lưu hành trong hệ thống</p>
        </div>

        {/* Gold Tier Users */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-orange-500/20">
            <Award size={40} className="text-amber-500/30" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Thành viên Hạng Gold</p>
          <h3 className="text-3xl font-black text-amber-500 mt-2">{kpis.goldUsers.toLocaleString()}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Tích lũy năm ≥ 1,000 điểm</p>
        </div>

        {/* Platinum Tier Users */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-orange-500/20">
            <Award size={40} className="text-indigo-500/30" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Thành viên Hạng Platinum</p>
          <h3 className="text-3xl font-black text-indigo-400 mt-2">{kpis.platinumUsers.toLocaleString()}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Tích lũy năm ≥ 5,000 điểm</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab("accounts")}
          className={`px-6 py-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === "accounts"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Users size={16} />
          Danh sách hội viên
        </button>
        <button
          onClick={() => setActiveTab("histories")}
          className={`px-6 py-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === "histories"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <History size={16} />
          Nhật ký điểm toàn hệ thống
        </button>
      </div>

      {/* Content Table Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-400">Đang đồng bộ dữ liệu điểm thưởng...</span>
          </div>
        ) : activeTab === "accounts" ? (
          /* ACCOUNTS TABLE */
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold">
                    <th className="py-4 px-6">Tên khách hàng</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6">Hạng thẻ</th>
                    <th className="py-4 px-6 text-right">Điểm hiện tại</th>
                    <th className="py-4 px-6 text-right">Tổng tích lũy năm</th>
                    <th className="py-4 px-6">Mã giới thiệu</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-slate-500">
                        Chưa tìm thấy hội viên nào đăng ký chương trình tích điểm.
                      </td>
                    </tr>
                  ) : (
                    accounts.map((acc) => (
                      <tr key={acc._id} className="border-b border-slate-800/50 hover:bg-slate-800/10 transition">
                        <td className="py-4 px-6 font-semibold text-white">{acc.userId?.fullName || "Chưa cập nhật"}</td>
                        <td className="py-4 px-6 text-slate-400">{acc.userId?.email}</td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            acc.membershipTier === "Platinum" 
                              ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                              : acc.membershipTier === "Gold"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                          }`}>
                            {acc.membershipTier}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-orange-400">{acc.points.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right font-medium text-slate-300">{acc.totalPointsAccumulatedYear.toLocaleString()}</td>
                        <td className="py-4 px-6 font-mono text-slate-500 text-xs">{acc.referralCode}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Accounts Pagination */}
            {accountsTotalPages > 1 && (
              <div className="p-4 border-t border-slate-800 flex justify-between items-center text-sm text-slate-400">
                <span>Trang {accountsPage} / {accountsTotalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={accountsPage === 1}
                    onClick={() => setAccountsPage(p => p - 1)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={accountsPage === accountsTotalPages}
                    onClick={() => setAccountsPage(p => p + 1)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* HISTORIES TABLE */
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold">
                    <th className="py-4 px-6">Ngày giao dịch</th>
                    <th className="py-4 px-6">Khách hàng</th>
                    <th className="py-4 px-6">Loại sự kiện</th>
                    <th className="py-4 px-6">Nội dung chi tiết</th>
                    <th className="py-4 px-6 text-right">Biến động điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {histories.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-slate-500">
                        Chưa ghi nhận biến động điểm thưởng nào trên hệ thống.
                      </td>
                    </tr>
                  ) : (
                    histories.map((h) => (
                      <tr key={h._id} className="border-b border-slate-800/50 hover:bg-slate-800/10 transition">
                        <td className="py-4 px-6 text-slate-500">
                          {new Date(h.createdAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="py-4 px-6 font-medium text-white">
                          <div>{h.userId?.fullName || "Khách hàng"}</div>
                          <div className="text-xs text-slate-500">{h.userId?.email}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            h.type.startsWith("Earn_") ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {h.type}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-300 font-normal">{h.description}</td>
                        <td className={`py-4 px-6 text-right font-bold text-base ${
                          h.points > 0 ? "text-green-500" : "text-red-500"
                        }`}>
                          {h.points > 0 ? `+${h.points}` : h.points}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Histories Pagination */}
            {historiesTotalPages > 1 && (
              <div className="p-4 border-t border-slate-800 flex justify-between items-center text-sm text-slate-400">
                <span>Trang {historiesPage} / {historiesTotalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={historiesPage === 1}
                    onClick={() => setHistoriesPage(p => p - 1)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={historiesPage === historiesTotalPages}
                    onClick={() => setHistoriesPage(p => p + 1)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
