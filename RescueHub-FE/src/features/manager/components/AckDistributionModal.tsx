import React, { useState } from "react";
import { CheckCircle, X } from "lucide-react";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import {
  ackDistribution,
  type Distribution,
  type AckPayload,
} from "../services/warehouseService";

interface AckDistributionModalProps {
  dist: Distribution;
  onClose: () => void;
  onSuccess: () => void;
}

export function AckDistributionModal({
  dist,
  onClose,
  onSuccess,
}: AckDistributionModalProps) {
  const [form, setForm] = useState<AckPayload>({
    ackMethodCode: dist.ackMethodCode,
    ackCode: "",
    ackByName: "",
    ackPhone: "",
    ackNote: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAck = async () => {
    if (!form.ackCode.trim()) {
      setError("Vui lòng nhập mã ACK.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await ackDistribution(dist.id, form, getAuthSession()?.accessToken ?? "");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi xác nhận");
    } finally {
      setLoading(false);
    }
  };

  const F = (k: keyof AckPayload) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 bg-black/40 z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">Xác nhận nhận hàng</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {dist.ack?.ackCode && (
          <div className="mx-6 mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-emerald-700 font-semibold">
                Mã xác nhận (ACK Code)
              </p>
              <p className="text-2xl font-black font-mono text-emerald-800 tracking-widest">
                {dist.ack.ackCode}
              </p>
            </div>
          </div>
        )}

        <div className="p-6 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">
              Mã ACK người dùng nhập <span className="text-red-500">*</span>
            </label>
            <input
              value={form.ackCode}
              onChange={F("ackCode")}
              placeholder="123456"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-widest text-center text-lg"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">
              Tên người nhận
            </label>
            <input
              value={form.ackByName}
              onChange={F("ackByName")}
              placeholder="Trần Văn D"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">
              Số điện thoại
            </label>
            <input
              value={form.ackPhone}
              onChange={F("ackPhone")}
              placeholder="0900000009"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">
              Ghi chú
            </label>
            <input
              value={form.ackNote}
              onChange={F("ackNote")}
              placeholder="Đã nhận đủ..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-sm hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            onClick={handleAck}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}
          >
            {loading ? "Đang xác nhận..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}
