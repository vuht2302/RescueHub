import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  CalendarClock,
  Eye,
  History,
  LoaderCircle,
  RefreshCw,
  X,
} from "lucide-react";
import {
  ackPublicTrackingRelief,
  getPublicMeHistory,
  getPublicTrackingMyReliefRequests,
  getPublicTrackingMyRescues,
  type PublicMeHistoryReliefItem,
  type PublicMeHistoryRescueItem,
  type PublicTrackingMyHistoryItem,
} from "../../../shared/services/publicApi";
import { getAuthSession } from "../../auth/services/authStorage";
import { motion } from "motion/react";

const TRACKING_TOKEN_STORAGE_KEY = "rescuehub.public.trackingToken";
const TRACKING_PHONE_STORAGE_KEY = "rescuehub.public.trackingPhone";
const LIST_PAGE_SIZE = 5;

type RescueHistoryItem = {
  id: string;
  trackingCode: string;
  incidentCode: string;
  incidentTypeCode: string;
  priorityName: string;
  description: string;
  locationText: string;
  landmark: string;
  reportedAt: string;
  updatedAt: string;
  statusCode: string;
  statusName: string;
};

type ReliefSupportItem = {
  supportTypeCode: string;
  supportTypeName: string;
  requestedQty: number;
  approvedQty: number;
  unitCode: string;
};

type ReliefHistoryItem = {
  id: string;
  requestCode: string;
  note: string;
  description: string;
  householdCount: number;
  requestedAt: string;
  updatedAt: string;
  statusCode: string;
  statusName: string;
  items: ReliefSupportItem[];
};

type CitizenStatus = {
  status: "pending" | "verified" | "completed";
};

type DetailModalState =
  | { kind: "rescue"; item: RescueHistoryItem }
  | { kind: "relief"; item: ReliefHistoryItem }
  | null;

type HistoryFilter = "all" | "rescue" | "relief";

type UnifiedHistoryRow = {
  id: string;
  kind: "rescue" | "relief";
  code: string;
  title: string;
  statusCode: string;
  statusName: string;
  time: string;
  detail: DetailModalState;
};

const getStatusFromRaw = (raw: string): CitizenStatus["status"] => {
  const normalized = raw.trim().toLowerCase();
  if (normalized.includes("complete") || normalized.includes("done")) {
    return "completed";
  }
  if (normalized.includes("verify") || normalized.includes("approved")) {
    return "verified";
  }

  return "pending";
};

const STATUS_LABEL_MAP: Record<string, string> = {
  NEW: "Chờ xử lý",
  IN_PROGRESS: "Đang xử lý",
  APPROVED: "Đã xác minh",
  VERIFIED: "Đã xác minh",
  COMPLETED: "Hoàn tất",
  DONE: "Hoàn tất",
  RESOLVED: "Đã xử lý",
  REJECTED: "Từ chối",
  CANCELLED: "Đã hủy",
};

const INCIDENT_TYPE_LABEL_MAP: Record<string, string> = {
  FLOOD: "Lũ lụt",
  FIRE: "Hỏa hoạn",
  LANDSLIDE: "Sạt lở",
  STORM: "Bão",
  EARTHQUAKE: "Động đất",
  OTHER: "Khác",
};

const PRIORITY_LABEL_MAP: Record<string, string> = {
  CRITICAL: "Khẩn cấp",
  HIGH: "Cao",
  MEDIUM: "Trung bình",
  LOW: "Thấp",
};

export const CitizenHistoryPage: React.FC = () => {
  const location = useLocation();
  const [rescues, setRescues] = useState<RescueHistoryItem[]>([]);
  const [reliefs, setReliefs] = useState<ReliefHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailModal, setDetailModal] = useState<DetailModalState>(null);
  const [isReliefAcking, setIsReliefAcking] = useState(false);
  const [reliefAckNote, setReliefAckNote] = useState("");
  const [reliefAckError, setReliefAckError] = useState("");
  const [reliefAckSuccess, setReliefAckSuccess] = useState(false);
  const [reliefDetail, setReliefDetail] = useState<any>(null);

  const normalizeLegacyRescueHistoryItem = (
    item: PublicTrackingMyHistoryItem,
  ): RescueHistoryItem => {
    const trackingCode = String(
      item.code ??
        (item as any).trackingCode ??
        (item as any).incidentCode ??
        "",
    ).trim();

    const statusCode = String(item.statusCode ?? "IN_PROGRESS");
    const statusName = String(item.statusName ?? statusCode ?? "IN_PROGRESS");

    return {
      id: String(item.id ?? trackingCode ?? `rescue-${Math.random()}`),
      trackingCode,
      incidentCode: trackingCode,
      incidentTypeCode: String((item as any).incidentTypeCode ?? "UNKNOWN"),
      priorityName: String((item as any).priority?.name ?? "UNKNOWN"),
      description: String(item.description ?? "Không có mô tả."),
      locationText: String(item.addressText ?? "Chưa có địa chỉ"),
      landmark: String((item as any).landmark ?? ""),
      reportedAt: String(item.createdAt ?? item.updatedAt ?? ""),
      updatedAt: String(item.updatedAt ?? item.createdAt ?? ""),
      statusCode,
      statusName,
    };
  };

  const normalizeLegacyReliefHistoryItem = (
    item: PublicTrackingMyHistoryItem,
  ): ReliefHistoryItem => {
    const requestCode = String(
      item.code ??
        (item as any).requestCode ??
        (item as any).trackingCode ??
        "",
    ).trim();

    const statusCode = String(item.statusCode ?? "NEW");
    const statusName = String(item.statusName ?? statusCode ?? "NEW");

    return {
      id: String(item.id ?? requestCode ?? `relief-${Math.random()}`),
      requestCode,
      note: String(item.description ?? "Không có mô tả."),
      description: String(item.description ?? "Không có mô tả."),
      householdCount: Number((item as any).householdCount ?? 1),
      requestedAt: String(item.createdAt ?? item.updatedAt ?? ""),
      updatedAt: String(item.updatedAt ?? item.createdAt ?? ""),
      statusCode,
      statusName,
      items: [],
    };
  };

  const normalizeMeHistoryRescueItem = (
    item: PublicMeHistoryRescueItem,
  ): RescueHistoryItem => {
    const trackingCode = String(
      item.trackingCode ?? item.incidentCode ?? "",
    ).trim();

    const statusCode = String(item.status?.code ?? "IN_PROGRESS");
    const statusName = String(item.status?.name ?? statusCode ?? "IN_PROGRESS");

    const rawPriorityName = String((item as any).priority?.name ?? "UNKNOWN");

    return {
      id: String(item.incidentId ?? trackingCode ?? `rescue-${Math.random()}`),
      trackingCode,
      incidentCode: String(item.incidentCode ?? trackingCode),
      incidentTypeCode: String(item.incidentTypeCode ?? "UNKNOWN"),
      priorityName: rawPriorityName,
      description: String(item.description ?? "Không có mô tả."),
      locationText: String(item.location?.addressText ?? "Chưa có địa chỉ"),
      landmark: String(item.location?.landmark ?? ""),
      reportedAt: String(
        item.reportedAt ?? item.updatedAt ?? new Date().toISOString(),
      ),
      updatedAt: String(
        item.updatedAt ?? item.reportedAt ?? new Date().toISOString(),
      ),
      statusCode,
      statusName,
    };
  };

  const normalizeMeHistoryReliefItem = (
    item: PublicMeHistoryReliefItem,
  ): ReliefHistoryItem => {
    const requestCode = String(item.requestCode ?? "").trim();

    const statusCode = String(item.status?.code ?? "NEW");
    const statusName = String(item.status?.name ?? statusCode ?? "NEW");

    const rawItems = Array.isArray((item as any).items)
      ? ((item as any).items as Array<any>)
      : [];

    const supportItems: ReliefSupportItem[] = rawItems.map((entry) => ({
      supportTypeCode: String(entry?.supportTypeCode ?? ""),
      supportTypeName: String(entry?.supportTypeName ?? ""),
      requestedQty: Number(entry?.requestedQty ?? 0),
      approvedQty: Number(entry?.approvedQty ?? 0),
      unitCode: String(entry?.unitCode ?? ""),
    }));

    return {
      id: String(
        item.reliefRequestId ?? requestCode ?? `relief-${Math.random()}`,
      ),
      requestCode,
      note: String(item.note ?? ""),
      description: String(
        item.note ?? (item as any).description ?? "Không có mô tả.",
      ),
      householdCount: Number(item.householdCount ?? 1),
      requestedAt: String(
        item.requestedAt ?? item.updatedAt ?? new Date().toISOString(),
      ),
      updatedAt: String(
        item.updatedAt ?? item.requestedAt ?? new Date().toISOString(),
      ),
      statusCode,
      statusName,
      items: supportItems,
    };
  };

  useEffect(() => {
    const authSession = getAuthSession();
    const accessToken = authSession?.accessToken?.trim() || "";
    const phone =
      authSession?.user.phone?.trim() ||
      (typeof window !== "undefined"
        ? localStorage.getItem(TRACKING_PHONE_STORAGE_KEY)?.trim()
        : "") ||
      "";
    const trackingToken =
      (typeof window !== "undefined"
        ? localStorage.getItem(TRACKING_TOKEN_STORAGE_KEY)?.trim()
        : "") || "";

    if (!accessToken && !phone) {
      setRescues([]);
      setReliefs([]);
      return;
    }

    const loadHistory = async () => {
      try {
        setIsHistoryLoading(true);
        if (accessToken) {
          const meHistory = await getPublicMeHistory(accessToken);
          const rescueItems: RescueHistoryItem[] = Array.isArray(
            meHistory.rescues?.items,
          )
            ? meHistory.rescues.items.map((item) =>
                normalizeMeHistoryRescueItem(item),
              )
            : [];

          const reliefItems: ReliefHistoryItem[] = Array.isArray(
            meHistory.reliefRequests?.items,
          )
            ? meHistory.reliefRequests.items.map((item) =>
                normalizeMeHistoryReliefItem(item),
              )
            : [];

          setRescues(
            rescueItems.sort(
              (a, b) =>
                new Date(b.reportedAt || b.updatedAt).getTime() -
                new Date(a.reportedAt || a.updatedAt).getTime(),
            ),
          );
          setReliefs(
            reliefItems.sort(
              (a, b) =>
                new Date(b.requestedAt || b.updatedAt).getTime() -
                new Date(a.requestedAt || a.updatedAt).getTime(),
            ),
          );

          setCurrentPage(1);
          return;
        }

        const [rescues, reliefs] = await Promise.all([
          getPublicTrackingMyRescues({
            phone,
            page: 1,
            pageSize: 20,
            trackingToken,
          }),
          getPublicTrackingMyReliefRequests({
            phone,
            page: 1,
            pageSize: 20,
            trackingToken,
          }),
        ]);

        const rescueItems: RescueHistoryItem[] = Array.isArray(rescues.items)
          ? rescues.items.map((item) => normalizeLegacyRescueHistoryItem(item))
          : [];

        const reliefItems: ReliefHistoryItem[] = Array.isArray(reliefs.items)
          ? reliefs.items.map((item) => normalizeLegacyReliefHistoryItem(item))
          : [];

        setRescues(
          rescueItems.sort(
            (a, b) =>
              new Date(b.reportedAt || b.updatedAt).getTime() -
              new Date(a.reportedAt || a.updatedAt).getTime(),
          ),
        );
        setReliefs(
          reliefItems.sort(
            (a, b) =>
              new Date(b.requestedAt || b.updatedAt).getTime() -
              new Date(a.requestedAt || a.updatedAt).getTime(),
          ),
        );

        setCurrentPage(1);
      } catch {
        setRescues([]);
        setReliefs([]);
      } finally {
        setIsHistoryLoading(false);
      }
    };

    void loadHistory();
  }, [refreshTick]);

  const loadReliefDetail = async (requestCode: string) => {
    const authSession = getAuthSession();
    const accessToken = authSession?.accessToken?.trim() || "";
    const trackingToken =
      (typeof window !== "undefined"
        ? localStorage.getItem(TRACKING_TOKEN_STORAGE_KEY)?.trim()
        : "") || "";

    const token = accessToken || trackingToken;
    if (!token) return;

    try {
      const { getPublicTrackingRelief } = await import(
        "../../../shared/services/publicApi"
      );
      const detail = await getPublicTrackingRelief(requestCode, token);
      setReliefDetail(detail);
      return detail;
    } catch {
      setReliefDetail(null);
      return null;
    }
  };

  const handleAckRelief = async () => {
    if (!reliefDetail?.requestCode || !reliefDetail?.canAckRelief) return;

    const authSession = getAuthSession();
    const accessToken = authSession?.accessToken?.trim() || "";
    const trackingToken =
      (typeof window !== "undefined"
        ? localStorage.getItem(TRACKING_TOKEN_STORAGE_KEY)?.trim()
        : "") || "";

    const token = accessToken || trackingToken;
    if (!token) {
      setReliefAckError("Vui long dang nhap de xac nhan.");
      return;
    }

    setIsReliefAcking(true);
    setReliefAckError("");

    try {
      await ackPublicTrackingRelief(reliefDetail.requestCode, {
        ackMethodCode: "MANUAL",
        ackCode: "CITIZEN_APP",
        note: reliefAckNote || "Nguoi dan xac nhan da nhan cuu tro",
      }, token);

      setReliefAckSuccess(true);
      setReliefAckNote("");
      await loadReliefDetail(reliefDetail.requestCode);
      setRefreshTick((prev) => prev + 1);
    } catch (error) {
      setReliefAckError(
        error instanceof Error ? error.message : "Khong the xac nhan cuu tro",
      );
    } finally {
      setIsReliefAcking(false);
    }
  };

  const openReliefDetail = async (item: ReliefHistoryItem) => {
    setDetailModal({ kind: "relief", item });
    setReliefAckNote("");
    setReliefAckError("");
    setReliefAckSuccess(false);
    setReliefDetail(null);
    await loadReliefDetail(item.requestCode);
  };

  const formatDateTime = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [],
  );

  const statusClassMap: Record<CitizenStatus["status"], string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    verified: "bg-cyan-50 text-cyan-700 border-cyan-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const statusLabelMap: Record<CitizenStatus["status"], string> = {
    pending: "Chờ xử lý",
    verified: "Đã xác minh",
    completed: "Hoàn tất",
  };

  const allHistoryRows = useMemo<UnifiedHistoryRow[]>(() => {
    const rescueRows = rescues.map((item) => ({
      id: `rescue-${item.id}`,
      kind: "rescue" as const,
      code: item.incidentCode || item.trackingCode,
      title: "Yêu cầu cứu hộ",
      statusCode: item.statusCode,
      statusName: item.statusName,
      time: item.reportedAt || item.updatedAt,
      detail: { kind: "rescue", item } as DetailModalState,
    }));

    const reliefRows = reliefs.map((item) => ({
      id: `relief-${item.id}`,
      kind: "relief" as const,
      code: item.requestCode,
      title: "Yêu cầu cứu trợ",
      statusCode: item.statusCode,
      statusName: item.statusName,
      time: item.requestedAt || item.updatedAt,
      detail: { kind: "relief", item } as DetailModalState,
    }));

    return [...rescueRows, ...reliefRows].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );
  }, [rescues, reliefs]);

  const filteredHistoryRows = useMemo(() => {
    if (historyFilter === "all") {
      return allHistoryRows;
    }

    return allHistoryRows.filter((item) => item.kind === historyFilter);
  }, [allHistoryRows, historyFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredHistoryRows.length / LIST_PAGE_SIZE),
  );

  const pagedHistoryRows = useMemo(() => {
    const start = (currentPage - 1) * LIST_PAGE_SIZE;
    return filteredHistoryRows.slice(start, start + LIST_PAGE_SIZE);
  }, [currentPage, filteredHistoryRows]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getStatusClass = (statusCode: string, statusName: string): string => {
    const status = getStatusFromRaw(statusCode || statusName);
    return statusClassMap[status];
  };

  const getStatusLabel = (statusCode: string, statusName: string): string => {
    const normalizedCode = String(statusCode || statusName || "")
      .trim()
      .toUpperCase();
    if (normalizedCode && STATUS_LABEL_MAP[normalizedCode]) {
      return STATUS_LABEL_MAP[normalizedCode];
    }

    const normalizedName = String(statusName || statusCode || "").trim();
    if (normalizedName) {
      return normalizedName;
    }

    const status = getStatusFromRaw(statusCode || statusName);
    return statusLabelMap[status];
  };

  const getIncidentTypeLabel = (code: string): string => {
    const normalized = String(code || "")
      .trim()
      .toUpperCase();
    return INCIDENT_TYPE_LABEL_MAP[normalized] || code || "-";
  };

  const getPriorityLabel = (name: string): string => {
    const normalized = String(name || "")
      .trim()
      .toUpperCase();
    return PRIORITY_LABEL_MAP[normalized] || name || "-";
  };

  useEffect(() => {
    if (isHistoryLoading) {
      return;
    }

    const hash = location.hash?.trim();
    if (hash === "#history-rescue") {
      setHistoryFilter("rescue");
      setCurrentPage(1);
      return;
    }

    if (hash === "#history-relief") {
      setHistoryFilter("relief");
      setCurrentPage(1);
      return;
    }

    if (hash) {
      setHistoryFilter("all");
      setCurrentPage(1);
    }
  }, [location.hash, isHistoryLoading, rescues.length, reliefs.length]);

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    totalItems: number,
    onChange: (nextPage: number) => void,
  ) => {
    if (totalItems === 0) {
      return null;
    }

    return (
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-600">
        <p>
          Tổng: <strong>{totalItems}</strong> bản ghi
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 disabled:opacity-50"
          >
            Trước
          </button>
          <span>
            Trang {currentPage}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <History size={18} className="text-blue-700" />
          Lịch sử hỗ trợ của bạn
        </h2>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
            <CalendarClock size={14} />
            Đồng bộ theo tài khoản đăng nhập
          </span>
          <button
            type="button"
            onClick={() => setRefreshTick((current) => current + 1)}
            disabled={isHistoryLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={13}
              className={isHistoryLoading ? "animate-spin" : ""}
            />
            Làm mới
          </button>
        </div>
      </div>

      <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => {
            setHistoryFilter("all");
            setCurrentPage(1);
          }}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
            historyFilter === "all"
              ? "bg-white text-blue-900 shadow-sm"
              : "text-slate-600"
          }`}
        >
          Tất cả
        </button>
        <button
          type="button"
          onClick={() => {
            setHistoryFilter("rescue");
            setCurrentPage(1);
          }}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
            historyFilter === "rescue"
              ? "bg-white text-blue-900 shadow-sm"
              : "text-slate-600"
          }`}
        >
          Cứu hộ
        </button>
        <button
          type="button"
          onClick={() => {
            setHistoryFilter("relief");
            setCurrentPage(1);
          }}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
            historyFilter === "relief"
              ? "bg-white text-blue-900 shadow-sm"
              : "text-slate-600"
          }`}
        >
          Cứu trợ
        </button>
      </div>

      {isHistoryLoading ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <LoaderCircle size={16} className="animate-spin" />
          Đang tải lịch sử...
        </div>
      ) : filteredHistoryRows.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Không có dữ liệu theo bộ lọc đã chọn.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="w-20 px-3 py-2 text-left">Loại</th>
                  <th className="w-52 px-3 py-2 text-left">Mã</th>
                  <th className="px-3 py-2 text-left">Nội dung</th>
                  <th className="w-36 px-3 py-2 text-left">Trạng thái</th>
                  <th className="w-40 px-3 py-2 text-left">Thời gian</th>
                  <th className="w-28 px-3 py-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagedHistoryRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-slate-200 align-top"
                  >
                    <td className="px-3 py-2 font-semibold text-slate-800">
                      {row.kind === "rescue" ? "Cứu hộ" : "Cứu trợ"}
                    </td>
                    <td className="break-words px-3 py-2 text-slate-700">
                      {row.code || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      <p className="font-medium text-slate-900">{row.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Xem mô tả trong mục Chi tiết
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusClass(row.statusCode, row.statusName)}`}
                      >
                        {getStatusLabel(row.statusCode, row.statusName)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-600">
                      {formatDateTime.format(new Date(row.time))}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (row.kind === "relief") {
                            void openReliefDetail(row.detail.item);
                          } else {
                            setDetailModal(row.detail);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-950 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-900"
                      >
                        <Eye size={12} />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 px-3 py-2">
            {renderPagination(
              currentPage,
              totalPages,
              filteredHistoryRows.length,
              setCurrentPage,
            )}
          </div>
        </div>
      )}

      {detailModal ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {detailModal.kind === "rescue"
                  ? "Chi tiết yêu cầu cứu hộ"
                  : "Chi tiết yêu cầu cứu trợ"}
              </h3>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {detailModal.kind === "rescue" ? (
              <div className="space-y-3 px-5 py-4 text-sm text-slate-700">
                <p>
                  <strong>Mã cứu hộ:</strong>{" "}
                  {detailModal.item.incidentCode ||
                    detailModal.item.trackingCode}
                </p>
                <p>
                  <strong>Mã theo dõi:</strong>{" "}
                  {detailModal.item.trackingCode || "-"}
                </p>
                <p>
                  <strong>Mức ưu tiên:</strong>{" "}
                  {getPriorityLabel(detailModal.item.priorityName)}
                </p>
                <p>
                  <strong>Loại sự cố:</strong>{" "}
                  {getIncidentTypeLabel(detailModal.item.incidentTypeCode)}
                </p>
                <p>
                  <strong>Trạng thái:</strong>{" "}
                  {getStatusLabel(
                    detailModal.item.statusCode,
                    detailModal.item.statusName,
                  )}
                </p>
                <p>
                  <strong>Địa chỉ:</strong>{" "}
                  {detailModal.item.locationText || "-"}
                </p>
                <p>
                  <strong>Mốc nhận diện:</strong>{" "}
                  {detailModal.item.landmark || "-"}
                </p>
                <p>
                  <strong>Thời gian báo:</strong>{" "}
                  {formatDateTime.format(
                    new Date(
                      detailModal.item.reportedAt || detailModal.item.updatedAt,
                    ),
                  )}
                </p>
                <div>
                  <p className="font-semibold">Mô tả:</p>
                  <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3">
                    {detailModal.item.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 px-5 py-4 text-sm text-slate-700">
                <p>
                  <strong>Mã yêu cầu:</strong>{" "}
                  {detailModal.item.requestCode || "-"}
                </p>
                <p>
                  <strong>Trạng thái:</strong>{" "}
                  {getStatusLabel(
                    detailModal.item.statusCode,
                    detailModal.item.statusName,
                  )}
                </p>
                <p>
                  <strong>Số hộ dân:</strong> {detailModal.item.householdCount}
                </p>
                <p>
                  <strong>Thời gian yêu cầu:</strong>{" "}
                  {formatDateTime.format(
                    new Date(detailModal.item.requestedAt),
                  )}
                </p>
                <div>
                  <p className="font-semibold">Mô tả:</p>
                  <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3">
                    {detailModal.item.description ||
                      detailModal.item.note ||
                      "Không có"}
                  </p>
                </div>

                <div>
                  <p className="font-semibold">Danh sách vật phẩm:</p>
                  {detailModal.item.items.length === 0 ? (
                    <p className="mt-1 rounded-lg bg-slate-50 p-3 text-slate-600">
                      Không có vật phẩm.
                    </p>
                  ) : (
                    <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                          <tr>
                            <th className="px-3 py-2 text-left">Mã</th>
                            <th className="px-3 py-2 text-left">
                              Tên vật phẩm
                            </th>
                            <th className="px-3 py-2 text-right">SL yêu cầu</th>
                            <th className="px-3 py-2 text-right">SL duyệt</th>
                            <th className="px-3 py-2 text-left">Đơn vị</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailModal.item.items.map((entry, index) => (
                            <tr
                              key={`${entry.supportTypeCode}-${index}`}
                              className="border-t border-slate-200"
                            >
                              <td className="px-3 py-2">
                                {entry.supportTypeCode || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {entry.supportTypeName || "-"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {entry.requestedQty}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {entry.approvedQty}
                              </td>
                              <td className="px-3 py-2">
                                {entry.unitCode || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Phan phoi */}
                {reliefDetail?.distributions && reliefDetail.distributions.length > 0 && (
                  <div>
                    <p className="font-semibold">Lịch sử phân phối:</p>
                    <div className="mt-2 space-y-2">
                      {reliefDetail.distributions.map((dist: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center rounded-lg bg-slate-50 p-2"
                        >
                          <span className="text-sm">{dist.distribution_code}</span>
                          <span className="text-xs text-slate-600">
                            {dist.distributed_at
                              ? new Date(dist.distributed_at).toLocaleString("vi-VN")
                              : "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Xac nhan da nhan cuu tro */}
                {(() => {
                  const hasAcked = reliefDetail?.distributions?.some(
                    (d: any) => d.ack_method_code
                  );
                  const canAck = !hasAcked;

                  if (reliefAckSuccess) {
                    return (
                      <div className="mt-4 rounded-xl bg-green-100 p-4 text-center">
                        <p className="font-semibold text-green-800">Đã xác nhận nhận cứu trợ</p>
                      </div>
                    );
                  }

                  if (!canAck) {
                    return (
                      <div className="mt-4 rounded-xl bg-green-100 p-4 text-center">
                        <p className="font-semibold text-green-800">Đã xác nhận nhận cứu trợ</p>
                      </div>
                    );
                  }

                  return (
                    <div className="mt-4 rounded-xl border-2 border-green-500 bg-green-50 p-4 space-y-3">
                      <p className="font-semibold text-green-800">Xác nhận đã nhận cứu trợ</p>
                      <textarea
                        value={reliefAckNote}
                        onChange={(e) => setReliefAckNote(e.target.value)}
                        placeholder="Ghi chú (tùy chọn): ví dụ: Đã nhận đầy đủ, Thiếu 1 thùng mì..."
                        className="w-full rounded-lg border border-green-300 bg-white p-2 text-sm outline-none"
                        rows={2}
                      />
                      {reliefAckError && (
                        <p className="text-sm text-red-600">{reliefAckError}</p>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleAckRelief}
                        disabled={isReliefAcking}
                        className="w-full rounded-lg bg-green-600 py-2 font-bold text-white disabled:opacity-60"
                      >
                        {isReliefAcking ? "Đang xử lý..." : "Xác nhận đã nhận cứu trợ"}
                      </motion.button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
};
