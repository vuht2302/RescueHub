import React, { useEffect, useState, useCallback } from "react";
import {
  Package,
  MapPin,
  User,
  Phone,
  Home,
  Truck,
  CheckCircle,
  Search,
  ClipboardCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
} from "lucide-react";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import {
  getReliefRequests,
  getReliefRequestDetail,
  type ReliefRequestItem,
  type ReliefRequestDetail,
} from "../../rescue-coordinator/services/incidentServices";
import {
  getDistributions,
  getDistribution,
  getReliefIssues,
  type DistributionListItem,
  type Distribution,
  type ReliefIssueListItem,
  type PagedResponse,
} from "../services/warehouseService";
import {
  REQUEST_STATUS,
  ISSUE_STATUS,
  DIST_STATUS,
  StatusBadge,
} from "../constants/statusConfig";
import { ReliefIssueDetailModal } from "../components/ReliefIssueDetailModal";
import { DistributionDetailModal } from "../components/DistributionDetailModal";
import { CreateReliefIssueModal } from "../components/CreateReliefIssueModal";
import { CreateReliefDistributionModal } from "../components/CreateReliefDistributionModal";

export const ReliefDistributionPage: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState<
    "requests" | "issues" | "distributions"
  >("requests");

  // Relief Requests state
  const [reliefRequests, setReliefRequests] = useState<ReliefRequestItem[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const [requestDetail, setRequestDetail] = useState<ReliefRequestDetail | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Relief Issues state
  const [reliefIssues, setReliefIssues] = useState<ReliefIssueListItem[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [viewIssueId, setViewIssueId] = useState<string | null>(null);
  const [issuePage, setIssuePage] = useState(1);
  const [issueTotalPages, setIssueTotalPages] = useState(1);
  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);

  // Distributions state
  const [distributions, setDistributions] = useState<DistributionListItem[]>([]);
  const [isLoadingDist, setIsLoadingDist] = useState(false);
  const [viewDistId, setViewDistId] = useState<string | null>(null);
  const [viewDistDetail, setViewDistDetail] = useState<Distribution | null>(null);
  const [showReliefDistModal, setShowReliefDistModal] = useState(false);
  const [distPage, setDistPage] = useState(1);
  const [distTotalPages, setDistTotalPages] = useState(1);

  // Load Relief Requests
  const loadReliefRequests = useCallback(async () => {
    setIsLoadingRequests(true);
    try {
      const data = await getReliefRequests(getAuthSession()?.accessToken ?? "");
      setReliefRequests(data.items);
    } catch (e) {
      console.error("Error:", e);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  // Load Relief Issues
  const loadReliefIssues = useCallback(async (page = 1) => {
    setIsLoadingIssues(true);
    try {
      const res = await getReliefIssues(getAuthSession()?.accessToken ?? "", {
        page,
        pageSize: 20,
      });
      setReliefIssues(res.items ?? []);
      setIssueTotalPages(res.totalPages ?? 1);
      setIssuePage(page);
    } catch (e) {
      console.error("Error:", e);
    } finally {
      setIsLoadingIssues(false);
    }
  }, []);

  // Load Distributions
  const loadDistributions = useCallback(async (page = 1) => {
    setIsLoadingDist(true);
    try {
      const res = await getDistributions(getAuthSession()?.accessToken ?? "");
      if (Array.isArray(res)) {
        setDistributions(res);
      } else if (res && 'items' in res) {
        setDistributions((res as PagedResponse<DistributionListItem>).items ?? []);
        setDistTotalPages((res as PagedResponse<DistributionListItem>).totalPages ?? 1);
      } else {
        setDistributions([]);
      }
      setDistPage(page);
    } catch (e) {
      console.error("Error loading distributions:", e);
    } finally {
      setIsLoadingDist(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "requests") void loadReliefRequests();
    else if (activeTab === "issues") void loadReliefIssues(issuePage);
    else if (activeTab === "distributions") void loadDistributions(distPage);
  }, [
    activeTab,
    issuePage,
    distPage,
    loadReliefRequests,
    loadReliefIssues,
    loadDistributions,
  ]);

  // Filter relief requests
  const filteredRequests = reliefRequests.filter((r) => {
    const matchSearch =
      r.requestCode.toLowerCase().includes(requestSearch.toLowerCase()) ||
      r.requester.name.toLowerCase().includes(requestSearch.toLowerCase()) ||
      r.requester.phone.includes(requestSearch);
    const matchStatus = !requestStatus || r.status.code === requestStatus;
    return matchSearch && matchStatus;
  });

  // Handle click on request - show modal
  const handleSelectRequest = async (request: ReliefRequestItem) => {
    setSelectedRequestId(request.reliefRequestId);
    try {
      const detail = await getReliefRequestDetail(
        request.reliefRequestId,
        getAuthSession()?.accessToken ?? "",
      );
      setRequestDetail(detail);
    } catch (e) {
      console.error(e);
      setRequestDetail(null);
    }
  };

  // Handle distribution created
  const handleDistributionCreated = (dist: any) => {
    setShowCreateModal(false);
    setSelectedRequestId(null);
    setRequestDetail(null);
    setActiveTab("distributions");
    void loadDistributions();
  };

  // Handle relief distribution created
  const handleReliefDistributionCreated = (dist: { id: string; code: string }) => {
    setShowReliefDistModal(false);
    void loadDistributions();
  };

  // Handle relief issue created
  const handleReliefIssueCreated = (issue: { id: string; code: string }) => {
    setShowCreateIssueModal(false);
    void loadReliefIssues();
    setViewIssueId(issue.id);
  };

  // Format household name helper
  const getHouseholdName = (dist: DistributionListItem) =>
    dist.household?.headName || "—";

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl">
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === "requests" ? "text-blue-950 border-b-2 border-blue-950" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
        >
          <ClipboardCheck size={16} className="inline mr-2" />
          Yêu cầu
        </button>
        <button
          onClick={() => setActiveTab("issues")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === "issues" ? "text-blue-950 border-b-2 border-blue-950" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
        >
          <Truck size={16} className="inline mr-2" />
          Cấp phát
        </button>
        <button
          onClick={() => setActiveTab("distributions")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === "distributions" ? "text-blue-950 border-b-2 border-blue-950" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
        >
          <Package size={16} className="inline mr-2" />
          Phân phối
        </button>
      </div>

      {/* Content - Full width */}
      <div className="flex-1 overflow-hidden bg-gray-50 rounded-b-xl">
        {/* RELIEF REQUESTS */}
        {activeTab === "requests" && (
          <div className="h-full flex flex-col">
            {/* Search */}
            <div className="p-4 bg-white border-b border-gray-100 space-y-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Tìm mã, tên, SĐT..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <select
                value={requestStatus}
                onChange={(e) => setRequestStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="NEW">Mới</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="REJECTED">Từ chối</option>
                <option value="FULFILLED">Đã cứu trợ</option>
              </select>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingRequests ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-800 rounded-full animate-spin" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardCheck size={32} className="text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Không có yêu cầu cứu trợ</p>
                </div>
              ) : (
                filteredRequests.map((req) => (
                  <div
                    key={req.reliefRequestId}
                    onClick={() => void handleSelectRequest(req)}
                    className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition-all hover:bg-blue-50 ${selectedRequestId === req.reliefRequestId ? "bg-blue-50 border-l-4 border-l-blue-800" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold truncate">{req.requestCode}</h3>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                          <User size={10} />
                          {req.requester.name}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${REQUEST_STATUS[req.status.code]?.cls || "bg-gray-100 text-gray-600"}`}>
                        {REQUEST_STATUS[req.status.code]?.label || req.status.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <span><Phone size={10} className="inline mr-1" />{req.requester.phone}</span>
                      <span><Home size={10} className="inline mr-1" />{req.householdCount} hộ</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* RELIEF ISSUES */}
        {activeTab === "issues" && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 bg-white border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 font-semibold">{reliefIssues.length} phiếu cấp phát</span>
                <button
                  onClick={() => setShowCreateIssueModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
                >
                  <Plus size={14} /> Tạo phiếu cấp phát
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingIssues ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-800 rounded-full animate-spin" />
                </div>
              ) : reliefIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Truck size={32} className="text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Chưa có phiếu cấp phát nào</p>
                </div>
              ) : (
                <>
                  {reliefIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => setViewIssueId(issue.id)}
                      className="px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold font-mono text-blue-700">{issue.code}</h3>
                          <p className="text-[11px] text-gray-400">{issue.fromWarehouse?.name} → {issue.reliefPoint?.name || "—"}</p>
                        </div>
                        <StatusBadge code={issue.status?.code ?? ""} statusMap={ISSUE_STATUS} />
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                        <span>{issue.lineCount} dòng</span>
                        <span>•</span>
                        <span>{new Date(issue.createdAt).toLocaleDateString("vi-VN")}</span>
                      </div>
                    </div>
                  ))}
                  {issueTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 py-3 border-t bg-white">
                      <button
                        disabled={issuePage <= 1}
                        onClick={() => void loadReliefIssues(issuePage - 1)}
                        className="px-3 py-1 rounded border text-xs disabled:opacity-40 hover:bg-gray-50"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-xs text-gray-500">Trang {issuePage}/{issueTotalPages}</span>
                      <button
                        disabled={issuePage >= issueTotalPages}
                        onClick={() => void loadReliefIssues(issuePage + 1)}
                        className="px-3 py-1 rounded border text-xs disabled:opacity-40 hover:bg-gray-50"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* DISTRIBUTIONS - Full width */}
        {activeTab === "distributions" && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 bg-white border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 font-semibold">{distributions.length} phiếu phân phối</span>
                <button
                  onClick={() => setShowReliefDistModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  <Plus size={14} /> Tạo phân phối
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingDist ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-800 rounded-full animate-spin" />
                </div>
              ) : distributions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package size={32} className="text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Chưa có phiếu phân phối nào</p>
                </div>
              ) : (
                <>
                  {distributions.map((dist) => (
                    <div
                      key={dist.id}
                      onClick={() => setViewDistId(dist.id)}
                      className="px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold font-mono text-blue-700">{dist.code}</h3>
                          <p className="text-[11px] text-gray-400">{getHouseholdName(dist)}</p>
                        </div>
                        <StatusBadge code={dist.status?.code ?? ""} statusMap={DIST_STATUS} />
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                        <span><MapPin size={10} className="inline" /> {dist.reliefPoint?.name || "—"}</span>
                        <span>•</span>
                        <span>{dist.lineCount} dòng</span>
                      </div>
                    </div>
                  ))}
                  {distTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 py-3 border-t bg-white">
                      <button
                        disabled={distPage <= 1}
                        onClick={() => void loadDistributions(distPage - 1)}
                        className="px-3 py-1 rounded border text-xs disabled:opacity-40 hover:bg-gray-50"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-xs text-gray-500">Trang {distPage}/{distTotalPages}</span>
                      <button
                        disabled={distPage >= distTotalPages}
                        onClick={() => void loadDistributions(distPage + 1)}
                        className="px-3 py-1 rounded border text-xs disabled:opacity-40 hover:bg-gray-50"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {requestDetail && (
        <ReliefRequestDetailModal
          detail={requestDetail}
          onClose={() => { setRequestDetail(null); setSelectedRequestId(null); }}
          onCreateDistribution={() => {
            setShowCreateModal(true);
          }}
        />
      )}
      {showCreateModal && requestDetail && (
        <CreateReliefDistributionModal
          reliefRequest={requestDetail}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleDistributionCreated}
        />
      )}
      {viewIssueId && (
        <ReliefIssueDetailModal
          issueId={viewIssueId}
          onClose={() => setViewIssueId(null)}
        />
      )}
      {showCreateIssueModal && (
        <CreateReliefIssueModal
          onClose={() => setShowCreateIssueModal(false)}
          onSuccess={handleReliefIssueCreated}
        />
      )}
      {viewDistId && (
        <DistributionDetailModal
          distId={viewDistId}
          onClose={() => { setViewDistId(null); setViewDistDetail(null); }}
          onAckSuccess={() => {
            void loadDistributions();
          }}
        />
      )}
      {showReliefDistModal && (
        <CreateReliefDistributionModal
          onClose={() => setShowReliefDistModal(false)}
          onSuccess={handleReliefDistributionCreated}
        />
      )}
    </div>
  );
};

// Relief Request Detail Modal
interface ReliefRequestDetailModalProps {
  detail: ReliefRequestDetail;
  onClose: () => void;
  onCreateDistribution: () => void;
}

function ReliefRequestDetailModal({ detail, onClose, onCreateDistribution }: ReliefRequestDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-start justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-gray-900">{detail.requestCode}</h2>
              <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold bg-green-100 text-green-700">
                <CheckCircle size={10} />
                {REQUEST_STATUS[detail.status?.code || ""]?.label || "Đã duyệt"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Nguồn: {detail.sourceTypeCode}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* Người yêu cầu */}
            <section>
              <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3 flex items-center gap-1.5">
                <User size={12} /> Người yêu cầu
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Họ tên</span>
                  <span className="text-sm font-bold">{detail.requester.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">SĐT</span>
                  <span className="text-sm font-bold text-blue-600">{detail.requester.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Số hộ</span>
                  <span className="text-sm font-bold">{detail.householdCount}</span>
                </div>
              </div>
            </section>

            {/* Địa chỉ */}
            <section>
              <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3 flex items-center gap-1.5">
                <MapPin size={12} /> Địa chỉ
              </h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-semibold">{detail.addressText}</p>
              </div>
            </section>

            {/* Chiến dịch */}
            {detail.campaign && (
              <section>
                <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3 flex items-center gap-1.5">
                  <FileText size={12} /> Chiến dịch
                </h3>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm font-bold text-blue-700">{detail.campaign.name}</p>
                  <p className="text-xs text-blue-500 font-mono">{detail.campaign.code}</p>
                </div>
              </section>
            )}

            {/* Vật phẩm */}
            <section>
              <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3 flex items-center gap-1.5">
                <Package size={12} /> Vật phẩm được duyệt
              </h3>
              <div className="bg-gray-50 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left font-bold text-gray-500">Vật phẩm</th>
                      <th className="px-3 py-2 text-center font-bold text-gray-500">SL yêu cầu</th>
                      <th className="px-3 py-2 text-center font-bold text-gray-500">SL duyệt</th>
                      <th className="px-3 py-2 text-center font-bold text-gray-500">ĐV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.requestedItems.map((item) => (
                      <tr key={item.reliefRequestItemId} className="border-t border-gray-100">
                        <td className="px-4 py-2.5 font-semibold">{item.supportTypeName}</td>
                        <td className="px-3 py-2.5 text-center text-gray-600">{item.requestedQty}</td>
                        <td className="px-3 py-2.5 text-center text-green-700 font-bold">{item.defaultApprovedQty || item.requestedQty}</td>
                        <td className="px-3 py-2.5 text-center text-gray-500">{item.unitCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-sm text-gray-600 hover:bg-gray-100"
            >
              Đóng
            </button>
            <button
              onClick={onCreateDistribution}
              className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm bg-green-600 hover:bg-green-700"
            >
              Tạo phân phối
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
