import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  RefreshCw,
  AlertCircle,
  PackageSearch,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Warehouse,
} from "lucide-react";
import {
  getStocks,
  getWarehouses,
  type StockLine,
  type StockListParams,
  type Warehouse as WarehouseType,
} from "../services/warehouseService";
import { getAuthSession } from "../../../features/auth/services/authStorage";

// ─── Lot status badge ─────────────────────────────────────────────────────────
const LOT_STATUS: Record<string, { label: string; cls: string }> = {
  AVAILABLE: { label: "Có sẵn", cls: "bg-emerald-100 text-emerald-700" },
  NEAR_EXPIRY: { label: "Sắp hết hạn", cls: "bg-amber-100 text-amber-700" },
  EXPIRED: { label: "Hết hạn", cls: "bg-red-100 text-red-700" },
  QUARANTINE: { label: "Cách ly", cls: "bg-purple-100 text-purple-700" },
};

function LotBadge({ code }: { code: string }) {
  const cfg = LOT_STATUS[code] ?? {
    label: code,
    cls: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}
    >
      {code === "NEAR_EXPIRY" && <AlertTriangle size={10} />}
      {cfg.label}
    </span>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────
export const StockTab: React.FC = () => {
  const [data, setData] = useState<StockLine[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [params, setParams] = useState<StockListParams>({
    warehouseId: "",
    itemId: "",
    lotNo: "",
    nearExpiry: false,
    page: 1,
    pageSize: 20,
  });

  // Load warehouses for dropdown
  const loadWarehouses = useCallback(async () => {
    setLoadingWarehouses(true);
    try {
      const token = getAuthSession()?.accessToken ?? "";
      const result = await getWarehouses(token);
      setWarehouses(result);
    } catch (e) {
      console.error("Lỗi tải danh sách kho:", e);
    } finally {
      setLoadingWarehouses(false);
    }
  }, []);

  useEffect(() => {
    void loadWarehouses();
  }, [loadWarehouses]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthSession()?.accessToken ?? "";
      const clean: StockListParams = {
        ...(params.warehouseId ? { warehouseId: params.warehouseId } : {}),
        ...(params.itemId ? { itemId: params.itemId } : {}),
        ...(params.lotNo ? { lotNo: params.lotNo } : {}),
        nearExpiry: params.nearExpiry,
        page: params.page,
        pageSize: params.pageSize,
      };
      const res = await getStocks(token, clean);
      setData(res.items ?? []);
      setTotalItems(res.totalItems ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải tồn kho");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void load();
  }, [load]);

  const setStr =
    (k: keyof StockListParams) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setParams((p) => ({ ...p, [k]: e.target.value, page: 1 }));
  const setWarehouse = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setParams((p) => ({ ...p, warehouseId: e.target.value, page: 1 }));
  const toggleNE = () =>
    setParams((p) => ({ ...p, nearExpiry: !p.nearExpiry, page: 1 }));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Warehouse
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <select
            value={params.warehouseId}
            onChange={setWarehouse}
            disabled={loadingWarehouses}
            className="pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer disabled:opacity-50"
          >
            <option value="">Tất cả kho</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.warehouseName}
              </option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        <input
          value={params.itemId}
          onChange={setStr("itemId")}
          placeholder="ID Hàng hóa..."
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={toggleNE}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
            params.nearExpiry
              ? "border-amber-500 bg-amber-50 text-amber-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {params.nearExpiry ? (
            <ToggleRight size={16} />
          ) : (
            <ToggleLeft size={16} />
          )}
          Gần hết hạn
        </button>
        <button
          onClick={() => void load()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Làm
          mới
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Kho", "Hàng hóa", "Mã hàng", "Số lượng", "Đơn vị"].map((h) => (
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
                <td
                  colSpan={10}
                  className="py-12 text-center text-gray-400 text-sm"
                >
                  Đang tải...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <PackageSearch size={32} className="text-gray-300" />
                    <p className="text-gray-400 text-sm">
                      Không có dữ liệu tồn kho
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((s) => {
                const isNE = s.lot?.statusCode === "NEAR_EXPIRY";
                const isExp = s.lot?.statusCode === "EXPIRED";
                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-blue-50/30 transition-colors ${
                      isNE ? "bg-amber-50/40" : isExp ? "bg-red-50/30" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800 whitespace-nowrap text-xs">
                        {s.warehouse.name}
                      </p>
                      <p className="font-mono text-[11px] text-gray-400">
                        {s.warehouse.code}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                      {s.item.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">
                      {s.item.code}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-gray-900">
                        {s.qtyOnHand.toLocaleString()}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {s.item.unitCode}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Tổng {totalItems} dòng</span>
          <div className="flex gap-2">
            <button
              disabled={(params.page ?? 1) <= 1}
              onClick={() =>
                setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))
              }
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft size={14} /> Trước
            </button>
            <span className="px-3 py-1.5 text-gray-700 font-medium">
              Trang {params.page} / {totalPages}
            </span>
            <button
              disabled={(params.page ?? 1) >= totalPages}
              onClick={() =>
                setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))
              }
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50"
            >
              Sau <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-right">
        {data.length} dòng tồn kho
      </p>
    </div>
  );
};
