import React, { useEffect, useState } from "react";
import { Package, X } from "lucide-react";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import {
  getReliefIssue,
  type ReliefIssue,
} from "../services/warehouseService";
import { StatusBadge, ISSUE_STATUS, formatDate } from "../constants/statusConfig";

interface ReliefIssueDetailModalProps {
  issueId: string;
  onClose: () => void;
}

export function ReliefIssueDetailModal({
  issueId,
  onClose,
}: ReliefIssueDetailModalProps) {
  const [detail, setDetail] = useState<ReliefIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const d = await getReliefIssue(
          issueId,
          getAuthSession()?.accessToken ?? "",
        );
        setDetail(d);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi tải chi tiết");
      } finally {
        setLoading(false);
      }
    })();
  }, [issueId]);

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">
              Phiếu cấp phát
            </p>
            <h2 className="text-lg font-bold font-mono">
              {detail?.code || "..."}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {detail && (
              <StatusBadge
                code={detail.status?.code ?? ""}
                statusMap={ISSUE_STATUS}
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
          <div className="m-6 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {detail && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-semibold mb-1">
                  Chiến dịch
                </p>
                <p className="text-sm font-bold">
                  {detail.campaign?.name ?? "—"}
                </p>
                {detail.campaign?.code && (
                  <p className="text-xs font-mono text-gray-500">
                    {detail.campaign.code}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-semibold mb-1">
                  Điểm cứu trợ
                </p>
                <p className="text-sm font-bold">
                  {detail.reliefPoint?.name ?? "—"}
                </p>
                {detail.reliefPoint?.code && (
                  <p className="text-xs font-mono text-gray-500">
                    {detail.reliefPoint.code}
                  </p>
                )}
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-400 font-semibold mb-1">
                  Kho xuất hàng
                </p>
                <p className="text-sm font-bold">
                  {detail.fromWarehouse?.name}
                </p>
                <p className="text-xs font-mono text-blue-600">
                  {detail.fromWarehouse?.code}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-semibold mb-1">
                  Ngày tạo
                </p>
                <p className="text-sm font-semibold">
                  {formatDate(detail.createdAt)}
                </p>
              </div>
            </div>
            {detail.note && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <span className="text-xs text-blue-500 font-semibold block mb-1">
                  Ghi chú
                </span>
                <p className="text-sm text-blue-900">{detail.note}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold mb-2">
                Danh sách hàng hóa ({detail.lines?.length ?? 0})
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
                    {(detail.lines ?? []).map((l) => (
                      <tr key={l.id}>
                        <td className="px-3 py-2">
                          <p className="font-semibold">{l.item.name}</p>
                          <p className="text-xs font-mono text-gray-400">
                            {l.item.code}
                          </p>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-600">
                          {l.lot?.lotNo ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-black">
                          {l.issueQty.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-500 text-xs">
                          {l.unitCode}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t">
                      <td
                        colSpan={2}
                        className="px-3 py-2 text-xs font-semibold text-right"
                      >
                        Tổng:
                      </td>
                      <td className="px-3 py-2 text-right font-black text-blue-700">
                        {(detail.lines ?? [])
                          .reduce((s, l) => s + l.issueQty, 0)
                          .toLocaleString()}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
