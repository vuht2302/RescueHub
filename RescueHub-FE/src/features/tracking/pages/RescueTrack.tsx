import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  LoaderCircle,
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

const TRACKING_TOKEN_STORAGE_KEY = "rescuehub.public.trackingToken";
const TRACKING_PHONE_STORAGE_KEY = "rescuehub.public.trackingPhone";

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
  statusName: string;
  createdAt: string;
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

  const normalizeTrackingListItem = (
    item: PublicTrackingMyHistoryItem,
    kind: "rescue" | "relief",
  ): TrackingListItem => {
    const code = String(
      item.code ??
        (item as any).trackingCode ??
        (item as any).incidentCode ??
        (item as any).requestCode ??
        "",
    ).trim();

    const fallbackTitle =
      kind === "rescue" ? "Yêu cầu cứu hộ" : "Yêu cầu cứu trợ";

    return {
      id: String(item.id ?? code ?? `${kind}-${Math.random()}`),
      code,
      title: String(item.title ?? fallbackTitle),
      statusName: String(item.statusName ?? "Đang xử lý"),
      createdAt: String(item.createdAt ?? item.updatedAt ?? ""),
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
      setSearchParams({ code: normalizedCode });
    } catch (error) {
      setTrackingData(null);
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
      setOtpMessage("Vui long nhap day du so dien thoai va OTP.");
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

      await fetchTrackingData(normalizedCode);
    } catch (error) {
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
      setReliefErrorMessage("Vui long xac thuc OTP truoc khi xac nhan da nhan cuu tro.");
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
          const rescueItems: TrackingListItem[] = (data.rescues?.items ?? []).map((item) => ({
            id: String(item.id ?? item.code ?? `rescue-${Math.random()}`),
            code: String(item.code ?? ""),
            title: String(item.title ?? "Yêu cầu cứu hộ"),
            statusName: String(item.statusName ?? "Đang xử lý"),
            createdAt: String(item.createdAt ?? item.updatedAt ?? ""),
          }));

          // Convert relief requests to TrackingListItem
          const reliefItems: TrackingListItem[] = (data.reliefRequests?.items ?? []).map((item) => ({
            id: String(item.id ?? item.code ?? `relief-${Math.random()}`),
            code: String(item.code ?? ""),
            title: String(item.title ?? "Yêu cầu cứu trợ"),
            statusName: String(item.statusName ?? "Đang xử lý"),
            createdAt: String(item.createdAt ?? item.updatedAt ?? ""),
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
            placeholder="Nhap ma OTP"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 outline-none text-on-surface"
          />
          <button
            type="submit"
            disabled={isVerifyingOtp}
            className="h-12 px-5 rounded-xl bg-surface-container-high text-on-surface font-bold disabled:opacity-60"
          >
            {isVerifyingOtp ? "Dang xac thuc..." : "Xac thuc OTP"}
          </button>
        </form>

        {otpExpiresAt ? (
          <p className="text-xs text-on-surface-variant">
            OTP hết hạn lúc: {new Date(otpExpiresAt).toLocaleString("vi-VN")}
          </p>
        ) : null}

        {trackingToken ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-green-700">
              Đã có tracking token hợp lệ.
            </p>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <article className="rounded-xl bg-surface-container-low p-4 border border-outline-variant/20">
              <h4 className="font-bold text-on-surface mb-3">Lịch sử cứu hộ</h4>
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
                        {item.code ? (
                          <button
                            type="button"
                            onClick={() => {
                              setTrackingCode(item.code);
                              void fetchTrackingData(item.code);
                            }}
                            className="rounded-md bg-primary text-on-primary px-3 py-1 text-xs font-bold"
                          >
                            Xem
                          </button>
                        ) : null}
                      </div>
                      {item.code ? (
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Mã: {item.code}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {item.statusName}
                      </p>
                      {item.createdAt ? (
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {new Date(item.createdAt).toLocaleString("vi-VN")}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-xl bg-surface-container-low p-4 border border-outline-variant/20">
              <h4 className="font-bold text-on-surface mb-3">
                Lịch sử cứu trợ
              </h4>
              <div className="space-y-3">
                {myReliefs.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">
                    Chưa có lịch sử cứu trợ.
                  </p>
                ) : (
                  myReliefs.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg bg-surface-container-lowest p-3 border border-outline-variant/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-on-surface">
                          {item.title}
                        </p>
                        {item.code ? (
                          <button
                            type="button"
                            onClick={() => {
                              setTrackingCode(item.code);
                              void fetchTrackingData(item.code);
                            }}
                            className="rounded-md bg-primary text-on-primary px-3 py-1 text-xs font-bold"
                          >
                            Xem
                          </button>
                        ) : null}
                      </div>
                      {item.code ? (
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Mã: {item.code}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {item.statusName}
                      </p>
                      {item.createdAt ? (
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {new Date(item.createdAt).toLocaleString("vi-VN")}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </article>
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
            {trackingData?.status?.name ?? "Cho nhập mã theo dõi"}
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
                  <p className="font-bold text-on-surface">{step.statusName}</p>
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
                  {trackingData.status.name}
                </p>
              </div>
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
            disabled={!trackingData?.canAckRescue || isAcking}
            className="w-full bg-primary text-on-primary p-6 rounded-3xl font-bold flex flex-col items-center gap-2 border border-primary/20 disabled:opacity-60"
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

      {/* CUU TRO SECTION */}
      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-on-surface">
            Theo dõi cứu trợ
          </h3>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={trackingCode}
            onChange={(event) => setTrackingCode(event.target.value)}
            placeholder="Nhập mã cứu trợ (RT-YYYYMMDD-XXX)"
            className="flex-1 bg-surface-container-low rounded-xl px-4 py-3 outline-none text-on-surface"
          />
          <button
            onClick={() => void fetchReliefTrackingData(trackingCode)}
            disabled={isReliefLoading || !trackingToken}
            className="h-12 px-6 rounded-xl bg-secondary text-on-secondary font-bold disabled:opacity-60"
          >
            {isReliefLoading ? "Đang tải..." : "Tra cứu cứu trợ"}
          </button>
        </div>

        {reliefErrorMessage ? (
          <p className="text-sm text-error">{reliefErrorMessage}</p>
        ) : null}

        {reliefTrackingData ? (
          <div className="space-y-4">
            {/* Relief Info */}
            <div className="rounded-xl bg-surface-container-low p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-on-surface-variant">Mã yêu cầu</p>
                  <p className="font-bold text-on-surface">
                    {reliefTrackingData.requestCode}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Trạng thái</p>
                  <p className="font-bold text-on-surface">
                    {reliefTrackingData.status?.name ?? "Đang xử lý"}
                  </p>
                </div>
              </div>
            </div>

            {/* Relief Items */}
            {reliefTrackingData.items && reliefTrackingData.items.length > 0 && (
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="text-xs text-on-surface-variant mb-2">
                  Vật phẩm cứu trợ
                </p>
                <div className="space-y-2">
                  {reliefTrackingData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-on-surface">
                        {item.itemCode ?? "Vật phẩm"}
                      </span>
                      <span className="text-sm font-medium text-on-surface">
                        {item.fulfilledQty ?? 0}/{item.requestedQty}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Distributions */}
            {reliefTrackingData.distributions &&
              reliefTrackingData.distributions.length > 0 && (
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-xs text-on-surface-variant mb-2">
                    Lịch sử phân phối
                  </p>
                  <div className="space-y-2">
                    {reliefTrackingData.distributions.map((dist, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-on-surface">
                          {dist.distribution_code}
                        </span>
                        <span className="text-on-surface-variant">
                          {dist.distributed_at
                            ? new Date(dist.distributed_at).toLocaleString("vi-VN")
                            : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Ack Relief Button */}
            {reliefTrackingData.canAckRelief ? (
              <div className="space-y-3">
                <textarea
                  value={reliefAckNote}
                  onChange={(e) => setReliefAckNote(e.target.value)}
                  placeholder="Ghi chú (tùy chọn): ví dụ: Đã nhận đầy đủ, Thiếu 1 thùng mì..."
                  className="w-full bg-surface-container-low rounded-xl px-4 py-3 outline-none text-on-surface resize-none"
                  rows={2}
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAckRelief}
                  disabled={isReliefAcking}
                  className="w-full bg-green-600 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isReliefAcking ? (
                    <LoaderCircle className="animate-spin" size={20} />
                  ) : (
                    <CheckCircle size={20} />
                  )}
                  <span>Xác nhận đã nhận cứu trợ</span>
                </motion.button>
              </div>
            ) : (
              <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
                <CheckCircle
                  size={24}
                  className="mx-auto text-green-600 mb-2"
                />
                <p className="text-sm font-medium text-green-800">
                  Bạn đã xác nhận nhận cứu trợ
                </p>
              </div>
            )}
          </div>
        ) : !reliefErrorMessage && !isReliefLoading ? (
          <p className="text-sm text-on-surface-variant text-center py-4">
            Nhập mã cứu trợ để xem thông tin và xác nhận đã nhận hàng
          </p>
        ) : null}
      </section>
    </div>
  );
};
