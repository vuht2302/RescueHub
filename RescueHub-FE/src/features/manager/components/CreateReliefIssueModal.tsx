import React, { useEffect, useState } from "react";
import { Package, Truck, X, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import {
  getDistributionOptions,
  getWarehouses,
  getItemsWithLots,
  getStocks,
  createReliefIssue,
  type ItemWithLots,
  type Warehouse,
  type StockLine,
  type ReliefIssuePayload,
} from "../services/warehouseService";

interface CreateReliefIssueModalProps {
  onClose: () => void;
  onSuccess: (issue: { id: string; code: string }) => void;
  initialReliefPointId?: string;
}

// Relief Point shape from options API
interface OptionsReliefPoint {
  id: string;
  code: string;
  name: string;
  statusCode: string;
  addressText: string;
  campaign: { id: string; code: string; name: string };
  location: { lat: number; lng: number };
}

interface IssueLine {
  id: string;
  itemId: string;
  lotId: string;
  issueQty: number;
  unitCode: string;
  itemName: string;
  lotNo: string;
  availableQty: number;
}

export function CreateReliefIssueModal({
  onClose,
  onSuccess,
  initialReliefPointId,
}: CreateReliefIssueModalProps) {
  const [reliefPoints, setReliefPoints] = useState<OptionsReliefPoint[]>([]);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [itemsWithLots, setItemsWithLots] = useState<ItemWithLots[]>([]);
  const [stockLines, setStockLines] = useState<StockLine[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [campaignId, setCampaignId] = useState("");
  const [reliefPointId, setReliefPointId] = useState(initialReliefPointId ?? "");
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<IssueLine[]>([]);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = getAuthSession()?.accessToken ?? "";
      const [options, warehousesData, itemsData] = await Promise.all([
        getDistributionOptions(token),
        getWarehouses(token, { statusCode: "ACTIVE" }),
        getItemsWithLots(token),
      ]);
      setReliefPoints(options.reliefPoints);
      const uniqueCampaigns = options.campaigns.filter(
        (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i,
      );
      setCampaigns(uniqueCampaigns);
      setWarehouses(warehousesData);
      setItemsWithLots(itemsData);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const loadStocksForWarehouse = async (warehouseId: string) => {
    if (!warehouseId) {
      setStockLines([]);
      return;
    }
    setLoadingStocks(true);
    try {
      const token = getAuthSession()?.accessToken ?? "";
      const result = await getStocks(token, { warehouseId, pageSize: 1000 });
      setStockLines(result.items);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải tồn kho");
      setStockLines([]);
    } finally {
      setLoadingStocks(false);
    }
  };

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        id: crypto.randomUUID(),
        itemId: "",
        lotId: "",
        issueQty: 0,
        unitCode: "",
        itemName: "",
        lotNo: "",
        availableQty: 0,
      },
    ]);
  };

  const handleRemoveLine = (id: string) => {
    setLines(lines.filter((l) => l.id !== id));
  };

  const handleLineChange = (
    id: string,
    field: keyof IssueLine,
    value: string | number,
  ) => {
    setLines(
      lines.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: value };

        // Auto-fill when item is selected
        if (field === "itemId" && typeof value === "string") {
          const item = itemsWithLots.find((i) => i.id === value);
          if (item) {
            updated.unitCode = item.unitCode;
            updated.itemName = item.itemName;
            updated.availableQty = 0;
            updated.lotId = "";
          }
        }

        // Auto-fill when lot is selected - get actual stock qty
        if (field === "lotId" && typeof value === "string") {
          const itemId = updated.itemId;
          const item = itemsWithLots.find((i) => i.id === itemId);
          const lot = item?.lots.find((l) => l.id === value);
          if (lot) {
            updated.lotNo = lot.lotNo;
          }
          // Get actual stock qty from warehouse stock lines
          const stockLine = stockLines.find(
            (s) => s.item.id === itemId && s.lot?.id === value,
          );
          updated.availableQty = stockLine?.qtyAvailable ?? 0;
        }

        return updated;
      }),
    );
  };

  const handleSubmit = async () => {
    if (!reliefPointId) {
      toast.error("Vui lòng chọn điểm cứu trợ");
      return;
    }
    if (!fromWarehouseId) {
      toast.error("Vui lòng chọn kho xuất hàng");
      return;
    }
    if (lines.length === 0) {
      toast.error("Vui lòng thêm ít nhất một mặt hàng");
      return;
    }

    const invalidLines = lines.filter(
      (l) => !l.itemId || !l.lotId || l.issueQty <= 0,
    );
    if (invalidLines.length > 0) {
      toast.error("Vui lòng điền đầy đủ thông tin cho các dòng hàng");
      return;
    }

    // Validate quantity against available stock
    const overQtyLines = lines.filter((l) => l.issueQty > l.availableQty);
    if (overQtyLines.length > 0) {
      const itemNames = overQtyLines.map((l) => l.itemName).join(", ");
      toast.error(`Số lượng xuất vượt quá tồn kho: ${itemNames}`);
      return;
    }

    setSubmitting(true);
    try {
      const token = getAuthSession()?.accessToken ?? "";
      const payload: ReliefIssuePayload = {
        campaignId: campaignId || "",
        reliefPointId,
        fromWarehouseId,
        note,
        lines: lines.map((l) => ({
          itemId: l.itemId,
          lotId: l.lotId,
          issueQty: l.issueQty,
          unitCode: l.unitCode,
        })),
      };

      const result = await createReliefIssue(payload, token);
      toast.success("Tạo phiếu cấp phát thành công");
      onSuccess({ id: result.id, code: result.code });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tạo phiếu cấp phát");
    } finally {
      setSubmitting(false);
    }
  };

  // Get unique items for dropdown (filter by stocks in selected warehouse)
  const availableItems = fromWarehouseId
    ? stockLines
        .filter((s) => s.qtyAvailable > 0)
        .map((s) => itemsWithLots.find((i) => i.id === s.item.id))
        .filter((item): item is ItemWithLots => item != null)
    : itemsWithLots.filter((item) => item.isActive && item.lots.length > 0);

  const selectedReliefPoint = reliefPoints.find((p) => p.id === reliefPointId);

  // Get lots for selected item - filter by stocks in warehouse if warehouse selected
  const getLotsForItem = (itemId: string) => {
    if (fromWarehouseId) {
      return stockLines
        .filter((s) => s.item.id === itemId && s.qtyAvailable > 0)
        .map((s) => ({
          id: s.lot?.id ?? "",
          lotNo: s.lot?.lotNo ?? "",
          expDate: s.lot?.expDate ?? null,
          statusCode: s.lot?.statusCode ?? "",
          qtyAvailable: s.qtyAvailable,
        }));
    }
    const item = itemsWithLots.find((i) => i.id === itemId);
    return (
      item?.lots.map((l) => ({
        ...l,
        qtyAvailable: 0,
      })) ?? []
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Truck size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">
                Tạo phiếu cấp phát
              </p>
              <h2 className="text-lg font-bold text-gray-900">
                Phiếu xuất kho cứu trợ
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Campaign */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Chiến dịch
                </label>
                <select
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 bg-white"
                >
                  <option value="">-- Chọn chiến dịch --</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Warehouse & Relief Point */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Kho xuất hàng <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={fromWarehouseId}
                    onChange={(e) => {
                      const newWarehouseId = e.target.value;
                      setFromWarehouseId(newWarehouseId);
                      setLines([]);
                      if (newWarehouseId) {
                        void loadStocksForWarehouse(newWarehouseId);
                      } else {
                        setStockLines([]);
                      }
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                  >
                    <option value="">-- Chọn kho --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.warehouseName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Điểm cứu trợ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reliefPointId}
                    onChange={(e) => setReliefPointId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                  >
                    <option value="">-- Chọn điểm cứu trợ --</option>
                    {reliefPoints.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {selectedReliefPoint && (
                    <p className="text-[10px] text-gray-400 mt-1 truncate">
                      {selectedReliefPoint.addressText}
                    </p>
                  )}
                </div>
              </div>

              {/* Lines */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-gray-500">
                    Danh sách hàng hóa <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <Plus size={14} />
                    Thêm dòng
                  </button>
                </div>

                {lines.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center">
                    <Package size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">
                      Chưa có hàng hóa nào
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      Nhấn "Thêm dòng" để bắt đầu
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lines.map((line, index) => (
                      <div
                        key={line.id}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-gray-400">
                            Dòng {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(line.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-5">
                            <label className="block text-[10px] text-gray-400 mb-1">
                              Hàng hóa
                            </label>
                            <select
                              value={line.itemId}
                              onChange={(e) => {
                                const newItemId = e.target.value;
                                setLines(
                                  lines.map((l) => {
                                    if (l.id !== line.id) return l;
                                    const updated = { ...l, itemId: newItemId, lotId: "", availableQty: 0 };
                                    const item = itemsWithLots.find((i) => i.id === newItemId);
                                    if (item) {
                                      updated.unitCode = item.unitCode;
                                      updated.itemName = item.itemName;
                                    }
                                    return updated;
                                  }),
                                );
                              }}
                              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-orange-400 bg-white"
                            >
                              <option value="">-- Chọn hàng --</option>
                              {availableItems.map((item) => {
                                const stockItem = stockLines.find((s) => s.item.id === item.id);
                                const totalAvailable = fromWarehouseId && stockItem
                                  ? stockLines
                                      .filter((s) => s.item.id === item.id)
                                      .reduce((sum, s) => sum + s.qtyAvailable, 0)
                                  : null;
                                return (
                                  <option key={item.id} value={item.id}>
                                    {item.itemName} ({item.itemCode})
                                    {totalAvailable !== null ? ` - Còn: ${totalAvailable}` : ""}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          <div className="col-span-4">
                            <label className="block text-[10px] text-gray-400 mb-1">
                              LOT / Hạn sử dụng
                            </label>
                            <select
                              value={line.lotId}
                              onChange={(e) => {
                                const newLotId = e.target.value;
                                setLines(
                                  lines.map((l) => {
                                    if (l.id !== line.id) return l;
                                    const updated = { ...l, lotId: newLotId, availableQty: 0 };
                                    const item = itemsWithLots.find((i) => i.id === l.itemId);
                                    const lot = item?.lots.find((lot) => lot.id === newLotId);
                                    if (lot) {
                                      updated.lotNo = lot.lotNo;
                                    }
                                    const stockLine = stockLines.find(
                                      (s) => s.item.id === l.itemId && s.lot?.id === newLotId,
                                    );
                                    updated.availableQty = stockLine?.qtyAvailable ?? 0;
                                    return updated;
                                  }),
                                );
                              }}
                              disabled={!line.itemId}
                              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-orange-400 bg-white disabled:bg-gray-100"
                            >
                              <option value="">-- Chọn LOT --</option>
                              {getLotsForItem(line.itemId).map((lot) => (
                                <option key={lot.id} value={lot.id}>
                                  {lot.lotNo}
                                  {lot.expDate && ` (HSD: ${lot.expDate})`}
                                  {" - Còn: "}{"qtyAvailable" in lot ? lot.qtyAvailable : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[10px] text-gray-400 mb-1">
                              Số lượng
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={line.issueQty || ""}
                              onChange={(e) =>
                                handleLineChange(
                                  line.id,
                                  "issueQty",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              disabled={!line.lotId}
                              placeholder="0"
                              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-orange-400 bg-white disabled:bg-gray-100"
                            />
                            {line.availableQty > 0 && (
                              <p className="text-[9px] text-gray-400 mt-0.5">
                                Còn: {line.availableQty}
                              </p>
                            )}
                          </div>
                          <div className="col-span-1">
                            <label className="block text-[10px] text-gray-400 mb-1">
                              ĐV
                            </label>
                            <div className="h-[34px] flex items-center px-2 border border-gray-200 rounded-lg bg-white text-xs">
                              {line.unitCode || "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Ghi chú
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập ghi chú nếu có..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg hover:shadow-lg transition-all disabled:opacity-60"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <Truck size={16} />
                Tạo phiếu cấp phát
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
