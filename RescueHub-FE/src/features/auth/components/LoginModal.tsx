import React, { useState } from "react";
import { X, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getDefaultRouteForRoles, login } from "../services/authService";
import { setAuthSession } from "../services/authStorage";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToSignup,
}) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const session = await login({
        username: username.trim(),
        password,
      });

      setAuthSession(session);
      onClose();

      navigate(getDefaultRouteForRoles(session.user.roles), { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Dang nhap that bai",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ fontFamily: "var(--font-primary)" }}
      >
        {/* Header */}
        <div
          className="bg-blue-950 px-6 py-6 flex justify-between items-center"
          style={{ backgroundColor: "var(--color-blue-950)" }}
        >
          <h2
            className="text-2xl font-black text-white"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Đăng Nhập
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Username Field */}
          <div>
            <label
              className="block text-sm font-bold text-gray-700 mb-2"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Username
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhap username"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-950 focus:outline-none transition-colors"
                style={{ borderColor: "var(--color-blue-950)" }}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              className="block text-sm font-bold text-gray-700 mb-2"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Mật khẩu
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-950 focus:outline-none transition-colors"
                style={{ borderColor: "var(--color-blue-950)" }}
                required
              />
            </div>
          </div>

          {/* Remember & Forgot */}
          <div className="flex justify-between items-center text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-gray-600">Ghi nhớ tôi</span>
            </label>
            <button
              type="button"
              className="text-blue-950 hover:underline font-semibold"
              style={{ color: "var(--color-blue-950)" }}
            >
              Quên MK?
            </button>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            {isLoading ? "Đang đăng nhập..." : "Đăng Nhập"}
          </button>

          {/* Divider */}
          <div className="relative flex items-center gap-3 my-6">
            <div className="flex-1 h-[1px] bg-gray-300"></div>
            <span className="text-sm text-gray-500">hoặc</span>
            <div className="flex-1 h-[1px] bg-gray-300"></div>
          </div>

          {/* Switch to Signup */}
          <div className="text-center text-sm text-gray-600">
            Chưa có tài khoản?{" "}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-blue-950 font-bold hover:underline"
              style={{ color: "var(--color-blue-950)" }}
            >
              Đăng kí
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
