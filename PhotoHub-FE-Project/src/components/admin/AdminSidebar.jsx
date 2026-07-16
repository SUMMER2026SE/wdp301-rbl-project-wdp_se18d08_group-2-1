import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  MessageSquare, 
  Settings,
  LogOut,
  Camera,
  Gift,
  Bell
} from "lucide-react";
import { adminService } from "../../services/adminService";

export default function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    fetchCounts();
    // Live update checking every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCounts = async () => {
    try {
      // 1. Lấy số lượng hồ sơ đối tác đang PENDING
      const verifRes = await adminService.getPhotographerVerifications({ verificationStatus: "PENDING" });
      if (verifRes.success) {
        setPendingVerifications(verifRes.data.pagination.total || 0);
      }

      // 2. Lấy số lượng yêu cầu rút tiền đang PENDING
      const withdrawRes = await adminService.getWithdrawRequests({ status: "PENDING" });
      if (withdrawRes.success) {
        setPendingWithdrawals(withdrawRes.data.pagination.total || 0);
      }
    } catch (error) {
      console.error("Lỗi tải thông báo Admin:", error);
    }
  };

  const totalNotifications = pendingVerifications + pendingWithdrawals;

  const menuItems = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Thành viên", path: "/admin/users", icon: Users },
    { 
      label: "Xác minh đối tác", 
      path: "/admin/verifications", 
      icon: FileCheck,
      badge: pendingVerifications > 0 ? pendingVerifications : null
    },
    { label: "Lịch đặt chụp", path: "/admin/bookings", icon: Calendar },
    { 
      label: "Tài chính & Rút tiền", 
      path: "/admin/finance", 
      icon: DollarSign,
      badge: pendingWithdrawals > 0 ? pendingWithdrawals : null
    },
    { label: "Tranh chấp & Khiếu nại", path: "/admin/disputes", icon: AlertTriangle },
    { label: "Báo cáo & Kiểm duyệt", path: "/admin/reports-chats", icon: MessageSquare },
    { label: "Tích điểm & Ưu đãi", path: "/admin/loyalty", icon: Gift },
    { label: "Cấu hình & Gói", path: "/admin/settings-packages", icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("photohub-notifications");
    window.location.href = "/";
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen sticky top-0 z-30">
      {/* Brand logo & Notification Bell */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30">
            <Camera className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold text-white tracking-wider">
            PhotoHub
          </span>
        </div>

        {/* Global Notification Bell Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition duration-300 relative"
            title="Thông báo công việc cần duyệt"
          >
            <Bell className={`h-4.5 w-4.5 ${totalNotifications > 0 ? "animate-bounce text-orange-400" : ""}`} />
            {totalNotifications > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                {totalNotifications}
              </span>
            )}
          </button>

          {/* Floating Dropdown Card */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-3 w-64 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3 z-50 text-xs animate-fadeIn">
              <h4 className="font-bold text-white uppercase text-[10px] tracking-wider border-b border-slate-900 pb-2">
                Công việc tồn đọng ({totalNotifications})
              </h4>
              
              <div className="space-y-2">
                {pendingVerifications > 0 ? (
                  <Link
                    to="/admin/verifications"
                    onClick={() => setShowNotifDropdown(false)}
                    className="block p-2 rounded-xl bg-slate-900 hover:bg-slate-800 transition text-slate-200 border border-slate-800"
                  >
                    <p className="font-bold text-orange-400">📄 Xác minh đối tác</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Có {pendingVerifications} nhiếp ảnh gia đang chờ duyệt.</p>
                  </Link>
                ) : null}

                {pendingWithdrawals > 0 ? (
                  <Link
                    to="/admin/finance"
                    onClick={() => setShowNotifDropdown(false)}
                    className="block p-2 rounded-xl bg-slate-900 hover:bg-slate-800 transition text-slate-200 border border-slate-800"
                  >
                    <p className="font-bold text-emerald-400">💰 Yêu cầu rút tiền</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Có {pendingWithdrawals} lệnh rút tiền đang chờ xử lý.</p>
                  </Link>
                ) : null}

                {totalNotifications === 0 && (
                  <div className="text-center py-4 text-slate-500 font-medium italic">
                    🎉 Hoàn thành mọi công việc!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "hover:bg-slate-800/60 hover:text-white text-slate-400"
              }`}
            >
              <Icon className="h-4.5 w-4.5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex-shrink-0">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300"
        >
          <LogOut className="h-4.5 w-4.5" />
          Đăng xuất Admin
        </button>
      </div>
    </aside>
  );
}
