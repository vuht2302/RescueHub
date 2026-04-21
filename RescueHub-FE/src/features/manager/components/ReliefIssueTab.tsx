import React, { useEffect, useState, useCallback } from "react";
import { Plus, Eye, X, AlertCircle, Truck, Trash2, Search, ChevronLeft, ChevronRight, RefreshCw, Package } from "lucide-react";
import {
  getReliefIssues, getReliefIssue, createReliefIssue,
  type ReliefIssueListItem, type ReliefIssue, type ReliefIssuePayload, type ReliefIssueLine,
  type ReliefIssueListParams,
  getWarehouses, getItems, getLots,
  type Warehouse, type Item, type Lot,
} from "../services/warehouseService";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import { toastSuccess, toastError } from "../../../shared/utils/toast";

// ─── Type for reference data ────────────────────────────────────────────────
interface CampaignOption {
  id: string;
  code: string;
  name: string;
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: "Đang chờ",    cls: "bg-yellow-100 text-yellow-700" },
  PROCESSING: { label: "Đang xử lý", cls: "bg-blue-100 text-blue-700"    },
  DELIVERED:  { label: "Đã giao",    cls: "bg-emerald-100 text-emerald-700" },
  ISSUED:     { label: "Đã xuất",     cls: "bg-purple-100 text-purple-700" },
  CANCELLED:  { label: "Đã hủy",     cls: "bg-red-100 text-red-600"      },
};

function StatusBadge({ code }: { code: string }) {
  const cfg = STATUS_CFG[code] ?? { label: code, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [detail, setDetail] = useState<ReliefIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const d = await getReliefIssue(id, getAuthSession()?.accessToken ?? "");
        setDetail(d);
      } catch (e) { setError(e instanceof Error ? e.message : "Lỗi tải chi tiết"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between px-6 py-4 border-b">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Phiếu cấp phát</p>
            <h2 className="text-lg font-black text-gray-900 font-mono">{loading ? "..." : detail?.code ?? "—"}</h2>
          </div>
          <div className="flex items-center gap-3">
            {detail && <StatusBadge code={detail.status?.code ?? ""} />}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
          </div>
        </div>

        {loading && <div className="py-12 text-center text-gray-400 text-sm">Đang tải...</div>}
        {error   && <div className="m-6 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}

        {detail && (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-semibold mb-1">Chiến dịch</p>
                <p className="text-sm font-bold text-gray-900">{detail.campaign?.name ?? "—"}</p>
                {detail.campaign?.code && <p className="text-xs font-mono text-gray-500">{detail.campaign.code}</p>}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-semibold mb-1">Điểm cứu trợ</p>
                <p className="text-sm font-bold text-gray-900">{detail.reliefPoint?.name ?? "—"}</p>
                {detail.reliefPoint?.code && <p className="text-xs font-mono text-gray-500">{detail.reliefPoint.code}</p>}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-semibold mb-1">Kho xuất hàng</p>
                <p className="text-sm font-bold text-gray-900">{detail.fromWarehouse?.name}</p>
                <p className="text-xs font-mono text-gray-500">{detail.fromWarehouse?.code}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-semibold mb-1">Ngày tạo</p>
                <p className="text-sm font-semibold text-gray-800">{new Date(detail.createdAt).toLocaleString("vi-VN")}</p>
              </div>
            </div>

            {detail.note && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <p className="text-xs text-blue-500 font-semibold mb-1">Ghi chú</p>
                <p className="text-sm text-blue-900">{detail.note}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-bold text-gray-700 mb-2">
                Danh sách hàng hóa
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                  {detail.lines?.length ?? 0} dòng
                </span>
              </p>
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Mã hàng", "Tên hàng hóa", "Lô", "Số lượng", "ĐV"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(detail.lines ?? []).map(l => (
                      <tr key={l.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">{l.item.code}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{l.item.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{l.lot?.lotNo ?? "—"}</td>
                        <td className="px-4 py-3 text-center font-black text-gray-900">{l.issueQty.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{l.unitCode}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t">
                      <td colSpan={3} className="px-4 py-2.5 text-xs font-semibold text-gray-500 text-right">Tổng:</td>
                      <td className="px-4 py-2.5 text-center font-black text-blue-700">
                        {(detail.lines ?? []).reduce((s, l) => s + l.issueQty, 0).toLocaleString()}
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

// ─── Create Modal ─────────────────────────────────────────────────────────────
interface CreateModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function CreateModal({ onClose, onSaved }: CreateModalProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const emptyLine: ReliefIssueLine = { itemId: "", lotId: "", issueQty: 1, unitCode: "" };
  const [form, setForm] = useState<ReliefIssuePayload>({ 
    campaignId: "", reliefPointId: "", fromWarehouseId: "", note: "", lines: [] 
  });
  const [newLine, setNewLine] = useState<ReliefIssueLine>({ ...emptyLine });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load reference data
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      const token = getAuthSession()?.accessToken ?? "";
      try {
        const [wh, it, lt] = await Promise.all([
          getWarehouses(token).catch(() => []),
          getItems(token).catch(() => []),
          getLots(token).catch(() => []),
        ]);
        setWarehouses(wh);
        setItems(it);
        setLots(lt);
        // Set default warehouse if available
        if (wh.length > 0) {
          setForm(p => ({ ...p, fromWarehouseId: wh[0].id }));
        }
      } catch (e) {
        console.error("Error loading data:", e);
      } finally {
        setLoadingData(false);
      }
    };
    void loadData();
  }, []);

  const addLine = () => {
    if (!newLine.itemId.trim())   { setError("Vui lòng chọn hàng hóa."); return; }
    if (!newLine.unitCode.trim()) { setError("Đơn vị không được để trống."); return; }
    if (newLine.issueQty <= 0)    { setError("Số lượng phải > 0."); return; }
    setError(null);
    
    // Auto-fill unitCode from selected item
    const selectedItem = items.find(i => i.id === newLine.itemId);
    const unitCode = selectedItem?.unit?.code || newLine.unitCode;
    
    setForm(p => ({ ...p, lines: [...p.lines, { ...newLine, unitCode }] }));
    setNewLine({ ...emptyLine });
  };

  const removeLine = (i: number) => setForm(p => ({ ...p, lines: p.lines.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.fromWarehouseId.trim()) { setError("Vui lòng chọn kho xuất hàng."); return; }
    if (form.lines.length === 0)      { setError("Phải có ít nhất 1 dòng hàng."); return; }
    setLoading(true); setError(null);
    try {
      await createReliefIssue({
        fromWarehouseId: form.fromWarehouseId.trim(),
        campaignId:      form.campaignId.trim(),
        reliefPointId:   form.reliefPointId.trim(),
        note:            form.note.trim(),
        lines:           form.lines,
      }, getAuthSession()?.accessToken ?? "");
      toastSuccess("Tạo phiếu cấp phát thành công!");
      onSaved();
    } catch (e) { 
      setError(e instanceof Error ? e.message : "Lỗi tạo phiếu");
      toastError(e instanceof Error ? e.message : "Lỗi tạo phiếu");
    }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Tạo phiếu cấp phát</h2>
            <p className="text-xs text-gray-400 mt-0.5">POST /api/v1/manager/relief-issues</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-800 rounded-full animate-spin" />
              <span className="ml-3 text-sm text-gray-500">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" />{error}
                </div>
              )}

              {/* ── Thông tin phiếu ── */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Thông tin phiếu</p>

                {/* Kho xuất hàng */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Kho xuất hàng <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.fromWarehouseId}
                    onChange={(e) => setForm(p => ({ ...p, fromWarehouseId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Chọn kho xuất --</option>
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>
                        {wh.warehouseName} ({wh.warehouseCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chiến dịch & Điểm cứu trợ */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Chiến dịch
                    </label>
                    <input
                      value={form.campaignId}
                      onChange={(e) => setForm(p => ({ ...p, campaignId: e.target.value }))}
                      placeholder="UUID chiến dịch..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Điểm cứu trợ
                    </label>
                    <input
                      value={form.reliefPointId}
                      onChange={(e) => setForm(p => ({ ...p, reliefPointId: e.target.value }))}
                      placeholder="UUID điểm cứu trợ..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Ghi chú
                  </label>
                  <input
                    value={form.note}
                    onChange={(e) => setForm(p => ({ ...p, note: e.target.value }))}
                    placeholder="Cấp phát đợt 1 cho điểm An Bình..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* ── lines[] ── */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Danh sách hàng hóa
                  <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold normal-case">
                    {form.lines.length} dòng
                  </span>
                </p>

                {/* New line form */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                  <p className="text-xs font-semibold text-gray-500">Thêm dòng hàng mới</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="text-[11px] text-gray-500 font-semibold block mb-1">
                        Hàng hóa <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={newLine.itemId}
                        onChange={(e) => {
                          const item = items.find(i => i.id === e.target.value);
                          setNewLine(p => ({ 
                            ...p, 
                            itemId: e.target.value,
                            unitCode: item?.unit?.code || "",
                          }));
                        }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Chọn hàng hóa --</option>
                        {items.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.itemName} ({item.itemCode})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 font-semibold block mb-1">Lô hàng</label>
                      <select
                        value={newLine.lotId}
                        onChange={(e) => setNewLine(p => ({ ...p, lotId: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Chọn lô (tùy chọn) --</option>
                        {lots
                          .filter(lot => !newLine.itemId || lot.item?.id === newLine.itemId)
                          .map(lot => (
                            <option key={lot.id} value={lot.id}>
                              {lot.lotNo} {lot.expDate ? `(HSD: ${new Date(lot.expDate).toLocaleDateString("vi-VN")})` : ""}
                            </option>
                          ))
                        }
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 font-semibold block mb-1">Số lượng <span className="text-red-400">*</span></label>
                      <input
                        type="number" min={1} value={newLine.issueQty}
                        onChange={(e) => setNewLine(p => ({ ...p, issueQty: parseInt(e.target.value) || 1 }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 font-semibold block mb-1">Đơn vị</label>
                      <input
                        value={newLine.unitCode}
                        onChange={(e) => setNewLine(p => ({ ...p, unitCode: e.target.value.toUpperCase() }))}
                        placeholder="THUNG / CAI / KIT..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold uppercase bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={addLine}
                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={15} /> Thêm dòng hàng
                  </button>
                </div>

                {/* Lines preview table */}
                {form.lines.length > 0 && (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {["STT", "Hàng hóa", "Lô", "Số lượng", "ĐV", ""].map((h, i) => (
                            <th key={i} className="px-3 py-2 text-left font-semibold text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {form.lines.map((l, i) => {
                          const item = items.find(it => it.id === l.itemId);
                          const lot = lots.find(lt => lt.id === l.lotId);
                          return (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-400 font-semibold text-center w-10">{i + 1}</td>
                              <td className="px-3 py-2">
                                <p className="font-semibold text-gray-900">{item?.itemName || l.itemId}</p>
                                <p className="font-mono text-[10px] text-gray-400">{item?.itemCode}</p>
                              </td>
                              <td className="px-3 py-2 font-mono text-gray-600">
                                {lot?.lotNo || <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-3 py-2 font-black text-gray-900 text-center">{l.issueQty.toLocaleString()}</td>
                              <td className="px-3 py-2 font-semibold text-gray-700 uppercase text-center">{l.unitCode}</td>
                              <td className="px-3 py-2 text-center">
                                <button onClick={() => removeLine(i)} className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600">
                                  <Trash2 size={12} />
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-sm text-gray-600 hover:bg-gray-100">
            Hủy
          </button>
          <button
            onClick={handleSave} disabled={loading || loadingData}
            className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#1e3a5f,#1e40af)" }}
          >
            {loading ? "Đang gửi..." : "Tạo phiếu cấp phát"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────
export const ReliefIssueTab: React.FC = () => {
  const [data, setData] = useState<ReliefIssueListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [params, setParams] = useState<ReliefIssueListParams>({
    campaignId: "", reliefPointId: "", statusCode: "", page: 1, pageSize: 20,
  });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getReliefIssues(getAuthSession()?.accessToken ?? "", {
        ...(params.campaignId    ? { campaignId:    params.campaignId    } : {}),
        ...(params.reliefPointId ? { reliefPointId: params.reliefPointId } : {}),
        ...(params.statusCode    ? { statusCode:    params.statusCode    } : {}),
        page: params.page, pageSize: params.pageSize,
      });
      setData(res.items ?? []);
      setTotalItems(res.totalItems ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } catch (e) { setError(e instanceof Error ? e.message : "Lỗi tải phiếu cấp phát"); }
    finally { setLoading(false); }
  }, [params]);

  useEffect(() => { void load(); }, [load]);

  const setStr = (k: keyof ReliefIssueListParams) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setParams(p => ({ ...p, [k]: e.target.value, page: 1 }));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={params.campaignId} onChange={setStr("campaignId")} placeholder="ID Chiến dịch..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
        </div>
        <input value={params.reliefPointId} onChange={setStr("reliefPointId")} placeholder="ID Điểm cứu trợ..." className="px-3 py-2 text-sm border border-gray-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
        <select value={params.statusCode} onChange={setStr("statusCode")} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Đang chờ</option>
          <option value="PROCESSING">Đang xử lý</option>
          <option value="ISSUED">Đã xuất</option>
          <option value="DELIVERED">Đã giao</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
        <button onClick={() => void load()} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold ml-auto" style={{ background: "linear-gradient(135deg,#1e3a5f,#1e40af)" }}>
          <Plus size={15} /> Tạo phiếu cấp phát
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Mã phiếu", "Trạng thái", "Chiến dịch", "Điểm cứu trợ", "Kho xuất", "Số dòng", "Ngày tạo", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400 text-sm">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-800 rounded-full animate-spin" />
                  Đang tải...
                </div>
              </td></tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package size={32} className="text-gray-300" />
                    <p className="text-gray-400 text-sm">Chưa có phiếu cấp phát nào</p>
                  </div>
                </td>
              </tr>
            ) : data.map(issue => (
              <tr key={issue.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold whitespace-nowrap">{issue.code}</td>
                <td className="px-4 py-3"><StatusBadge code={issue.status?.code ?? ""} /></td>
                <td className="px-4 py-3">
                  <p className="text-gray-800 font-medium text-xs whitespace-nowrap">{issue.campaign?.name ?? "—"}</p>
                  {issue.campaign?.code && <p className="font-mono text-[11px] text-gray-400">{issue.campaign.code}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-800 font-medium text-xs whitespace-nowrap">{issue.reliefPoint?.name ?? "—"}</p>
                  {issue.reliefPoint?.code && <p className="font-mono text-[11px] text-gray-400">{issue.reliefPoint.code}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-700 font-medium text-xs whitespace-nowrap">{issue.fromWarehouse?.name}</p>
                  <p className="font-mono text-[11px] text-gray-400">{issue.fromWarehouse?.code}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">
                    {issue.lineCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(issue.createdAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setViewId(issue.id)} className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600">
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Tổng {totalItems} phiếu</span>
          <div className="flex gap-2">
            <button disabled={(params.page ?? 1) <= 1} onClick={() => setParams(p => ({ ...p, page: (p.page ?? 1) - 1 }))} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50">
              <ChevronLeft size={14} /> Trước
            </button>
            <span className="px-3 py-1.5 text-gray-700 font-medium">Trang {params.page} / {totalPages}</span>
            <button disabled={(params.page ?? 1) >= totalPages} onClick={() => setParams(p => ({ ...p, page: (p.page ?? 1) + 1 }))} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50">
              Sau <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {viewId     && <DetailModal id={viewId} onClose={() => setViewId(null)} />}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); void load(); }} />}
    </div>
  );
};
