import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Eye,
  X,
  AlertCircle,
  ArrowRightLeft,
  Trash2,
} from "lucide-react";
import {
  getStockTransactions,
  getStockTransaction,
  createStockTransaction,
  getWarehouses,
  getItemsWithLots,
  type StockTransaction,
  type StockTransactionListItem,
  type StockTransactionPayload,
  type TransactionLine,
  type Warehouse,
  type ItemWithLots,
} from "../services/warehouseService";
import { getAuthSession } from "../../../features/auth/services/authStorage";

// Chỉ cho phép 2 loại giao dịch: Nhập kho và Xuất kho
const TYPE_OPTIONS = [
  { code: "RECEIPT", label: "Nhập kho" },
  { code: "ISSUE", label: "Xuất kho" },
];
const REF_OPTIONS = ["MANUAL", "RELIEF_ISSUE", "TRANSFER", "DISTRIBUTION"];

const REFERENCE_TYPE_LABELS: Record<string, string> = {
  MANUAL: "Tạo thủ công",
  RELIEF_ISSUE: "Phiếu cấp phát cứu trợ",
  TRANSFER: "Chuyển kho/chuyển hàng nội bộ",
  DISTRIBUTION: "Phiếu phân phối tới người nhận",
};

function referenceTypeLabel(code?: string | null) {
  if (!code) return "—";
  return REFERENCE_TYPE_LABELS[code] ?? code;
}

function DetailModal({ txId, onClose }: { txId: string; onClose: () => void }) {
  const [tx, setTx] = useState<StockTransaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStockTransaction(txId, getAuthSession()?.accessToken ?? "")
      .then(setTx)
      .finally(() => setLoading(false));
  }, [txId]);

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {tx?.code || "Đang tải..."}
            </h2>
            {tx && (
              <p className="text-xs text-gray-500">
                {tx.transactionTypeCode} •{" "}
                {new Date(tx.happenedAt).toLocaleString("vi-VN")}
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
        ) : tx ? (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-gray-500 block">Kho</span>
                <p className="font-semibold">{tx.warehouse?.name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">
                  Loại tham chiếu
                </span>
                <p className="font-semibold">
                  {referenceTypeLabel(tx.referenceType)}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-gray-500 block">Ghi chú</span>
                <p className="text-gray-700">{tx.note || "—"}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2">
                Dòng hàng ({tx.lines?.length ?? 0})
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
                    {(tx.lines ?? []).map((l, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium">
                          {l.item?.name}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-blue-700">
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

function CreateModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const now = new Date().toISOString().slice(0, 16);
  const [form, setForm] = useState<StockTransactionPayload>({
    transactionTypeCode: "RECEIPT",
    warehouseId: "",
    referenceType: "MANUAL",
    referenceId: null,
    happenedAt: now,
    note: "",
    lines: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newLine, setNewLine] = useState<TransactionLine>({
    itemId: "",
    lotId: "",
    qty: 1,
    unitCode: "THUNG",
  });

  // State cho danh sách kho và hàng hóa
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<ItemWithLots[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load danh sách kho và hàng hóa khi mở modal
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const token = getAuthSession()?.accessToken ?? "";
        const [warehousesData, itemsData] = await Promise.all([
          getWarehouses(token),
          getItemsWithLots(token),
        ]);
        setWarehouses(warehousesData);
        setItems(itemsData);
      } catch (e) {
        setError("Không thể tải danh sách kho hoặc hàng hóa.");
      } finally {
        setLoadingData(false);
      }
    };
    void loadData();
  }, []);

  // Lấy danh sách lots cho item được chọn
  const getLotsForItem = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    return item?.lots ?? [];
  };

  // Lấy unitCode mặc định cho item
  const getItemUnitCode = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    return item?.unitCode ?? "THUNG";
  };

  const addLine = () => {
    if (!newLine.itemId.trim()) return;
    setForm((p) => ({ ...p, lines: [...p.lines, { ...newLine }] }));
    setNewLine({ itemId: "", lotId: "", qty: 1, unitCode: "THUNG" });
  };
  const removeLine = (i: number) =>
    setForm((p) => ({ ...p, lines: p.lines.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.warehouseId.trim()) {
      setError("Vui lòng chọn kho.");
      return;
    }
    if (form.lines.length === 0) {
      setError("Cần ít nhất 1 dòng hàng.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createStockTransaction(
        { ...form, happenedAt: new Date(form.happenedAt).toISOString() },
        getAuthSession()?.accessToken ?? "",
      );
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tạo giao dịch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">Tạo giao dịch kho</h2>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Loại giao dịch
              </label>
              <select
                value={form.transactionTypeCode}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    transactionTypeCode: e.target.value,
                  }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Loại tham chiếu
              </label>
              <select
                value={form.referenceType}
                onChange={(e) =>
                  setForm((p) => ({ ...p, referenceType: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {REF_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {referenceTypeLabel(v)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">
              Kho *
            </label>
            <select
              value={form.warehouseId}
              onChange={(e) =>
                setForm((p) => ({ ...p, warehouseId: e.target.value }))
              }
              disabled={loadingData}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">-- Chọn kho --</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.warehouseName} ({w.warehouseCode})
                </option>
              ))}
            </select>
            {loadingData && (
              <p className="text-xs text-gray-400 mt-1">
                Đang tải danh sách kho...
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Thời gian
              </label>
              <input
                type="datetime-local"
                value={form.happenedAt}
                onChange={(e) =>
                  setForm((p) => ({ ...p, happenedAt: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                ID Tham chiếu
              </label>
              <input
                value={form.referenceId ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    referenceId: e.target.value || null,
                  }))
                }
                placeholder="UUID (nếu có)..."
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
              placeholder="Nhập kho tiếp nhận..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lines */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2">Dòng hàng</h3>
            <div className="flex gap-2 mb-3 flex-wrap">
              {/* Dropdown chọn hàng hóa */}
              <select
                value={newLine.itemId}
                onChange={(e) => {
                  const itemId = e.target.value;
                  const unitCode = itemId ? getItemUnitCode(itemId) : "THUNG";
                  setNewLine((p) => ({
                    ...p,
                    itemId,
                    lotId: "", // Reset lot khi đổi item
                    unitCode,
                  }));
                }}
                disabled={loadingData}
                className="flex-1 min-w-[150px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">-- Chọn hàng hóa --</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.itemName} ({item.itemCode})
                  </option>
                ))}
              </select>

              {/* Dropdown chọn lô (nếu item đã chọn) */}
              <select
                value={newLine.lotId}
                onChange={(e) =>
                  setNewLine((p) => ({ ...p, lotId: e.target.value }))
                }
                disabled={loadingData || !newLine.itemId}
                className="flex-1 min-w-[150px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  {newLine.itemId ? "-- Chọn lô --" : "Chọn hàng hóa trước"}
                </option>
                {getLotsForItem(newLine.itemId).map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.lotNo}
                    {lot.expDate
                      ? ` (HSD: ${new Date(lot.expDate).toLocaleDateString("vi-VN")})`
                      : ""}
                  </option>
                ))}
              </select>

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
                className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={newLine.unitCode}
                onChange={(e) =>
                  setNewLine((p) => ({ ...p, unitCode: e.target.value }))
                }
                placeholder="ĐV"
                className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addLine}
                disabled={!newLine.itemId}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
              </button>
            </div>
            {form.lines.length > 0 && (
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left">Hàng hóa</th>
                      <th className="px-3 py-2 text-left">Lô</th>
                      <th className="px-3 py-2 text-right">SL</th>
                      <th className="px-3 py-2 text-left">ĐV</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {form.lines.map((l, i) => {
                      const item = items.find((it) => it.id === l.itemId);
                      const lot = item?.lots?.find((lt) => lt.id === l.lotId);
                      return (
                        <tr key={i}>
                          <td className="px-3 py-2">
                            <div className="font-medium text-gray-900">
                              {item?.itemName || "—"}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                              {item?.itemCode || l.itemId.slice(-8)}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            {lot ? (
                              <div>
                                <div className="font-mono text-blue-700">
                                  {lot.lotNo}
                                </div>
                                {lot.expDate && (
                                  <div className="text-[10px] text-gray-500">
                                    HSD:{" "}
                                    {new Date(lot.expDate).toLocaleDateString(
                                      "vi-VN",
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
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
                      );
                    })}
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
            {loading ? "Đang tạo..." : "Tạo giao dịch"}
          </button>
        </div>
      </div>
    </div>
  );
}

function typeBadge(code: string) {
  const labels: Record<string, string> = {
    RECEIPT: "Nhập kho",
    ISSUE: "Xuất kho",
    TRANSFER: "Chuyển kho",
    ADJUSTMENT: "Điều chỉnh",
    RETURN: "Trả hàng",
  };
  const colors: Record<string, string> = {
    RECEIPT: "bg-emerald-100 text-emerald-700",
    ISSUE: "bg-orange-100 text-orange-700",
    TRANSFER: "bg-blue-100 text-blue-700",
    ADJUSTMENT: "bg-purple-100 text-purple-700",
    RETURN: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[code] ?? "bg-gray-100 text-gray-600"}`}
    >
      {labels[code] ?? code}
    </span>
  );
}

export const TransactionTab: React.FC = () => {
  const [data, setData] = useState<StockTransactionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewTxId, setViewTxId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getStockTransactions(getAuthSession()?.accessToken ?? ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải giao dịch");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg,#1e3a5f,#1e40af)" }}
        >
          <Plus size={15} /> Tạo giao dịch
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
                "Mã GD",
                "Loại",
                "Kho",
                "Tham chiếu",
                "Thời gian",
                "Ghi chú",
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
                    <ArrowRightLeft size={32} className="text-gray-300" />
                    <p className="text-gray-400 text-sm">Chưa có giao dịch</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold whitespace-nowrap">
                    {tx.code}
                  </td>
                  <td className="px-4 py-3">
                    {typeBadge(tx.transactionTypeCode)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {tx.warehouse?.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {referenceTypeLabel(tx.referenceType)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(tx.happenedAt).toLocaleString("vi-VN")}
                  </td>

                  <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate text-xs">
                    {tx.note || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setViewTxId(tx.id)}
                      className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {viewTxId && (
        <DetailModal txId={viewTxId} onClose={() => setViewTxId(null)} />
      )}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            void load();
          }}
        />
      )}
    </div>
  );
};
