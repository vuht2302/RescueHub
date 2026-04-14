import React, { useState } from "react";
import { X, Mail, Lock, User } from "lucide-react";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export const SignupModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
}) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Mật khẩu không khớp!");
      return;
    }
    setIsLoading(true);
    // Simulate signup
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: "var(--font-primary)" }}
      >
        {/* Header */}
        <div
          className="bg-blue-950 px-6 py-6 flex justify-between items-center sticky top-0 z-10"
          style={{ backgroundColor: "var(--color-blue-950)" }}
        >
          <h2
            className="text-2xl font-black text-white"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Đăng Kí
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full Name Field */}
          <div>
            <label
              className="block text-sm font-bold text-gray-700 mb-2"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Họ và tên
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-950 focus:outline-none transition-colors"
                style={{ borderColor: "var(--color-blue-950)" }}
                required
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label
              className="block text-sm font-bold text-gray-700 mb-2"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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

          {/* Confirm Password Field */}
          <div>
            <label
              className="block text-sm font-bold text-gray-700 mb-2"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-950 focus:outline-none transition-colors"
                style={{ borderColor: "var(--color-blue-950)" }}
                required
              />
            </div>
          </div>

          {/* Terms & Conditions */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-5 h-5 mt-1 rounded"
              required
            />
            <span className="text-sm text-gray-600">
              Tôi đồng ý với{" "}
              <button
                type="button"
                className="text-blue-950 hover:underline font-semibold"
                style={{ color: "var(--color-blue-950)" }}
              >
                Điều khoản dịch vụ
              </button>{" "}
              và{" "}
              <button
                type="button"
                className="text-blue-950 hover:underline font-semibold"
                style={{ color: "var(--color-blue-950)" }}
              >
                Chính sách bảo mật
              </button>
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !agreeTerms}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            {isLoading ? "Đang đăng kí..." : "Đăng Kí"}
          </button>

          {/* Divider */}
          <div className="relative flex items-center gap-3 my-4">
            <div className="flex-1 h-[1px] bg-gray-300"></div>
            <span className="text-sm text-gray-500">hoặc</span>
            <div className="flex-1 h-[1px] bg-gray-300"></div>
          </div>

          {/* Social Signup */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="border-2 border-gray-300 hover:border-blue-950 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
            >
              Google
            </button>
            <button
              type="button"
              className="border-2 border-gray-300 hover:border-blue-950 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
            >
              Facebook
            </button>
          </div>

          {/* Switch to Login */}
          <div className="text-center text-sm text-gray-600">
            Đã có tài khoản?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-950 font-bold hover:underline"
              style={{ color: "var(--color-blue-950)" }}
            >
              Đăng nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
