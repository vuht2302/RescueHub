import React, { useEffect, useState, useCallback } from "react";
import {
  getSystemSettings,
  updateSystemSettings,
} from "@/src/shared/services/systemSetting.service";
import {
  Settings,
  AlertCircle,
  Save,
  Clock,
  Shield,
  Map,
  Phone,
} from "lucide-react";

const SystemSettingsPage = () => {
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ===== LOAD =====
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSystemSettings();
      setForm(data);
    } catch (err) {
      console.error(err);
      setError("Load settings thất bại");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===== HANDLE CHANGE =====
  const handleChange = (key: string, value: any) => {
    setForm((prev: any) => ({
      ...prev,
      [key]: value,
    }));
    setSuccess(false);
  };

  // ===== SAVE =====
  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccess(false);

      await updateSystemSettings({
        otpTtlMinutes: Number(form.otpTtlMinutes),
        accessTokenExpiryMinutes: Number(form.accessTokenExpiryMinutes),
        refreshTokenExpiryHours: Number(form.refreshTokenExpiryHours),
        publicMapCacheSeconds: Number(form.publicMapCacheSeconds),
        publicHotline: form.publicHotline,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2
            className="text-2xl font-black text-gray-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Cấu hình hệ thống
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý các thông số vận hành hệ thống
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-2xl space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="space-y-6">
        <div>
          <h2
            className="text-2xl font-black text-gray-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Cấu hình hệ thống
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý các thông số vận hành hệ thống
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2
          className="text-2xl font-black text-gray-900"
          style={{ fontFamily: "var(--font-primary)" }}
        >
          Cấu hình hệ thống
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Quản lý các thông số vận hành hệ thống
        </p>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2 max-w-2xl">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700 flex items-center gap-2 max-w-2xl">
          <Settings size={16} />
          Lưu thay đổi thành công!
        </div>
      )}

      {/* FORM */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-2xl space-y-6">
        {/* OTP */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Shield size={16} className="text-blue-600" />
            OTP TTL (phút)
          </label>
          <input
            type="number"
            value={form.otpTtlMinutes}
            onChange={(e) => handleChange("otpTtlMinutes", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Thời gian hiệu lực của mã OTP
          </p>
        </div>

        {/* ACCESS TOKEN */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Clock size={16} className="text-blue-600" />
            Access Token Expiry (phút)
          </label>
          <input
            type="number"
            value={form.accessTokenExpiryMinutes}
            onChange={(e) =>
              handleChange("accessTokenExpiryMinutes", e.target.value)
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Thời gian hết hạn của access token
          </p>
        </div>

        {/* REFRESH TOKEN */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Clock size={16} className="text-blue-600" />
            Refresh Token Expiry (giờ)
          </label>
          <input
            type="number"
            value={form.refreshTokenExpiryHours}
            onChange={(e) =>
              handleChange("refreshTokenExpiryHours", e.target.value)
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Thời gian hết hạn của refresh token
          </p>
        </div>

        {/* CACHE */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Map size={16} className="text-blue-600" />
            Map Cache (giây)
          </label>
          <input
            type="number"
            value={form.publicMapCacheSeconds}
            onChange={(e) =>
              handleChange("publicMapCacheSeconds", e.target.value)
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Thời gian cache dữ liệu bản đồ công khai
          </p>
        </div>

        {/* HOTLINE */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Phone size={16} className="text-blue-600" />
            Hotline công khai
          </label>
          <input
            value={form.publicHotline}
            onChange={(e) => handleChange("publicHotline", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Số điện thoại hotline hiển thị cho công chúng
          </p>
        </div>

        {/* DIVIDER */}
        <div className="border-t border-gray-100" />

        {/* UPDATED */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={12} />
            Cập nhật lần cuối:{" "}
            {new Date(form.updatedAt).toLocaleString("vi-VN")}
          </div>

          {/* ACTION */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60 transition-opacity"
            style={{ background: "linear-gradient(135deg,#1e3a5f,#1e40af)" }}
          >
            <Save size={15} />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsPage;
