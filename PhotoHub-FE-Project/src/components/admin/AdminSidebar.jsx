import React from "react";
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
  Camera
} from "lucide-react";

export default function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Thành viên", path: "/admin/users", icon: Users },
    { label: "Xác minh đối tác", path: "/admin/verifications", icon: FileCheck },
    { label: "Lịch đặt chụp", path: "/admin/bookings", icon: Calendar },
    { label: "Tài chính & Rút tiền", path: "/admin/finance", icon: DollarSign },
    { label: "Tranh chấp & Khiếu nại", path: "/admin/disputes", icon: AlertTriangle },
    { label: "Báo cáo & Kiểm duyệt", path: "/admin/reports-chats", icon: MessageSquare },
    { label: "Cấu hình & Gói", path: "/admin/settings-packages", icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen sticky top-0">
      {/* Brand logo */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30">
          <Camera className="h-5 w-5" />
        </span>
        <span className="text-lg font-bold text-white tracking-wider">
          PhotoHub Admin
        </span>
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
              <Icon className="h-4.5 w-4.5" />
              {item.label}
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
