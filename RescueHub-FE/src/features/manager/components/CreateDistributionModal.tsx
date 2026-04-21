import React, { useState } from "react";
import {
  AlertCircle,
  Package,
  Truck,
  User,
  X,
} from "lucide-react";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import {
  createDistribution,
  type DistributionPayload,
  type Distribution,
} from "../services/warehouseService";
import { toastSuccess } from "../../../shared/utils/toast";

interface CreateDistributionModalProps {
  reliefRequest: import("../../rescue-coordinator/services/incidentServices").ReliefRequestDetail;
  onClose: () => void;
  onSuccess: (distribution: Distribution) => void;
}

export function CreateDistributionModal({
  reliefRequest,
  onClose,
  onSuccess,
}: CreateDistributionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    reliefPointId: "",
    householdId: "",
    ackMethodCode: "OTP",
    note: "",
  });

  const handleSubmit = async () => {
    if (!form.reliefPointId.trim()) {
      setError("Vui lòng nhập ID điểm cứu trợ.");
      return;
    }
    if (!form.householdId.trim()) {
      setError("Vui lòng nhập ID hộ dân.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = getAuthSession()?.accessToken ?? "";
      const lines = reliefRequest.requestedItems
        .filter((item) => (item.defaultApprovedQty || item.requestedQty) > 0)
        .map((item) => ({
          itemId: item.reliefRequestItemId,
          lotId: "",
          qty: item.defaultApprovedQty || item.requestedQty,
          unitCode: item.unitCode,
        }));
      const payload: DistributionPayload = {
        campaignId: reliefRequest.campaign?.id || "",
        reliefPointId: form.reliefPointId.trim(),
        householdId: form.householdId.trim(),
        incidentId: reliefRequest.incident?.id || null,
        ackMethodCode: form.ackMethodCode,
        note:
          form.note ||
          `Phân phối cứu trợ cho yêu cầu ${reliefRequest.requestCode}`,
        lines,
      };
      const result = await createDistribution(payload, token);
      toastSuccess(`Đã tạo phiếu phân phối ${result.code}`);
      onSuccess(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tạo phiếu phân phối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-green-50">
          <div>
            <h2 className="text-lg font-bold text-green-800">
              Tạo phiếu phân phối cứu trợ
            </h2>
            <p className="text-xs text-gray-500">
              Yêu cầu: {reliefRequest.requestCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-green-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">
              <User size={16} className="inline mr-2" />
              Người nhận
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-gray-500 block">Tên</span>
                <p className="font-semibold">{reliefRequest.requester?.name || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">SĐT</span>
                <p className="font-semibold">{reliefRequest.requester?.phone || "—"}</p>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              ID Điểm cứu trợ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.reliefPointId}
              onChange={(e) =>
                setForm((p) => ({ ...p, reliefPointId: e.target.value }))
              }
              placeholder="UUID điểm cứu trợ..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              ID Hộ dân <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.householdId}
              onChange={(e) =>
                setForm((p) => ({ ...p, householdId: e.target.value }))
              }
              placeholder="UUID hộ dân..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Phương thức xác nhận
            </label>
            <select
              value={form.ackMethodCode}
              onChange={(e) =>
                setForm((p) => ({ ...p, ackMethodCode: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="OTP">OTP (Mã xác nhận)</option>
              <option value="SIGNATURE">Chữ ký</option>
              <option value="MANUAL">Thủ công</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Ghi chú
            </label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="Ghi chú..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Package size={16} /> Vật phẩm (
              {reliefRequest.requestedItems.length})
            </h3>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                      Vật phẩm
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">
                      SL
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500">
                      ĐV
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reliefRequest.requestedItems.map((item) => (
                    <tr key={item.reliefRequestItemId}>
                      <td className="px-3 py-2 font-medium">
                        {item.supportTypeName}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-green-700">
                        {item.defaultApprovedQty || item.requestedQty}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-500">
                        {item.unitCode}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
              <Truck size={16} />
            )}
            Tạo phiếu phân phối
          </button>
        </div>
      </div>
    </div>
  );
}
