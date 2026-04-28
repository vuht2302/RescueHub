import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  LoaderCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  ackPublicTrackingRelief,
  ackPublicTrackingRescue,
  getPublicMeHistory,
  getPublicTrackingMyReliefRequests,
  getPublicTrackingMyRescues,
  getPublicTrackingRelief,
  getPublicTrackingRescue,
  requestPublicTrackingOtp,
  verifyPublicTrackingOtp,
  type PublicTrackingMyHistoryItem,
  type PublicTrackingHistoryItem,
  type PublicTrackingRescueResponse,
  type PublicTrackingReliefResponse,
} from "../../../shared/services/publicApi";
import { getAuthSession } from "../../auth/services/authStorage";
import { toastError, toastSuccess } from "../../../shared/utils/toast";

const TRACKING_TOKEN_STORAGE_KEY = "rescuehub.public.trackingToken";
const TRACKING_PHONE_STORAGE_KEY = "rescuehub.public.trackingPhone";

const RESCUE_STATUS_MAP: Record<string, string> = {
  NEW: "Mới tiếp nhận",
  VERIFIED: "Đã xác minh",
  ASSESSED: "Đã đánh giá",
  PENDING: "Chờ tiếp nhận",
  ASSIGNED: "Đã phân công",
  DISPATCHED: "Đã điều động",
  EN_ROUTE: "Đang trên đường",
  ARRIVED: "Đã đến hiện trường",
  IN_PROGRESS: "Đang thực hiện",
  RESCUED: "Đã cứu hộ thành công",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  REJECTED: "Từ chối",
  REPORTED: "Đã báo cáo",
};

const RELIEF_STATUS_MAP: Record<string, string> = {
  PENDING: "Chờ xử lý",
  APPROVED: "Đã duyệt",
  IN_PROGRESS: "Đang phân phối",
  DISTRIBUTED: "Đã phân phối",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

const getRescueStatusLabel = (code: string): string => {
  return RESCUE_STATUS_MAP[code] ?? code;
};

const getReliefStatusLabel = (code: string): string => {
  return RELIEF_STATUS_MAP[code] ?? code;
};

const getBestImageUrl = (media?: {
  aiOptimizedUrl?: string;
  thumbnailUrl?: string;
  fileUrl?: string;
}): string | undefined => {
  return media?.aiOptimizedUrl || media?.thumbnailUrl || media?.fileUrl;
};

const getStoredTrackingToken = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(TRACKING_TOKEN_STORAGE_KEY)?.trim() ?? "";
};

const getStoredTrackingPhone = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(TRACKING_PHONE_STORAGE_KEY)?.trim() ?? "";
};

type TrackingListItem = {
  id: string;
  code: string;
  title: string;
  statusCode: string;
  statusName: string;
  createdAt: string;
  imageUrls?: string[];
  media?: Array<{
    id?: string;
    mediaTypeCode?: string;
    fileUrl?: string;
    thumbnailUrl?: string;
    aiOptimizedUrl?: string;
  }>;
};

export const RescueTrack: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trackingCode, setTrackingCode] = useState(
    searchParams.get("code") ?? "",
  );
  const [trackingData, setTrackingData] =
    useState<PublicTrackingRescueResponse | null>(null);
  const [reliefTrackingData, setReliefTrackingData] =
    useState<PublicTrackingReliefResponse | null>(null);
  const [trackingPhone, setTrackingPhone] = useState(getStoredTrackingPhone());
  const [trackingOtp, setTrackingOtp] = useState("");
  const [trackingToken, setTrackingToken] = useState(getStoredTrackingToken());
  const [otpExpiresAt, setOtpExpiresAt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReliefLoading, setIsReliefLoading] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isAcking, setIsAcking] = useState(false);
  const [isReliefAcking, setIsReliefAcking] = useState(false);
  const [reliefAckNote, setReliefAckNote] = useState("");
  const [isHistoryListLoading, setIsHistoryListLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [myRescues, setMyRescues] = useState<TrackingListItem[]>([]);
  const [myReliefs, setMyReliefs] = useState<TrackingListItem[]>([]);
  const [reliefErrorMessage, setReliefErrorMessage] = useState("");
  const [isLoggedInUser, setIsLoggedInUser] = useState(false);
  const [isMeHistoryLoading, setIsMeHistoryLoading] = useState(false);
  const [isRescueAcked, setIsRescueAcked] = useState(false);

  // Image modal state
  const [imageModal, setImageModal] = useState<{
    images: string[];
    currentIndex: number;
  } | null>(null);

  const normalizeTrackingListItem = (
    item: PublicTrackingMyHistoryItem,
    kind: "rescue" | "relief",
  ): TrackingListItem => {
    const code = String(
      item.code ??
        item.trackingCode ??
        item.incidentCode ??
        (item as any).requestCode ??
        "",
    ).trim();

    const fallbackTitle =
      kind === "rescue" ? "Yêu cầu cứu hộ" : "Yêu cầu cứu trợ";

    const statusCode = String(item.status?.code ?? "");
    const statusName = String(item.status?.name ?? "Đang xử lý");

    const createdAt = String(
      item.reportedAt ?? item.createdAt ?? item.updatedAt ?? "",
    );

    return {
      id: String(
        item.id ??
          item.incidentId ??
          item.reliefRequestId ??
          code ??
          `${kind}-${Math.random()}`,
      ),
      code,
      title: String(
        item.title ??
          (kind === "rescue" ? item.description : item.note) ??
          fallbackTitle,
      ),
      statusCode,
      statusName,
      createdAt,
      imageUrls: (item as any).imageUrls,
      media: (item as any).media,
    };
  };

  const loadMyTrackingHistory = async (
    phone: string,
    token: string,
  ): Promise<void> => {
    if (!phone.trim() || !token.trim()) {
      setMyRescues([]);
      setMyReliefs([]);
      return;
    }

    setIsHistoryListLoading(true);
    try {
      const [rescues, reliefs] = await Promise.all([
        getPublicTrackingMyRescues({
          phone,
          page: 1,
          pageSize: 20,
          trackingToken: token,
        }),
        getPublicTrackingMyReliefRequests({
          phone,
          page: 1,
          pageSize: 20,
          trackingToken: token,
        }),
      ]);

      setMyRescues(
        (Array.isArray(rescues.items) ? rescues.items : []).map((item) =>
          normalizeTrackingListItem(item, "rescue"),
        ),
      );

      setMyReliefs(
        (Array.isArray(reliefs.items) ? reliefs.items : []).map((item) =>
          normalizeTrackingListItem(item, "relief"),
        ),
      );
    } catch (error) {
      setMyRescues([]);
      setMyReliefs([]);
      setOtpMessage(
        error instanceof Error
          ? error.message
          : "Khong the tai lich su cua so dien thoai nay",
      );
    } finally {
      setIsHistoryListLoading(false);
    }
  };

  const history = useMemo<PublicTrackingHistoryItem[]>(() => {
    if (!trackingData?.history) {
      return [];
    }

    return [...trackingData.history]
      .filter((item) => item?.statusName)
      .sort(
        (left, right) =>
          new Date(left.time).getTime() - new Date(right.time).getTime(),
      );
  }, [trackingData]);

  const fetchTrackingData = async (code: string) => {
    const normalizedCode = code.trim();
    if (!normalizedCode) {
      setErrorMessage("Vui long nhap ma theo doi");
      setTrackingData(null);
      return;
    }

    if (/^\+?\d{9,15}$/.test(normalizedCode)) {
      setErrorMessage(
        "Ban dang nhap so dien thoai. Hay nhap ma theo doi dang SC-YYYYMMDD-XXX.",
      );
      setTrackingData(null);
      return;
    }

    if (!trackingToken) {
      setErrorMessage("Vui long xac thuc OTP truoc khi tra cuu.");
      setTrackingData(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await getPublicTrackingRescue(
        normalizedCode,
        trackingToken,
      );
      setTrackingData(response);
      setIsRescueAcked(!response.canAckRescue);
      setSearchParams({ code: normalizedCode });
    } catch (error) {
      setTrackingData(null);
      setIsRescueAcked(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Khong the tai du lieu theo doi",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReliefTrackingData = async (requestCode: string) => {
    const normalizedCode = requestCode.trim();
    if (!normalizedCode) {
      setReliefErrorMessage("Vui long nhap ma theo doi cuu tro");
      setReliefTrackingData(null);
      return;
    }

    if (!trackingToken) {
      setReliefErrorMessage("Vui long xac thuc OTP truoc khi tra cuu cuu tro.");
      setReliefTrackingData(null);
      return;
    }

    setIsReliefLoading(true);
    setReliefErrorMessage("");

    try {
      const response = await getPublicTrackingRelief(
        normalizedCode,
        trackingToken,
      );
      setReliefTrackingData(response);
    } catch (error) {
      setReliefTrackingData(null);
      setReliefErrorMessage(
        error instanceof Error
          ? error.message
          : "Khong the tai du lieu cuu tro",
      );
    } finally {
      setIsReliefLoading(false);
    }
  };

  const handleRequestOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPhone = trackingPhone.trim();

    if (!/^\+?\d{9,15}$/.test(normalizedPhone)) {
      setOtpMessage("So dien thoai khong hop le.");
      return;
    }

    setIsRequestingOtp(true);
    setOtpMessage("");

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(TRACKING_PHONE_STORAGE_KEY, normalizedPhone);
      }

      const response = await requestPublicTrackingOtp({
        phone: normalizedPhone,
        purpose: "TRACKING",
      });

      setOtpExpiresAt(response.expiredAt);
      if (response.otpCode) {
        setTrackingOtp(response.otpCode);
      }
      setOtpMessage("Đã gửi OTP. Vui lòng nhập OTP để xác thực.");
    } catch (error) {
      setOtpMessage(
        error instanceof Error ? error.message : "Khong the gui OTP",
      );
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPhone = trackingPhone.trim();
    const normalizedOtp = trackingOtp.trim();

    if (!normalizedPhone || !normalizedOtp) {
      setOtpMessage("Vui lòng nhập đầy đủ số điện thoại và OTP.");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpMessage("");

    try {
      const response = await verifyPublicTrackingOtp({
        phone: normalizedPhone,
        otpCode: normalizedOtp,
        purpose: "TRACKING",
      });

      setTrackingToken(response.trackingToken);
      if (typeof window !== "undefined") {
        localStorage.setItem(
          TRACKING_TOKEN_STORAGE_KEY,
          response.trackingToken,
        );
      }
      await loadMyTrackingHistory(normalizedPhone, response.trackingToken);
      setOtpMessage("Xác thực OTP thành công. Bạn có thể tra cứu mã theo dõi.");
    } catch (error) {
      setTrackingToken("");
      if (typeof window !== "undefined") {
        localStorage.removeItem(TRACKING_TOKEN_STORAGE_KEY);
      }
      setOtpMessage(
        error instanceof Error ? error.message : "Xác thực OTP thất bại",
      );
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleAckRescue = async () => {
    const normalizedCode = trackingCode.trim();
    const normalizedOtp = trackingOtp.trim();

    if (!normalizedCode || !trackingData?.canAckRescue) {
      return;
    }

    if (!trackingToken) {
      setErrorMessage("Vui long xac thuc OTP truoc khi xac nhan da duoc cuu.");
      return;
    }

    if (!normalizedOtp) {
      setErrorMessage("Vui long nhap OTP de xac nhan da duoc cuu.");
      return;
    }

    setIsAcking(true);
    setErrorMessage("");

    try {
      await ackPublicTrackingRescue(
        normalizedCode,
        {
          ackMethodCode: "OTP",
          ackCode: normalizedOtp,
          note: "Nguoi dan xac nhan da an toan",
        },
        trackingToken,
      );

      toastSuccess("Xác nhận đã an toàn thành công.");
      setIsRescueAcked(true);
      await fetchTrackingData(normalizedCode);
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : "Không thể xác nhận cứu hộ",
      );
      setErrorMessage(
        error instanceof Error ? error.message : "Khong the xac nhan cuu ho",
      );
    } finally {
      setIsAcking(false);
    }
  };

  const handleAckRelief = async () => {
    if (!reliefTrackingData?.requestCode || !reliefTrackingData?.canAckRelief) {
      return;
    }

    if (!trackingToken) {
      setReliefErrorMessage(
        "Vui long xac thuc OTP truoc khi xac nhan da nhan cuu tro.",
      );
      return;
    }

    setIsReliefAcking(true);
    setReliefErrorMessage("");

    try {
      await ackPublicTrackingRelief(
        reliefTrackingData.requestCode,
        {
          ackMethodCode: "OTP",
          ackCode: trackingOtp.trim() || "MANUAL",
          note: reliefAckNote || "Nguoi dan xac nhan da nhan cuu tro",
        },
        trackingToken,
      );

      await fetchReliefTrackingData(reliefTrackingData.requestCode);
    } catch (error) {
      setReliefErrorMessage(
        error instanceof Error ? error.message : "Khong the xac nhan cuu tro",
      );
    } finally {
      setIsReliefAcking(false);
    }
  };

  useEffect(() => {
    const codeFromQuery = searchParams.get("code")?.trim();
    if (codeFromQuery) {
      setTrackingCode(codeFromQuery);
      if (trackingToken) {
        void fetchTrackingData(codeFromQuery);
      }
    }

    const phone = trackingPhone.trim() || getStoredTrackingPhone();
    if (trackingToken && phone) {
      void loadMyTrackingHistory(phone, trackingToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingToken]);

  const handleClearTrackingAuth = () => {
    setTrackingToken("");
    setTrackingOtp("");
    if (typeof window !== "undefined") {
      localStorage.removeItem(TRACKING_TOKEN_STORAGE_KEY);
    }
    setOtpMessage("Da xoa xac thuc OTP tracking.");
  };

  // Check if citizen is logged in and load history
  useEffect(() => {
    const authSession = getAuthSession();
    if (authSession?.accessToken) {
      setIsLoggedInUser(true);
      setIsMeHistoryLoading(true);

      getPublicMeHistory(authSession.accessToken)
        .then((data) => {
          // Convert rescues to TrackingListItem
          const rescueItems: TrackingListItem[] = (
            data.rescues?.items ?? []
          ).map((item) => ({
            id: String(
              item.id ??
                item.incidentId ??
                item.trackingCode ??
                item.code ??
                `rescue-${Math.random()}`,
            ),
            code: String(
              item.incidentCode ?? item.trackingCode ?? item.code ?? "",
            ),
            title: String(item.description ?? item.title ?? "Yêu cầu cứu hộ"),
            statusCode: String(item.status?.code ?? ""),
            statusName: String(item.status?.name ?? "Đang xử lý"),
            createdAt: String(
              item.reportedAt ?? item.createdAt ?? item.updatedAt ?? "",
            ),
            imageUrls: item.imageUrls,
            media: item.media,
          }));

          // Convert relief requests to TrackingListItem
          const reliefItems: TrackingListItem[] = (
            data.reliefRequests?.items ?? []
          ).map((item) => ({
            id: String(item.id ?? item.code ?? `relief-${Math.random()}`),
            code: String(item.code ?? ""),
            title: String(item.title ?? "Yêu cầu cứu trợ"),
            statusCode: String(item.status?.code ?? ""),
            statusName: String(item.status?.name ?? "Đang xử lý"),
            createdAt: String(item.requestedAt ?? item.updatedAt ?? ""),
          }));

          setMyRescues(rescueItems);
          setMyReliefs(reliefItems);
        })
        .catch(() => {
          // Fallback to tracking token method if me/history fails
          if (!trackingToken) {
            setMyRescues([]);
            setMyReliefs([]);
          }
        })
        .finally(() => {
          setIsMeHistoryLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 md:p-6 space-y-3">
        <h2 className="text-lg font-bold text-on-surface">
          Xác thực OTP theo dõi
        </h2>

        <form
          onSubmit={handleRequestOtp}
          className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3"
        >
          <input
            value={trackingPhone}
            onChange={(event) => setTrackingPhone(event.target.value)}
            placeholder="Nhập số điện thoại để nhận OTP"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 outline-none text-on-surface"
          />
          <button
            type="submit"
            disabled={isRequestingOtp}
            className="h-12 px-5 rounded-xl bg-primary text-on-primary font-bold disabled:opacity-60"
          >
            {isRequestingOtp ? "Đang gửi OTP..." : "Gửi OTP"}
          </button>
        </form>

        <form
          onSubmit={handleVerifyOtp}
          className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3"
        >
          <input
            value={trackingOtp}
            onChange={(event) => setTrackingOtp(event.target.value)}
            placeholder="Nhập Mã OTP"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 outline-none text-on-surface"
          />
          <button
            type="submit"
            disabled={isVerifyingOtp}
            className="h-12 px-5 rounded-xl bg-surface-container-high text-on-surface font-bold disabled:opacity-60"
          >
            {isVerifyingOtp ? "Đang xác thực ...." : "Xác thực OTP"}
          </button>
        </form>

        {otpExpiresAt ? (
          <p className="text-xs text-on-surface-variant">
            OTP hết hạn lúc: {new Date(otpExpiresAt).toLocaleString("vi-VN")}
          </p>
        ) : null}

        {trackingToken ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-green-700">Đã xác thực thành công.</p>
            <button
              type="button"
              onClick={handleClearTrackingAuth}
              className="text-xs font-semibold text-on-surface-variant hover:underline"
            >
              Xóa xác thực
            </button>
          </div>
        ) : null}

        {otpMessage ? (
          <p className="text-sm text-on-surface-variant">{otpMessage}</p>
        ) : null}
      </section>

      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 md:p-6 space-y-4">
        <h3 className="text-lg font-bold text-on-surface">Lịch sử của bạn</h3>
        {isHistoryListLoading ? (
          <div className="inline-flex items-center gap-2 text-sm text-on-surface-variant">
            <LoaderCircle size={16} className="animate-spin" />
            Đang tải lịch sử...
          </div>
        ) : (
          <div className="space-y-3">
            {myRescues.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                Chưa có lịch sử cứu hộ.
              </p>
            ) : (
              myRescues.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg bg-surface-container-lowest p-3 border border-outline-variant/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-on-surface">
                      {item.title}
                    </p>
                  </div>
                  {item.code ? (
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Mã: {item.code}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs font-medium text-blue-700">
                    {getRescueStatusLabel(item.statusCode) || item.statusName}
                  </p>
                  {item.createdAt ? (
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </p>
                  ) : null}
                  {item.imageUrls && item.imageUrls.length > 0 && (
                    <div className="mt-2 flex gap-2 overflow-x-auto">
                      {item.imageUrls.slice(0, 3).map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setImageModal({
                              images: item.imageUrls!,
                              currentIndex: idx,
                            })
                          }
                          className="flex-shrink-0"
                        >
                          <img
                            src={url}
                            alt={`Hình ảnh ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded-lg border border-outline-variant/20 hover:opacity-80 cursor-pointer"
                            loading="lazy"
                          />
                        </button>
                      ))}
                      {item.imageUrls.length > 3 && (
                        <span className="flex items-center text-xs text-on-surface-variant">
                          +{item.imageUrls.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        {errorMessage ? (
          <p className="text-sm text-error">{errorMessage}</p>
        ) : null}
      </section>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-primary font-bold text-sm tracking-widest uppercase">
            Mã theo dõi: {trackingData?.incidentCode ?? "Chưa có"}
          </span>
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-on-surface mt-2 tracking-tight">
            {trackingData ? "Tiến trình cứu hộ" : "Theo dõi cứu hộ"}
          </h1>
          {trackingData?.latestUpdate ? (
            <p className="text-on-surface-variant mt-2">
              {trackingData.latestUpdate}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-on-surface-variant bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/20">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: trackingData?.status?.color ?? "#3b82f6",
            }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full animate-ping"
              style={{
                backgroundColor: trackingData?.status?.color ?? "#3b82f6",
              }}
            ></div>
          </div>
          <span className="text-sm font-semibold">
            {getRescueStatusLabel(trackingData?.status?.code ?? "")}
          </span>
        </div>
      </div>

      <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 p-8 md:p-12">
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((step, idx) => (
              <div
                key={`${step.statusName}-${step.time}-${idx}`}
                className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-low"
              >
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <p className="font-bold text-on-surface">
                    {getRescueStatusLabel(step.statusCode ?? step.statusName)}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {new Date(step.time).toLocaleString("vi-VN")}
                  </p>
                  {step.note ? (
                    <p className="text-sm text-on-surface mt-1">{step.note}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-on-surface-variant">
            Nhập mã theo dõi để xem tiến trình cứu hộ
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/10 space-y-4">
          <h3 className="text-2xl font-headline font-extrabold text-on-surface">
            Trạng thái hiện tại
          </h3>
          {trackingData ? (
            <>
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="text-xs text-on-surface-variant">Mã sự cố</p>
                <p className="font-bold text-on-surface mt-1">
                  {trackingData.incidentCode}
                </p>
              </div>
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="text-xs text-on-surface-variant">Trạng thái</p>
                <p className="font-bold text-on-surface mt-1">
                  {getRescueStatusLabel(trackingData.status.code)}
                </p>
              </div>
              {trackingData.imageUrls && trackingData.imageUrls.length > 0 && (
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-xs text-on-surface-variant mb-2">
                    Hình ảnh sự cố
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {trackingData.imageUrls.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setImageModal({
                            images: trackingData.imageUrls!,
                            currentIndex: idx,
                          })
                        }
                        className="block rounded-lg overflow-hidden border border-outline-variant/20 hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <img
                          src={url}
                          alt={`Hình ảnh sự cố ${idx + 1}`}
                          className="w-full h-32 object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {trackingData.media && trackingData.media.length > 0 && (
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-xs text-on-surface-variant mb-2">
                    Hình ảnh hiện trường
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {trackingData.media.map((mediaItem, idx) => (
                      <button
                        key={mediaItem.id}
                        type="button"
                        onClick={() => {
                          const urls = trackingData
                            .media!.map((m) => getBestImageUrl(m))
                            .filter(Boolean) as string[];
                          setImageModal({ images: urls, currentIndex: idx });
                        }}
                        className="block rounded-lg overflow-hidden border border-outline-variant/20 hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <img
                          src={getBestImageUrl(mediaItem)}
                          alt="Hình ảnh hiện trường"
                          className="w-full h-32 object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="text-xs text-on-surface-variant">
                  Cứu trợ liên quan
                </p>
                <p className="font-bold text-on-surface mt-1">
                  {trackingData.relatedRelief.needed
                    ? "Có yêu cầu cứu trợ"
                    : "Chưa cần cứu trợ"}
                </p>
              </div>
            </>
          ) : (
            <p className="text-on-surface-variant">
              Chưa có dữ liệu, vui lòng nhập mã theo dõi.
            </p>
          )}
        </div>

        <aside className="space-y-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAckRescue}
            disabled={!trackingData?.canAckRescue || isAcking || isRescueAcked}
            className={`w-full bg-primary text-on-primary p-6 rounded-3xl font-bold flex flex-col items-center gap-2 border border-primary/20 disabled:opacity-60 ${isRescueAcked ? "hidden" : ""}`}
          >
            {isAcking ? (
              <LoaderCircle className="animate-spin" size={24} />
            ) : (
              <ShieldCheck size={30} />
            )}
            <div className="text-center">
              <span className="block text-lg">Tôi đã an toàn</span>
              <span className="text-xs opacity-80 font-medium">
                Gửi xác nhận đã được cứu
              </span>
            </div>
          </motion.button>

          <div className="p-6 bg-error-container text-error rounded-3xl border border-error/20">
            <div className="inline-flex items-center gap-2 font-bold">
              <AlertTriangle size={18} />
              <span>Cập nhật SOS</span>
            </div>
            <p className="text-sm mt-2 opacity-80">
              Nếu tình huống xấu hơn, bạn có thể quay lại trang chủ để gửi SOS
            </p>
          </div>
        </aside>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {imageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setImageModal(null)}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setImageModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X size={24} />
            </button>

            {/* Navigation buttons */}
            {imageModal.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageModal({
                      ...imageModal,
                      currentIndex:
                        (imageModal.currentIndex -
                          1 +
                          imageModal.images.length) %
                        imageModal.images.length,
                    });
                  }}
                  className="absolute left-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageModal({
                      ...imageModal,
                      currentIndex:
                        (imageModal.currentIndex + 1) %
                        imageModal.images.length,
                    });
                  }}
                  className="absolute right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            {/* Image */}
            <motion.img
              key={imageModal.currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={imageModal.images[imageModal.currentIndex]}
              alt={`Hình ảnh ${imageModal.currentIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Image counter */}
            {imageModal.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
                {imageModal.currentIndex + 1} / {imageModal.images.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
