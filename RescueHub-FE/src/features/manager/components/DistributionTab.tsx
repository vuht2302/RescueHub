import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Eye,
  X,
  AlertCircle,
  PackagePlus,
  Trash2,
  CheckCircle,
} from "lucide-react";
import {
  getDistributions,
  getDistribution,
  createDistribution,
  ackDistribution,
  type Distribution,
  type DistributionListItem,
  type DistributionPayload,
  type DistributionLine,
  type AckPayload,
} from "../services/warehouseService";
import { getAuthSession } from "../../../features/auth/services/authStorage";

// ─── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({
  distId,
  onClose,
  onAck,
}: {
  distId: string;
  onClose: () => void;
  onAck: (d: Distribution) => void;
}) {
  const [dist, setDist] = useState<Distribution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDistribution(distId, getAuthSession()?.accessToken ?? "")
      .then(setDist)
      .finally(() => setLoading(false));
  }, [distId]);

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold">{dist?.code || "Đang tải..."}</h2>
            {dist && (
              <p className="text-xs text-gray-500">
                Chiến dịch: {dist.campaign?.name || "—"} •{" "}
                {new Date(dist.createdAt).toLocaleString("vi-VN")}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            Đang tải chi tiết...
          </div>
        ) : dist ? (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-gray-500 block">Hộ dân</span>
                <p className="font-semibold">{dist.recipient?.name || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">
                  Điểm cứu trợ
                </span>
                <p className="font-semibold">{dist.reliefPoint?.name || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">
                  Phương thức ACK
                </span>
                <p className="font-semibold">{dist.ackMethodCode}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Mã ACK</span>
                {dist.ack?.ackCode ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-mono text-sm font-bold">
                    {dist.ack.ackCode}
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">—</span>
                )}
              </div>
            </div>
            {dist.ack?.ackCode && dist.status?.code !== "ACKNOWLEDGED" && (
              <button
                onClick={() => onAck(dist)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm"
                style={{
                  background: "linear-gradient(135deg,#059669,#10b981)",
                }}
              >
                <CheckCircle size={16} /> Xác nhận đã nhận hàng (ACK)
              </button>
            )}
            <div>
              <h3 className="text-sm font-bold mb-2">
                Dòng hàng ({dist.lines?.length ?? 0})
              </h3>
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                        Hàng hóa
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                        Lô
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">
                        SL
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
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
                        <td className="px-3 py-2 font-mono text-xs">
                          {l.lot?.lotNo || "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-bold">
                          {l.qty}
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {l.unitCode}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-red-500">
            Không tìm thấy thông tin.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ACK Modal ────────────────────────────────────────────────────────────────
function AckModal({
  dist,
  onClose,
  onDone,
}: {
  dist: Distribution;
  onClose: () => void;
  onDone: () => void;
}) {
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
      onDone();
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
              Mã ACK người dùng nhập *
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
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-sm"
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

// ─── Create Modal ─────────────────────────────────────────────────────────────
function CreateModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (d: Distribution) => void;
}) {
  const [form, setForm] = useState<DistributionPayload>({
    campaignId: "",
    reliefPointId: "",
    householdId: "",
    incidentId: null,
    recipientName: "",
    recipientPhone: "",
    ackMethodCode: "OTP",
    note: "",
    lines: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newLine, setNewLine] = useState<DistributionLine>({
    itemId: "",
    lotId: "",
    qty: 1,
    unitCode: "THUNG",
  });

  const addLine = () => {
    if (!newLine.itemId.trim()) return;
    setForm((p) => ({ ...p, lines: [...p.lines, { ...newLine }] }));
    setNewLine({ itemId: "", lotId: "", qty: 1, unitCode: "THUNG" });
  };
  const removeLine = (i: number) =>
    setForm((p) => ({ ...p, lines: p.lines.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.householdId.trim()) {
      setError("Vui lòng nhập ID hộ dân.");
      return;
    }
    if (form.lines.length === 0) {
      setError("Cần ít nhất 1 dòng hàng.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const dist = await createDistribution(
        form,
        getAuthSession()?.accessToken ?? "",
      );
      onSaved(dist);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tạo phiếu");
    } finally {
      setLoading(false);
    }
  };

  const F =
    (k: keyof DistributionPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value || null }));

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">Tạo phiếu phân phối</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">
              ID Hộ dân *
            </label>
            <input
              value={form.householdId}
              onChange={(e) =>
                setForm((p) => ({ ...p, householdId: e.target.value }))
              }
              placeholder="UUID hộ dân..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                ID Chiến dịch
              </label>
              <input
                value={form.campaignId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, campaignId: e.target.value }))
                }
                placeholder="UUID..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                ID Điểm cứu trợ
              </label>
              <input
                value={form.reliefPointId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, reliefPointId: e.target.value }))
                }
                placeholder="UUID..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Phương thức ACK
              </label>
              <select
                value={form.ackMethodCode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, ackMethodCode: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="OTP">OTP</option>
                <option value="SIGNATURE">Chữ ký</option>
                <option value="MANUAL">Thủ công</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                ID Sự cố (nếu có)
              </label>
              <input
                value={form.incidentId ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, incidentId: e.target.value || null }))
                }
                placeholder="UUID (tùy chọn)..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">
              Ghi chú
            </label>
            <input
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="Phân phối theo danh sách ưu tiên..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Lines */}
          <div>
            <h3 className="text-sm font-bold mb-2">Dòng hàng</h3>
            <div className="flex gap-2 mb-3">
              <input
                value={newLine.itemId}
                onChange={(e) =>
                  setNewLine((p) => ({ ...p, itemId: e.target.value }))
                }
                placeholder="ID Hàng hóa"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={newLine.lotId}
                onChange={(e) =>
                  setNewLine((p) => ({ ...p, lotId: e.target.value }))
                }
                placeholder="ID Lô"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                value={newLine.qty}
                onChange={(e) =>
                  setNewLine((p) => ({
                    ...p,
                    qty: parseInt(e.target.value) || 1,
                  }))
                }
                min={1}
                className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={newLine.unitCode}
                onChange={(e) =>
                  setNewLine((p) => ({ ...p, unitCode: e.target.value }))
                }
                placeholder="ĐV"
                className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addLine}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white"
              >
                <Plus size={16} />
              </button>
            </div>
            {form.lines.length > 0 && (
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left">ID Hàng</th>
                      <th className="px-3 py-2 text-left">ID Lô</th>
                      <th className="px-3 py-2 text-right">SL</th>
                      <th className="px-3 py-2">ĐV</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {form.lines.map((l, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-mono">
                          {l.itemId.slice(-8)}…
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {l.lotId.slice(-8)}…
                        </td>
                        <td className="px-3 py-2 text-right font-bold">
                          {l.qty}
                        </td>
                        <td className="px-3 py-2">{l.unitCode}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removeLine(i)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-sm"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#1e3a5f,#1e40af)" }}
          >
            {loading ? "Đang tạo..." : "Tạo phiếu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function statusBadge(code: string) {
  const m: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    ACKNOWLEDGED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-red-100 text-red-600",
  };
  const l: Record<string, string> = {
    PENDING: "Chờ nhận",
    ACKNOWLEDGED: "Đã nhận",
    CANCELLED: "Đã hủy",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${m[code] ?? "bg-gray-100 text-gray-500"}`}
    >
      {l[code] ?? code}
    </span>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────
export const DistributionTab: React.FC = () => {
  const [data, setData] = useState<DistributionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewDistId, setViewDistId] = useState<string | null>(null);
  const [ackDist, setAckDist] = useState<Distribution | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getDistributions(getAuthSession()?.accessToken ?? ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải phiếu phân phối");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreated = (d: Distribution) => {
    setShowCreate(false);
    setAckDist(d);
    void load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg,#1e3a5f,#1e40af)" }}
        >
          <Plus size={15} /> Tạo phiếu phân phối
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {[
                "Mã phiếu",
                "Hộ dân",
                "Chiến dịch",
                "Phương thức",
                "Trạng thái",
                "Số dòng",
                "Ngày tạo",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  Đang tải...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <PackagePlus size={32} className="text-gray-300" />
                    <p className="text-gray-400 text-sm">
                      Chưa có phiếu phân phối
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((dist) => (
                <tr
                  key={dist.id}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold whitespace-nowrap">
                    {dist.code}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">
                    {dist.household?.headName || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {dist.campaign?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {dist.ackMethodCode}
                  </td>
                  <td className="px-4 py-3">
                    {statusBadge(dist.status?.code ?? "PENDING")}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-700">
                    {dist.lineCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(dist.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => setViewDistId(dist.id)}
                        className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {viewDistId && (
        <DetailModal
          distId={viewDistId}
          onClose={() => setViewDistId(null)}
          onAck={(d) => {
            setViewDistId(null);
            setAckDist(d);
          }}
        />
      )}
      {ackDist && (
        <AckModal
          dist={ackDist}
          onClose={() => setAckDist(null)}
          onDone={() => {
            setAckDist(null);
            void load();
          }}
        />
      )}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onSaved={handleCreated}
        />
      )}
    </div>
  );
};
