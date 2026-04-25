import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  Calendar,
  MapPin,
  RefreshCw,
  Plus,
  X,
  Map,
  Truck,
} from "lucide-react";
import {
  getReliefCampaigns,
  getReliefCampaign,
  type ReliefCampaign,
  type ReliefCampaignDetail,
} from "../../../services/warehouseService";
import { getAuthSession } from "../../../../auth/services/authStorage";
import { StatusBadge, CAMPAIGN_STATUS } from "../../../constants/statusConfig";

interface ReliefCampaignTabProps {
  onSelectCampaign?: (campaign: ReliefCampaign) => void;
  onCreateDistribution?: (campaignId: string, reliefPointId?: string) => void;
}

export const ReliefCampaignTab: React.FC<ReliefCampaignTabProps> = ({
  onSelectCampaign,
  onCreateDistribution,
}) => {
  const [campaigns, setCampaigns] = useState<ReliefCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedCampaign, setSelectedCampaign] =
    useState<ReliefCampaign | null>(null);

  const loadCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getReliefCampaigns(
        getAuthSession()?.accessToken ?? "",
        {
          ...(search ? { keyword: search } : {}),
          ...(statusFilter ? { statusCode: statusFilter } : {}),
        },
      );
      setCampaigns(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải chiến dịch");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  const handleCampaignClick = (campaign: ReliefCampaign) => {
    setSelectedCampaign(campaign);
    onSelectCampaign?.(campaign);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search & Filter */}
      <div className="p-4 bg-white border-b border-gray-100 space-y-2">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Tìm mã, tên chiến dịch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void loadCampaigns()}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PLANNED">Đang lên kế hoạch</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <button
            onClick={() => void loadCampaigns()}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            title="Làm mới"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading && campaigns.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-800 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <button
              onClick={() => void loadCampaigns()}
              className="text-xs text-blue-600 hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar size={32} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Chưa có chiến dịch cứu trợ</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                <th className="px-4 py-3">Chiến dịch</th>
                <th className="px-4 py-3">Khu vực</th>
                <th className="px-4 py-3">Ngày bắt đầu</th>
                <th className="px-4 py-3">Trạm</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  onClick={() => handleCampaignClick(campaign)}
                  className={`cursor-pointer transition-colors hover:bg-blue-50 ${
                    selectedCampaign?.id === campaign.id ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-blue-700 truncate">
                        {campaign.name}
                      </p>
                      <p className="text-[11px] text-gray-400 font-mono">
                        {campaign.code}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin size={12} />
                      {campaign.adminArea?.name || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar size={12} />
                      {formatDate(campaign.startAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-xs font-semibold">
                      {campaign.reliefPointCount} trạm
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      code={campaign.status?.code ?? ""}
                      statusMap={CAMPAIGN_STATUS}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {onCreateDistribution && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateDistribution(campaign.id);
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-xs font-semibold transition-colors ml-auto"
                      >
                        <Truck size={12} />
                        Tạo phân phối
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <CampaignDetailModal
          campaignId={selectedCampaign.id}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
};

// Campaign Detail Modal
interface CampaignDetailModalProps {
  campaignId: string;
  onClose: () => void;
}

function CampaignDetailModal({
  campaignId,
  onClose,
}: CampaignDetailModalProps) {
  const [detail, setDetail] = useState<ReliefCampaignDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const loadDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getReliefCampaign(
          campaignId,
          getAuthSession()?.accessToken ?? "",
        );
        setDetail(data);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Lỗi tải chi tiết chiến dịch",
        );
      } finally {
        setIsLoading(false);
      }
    };
    void loadDetail();
  }, [campaignId]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-blue-300 border-t-blue-800 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <p className="text-red-500 mb-4">{error ?? "Không có dữ liệu"}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-start justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-gray-900">
                {detail.name}
              </h2>
              <StatusBadge
                code={detail.status?.code ?? ""}
                statusMap={CAMPAIGN_STATUS}
              />
            </div>
            <p className="text-xs text-gray-400 font-mono mt-1">
              {detail.code}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Description */}
            {detail.description && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-700">{detail.description}</p>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Admin Area */}
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-blue-400 font-bold mb-1">
                  Khu vực
                </p>
                <p className="text-sm font-bold text-blue-700 flex items-center gap-1">
                  <MapPin size={12} />
                  {detail.adminArea?.name || "—"}
                </p>
              </div>

              {/* Relief Points */}
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-orange-400 font-bold mb-1">
                  Trạm cứu trợ
                </p>
                <p className="text-sm font-bold text-orange-700">
                  {detail.reliefPointCount} trạm
                </p>
              </div>

              {/* Start Date */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">
                  Ngày bắt đầu
                </p>
                <p className="text-sm font-semibold flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(detail.startAt)}
                </p>
              </div>

              {/* End Date */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">
                  Ngày kết thúc
                </p>
                <p className="text-sm font-semibold flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(detail.endAt) || "Chưa kết thúc"}
                </p>
              </div>
            </div>

            {/* Relief Points List */}
            {detail.reliefPoints && detail.reliefPoints.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Map size={14} />
                  Danh sách trạm cứu trợ
                </h3>
                <div className="space-y-2">
                  {detail.reliefPoints.map((point) => (
                    <div
                      key={point.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {point.name}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          {point.code}
                        </p>
                      </div>
                      <StatusBadge
                        code={point.statusCode}
                        statusMap={{
                          OPEN: {
                            label: "Hoạt động",
                            cls: "bg-green-100 text-green-700",
                          },
                          CLOSE: {
                            label: "Đóng",
                            cls: "bg-gray-100 text-gray-600",
                          },
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-sm text-gray-600 hover:bg-gray-100"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
