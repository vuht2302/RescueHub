import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  Package,
  User,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import { toast } from "react-toastify";
import {
  getDistribution,
  ackDistribution,
  type Distribution,
} from "../services/warehouseService";
import {
  StatusBadge,
  DIST_STATUS,
  formatDate,
} from "../constants/statusConfig";

interface DistributionDetailModalProps {
  distId: string;
  onClose: () => void;
  onAckSuccess?: () => void;
}

export function DistributionDetailModal({
  distId,
  onClose,
  onAckSuccess,
}: DistributionDetailModalProps) {
  const [dist, setDist] = useState<Distribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ackLoading, setAckLoading] = useState(false);
  const [ackError, setAckError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await getDistribution(
          distId,
          getAuthSession()?.accessToken ?? "",
        );
        setDist(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không thể tải chi tiết");
      } finally {
        setLoading(false);
      }
    })();
  }, [distId]);

  const handleAck = async () => {
    if (!dist) return;
    setAckLoading(true);
    setAckError(null);
    try {
      const payload = {
        ackMethodCode: dist.ackMethodCode || "MANUAL",
        ackCode: dist.ack?.ackCode || "",
        ackByName: dist.ack?.ackByName || "",
        ackPhone: dist.ack?.ackPhone || "",
        ackNote: dist.ack?.ackNote || "",
      };
      await ackDistribution(
        distId,
        payload,
        getAuthSession()?.accessToken ?? "",
      );
      const updated = await getDistribution(
        distId,
        getAuthSession()?.accessToken ?? "",
      );
      setDist(updated);
      onAckSuccess?.();
      toast.success("Xác nhận đã nhận hàng thành công!");
    } catch (e) {
      setAckError(e instanceof Error ? e.message : "Lỗi xác nhận");
    } finally {
      setAckLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">
              Phiếu phân phối
            </p>
            <h2 className="text-lg font-bold font-mono">
              {dist?.code || "..."}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {dist && (
              <StatusBadge
                code={dist.status?.code ?? ""}
                statusMap={DIST_STATUS}
              />
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {loading && (
          <div className="p-12 text-center text-gray-500">Đang tải...</div>
        )}
        {error && (
          <div className="m-6 bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <AlertCircle size={32} className="mx-auto text-red-400 mb-2" />
            <p className="text-red-600 font-semibold">{error}</p>
            <p className="text-gray-500 text-xs mt-1 font-mono">{distId}</p>
          </div>
        )}

        {dist && (
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-blue-800 mb-3">
                <User size={16} className="inline mr-2" />
                Hộ dân nhận cứu trợ
              </h3>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-xs text-gray-500 block">Họ tên</span>
                  <p className="font-semibold">{dist.recipient?.name || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">SĐT</span>
                  <p className="font-semibold text-blue-700">
                    {dist.recipient?.phone || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Ngày tạo</span>
                  <p className="font-semibold">{formatDate(dist.createdAt)}</p>
                </div>
                <div className="col-span-3">
                  <span className="text-xs text-gray-500 block">Địa chỉ</span>
                  <p className="font-semibold">
                    {dist.recipient?.address || "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-gray-500 block">
                  Khu vực
                </span>
                <p className="font-semibold">{dist.adminArea?.name || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Chiến dịch</span>
                <p className="font-semibold">{dist.campaign?.name || "—"}</p>
              </div>
            </div>
            {dist.note && (
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-500 block">Ghi chú</span>
                <p className="font-semibold">{dist.note}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                <Package size={16} /> Vật phẩm ({dist.lines?.length ?? 0})
              </h3>
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                        Hàng hóa
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                        LOT
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
                    {(dist.lines ?? []).map((l, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium">
                          {l.item?.name}
                        </td>
                        <td className="px-3 py-2 text-gray-500 font-mono text-xs">
                          {l.lot?.lotNo || "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-green-700">
                          {l.qty}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-500">
                          {l.unitCode}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {dist.status?.code === "PENDING" && (
              <div className="space-y-2">
                {ackError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {ackError}
                  </div>
                )}
                <button
                  onClick={handleAck}
                  disabled={ackLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm hover:shadow-lg transition-shadow disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg,#059669,#10b981)",
                  }}
                >
                  {ackLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Đang xác
                      nhận...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Xác nhận đã nhận hàng
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
