import React from "react";
import { Link, NavLink } from "react-router-dom";
import { UserCircle, Settings } from "lucide-react";

export const TopBar: React.FC = () => {
  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    `pb-1 transition-colors ${isActive ? "text-white border-b-2 border-white" : "text-gray-300 hover:text-white"}`;

  return (
    <nav
      className="fixed top-0 w-full z-50 bg-blue-950 shadow-md flex justify-between items-center px-8 py-4"
      style={{ fontFamily: "var(--font-primary)" }}
    >
      <div className="flex items-center gap-8">
        <Link
          to="/rescue-team"
          className="text-xl font-black text-white tracking-tighter cursor-pointer"
          style={{ fontFamily: "var(--font-primary)" }}
        >
          RecuseHub
        </Link>
        <div className="hidden md:flex items-center gap-8  tracking-tight">
          <NavLink
            to="/rescue-team"
            className={getNavClassName}
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Đội cứu hộ
          </NavLink>
          <NavLink
            to="/home"
            className={getNavClassName}
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Trang chủ
          </NavLink>
          <NavLink
            to="/track"
            className={getNavClassName}
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Theo dõi
          </NavLink>
          <NavLink
            to="/alerts"
            className={getNavClassName}
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Cảnh báo
          </NavLink>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/request"
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg font-bold transition-all active:scale-95 text-sm"
          style={{ fontFamily: "var(--font-primary)" }}
        >
          Gửi tín hiệu
        </Link>
        <div className="flex gap-2">
          <button className="p-2 text-gray-300 hover:text-white hover:bg-blue-900/50 rounded-full transition-colors">
            <UserCircle size={24} />
          </button>
          <button className="p-2 text-gray-300 hover:text-white hover:bg-blue-900/50 rounded-full transition-colors">
            <Settings size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
};
