import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  SquareMenu,
  BarChart3,
  ChevronRight,
  CarTaxiFront,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { performLogout } from "../../auth/services/authStorage";

export const adminMenu = [
  // { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "reports", label: "Báo cáo", icon: BarChart3 },
  { id: "users", label: "Tài khoản", icon: Users },
  { id: "roles", label: "Vai trò", icon: Shield },
  { id: "master-data", label: "Danh mục hệ thống", icon: Settings },
  { id: "catalog", label: "Danh mục sản phẩm", icon: CarTaxiFront },
  { id: "workflow", label: "Workflow", icon: SquareMenu },
  { id: "system-setting", label: "Cài đặt hệ thống", icon: Settings },
];

export const AdminSidebar = ({ active, setActive }) => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
        await performLogout();
      localStorage.removeItem("rescuehub.auth.session");

      localStorage.removeItem("accessToken");
    } catch (err) {
      console.error(err);
    } finally {
      navigate("/home", { replace: true });
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-white shadow-lg flex flex-col border-r">
      {/* LOGO */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-black text-blue-950">
          RescueHub
        </h1>
        <p className="text-xs text-gray-600">
          Quản trị hệ thống
        </p>
      </div>

      {/* MENU */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {adminMenu.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-blue-50 shadow-sm"
                  : "hover:bg-gray-50"
              }`}
            >
              <Icon
                size={20}
                className={
                  isActive ? "text-blue-600" : "text-gray-600"
                }
              />
              <span
                className={`text-sm font-semibold flex-1 text-left ${
                  isActive
                    ? "text-blue-950"
                    : "text-gray-700"
                }`}
              >
                {item.label}
              </span>
              {isActive && <ChevronRight size={16} />}
            </button>
          );
        })}
      </nav>

      {/* LOGOUT */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 hover:bg-red-100 transition"
        >
          <LogOut size={20} className="text-red-600" />
          <span className="text-sm font-semibold text-red-600">
            {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
          </span>
        </button>
      </div>
    </aside>
  );
};