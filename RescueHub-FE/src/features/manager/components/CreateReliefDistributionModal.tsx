import React, { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  Package,
  Truck,
  X,
  Plus,
  Trash2,
  MapPin,
  Phone,
  Users,
  Loader2,
  MapPinned,
  Search,
} from "lucide-react";
import { toast } from "react-toastify";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import { AddressAutocomplete, type AddressSuggestion } from "../../../shared/components/AddressAutocomplete";
import {
  getDistributionOptions,
  getWarehouses,
  getStocks,
  getItemsWithLots,
  createDistribution,
  type StockLine,
  type ItemWithLots,
  type Warehouse,
} from "../services/warehouseService";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DistributionLine {
  id: string;
  itemId: string;
  lotId: string;
  qty: number;
  unitCode: string;
  itemName: string;
  lotNo: string;
  availableQty: number;
}

interface DistributionOptions {
  campaigns: Array<{ id: string; code: string; name: string; statusCode: string; startAt: string; endAt: string | null }>;
  reliefPoints: Array<{ id: string; code: string; name: string; statusCode: string; addressText: string; campaign: { id: string; code: string; name: string }; location: { lat: number; lng: number } }>;
  ackMethodCodes: Array<{ code: string; name: string; color: string | null }>;
  distributionStatusCodes: Array<{ code: string; name: string; color: string | null }>;
}

interface CreateDistributionModalProps {
  reliefPointId?: string;
  onClose: () => void;
  onSuccess: (distribution: { id: string; code: string }) => void;
}

interface OptionsReliefPoint {
  id: string;
  code: string;
  name: string;
  statusCode: string;
  addressText: string;
  campaign: { id: string; code: string; name: string };
  location: { lat: number; lng: number };
}

// ─── Searchable Select Component ───────────────────────────────────────────────
function SearchableSelect<T extends { id: string }>({
  value,
  onChange,
  options,
  getLabel,
  getSubLabel,
  placeholder,
  searchPlaceholder,
  loading,
}: {
  value: string;
  onChange: (id: string) => void;
  options: T[];
  getLabel: (item: T) => string;
  getSubLabel?: (item: T) => string;
  placeholder: string;
  searchPlaceholder: string;
  loading?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find((o) => o.id === value);

  const filtered = options.filter((o) => {
    const label = getLabel(o).toLowerCase();
    return label.includes(search.toLowerCase());
  });

  useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
      >
        {selected ? (
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{getLabel(selected)}</p>
            {getSubLabel && (
              <p className="text-xs text-gray-500 truncate">{getSubLabel(selected)}</p>
            )}
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <Search size={16} className="flex-shrink-0 ml-2 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-40">
              {loading ? (
                <div className="p-4 text-center text-gray-400 text-xs">Đang tải...</div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-xs">Không tìm thấy</div>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onChange(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-green-50 transition-colors ${
                      item.id === value ? "bg-green-50" : ""
                    }`}
                  >
                    <p className="text-sm font-medium">{getLabel(item)}</p>
                    {getSubLabel && (
                      <p className="text-xs text-gray-500">{getSubLabel(item)}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function CreateReliefDistributionModal({
  onClose,
  onSuccess,
  reliefPointId: initialReliefPointId,
}: CreateDistributionModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dropdown data
  const [reliefPoints, setReliefPoints] = useState<OptionsReliefPoint[]>([]);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [ackMethodCodes, setAckMethodCodes] = useState<Array<{ code: string; name: string }>>([]);

  // Stock data for selected relief point
  const [stockLines, setStockLines] = useState<StockLine[]>([]);
  const [itemsWithLots, setItemsWithLots] = useState<ItemWithLots[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);

  // Form state
  const [campaignId, setCampaignId] = useState("");
  const [reliefPointId, setReliefPointId] = useState(initialReliefPointId ?? "");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recipientLat, setRecipientLat] = useState<number>(0);
  const [recipientLng, setRecipientLng] = useState<number>(0);
  const [memberCount, setMemberCount] = useState(1);
  const [vulnerableCount, setVulnerableCount] = useState(0);
  const [ackMethodCode, setAckMethodCode] = useState("OTP");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<DistributionLine[]>([]);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const token = getAuthSession()?.accessToken ?? "";
      const options = await getDistributionOptions(token);
      setReliefPoints(options.reliefPoints);
      setCampaigns(options.campaigns);
      setAckMethodCodes(options.ackMethodCodes);

      // Load items with lots
      const items = await getItemsWithLots(token);
      setItemsWithLots(items);

      // Auto-select relief point if provided
      if (initialReliefPointId) {
        setReliefPointId(initialReliefPointId);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [initialReliefPointId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Load stocks when relief point changes
  const loadStocksForReliefPoint = async (rpId: string) => {
    setLoadingStocks(true);
    try {
      const token = getAuthSession()?.accessToken ?? "";
      // Get all stocks and filter by relief point's warehouse
      const result = await getStocks(token, { pageSize: 1000 });
      // Filter stocks by warehouse associated with relief point
      // For now, show all available stocks
      setStockLines(result.items);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải tồn kho");
      setStockLines([]);
    } finally {
      setLoadingStocks(false);
    }
  };

  useEffect(() => {
    if (reliefPointId) {
      void loadStocksForReliefPoint(reliefPointId);
    } else {
      setStockLines([]);
    }
  }, [reliefPointId]);

  const selectedReliefPoint = reliefPoints.find((rp) => rp.id === reliefPointId);

  // Get available items for dropdown
  const availableItems = stockLines.length > 0
    ? stockLines
        .filter((s) => s.qtyAvailable > 0)
        .map((s) => itemsWithLots.find((i) => i.id === s.item.id))
        .filter((item): item is ItemWithLots => item != null)
    : itemsWithLots.filter((item) => item.isActive && item.lots.length > 0);

  // Get lots for item
  const getLotsForItem = (itemId: string) => {
    if (stockLines.length > 0) {
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

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        id: crypto.randomUUID(),
        itemId: "",
        lotId: "",
        qty: 0,
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
    field: keyof DistributionLine,
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
    if (!recipientName.trim()) {
      toast.error("Vui lòng nhập tên người nhận");
      return;
    }
    if (!recipientPhone.trim()) {
      toast.error("Vui lòng nhập SĐT người nhận");
      return;
    }
    if (lines.length === 0) {
      toast.error("Vui lòng thêm ít nhất một vật phẩm");
      return;
    }

    const invalidLines = lines.filter((l) => !l.itemId || !l.lotId || l.qty <= 0);
    if (invalidLines.length > 0) {
      toast.error("Vui lòng điền đầy đủ thông tin cho các dòng vật phẩm");
      return;
    }

    // Validate quantity
    const overQtyLines = lines.filter((l) => l.qty > l.availableQty);
    if (overQtyLines.length > 0) {
      const itemNames = overQtyLines.map((l) => l.itemName).join(", ");
      toast.error(`Số lượng vượt quá tồn kho: ${itemNames}`);
      return;
    }

    setSubmitting(true);
    try {
      const token = getAuthSession()?.accessToken ?? "";
      const payload = {
        campaignId: campaignId || "",
        reliefPointId,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        recipientLocation: {
          lat: recipientLat,
          lng: recipientLng,
          addressText: recipientAddress.trim(),
        },
        recipientMemberCount: memberCount,
        recipientVulnerableCount: vulnerableCount,
        lines: lines.map((l) => ({
          itemId: l.itemId,
          lotId: l.lotId,
          qty: l.qty,
          unitCode: l.unitCode,
        })),
        ackMethodCode,
        note: note.trim(),
      };

      const result = await createDistribution(payload as any, token);
      toast.success(`Tạo phiếu phân phối ${result.code} thành công`);
      onSuccess({ id: result.id, code: result.code });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tạo phiếu phân phối");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-green-600 to-emerald-600 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Truck size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-green-100 font-semibold uppercase">
                Tạo phiếu phân phối
              </p>
              <h2 className="text-lg font-bold text-white">
                Phiếu phân phối cứu trợ
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-green-500" />
            </div>
          ) : (
            <>
              {/* Campaign & Relief Point */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Chiến dịch
                  </label>
                  <select
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 bg-white"
                  >
                    <option value="">-- Chọn chiến dịch --</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Điểm cứu trợ <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    value={reliefPointId}
                    onChange={(id) => setReliefPointId(id)}
                    options={reliefPoints}
                    getLabel={(rp) => rp.name}
                    getSubLabel={(rp) => rp.addressText}
                    placeholder="-- Chọn điểm cứu trợ --"
                    searchPlaceholder="Tìm điểm cứu trợ..."
                    loading={loading}
                  />
                  {selectedReliefPoint && (
                    <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                      <MapPinned size={10} />
                      {selectedReliefPoint.addressText}
                    </p>
                  )}
                </div>
              </div>

              {/* Recipient Info */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
                  <Users size={16} />
                  Thông tin người nhận cứu trợ
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      Tên người nhận <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-green-400 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="0912 345 678"
                        className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-green-400 bg-white"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      Địa chỉ nhận cứu trợ
                    </label>
                    <AddressAutocomplete
                      value={recipientAddress}
                      onChange={setRecipientAddress}
                      onSelect={(suggestion) => {
                        setRecipientLat(suggestion.lat);
                        setRecipientLng(suggestion.lng);
                      }}
                      placeholder="Nhập địa chỉ để tìm kiếm..."
                    />
                    {recipientLat && recipientLng && (
                      <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                        <MapPinned size={10} />
                        Tọa độ: {recipientLat.toFixed(5)}, {recipientLng.toFixed(5)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      Số thành viên
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={memberCount}
                      onChange={(e) => setMemberCount(parseInt(e.target.value) || 1)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      Số người dễ tổn thương
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={vulnerableCount}
                      onChange={(e) => setVulnerableCount(parseInt(e.target.value) || 0)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Items Lines */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                    <Package size={14} />
                    Danh sách vật phẩm <span className="text-red-500">*</span>
                    {loadingStocks && (
                      <Loader2 size={12} className="animate-spin text-green-500" />
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <Plus size={14} />
                    Thêm vật phẩm
                  </button>
                </div>

                {lines.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center">
                    <Package size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Chưa có vật phẩm nào</p>
                    <p className="text-xs text-gray-300 mt-1">Nhấn "Thêm vật phẩm" để bắt đầu</p>
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
                            Vật phẩm {index + 1}
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
                              Vật phẩm
                            </label>
                            <select
                              value={line.itemId}
                              onChange={(e) => handleLineChange(line.id, "itemId", e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-green-400 bg-white"
                            >
                              <option value="">-- Chọn vật phẩm --</option>
                              {availableItems.map((item) => {
                                const totalAvailable = stockLines.length > 0
                                  ? stockLines
                                      .filter((s) => s.item.id === item.id)
                                      .reduce((sum, s) => sum + s.qtyAvailable, 0)
                                  : 0;
                                return (
                                  <option key={item.id} value={item.id}>
                                    {item.itemName} ({item.itemCode})
                                    {totalAvailable > 0 ? ` - Còn: ${totalAvailable}` : ""}
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
                              onChange={(e) => handleLineChange(line.id, "lotId", e.target.value)}
                              disabled={!line.itemId}
                              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-green-400 bg-white disabled:bg-gray-100"
                            >
                              <option value="">-- Chọn LOT --</option>
                              {getLotsForItem(line.itemId).map((lot: any) => (
                                <option key={lot.id} value={lot.id}>
                                  {lot.lotNo}
                                  {lot.expDate && ` (HSD: ${lot.expDate})`}
                                  {" - Còn: "}{lot.qtyAvailable ?? 0}
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
                              value={line.qty || ""}
                              onChange={(e) =>
                                handleLineChange(line.id, "qty", parseInt(e.target.value) || 0)
                              }
                              disabled={!line.lotId}
                              placeholder="0"
                              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-green-400 bg-white disabled:bg-gray-100"
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

              {/* ACK Method & Note */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Phương thức xác nhận
                  </label>
                  <select
                    value={ackMethodCode}
                    onChange={(e) => setAckMethodCode(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 bg-white"
                  >
                    {ackMethodCodes.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.name}
                      </option>
                    ))}
                    {!ackMethodCodes.find((m) => m.code === "OTP") && (
                      <>
                        <option value="OTP">OTP (Mã xác nhận SMS)</option>
                        <option value="SIGNATURE">Chữ ký</option>
                        <option value="MANUAL">Thủ công</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Ghi chú
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú (tùy chọn)..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 bg-white"
                  />
                </div>
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
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <Truck size={16} />
                Tạo phiếu phân phối
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
