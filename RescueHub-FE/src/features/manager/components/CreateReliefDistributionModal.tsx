import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  AlertCircle,
  Package,
  Truck,
  X,
  Plus,
  Trash2,
  Loader2,
  Search,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { toast } from "react-toastify";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import {
  getDistributionOptions,
  getManagerTeams,
  getItemsForDropdown,
  createDistribution,
  getReliefCampaign,
  getWarehouses,
  getStocks,
  type ManagerTeam,
  type ItemForDropdown,
  type Warehouse,
  type ReliefCampaignDetail,
  type ReliefRequestDetail,
} from "../services/warehouseService";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AggregatedItem {
  supportTypeCode: string;
  supportTypeName: string;
  totalNeededQty: number;
  unitCode: string;
  warehouseStock: Map<string, number>; // warehouseId -> available qty
  sufficientWarehouseIds: string[];
}

interface DistributionLine {
  id: string;
  itemId: string;
  qty: number;
  unitCode: string;
  itemName: string;
  availableQty: number;
  supportTypeCode?: string;
  supportTypeName?: string;
  neededQty?: number;
}

interface WarehouseStockInfo {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  canFulfillAll: boolean;
  itemStocks: Map<string, { available: number; needed: number }>;
  missingItems: string[];
}

interface CreateDistributionModalProps {
  initialCampaignId?: string;
  onClose: () => void;
  onSuccess: (distribution: { id: string; code: string }) => void;
}

interface TeamOption {
  id: string;
  code: string;
  name: string;
  statusCode: string;
}

// ─── Helper Components ──────────────────────────────────────────────────────────
function SummaryBanner({ lines }: { lines: DistributionLine[] }) {
  const allSufficient = lines.every(
    (l) => !l.neededQty || l.availableQty >= l.neededQty,
  );
  const bgClass = allSufficient
    ? "bg-green-50 border-green-200"
    : "bg-orange-50 border-orange-200";
  const textClass = allSufficient ? "text-green-600" : "text-orange-600";
  const icon = allSufficient ? (
    <CheckCircle size={12} />
  ) : (
    <AlertTriangle size={12} />
  );
  const message = allSufficient
    ? "Đủ hàng cho tất cả vật phẩm"
    : "Một số vật phẩm không đủ số lượng";

  return (
    <div className={`mt-3 p-3 rounded-lg border ${bgClass}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600">
          Tổng hợp: {lines.length} vật phẩm
        </span>
        <span
          className={`flex items-center gap-1 text-xs font-semibold ${textClass}`}
        >
          {icon}
          {message}
        </span>
      </div>
    </div>
  );
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
              <p className="text-xs text-gray-500 truncate">
                {getSubLabel(selected)}
              </p>
            )}
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <Search size={16} className="flex-shrink-0 ml-2 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
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
                <div className="p-4 text-center text-gray-400 text-xs">
                  Đang tải...
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-xs">
                  Không tìm thấy
                </div>
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
                      <p className="text-xs text-gray-500">
                        {getSubLabel(item)}
                      </p>
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
  initialCampaignId,
}: CreateDistributionModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dropdown data
  const [campaigns, setCampaigns] = useState<
    Array<{ id: string; code: string; name: string; adminAreaId?: string }>
  >([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [itemsWithLots, setItemsWithLots] = useState<ItemForDropdown[]>([]);
  const [allWarehouses, setAllWarehouses] = useState<Warehouse[]>([]);
  const [allWarehouseStocks, setAllWarehouseStocks] = useState<
    Map<string, Map<string, number>>
  >(new Map()); // warehouseId -> (itemId -> qty)

  // Campaign detail data
  const [campaignDetail, setCampaignDetail] = useState<{
    name: string;
    code: string;
    adminAreaName?: string;
  } | null>(null);
  const [campaignFullDetail, setCampaignFullDetail] =
    useState<ReliefCampaignDetail | null>(null);

  // Aggregated items from relief requests
  const [aggregatedItems, setAggregatedItems] = useState<AggregatedItem[]>([]);
  const [isLoadingAggregatedItems, setIsLoadingAggregatedItems] =
    useState(false);

  // Warehouse suggestions
  const [warehouseSuggestions, setWarehouseSuggestions] = useState<
    WarehouseStockInfo[]
  >([]);

  // Form state
  const [campaignId, setCampaignId] = useState(initialCampaignId ?? "");
  const [adminAreaId, setAdminAreaId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<DistributionLine[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");

  // Aggregate items from relief requests
  const aggregateReliefRequestItems = useCallback(
    (reliefRequests: ReliefRequestDetail[]): AggregatedItem[] => {
      const itemMap = new Map<string, AggregatedItem>();

      for (const request of reliefRequests) {
        if (!request.items) continue;
        for (const item of request.items) {
          const key = `${item.supportTypeCode}-${item.unitCode}`;
          if (!itemMap.has(key)) {
            itemMap.set(key, {
              supportTypeCode: item.supportTypeCode,
              supportTypeName: item.supportTypeName,
              totalNeededQty: 0,
              unitCode: item.unitCode,
              warehouseStock: new Map(),
              sufficientWarehouseIds: [],
            });
          }
          const aggregated = itemMap.get(key)!;
          aggregated.totalNeededQty += item.approvedQty || item.requestedQty;
        }
      }

      return Array.from(itemMap.values());
    },
    [],
  );

  // Load all warehouses with their stocks
  const loadAllWarehouseStocks = useCallback(async () => {
    const token = getAuthSession()?.accessToken ?? "";
    const warehouseStockMap = new Map<string, Map<string, number>>();

    try {
      const warehouseList = await getWarehouses(token, {
        statusCode: "ACTIVE",
      });
      setAllWarehouses(warehouseList);

      // Load stocks for each warehouse
      const stockPromises = warehouseList.map(async (wh) => {
        try {
          const stockResponse = await getStocks(token, {
            warehouseId: wh.id,
            pageSize: 500,
          });
          const itemStockMap = new Map<string, number>();
          for (const stock of stockResponse.items ?? []) {
            // Use stock.item.code (supportTypeCode) as key for matching with aggregated items
            const current = itemStockMap.get(stock.item.code) ?? 0;
            itemStockMap.set(stock.item.code, current + (stock.qtyOnHand ?? 0));
          }
          warehouseStockMap.set(wh.id, itemStockMap);
        } catch (e) {
          console.error(`Lỗi tải tồn kho kho ${wh.warehouseName}:`, e);
          warehouseStockMap.set(wh.id, new Map());
        }
      });

      await Promise.all(stockPromises);
      setAllWarehouseStocks(warehouseStockMap);
    } catch (e) {
      console.error("Lỗi tải danh sách kho:", e);
    }
  }, []);

  // Analyze warehouse suggestions based on aggregated items
  const analyzeWarehouseSuggestions = useCallback(
    (
      aggregated: AggregatedItem[],
      stockMap: Map<string, Map<string, number>>,
      warehouseList: Warehouse[],
    ): WarehouseStockInfo[] => {
      const suggestions: WarehouseStockInfo[] = [];

      for (const wh of warehouseList) {
        const itemStocks = stockMap.get(wh.id);
        if (!itemStocks) continue;

        const stockInfo = new Map<
          string,
          { available: number; needed: number }
        >();
        const missingItems: string[] = [];
        let canFulfillAll = true;

        for (const aggItem of aggregated) {
          // Use supportTypeCode as key (matches stock.item.code from API)
          const available = itemStocks.get(aggItem.supportTypeCode) ?? 0;
          stockInfo.set(aggItem.supportTypeCode, {
            available,
            needed: aggItem.totalNeededQty,
          });

          if (available < aggItem.totalNeededQty) {
            canFulfillAll = false;
            missingItems.push(aggItem.supportTypeName);
          }
        }

        suggestions.push({
          warehouseId: wh.id,
          warehouseName: wh.warehouseName,
          warehouseCode: wh.warehouseCode ?? "",
          canFulfillAll,
          itemStocks: stockInfo,
          missingItems,
        });
      }

      // Sort: warehouses that can fulfill all first, then by missing item count
      return suggestions.sort((a, b) => {
        if (a.canFulfillAll && !b.canFulfillAll) return -1;
        if (!a.canFulfillAll && b.canFulfillAll) return 1;
        return a.missingItems.length - b.missingItems.length;
      });
    },
    [],
  );

  // Load stocks for selected warehouse
  const loadWarehouseStocks = useCallback(async (whId: string) => {
    try {
      const token = getAuthSession()?.accessToken ?? "";
      const stockResponse = await getStocks(token, {
        warehouseId: whId,
        pageSize: 100,
      });
      const stocks = stockResponse.items ?? [];

      // Transform stocks to inventory items for dropdown
      const itemMap = new Map<string, ItemForDropdown>();
      for (const stock of stocks) {
        if (!itemMap.has(stock.item.id)) {
          itemMap.set(stock.item.id, {
            id: stock.item.id,
            itemCode: stock.item.code,
            itemName: stock.item.name,
            unitCode: stock.item.unitCode ?? "",
            totalQtyAvailable: stock.qtyOnHand ?? 0,
            lots: [],
            isActive: true,
          });
        } else {
          // Aggregate quantity for same item
          const item = itemMap.get(stock.item.id)!;
          item.totalQtyAvailable += stock.qtyOnHand ?? 0;
        }
      }

      setItemsWithLots(Array.from(itemMap.values()));
    } catch (e) {
      console.error("Lỗi tải tồn kho:", e);
    }
  }, []);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthSession()?.accessToken ?? "";
      const options = await getDistributionOptions(token);
      setCampaigns(options.campaigns);

      // Load warehouses
      const warehouseList = await getWarehouses(token, {
        statusCode: "ACTIVE",
      });
      setWarehouses(warehouseList);

      // Load all warehouse stocks in background
      void loadAllWarehouseStocks();

      // Load campaign detail if initialCampaignId is provided
      if (initialCampaignId) {
        const detail = await getReliefCampaign(initialCampaignId, token);
        setCampaignId(initialCampaignId);
        setAdminAreaId(detail.adminArea?.id ?? "");
        setCampaignDetail({
          name: detail.name,
          code: detail.code,
          adminAreaName: detail.adminArea?.name,
        });
        setCampaignFullDetail(detail);

        // Aggregate items from relief requests
        if (detail.reliefRequests && detail.reliefRequests.length > 0) {
          setIsLoadingAggregatedItems(true);
          const aggregated = aggregateReliefRequestItems(detail.reliefRequests);
          setAggregatedItems(aggregated);

          // Auto-select warehouse matching campaign's adminArea
          const matchingWarehouse = warehouseList.find(
            (w) => w.adminArea?.id === detail.adminArea?.id,
          );
          if (matchingWarehouse) {
            setWarehouseId(matchingWarehouse.id);
            // Load stocks for this warehouse
            await loadWarehouseStocks(matchingWarehouse.id);
          }
          setIsLoadingAggregatedItems(false);
        }
      }

      const teamItems = await getManagerTeams(token, {
        statusCode: "AVAILABLE",
      });
      const mappedTeams: TeamOption[] = teamItems
        .map((team: ManagerTeam) => {
          const statusCode = String(team.status?.code ?? "").toUpperCase();
          return {
            id: team.id,
            code: team.teamCode ?? "",
            name: team.teamName ?? team.name ?? "Đội cứu trợ",
            statusCode,
          };
        })
        .filter((team) => team.statusCode === "AVAILABLE");
      setTeams(mappedTeams);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [
    initialCampaignId,
    loadWarehouseStocks,
    loadAllWarehouseStocks,
    aggregateReliefRequestItems,
  ]);

  // Update warehouse suggestions when aggregated items or stocks change
  useEffect(() => {
    if (
      aggregatedItems.length > 0 &&
      allWarehouseStocks.size > 0 &&
      allWarehouses.length > 0
    ) {
      const suggestions = analyzeWarehouseSuggestions(
        aggregatedItems,
        allWarehouseStocks,
        allWarehouses,
      );
      setWarehouseSuggestions(suggestions);

      // Auto-select first warehouse that can fulfill all if no warehouse selected
      if (!warehouseId && suggestions.length > 0) {
        const firstSufficient = suggestions.find((s) => s.canFulfillAll);
        if (firstSufficient) {
          setWarehouseId(firstSufficient.warehouseId);
          void loadWarehouseStocks(firstSufficient.warehouseId);
        }
      }
    }
  }, [
    aggregatedItems,
    allWarehouseStocks,
    allWarehouses,
    warehouseId,
    analyzeWarehouseSuggestions,
    loadWarehouseStocks,
  ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Handle warehouse selection
  const handleWarehouseChange = async (newWarehouseId: string) => {
    setWarehouseId(newWarehouseId);
    setLines([]); // Clear existing lines when warehouse changes

    if (newWarehouseId) {
      await loadWarehouseStocks(newWarehouseId);
    } else {
      // Load all items from inventory if no warehouse selected
      const token = getAuthSession()?.accessToken ?? "";
      const items = await getItemsForDropdown(token);
      setItemsWithLots(items);
    }
  };

  // Handle campaign selection
  const handleCampaignChange = async (newCampaignId: string) => {
    setCampaignId(newCampaignId);
    if (newCampaignId) {
      try {
        const token = getAuthSession()?.accessToken ?? "";
        const detail = await getReliefCampaign(newCampaignId, token);
        setAdminAreaId(detail.adminArea?.id ?? "");
        setCampaignDetail({
          name: detail.name,
          code: detail.code,
          adminAreaName: detail.adminArea?.name,
        });
        setCampaignFullDetail(detail);

        // Aggregate items from relief requests
        if (detail.reliefRequests && detail.reliefRequests.length > 0) {
          setIsLoadingAggregatedItems(true);
          const aggregated = aggregateReliefRequestItems(detail.reliefRequests);
          setAggregatedItems(aggregated);
          setIsLoadingAggregatedItems(false);
        } else {
          setAggregatedItems([]);
        }

        // Auto-select warehouse matching campaign's adminArea
        const matchingWarehouse = warehouses.find(
          (w) => w.adminArea?.id === detail.adminArea?.id,
        );
        if (matchingWarehouse) {
          setWarehouseId(matchingWarehouse.id);
          await loadWarehouseStocks(matchingWarehouse.id);
        } else {
          setWarehouseId("");
        }
      } catch (e) {
        toast.error("Không thể tải thông tin chiến dịch");
      }
    } else {
      setAdminAreaId("");
      setCampaignDetail(null);
      setCampaignFullDetail(null);
      setAggregatedItems([]);
      setWarehouseId("");
    }
  };

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        id: crypto.randomUUID(),
        itemId: "",
        qty: 0,
        unitCode: "",
        itemName: "",
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
            // Set available qty from stock data
            updated.availableQty = item.totalQtyAvailable ?? 0;
          }
        }

        return updated;
      }),
    );
  };

  const handleSubmit = async () => {
    if (!campaignId) {
      toast.error("Vui lòng chọn chiến dịch");
      return;
    }
    if (!adminAreaId) {
      toast.error("Không có thông tin khu vực chiến dịch");
      return;
    }
    if (!teamId) {
      toast.error("Vui lòng chọn đội cứu trợ");
      return;
    }
    if (!warehouseId) {
      toast.error("Vui lòng chọn kho xuất hàng");
      return;
    }
    if (lines.length === 0) {
      toast.error("Vui lòng thêm ít nhất một vật phẩm");
      return;
    }

    const invalidLines = lines.filter((l) => !l.itemId || l.qty <= 0);
    if (invalidLines.length > 0) {
      toast.error("Vui lòng điền đầy đủ thông tin cho các dòng vật phẩm");
      return;
    }

    setSubmitting(true);
    try {
      const token = getAuthSession()?.accessToken ?? "";
      const payload = {
        campaignId,
        adminAreaId,
        warehouseId,
        teamId,
        lines: lines.map((l) => ({
          itemId: l.itemId,
          qty: l.qty,
          unitCode: l.unitCode,
        })),
        ackMethodCode: "MANUAL",
        note: note.trim() || undefined,
      };

      const result = await createDistribution(payload, token);
      toast.success(`Tạo phiếu phân phối ${result.code} thành công`);
      onSuccess({ id: result.id, code: result.code });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tạo phiếu phân phối");
    } finally {
      setSubmitting(false);
    }
  };

  // Get available items (items loaded from stock API use qtyOnHand)
  const availableItems = itemsWithLots.filter(
    (item) => item.isActive && (item.totalQtyAvailable ?? 0) > 0,
  );

  // Check if summary should be shown
  const shouldShowSummary = lines.length > 0 && aggregatedItems.length > 0;

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b  flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Truck size={20} className="text-black" />
            </div>
            <div>
              <p className="text-xs text-black-200 font-semibold uppercase">
                Tạo phiếu phân phối
              </p>
              <h2 className="text-lg font-bold text-black">
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
              {/* Campaign Info (readonly display) */}
              <div className=" rounded-xl p-4 border border-black-200">
                <h3 className="text-sm font-bold text-black-800 mb-3 flex items-center gap-2">
                  <MapPin size={16} />
                  Thông tin chiến dịch
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-500 font-semibold uppercase mb-1">
                      Chiến dịch
                    </p>
                    <div className="h-[42px] flex items-center px-3 border border-gray-200 rounded-lg bg-gray-50 text-sm">
                      {campaignDetail
                        ? `${campaignDetail.name} (${campaignDetail.code})`
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-semibold uppercase mb-1">
                      Khu vực
                    </p>
                    <div className="h-[42px] flex items-center px-3 border border-gray-200 rounded-lg bg-gray-50 text-sm">
                      {campaignDetail?.adminAreaName ?? "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Aggregated Items Summary from Relief Requests */}
              {(aggregatedItems.length > 0 || isLoadingAggregatedItems) && (
                <div className=" rounded-xl p-4 border border-black-200">
                  <h3 className="text-sm font-bold text-black-800 mb-3 flex items-center gap-2">
                    <Package size={16} />
                    Tổng hợp vật phẩm cần thiết
                    <span className="ml-auto text-xs font-normal text-blue-600">
                      {campaignFullDetail?.reliefRequestSummary?.total ??
                        aggregatedItems.length}{" "}
                      yêu cầu
                    </span>
                  </h3>
                  {isLoadingAggregatedItems ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2
                        size={20}
                        className="animate-spin text-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-500">
                        Đang tổng hợp...
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {aggregatedItems.map((item, index) => {
                        const selectedWarehouseStock = warehouseId
                          ? (allWarehouseStocks
                              .get(warehouseId)
                              ?.get(item.supportTypeCode) ?? 0)
                          : 0;
                        const isSufficient =
                          selectedWarehouseStock >= item.totalNeededQty;
                        const shortfall =
                          item.totalNeededQty - selectedWarehouseStock;

                        return (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              isSufficient
                                ? "bg-white border-green-200"
                                : "bg-white border-orange-200"
                            }`}
                          >
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-800">
                                {item.supportTypeName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {item.supportTypeCode}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Cần</p>
                                <p className="text-sm font-bold text-blue-600">
                                  {item.totalNeededQty} {item.unitCode}
                                </p>
                              </div>
                              {warehouseId && (
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">
                                    Kho có
                                  </p>
                                  <p
                                    className={`text-sm font-bold ${
                                      isSufficient
                                        ? "text-green-600"
                                        : "text-orange-600"
                                    }`}
                                  >
                                    {selectedWarehouseStock} {item.unitCode}
                                  </p>
                                </div>
                              )}
                              {!isSufficient && selectedWarehouseStock > 0 && (
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">Thiếu</p>
                                  <p className="text-sm font-bold text-red-600">
                                    {shortfall} {item.unitCode}
                                  </p>
                                </div>
                              )}
                              {isSufficient && (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                                  <CheckCircle
                                    size={16}
                                    className="text-green-600"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Warehouse Suggestions */}
              {warehouseSuggestions.length > 0 &&
                aggregatedItems.length > 0 && (
                  <div className=" rounded-xl p-4 border border-purple-200">
                    <h3 className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2">
                      <WarehouseIcon size={16} />
                      Gợi ý kho xuất hàng
                    </h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {warehouseSuggestions.slice(0, 5).map((suggestion) => (
                        <div
                          key={suggestion.warehouseId}
                          onClick={() => {
                            setWarehouseId(suggestion.warehouseId);
                            void loadWarehouseStocks(suggestion.warehouseId);
                          }}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                            suggestion.warehouseId === warehouseId
                              ? "bg-purple-100 border-purple-400"
                              : suggestion.canFulfillAll
                                ? "bg-white border-green-200 hover:border-green-400"
                                : "bg-white border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                suggestion.canFulfillAll
                                  ? "bg-green-100"
                                  : "bg-orange-100"
                              }`}
                            >
                              {suggestion.canFulfillAll ? (
                                <CheckCircle
                                  size={16}
                                  className="text-green-600"
                                />
                              ) : (
                                <AlertTriangle
                                  size={16}
                                  className="text-orange-600"
                                />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {suggestion.warehouseName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {suggestion.warehouseCode}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {suggestion.canFulfillAll ? (
                              <span className="text-xs font-semibold text-green-600">
                                Đủ hàng
                              </span>
                            ) : (
                              <div>
                                <p className="text-xs text-orange-600">
                                  Thiếu {suggestion.missingItems.length} loại
                                </p>
                                <p className="text-[10px] text-gray-400 truncate max-w-[150px]">
                                  {suggestion.missingItems
                                    .slice(0, 2)
                                    .join(", ")}
                                  {suggestion.missingItems.length > 2 && "..."}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Team Selection */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
                  <AlertCircle size={16} />
                  Thông tin điều phối
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      Đội cứu trợ <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      value={teamId}
                      onChange={setTeamId}
                      options={teams}
                      getLabel={(team) =>
                        team.code ? `${team.name} (${team.code})` : team.name
                      }
                      getSubLabel={() => "AVAILABLE"}
                      placeholder="-- Chọn đội có sẵn"
                      searchPlaceholder="Tìm đội cứu trợ..."
                      loading={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      Kho xuất hàng <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      value={warehouseId}
                      onChange={handleWarehouseChange}
                      options={warehouses}
                      getLabel={(wh) =>
                        wh.warehouseCode
                          ? `${wh.warehouseName} (${wh.warehouseCode})`
                          : wh.warehouseName
                      }
                      getSubLabel={(wh) => wh.adminArea?.name ?? ""}
                      placeholder="-- Chọn kho"
                      searchPlaceholder="Tìm kho..."
                      loading={loading}
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
                  </label>
                  <div className="flex items-center gap-2">
                    {aggregatedItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          // Auto-fill lines from aggregated items
                          const newLines: DistributionLine[] =
                            aggregatedItems.map((item) => ({
                              id: crypto.randomUUID(),
                              itemId: "",
                              qty: item.totalNeededQty,
                              unitCode: item.unitCode,
                              itemName: item.supportTypeName,
                              availableQty: warehouseId
                                ? (allWarehouseStocks
                                    .get(warehouseId)
                                    ?.get(item.supportTypeCode) ?? 0)
                                : 0,
                              supportTypeCode: item.supportTypeCode,
                              supportTypeName: item.supportTypeName,
                              neededQty: item.totalNeededQty,
                            }));
                          setLines(newLines);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Package size={14} />
                        Điền từ yêu cầu
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <Plus size={14} />
                      Thêm vật phẩm
                    </button>
                  </div>
                </div>

                {lines.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center">
                    <Package size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">
                      Chưa có vật phẩm nào
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      Nhấn "Thêm vật phẩm" để bắt đầu
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
                        <div className="grid grid-cols-11 gap-3">
                          <div className="col-span-5">
                            <label className="block text-[10px] text-gray-400 mb-1">
                              Vật phẩm
                            </label>
                            <select
                              value={line.itemId}
                              onChange={(e) =>
                                handleLineChange(
                                  line.id,
                                  "itemId",
                                  e.target.value,
                                )
                              }
                              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-green-400 bg-white"
                            >
                              <option value="">-- Chọn vật phẩm --</option>
                              {availableItems.map((item) => {
                                const totalAvailable =
                                  item.totalQtyAvailable ?? 0;
                                return (
                                  <option key={item.id} value={item.id}>
                                    {item.itemName} ({item.itemCode})
                                    {totalAvailable > 0
                                      ? ` - Còn: ${totalAvailable} ${item.unitCode}`
                                      : " - Hết hàng"}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          <div className="col-span-3">
                            <label className="block text-[10px] text-gray-400 mb-1">
                              Số lượng
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={line.qty || ""}
                              onChange={(e) =>
                                handleLineChange(
                                  line.id,
                                  "qty",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              disabled={!line.itemId}
                              placeholder="0"
                              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-green-400 bg-white disabled:bg-gray-100"
                            />
                            {line.availableQty > 0 && (
                              <p
                                className={`text-[9px] mt-0.5 ${
                                  line.neededQty &&
                                  line.availableQty >= line.neededQty
                                    ? "text-green-600"
                                    : "text-gray-400"
                                }`}
                              >
                                Còn: {line.availableQty}
                                {line.neededQty && (
                                  <span
                                    className={
                                      line.availableQty >= line.neededQty
                                        ? " text-green-600"
                                        : " text-orange-600"
                                    }
                                  >
                                    {" "}
                                    / Cần: {line.neededQty}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[10px] text-gray-400 mb-1">
                              ĐV
                            </label>
                            <div className="h-[34px] flex items-center px-2 border border-gray-200 rounded-lg bg-white text-xs">
                              {line.unitCode || "—"}
                            </div>
                          </div>
                          {line.neededQty && line.availableQty > 0 && (
                            <div className="col-span-1 flex items-center justify-center">
                              {line.availableQty >= line.neededQty ? (
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                  <CheckCircle
                                    size={14}
                                    className="text-green-600"
                                  />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                                  <AlertTriangle
                                    size={14}
                                    className="text-orange-600"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {shouldShowSummary && <SummaryBanner lines={lines} />}
                  </div>
                )}
              </div>

              {/* Note */}
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
            style={{
              background: "black",
            }}
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
