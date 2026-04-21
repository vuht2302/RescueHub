import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  AlertCircle,
  Package,
  Truck,
  User,
  X,
  ChevronDown,
  Search,
  MapPin,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import {
  createDistribution,
  getHouseholds,
  getDistributionOptions,
  type DistributionOptions,
  type Household,
  type DistributionPayload,
  type Distribution,
} from "../services/warehouseService";
import { toastSuccess } from "../../../shared/utils/toast";

interface CreateDistributionModalProps {
  reliefRequest: import("../../rescue-coordinator/services/incidentServices").ReliefRequestDetail;
  onClose: () => void;
  onSuccess: (distribution: Distribution) => void;
}

// ─── Relief Point shape from options API ─────────────────────────────────────
interface OptionsReliefPoint {
  id: string;
  code: string;
  name: string;
  statusCode: string;
  addressText: string;
  campaign: { id: string; code: string; name: string };
  location: { lat: number; lng: number };
}

// ─── Searchable Select Component ─────────────────────────────────────────────
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
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
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
        <ChevronDown
          size={16}
          className={`flex-shrink-0 ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
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

export function CreateDistributionModal({
  reliefRequest,
  onClose,
  onSuccess,
}: CreateDistributionModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dropdown data
  const [households, setHouseholds] = useState<Household[]>([]);
  const [reliefPoints, setReliefPoints] = useState<OptionsReliefPoint[]>([]);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // Auto-fill from relief request
  const autoFilledHousehold = useMemo(() => {
    // Check if there's an existing household that matches the requester
    const matched = households.find(
      (h) =>
        h.phone === reliefRequest.requester?.phone ||
        h.headName === reliefRequest.requester?.name
    );
    return matched || null;
  }, [households, reliefRequest.requester]);

  // Get location from request (API may return it in detail)
  const requestLocation = (reliefRequest as any).location;
  const requestLat = requestLocation?.lat || (reliefRequest.incident as any)?.location?.lat;
  const requestLng = requestLocation?.lng || (reliefRequest.incident as any)?.location?.lng;

  const [form, setForm] = useState({
    reliefPointId: "",
    householdId: autoFilledHousehold?.id || "",
    ackMethodCode: "OTP",
    note: "",
  });

  // Auto-select nearest relief point based on location
  const suggestedReliefPoint = useMemo(() => {
    if (!requestLat || !requestLng || reliefPoints.length === 0) {
      return null;
    }

    // Calculate distance and find nearest relief point
    let nearest = reliefPoints[0];
    let minDistance = Infinity;

    for (const rp of reliefPoints) {
      if (!rp.location) continue;

      const distance = Math.sqrt(
        Math.pow(rp.location.lat - requestLat, 2) +
        Math.pow(rp.location.lng - requestLng, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = rp;
      }
    }

    // Only suggest if within ~0.5 degrees (~50km)
    return minDistance < 0.5 ? nearest : null;
  }, [reliefPoints, requestLat, requestLng]);

  // Load households, relief points, campaigns from the single options endpoint
  const loadDropdownData = useCallback(async () => {
    const token = getAuthSession()?.accessToken ?? "";
    setLoadingDropdowns(true);
    try {
      const [hList, options] = await Promise.all([
        getHouseholds(token),
        getDistributionOptions(token),
      ]);
      setHouseholds(hList);
      setReliefPoints(options.reliefPoints);
      setCampaigns(options.campaigns);

      // Auto-select matched household
      const matched = hList.find(
        (h) =>
          h.phone === reliefRequest.requester?.phone ||
          h.headName === reliefRequest.requester?.name
      );
      if (matched) {
        setForm((p) => ({ ...p, householdId: matched.id }));
      }

      // Auto-select nearest relief point
      if (requestLat && requestLng) {
        let nearest = options.reliefPoints[0];
        let minDistance = Infinity;

        for (const rp of options.reliefPoints) {
          if (!rp.location) continue;

          const distance = Math.sqrt(
            Math.pow(rp.location.lat - requestLat, 2) +
            Math.pow(rp.location.lng - requestLng, 2)
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearest = rp;
          }
        }

        if (minDistance < 0.5) {
          setForm((p) => ({ ...p, reliefPointId: nearest.id }));
        }
      }
    } catch (e) {
      console.error("Error loading dropdown data:", e);
    } finally {
      setLoadingDropdowns(false);
    }
  }, [reliefRequest.requester, requestLat, requestLng]);

  useEffect(() => {
    void loadDropdownData();
  }, [loadDropdownData]);

  const handleSubmit = async () => {
    if (!form.reliefPointId) {
      setError("Vui lòng chọn điểm cứu trợ.");
      return;
    }
    if (!form.householdId) {
      setError("Vui lòng chọn hộ dân.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = getAuthSession()?.accessToken ?? "";
      const lines = reliefRequest.requestedItems
        .filter((item) => (item.defaultApprovedQty || item.requestedQty) > 0)
        .map((item) => ({
          itemId: item.reliefRequestItemId,
          lotId: "",
          qty: item.defaultApprovedQty || item.requestedQty,
          unitCode: item.unitCode,
        }));
      const payload: DistributionPayload = {
        campaignId: reliefRequest.campaign?.id || "",
        reliefPointId: form.reliefPointId,
        householdId: form.householdId,
        incidentId: reliefRequest.incident?.id || null,
        ackMethodCode: form.ackMethodCode,
        note:
          form.note ||
          `Phân phối cứu trợ cho yêu cầu ${reliefRequest.requestCode}`,
        lines,
      };
      const result = await createDistribution(payload, token);
      toastSuccess(`Đã tạo phiếu phân phối ${result.code}`);
      onSuccess(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tạo phiếu phân phối");
    } finally {
      setSubmitting(false);
    }
  };

  // Get selected items for display
  const selectedHousehold = households.find((h) => h.id === form.householdId);
  const selectedReliefPoint = reliefPoints.find((rp) => rp.id === form.reliefPointId);

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-green-50 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-green-800">
              Tạo phiếu phân phối cứu trợ
            </h2>
            <p className="text-xs text-gray-500">
              Yêu cầu: {reliefRequest.requestCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-green-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Auto-filled Requester Info */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-green-800">
                <User size={16} className="inline mr-2" />
                Thông tin từ yêu cầu cứu trợ
              </h3>
              <span className="px-2 py-0.5 bg-green-200 text-green-800 rounded text-xs font-semibold">
                AUTO
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-green-600 block">Người yêu cầu</span>
                <p className="font-semibold text-green-900">
                  {reliefRequest.requester?.name || "—"}
                </p>
              </div>
              <div>
                <span className="text-xs text-green-600 block">SĐT</span>
                <p className="font-semibold text-green-900">
                  {reliefRequest.requester?.phone || "—"}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-green-600 block">Địa chỉ</span>
                <p className="font-semibold text-green-900 text-xs">
                  {(reliefRequest as any).location?.addressText || requestLocation?.addressText || reliefRequest.addressText || "—"}
                </p>
              </div>
              {autoFilledHousehold && (
                <div className="col-span-2 flex items-center gap-2 p-2 bg-white rounded-lg">
                  <CheckCircle size={14} className="text-green-600" />
                  <span className="text-xs text-green-700">
                    Đã tìm thấy hộ dân: <strong>{autoFilledHousehold.headName}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Relief Point Selection - with auto-suggestion */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              <MapPin size={12} className="inline mr-1" />
              Điểm cứu trợ <span className="text-red-500">*</span>
              {suggestedReliefPoint && (
                <span className="ml-2 text-green-600 font-normal">
                  (Gợi ý: {suggestedReliefPoint.name})
                </span>
              )}
            </label>
            <SearchableSelect
              value={form.reliefPointId}
              onChange={(id) => setForm((p) => ({ ...p, reliefPointId: id }))}
              options={reliefPoints}
              getLabel={(rp) => rp.name}
              getSubLabel={(rp) => rp.addressText}
              placeholder="-- Chọn điểm cứu trợ --"
              searchPlaceholder="Tìm điểm cứu trợ..."
              loading={loadingDropdowns}
            />
            {selectedReliefPoint && (
              <p className="text-xs text-green-600 mt-1">
                ✓ {selectedReliefPoint.addressText}
              </p>
            )}
          </div>

          {/* Household Selection - with auto-match */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              <User size={12} className="inline mr-1" />
              Hộ dân nhận <span className="text-red-500">*</span>
              {autoFilledHousehold && (
                <span className="ml-2 text-green-600 font-normal">
                  (Tự động khớp từ yêu cầu)
                </span>
              )}
            </label>
            <SearchableSelect
              value={form.householdId}
              onChange={(id) => setForm((p) => ({ ...p, householdId: id }))}
              options={households}
              getLabel={(h) => h.headName}
              getSubLabel={(h) => `${h.phone} • ${h.address}`}
              placeholder="-- Chọn hộ dân --"
              searchPlaceholder="Tìm họ tên, SĐT, địa chỉ..."
              loading={loadingDropdowns}
            />
            {selectedHousehold && (
              <div className="mt-2 p-2 bg-green-50 rounded-lg text-xs border border-green-200">
                <div className="flex items-center gap-1 mb-1">
                  <CheckCircle size={12} className="text-green-600" />
                  <span className="font-semibold text-green-800">Đã chọn:</span>
                </div>
                <p className="font-semibold">{selectedHousehold.headName}</p>
                <p className="text-gray-600">{selectedHousehold.phone}</p>
                <p className="text-gray-500">{selectedHousehold.address}</p>
              </div>
            )}
          </div>

          {/* ACK Method */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Phương thức xác nhận
            </label>
            <select
              value={form.ackMethodCode}
              onChange={(e) =>
                setForm((p) => ({ ...p, ackMethodCode: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="OTP">OTP (Mã xác nhận SMS)</option>
              <option value="SIGNATURE">Chữ ký</option>
              <option value="MANUAL">Thủ công</option>
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Ghi chú
            </label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="Ghi chú (tùy chọn)..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Items Preview */}
          {reliefRequest.requestedItems.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Package size={16} /> Vật phẩm ({reliefRequest.requestedItems.length})
              </h3>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                        Vật phẩm
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
                    {reliefRequest.requestedItems.map((item) => (
                      <tr key={item.reliefRequestItemId}>
                        <td className="px-3 py-2 font-medium">
                          {item.supportTypeName}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-green-700">
                          {item.defaultApprovedQty || item.requestedQty}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-500">
                          {item.unitCode}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-sm hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loadingDropdowns}
            className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Truck size={16} />
            )}
            Tạo phiếu phân phối
          </button>
        </div>
      </div>
    </div>
  );
}
