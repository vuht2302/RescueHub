import React, { useEffect, useState } from "react";
import { CheckCircle, Package, User, X, AlertCircle } from "lucide-react";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import {
  getDistribution,
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
  onAck?: (dist: Distribution) => void;
}

export function DistributionDetailModal({
  distId,
  onClose,
  onAck,
}: DistributionDetailModalProps) {
  const [dist, setDist] = useState<Distribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            {dist.ack?.ackCode &&
              dist.status?.code !== "ACKNOWLEDGED" &&
              onAck && (
                <button
                  onClick={() => onAck(dist)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm hover:shadow-lg transition-shadow"
                  style={{
                    background: "linear-gradient(135deg,#059669,#10b981)",
                  }}
                >
                  <CheckCircle size={16} /> Xác nhận đã nhận hàng (ACK)
                </button>
              )}
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-blue-800 mb-3">
                <User size={16} className="inline mr-2" />
                Hộ dân nhận cứu trợ
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-gray-500 block">Họ tên</span>
                  <p className="font-semibold">{dist.recipient?.name || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">SĐT</span>
                  <p className="font-semibold text-blue-700">
                    {dist.recipient.phone || "—"}
                  </p>
                </div>
                <div className="col-span-2">
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
                  Điểm cứu trợ
                </span>
                <p className="font-semibold">{dist.reliefPoint?.name || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Chiến dịch</span>
                <p className="font-semibold">{dist.campaign?.name || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">
                  Phương thức ACK
                </span>
                <p className="font-semibold">{dist.ackMethodCode || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Ngày tạo</span>
                <p className="font-semibold">{formatDate(dist.createdAt)}</p>
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
            {dist.ack && (
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
                  <CheckCircle size={16} /> Xác nhận đã nhận
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Người nhận
                    </span>
                    <p className="font-semibold">{dist.ack.ackByName || "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">SĐT</span>
                    <p className="font-semibold">{dist.ack.ackPhone || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500 block">
                      Mã xác nhận
                    </span>
                    <p className="font-semibold font-mono">
                      {dist.ack.ackCode || "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500 block">
                      Thời gian nhận
                    </span>
                    <p className="font-semibold">
                      {dist.ack.ackAt ? formatDate(dist.ack.ackAt) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
