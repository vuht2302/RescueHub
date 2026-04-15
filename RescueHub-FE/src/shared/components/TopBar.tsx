import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Settings, UserCircle } from "lucide-react";
import { LoginModal } from "../../features/auth/components/LoginModal";
import { SignupModal } from "../../features/auth/components/SignupModal";
import {
  getAuthSession,
  performLogout,
} from "../../features/auth/services/authStorage";

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authSession, setAuthSession] = useState(getAuthSession());

  useEffect(() => {
    const refreshAuthState = () => setAuthSession(getAuthSession());

    window.addEventListener("auth-changed", refreshAuthState);
    window.addEventListener("storage", refreshAuthState);

    return () => {
      window.removeEventListener("auth-changed", refreshAuthState);
      window.removeEventListener("storage", refreshAuthState);
    };
  }, []);

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    `pb-1 transition-colors ${isActive ? "text-white border-b-2 border-white" : "text-gray-300 hover:text-white"}`;

  const openLogin = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  const openSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await performLogout();
    } finally {
      setShowLoginModal(false);
      setShowSignupModal(false);
      navigate("/home", { replace: true });
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <nav
        className="fixed top-0 w-full z-50 bg-blue-950 shadow-md flex justify-between items-center px-8 py-4"
        style={{ fontFamily: "var(--font-primary)" }}
      >
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="text-xl font-black text-white tracking-tighter cursor-pointer"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            RescueHub
          </Link>
          <div className="hidden md:flex items-center gap-8 tracking-tight">
            <NavLink
              to="/"
              end
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
            <NavLink
              to="/confirmed"
              className={getNavClassName}
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Báo cáo
            </NavLink>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {authSession && (
            <>
              <Link
                to="/home?relief=1"
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-bold transition-all active:scale-95 text-sm"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Yêu cầu cứu trợ
              </Link>
              <Link
                to="/home?request=1"
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg font-bold transition-all active:scale-95 text-sm"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Gửi tín hiệu
              </Link>
            </>
          )}
          {!authSession ? (
            <div className="flex gap-2">
              <button
                onClick={openLogin}
                className="p-2 text-gray-300 hover:text-white hover:bg-blue-900/50 rounded-full transition-colors"
                title="Đăng nhập"
              >
                <UserCircle size={24} />
              </button>
              <button
                onClick={openSignup}
                className="p-2 text-gray-300 hover:text-white hover:bg-blue-900/50 rounded-full transition-colors"
                title="Đăng kí"
              >
                <Settings size={24} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-white leading-tight">
                  {authSession.user.displayName}
                </p>
                <p className="text-xs text-blue-100 leading-tight">
                  {authSession.user.roles[0] ?? "CITIZEN"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-800/80 bg-blue-900/40 px-3 py-2 text-sm font-bold text-white hover:bg-blue-800/70 transition-colors"
                title="Đăng xuất"
              >
                <LogOut size={18} />
                <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={openSignup}
      />
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={openLogin}
      />
    </>
  );
};
