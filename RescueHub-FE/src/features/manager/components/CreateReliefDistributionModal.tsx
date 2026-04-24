import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { toast } from "react-toastify";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import {
  getDistributionOptions,
  getManagerTeams,
  getItemsWithLots,
  createDistribution,
  getReliefCampaign,
  type ManagerTeam,
  type ItemWithLots,
} from "../services/warehouseService";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DistributionLine {
  id: string;
  itemId: string;
  qty: number;
  unitCode: string;
  itemName: string;
  availableQty: number;
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
  const [ackMethodCodes, setAckMethodCodes] = useState<
    Array<{ code: string; name: string }>
  >([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [itemsWithLots, setItemsWithLots] = useState<ItemWithLots[]>([]);

  // Campaign detail data
  const [campaignDetail, setCampaignDetail] = useState<{
    name: string;
    code: string;
    adminAreaName?: string;
  } | null>(null);

  // Form state
  const [campaignId, setCampaignId] = useState(initialCampaignId ?? "");
  const [adminAreaId, setAdminAreaId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [ackMethodCode, setAckMethodCode] = useState("OTP");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<DistributionLine[]>([]);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const token = getAuthSession()?.accessToken ?? "";
      const options = await getDistributionOptions(token);
      setCampaigns(options.campaigns);
      setAckMethodCodes(options.ackMethodCodes);

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

      // Load items with lots
      const items = await getItemsWithLots(token);
      setItemsWithLots(items);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [initialCampaignId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
      } catch (e) {
        toast.error("Không thể tải thông tin chiến dịch");
      }
    } else {
      setAdminAreaId("");
      setCampaignDetail(null);
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
            // Set available qty from lots
            const totalAvailable =
              item.lots?.reduce((sum, lot) => sum + (lot.qty ?? 0), 0) ?? 0;
            updated.availableQty = totalAvailable;
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
        teamId,
        lines: lines.map((l) => ({
          itemId: l.itemId,
          qty: l.qty,
          unitCode: l.unitCode,
        })),
        ackMethodCode,
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

  // Get available items
  const availableItems = itemsWithLots.filter(
    (item) => item.isActive && item.lots && item.lots.length > 0,
  );

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
              {/* Campaign Info (readonly display) */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
                  <MapPin size={16} />
                  Thông tin chiến dịch
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-500 font-semibold uppercase mb-1">
                      Chiến dịch
                    </p>
                    <select
                      value={campaignId}
                      onChange={(e) =>
                        void handleCampaignChange(e.target.value)
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400 bg-white"
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
                    <p className="text-[10px] text-gray-500 font-semibold uppercase mb-1">
                      Khu vực
                    </p>
                    <div className="h-[42px] flex items-center px-3 border border-gray-200 rounded-lg bg-gray-50 text-sm">
                      {campaignDetail?.adminAreaName ?? "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Selection */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
                  <AlertCircle size={16} />
                  Thông tin điều phối
                </h3>
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
                    placeholder="-- Chọn đội AVAILABLE --"
                    searchPlaceholder="Tìm đội cứu trợ..."
                    loading={loading}
                  />
                </div>
              </div>

              {/* Items Lines */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                    <Package size={14} />
                    Danh sách vật phẩm <span className="text-red-500">*</span>
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
                                  item.lots?.reduce(
                                    (sum, lot) => sum + (lot.qty ?? 0),
                                    0,
                                  ) ?? 0;
                                return (
                                  <option key={item.id} value={item.id}>
                                    {item.itemName} ({item.itemCode})
                                    {totalAvailable > 0
                                      ? ` - Còn: ${totalAvailable}`
                                      : ""}
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
                              <p className="text-[9px] text-gray-400 mt-0.5">
                                Còn: {line.availableQty}
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
            style={{
              background: "linear-gradient(135deg, #059669, #10b981)",
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
