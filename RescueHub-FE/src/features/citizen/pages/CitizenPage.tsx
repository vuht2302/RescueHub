import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";
import { LifeBuoy, LocateFixed, MapPin, Phone, Send } from "lucide-react";
import { getPublicMapData } from "../../../shared/services/publicApi";
import { getAuthSession } from "../../auth/services/authStorage";
import { ReliefRequestModal } from "../../home/components/ReliefRequestModal";
import { RescueRequestModal } from "../../home/components/RescueRequestModal";

type Coordinate = {
  lat: number;
  lng: number;
};

type ReliefPoint = {
  id: string;
  title: string;
  addressText: string;
  lat: number;
  lng: number;
  statusCode: string;
  statusName: string;
  markerType: string;
};

const DEFAULT_CENTER: Coordinate = {
  lat: 10.7769,
  lng: 106.7009,
};

const getDistanceKm = (from: Coordinate, to: Coordinate) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) *
      Math.cos(toRad(to.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const normalizeReliefStatus = (
  statusName: string,
  statusCode?: string,
): string => {
  const normalizedCode = String(statusCode ?? "")
    .trim()
    .toUpperCase();
  const normalizedName = String(statusName ?? "")
    .trim()
    .toLowerCase();

  if (normalizedCode === "OPEN") {
    return "Đang mở";
  }

  if (normalizedName === "dang mo") {
    return "Đang mở";
  }

  return statusName || "Đang mở";
};

export const CitizenPage: React.FC = () => {
  const locationRouter = useLocation();
  const navigate = useNavigate();
  const authSession = getAuthSession();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<vietmapgl.Map | null>(null);
  const userMarkerRef = useRef<vietmapgl.Marker | null>(null);
  const reliefMarkersRef = useRef<vietmapgl.Marker[]>([]);
  const focusPopupRef = useRef<vietmapgl.Popup | null>(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [mapErrorMessage, setMapErrorMessage] = useState("");
  const [mapPoints, setMapPoints] = useState<ReliefPoint[]>([]);
  const [isMapDataLoading, setIsMapDataLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<
    "locating" | "granted" | "denied" | "unsupported"
  >("locating");
  const [locationAccuracyMeters, setLocationAccuracyMeters] = useState<
    number | null
  >(null);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isReliefModalOpen, setIsReliefModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinate>(DEFAULT_CENTER);
  const defaultReporterName = authSession?.user.displayName?.trim() || "";
  const defaultReporterPhone = authSession?.user.phone?.trim() || "";

  const vietmapApiKey = (import.meta.env.VITE_VIETMAP_API_KEY ?? "").trim();
  const canUseVietmap = vietmapApiKey.length > 0;

  useEffect(() => {
    const params = new URLSearchParams(locationRouter.search);
    setIsRequestModalOpen(params.get("request") === "1");
    setIsReliefModalOpen(params.get("relief") === "1");
  }, [locationRouter.search]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      setLocationAccuracyMeters(null);
      return;
    }

    setLocationStatus("locating");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationAccuracyMeters(
          Number.isFinite(position.coords.accuracy)
            ? Math.max(0, position.coords.accuracy)
            : null,
        );
        setLocationStatus("granted");
      },
      () => {
        setLocationAccuracyMeters(null);
        setLocationStatus("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 10000,
      },
    );
  }, []);

  useEffect(() => {
    if (!canUseVietmap || !mapContainerRef.current || mapRef.current) {
      return;
    }

    setMapErrorMessage("");

    const map = new vietmapgl.Map({
      container: mapContainerRef.current,
      style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${vietmapApiKey}`,
      center: [userLocation.lng, userLocation.lat],
      zoom: 13,
      attributionControl: false,
    });

    map.addControl(new vietmapgl.NavigationControl(), "top-right");
    mapRef.current = map;

    let errorHandled = false;

    const onLoad = () => {
      setIsMapReady(true);
      map.triggerRepaint();
    };

    const onError = (e: any) => {
      if (errorHandled) return;
      errorHandled = true;
      const msg =
        e?.error?.message ||
        e?.message ||
        "Không thể tải bản đồ VietMap. Vui lòng kiểm tra API key.";
      setMapErrorMessage(msg);
    };

    if (map.loaded()) {
      onLoad();
    } else {
      map.once("load", onLoad);
    }

    map.on("error", onError);

    return () => {
      map.off("error", onError);
      map.off("load", onLoad);
      if (focusPopupRef.current) {
        focusPopupRef.current.remove();
        focusPopupRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      reliefMarkersRef.current.forEach((marker) => marker.remove());
      reliefMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
      setIsMapReady(false);
    };
  }, [canUseVietmap, vietmapApiKey, userLocation.lat, userLocation.lng]);

  useEffect(() => {
    if (!mapRef.current || !isMapReady) {
      return;
    }

    mapRef.current.resize();
  }, [isMapReady]);

  useEffect(() => {
    if (!canUseVietmap || !mapRef.current || !isMapReady) {
      return;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    const marker = new vietmapgl.Marker({ color: "#2563eb" })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(
        new vietmapgl.Popup({ offset: 10 }).setText("Vị trí hiện tại của bạn"),
      )
      .addTo(mapRef.current);

    userMarkerRef.current = marker;

    mapRef.current.easeTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
      duration: 350,
      essential: true,
    });
  }, [canUseVietmap, isMapReady, userLocation.lat, userLocation.lng]);

  useEffect(() => {
    if (!canUseVietmap) {
      return;
    }

    const loadMapData = async () => {
      try {
        setIsMapDataLoading(true);
        const parsePoints = (rawMarkers: Array<any>): ReliefPoint[] =>
          rawMarkers
            .map((marker) => ({
              id: String(marker?.id ?? ""),
              title: String(marker?.title ?? "Điểm hỗ trợ"),
              addressText: String(
                marker?.position?.addressText ??
                  marker?.addressText ??
                  "Chưa có địa chỉ",
              ),
              lat: Number(
                marker?.position?.lat ??
                  marker?.lat ??
                  marker?.position?.latitude,
              ),
              lng: Number(
                marker?.position?.lng ??
                  marker?.lng ??
                  marker?.position?.longitude,
              ),
              statusCode: String(marker?.status?.code ?? ""),
              statusName: String(marker?.status?.name ?? "Đang mở"),
              markerType: String(marker?.markerType ?? ""),
            }))
            .filter(
              (point) =>
                Number.isFinite(point.lat) && Number.isFinite(point.lng),
            );

        const toReliefPoints = (points: ReliefPoint[]): ReliefPoint[] => {
          const reliefOnly = points.filter((point) => {
            const markerType = point.markerType.trim().toUpperCase();
            return (
              markerType.includes("RELIEF") ||
              markerType === "AID_POINT" ||
              markerType === "SUPPLY_POINT"
            );
          });

          return reliefOnly.length > 0 ? reliefOnly : points;
        };

        const radiusCandidates = [50, 150, 500];
        let resolvedPoints: ReliefPoint[] = [];

        for (const radiusKm of radiusCandidates) {
          const mapData = await getPublicMapData(
            userLocation.lat,
            userLocation.lng,
            radiusKm,
          );

          const markers = Array.isArray(mapData.markers) ? mapData.markers : [];
          const parsedPoints = parsePoints(markers);
          const usablePoints = toReliefPoints(parsedPoints);

          if (usablePoints.length > 0) {
            resolvedPoints = usablePoints;
            break;
          }
        }

        setMapPoints(resolvedPoints);
      } catch {
        setMapPoints([]);
      } finally {
        setIsMapDataLoading(false);
      }
    };

    void loadMapData();
  }, [canUseVietmap, userLocation.lat, userLocation.lng]);

  useEffect(() => {
    if (!canUseVietmap || !mapRef.current || !isMapReady) {
      return;
    }

    reliefMarkersRef.current.forEach((marker) => marker.remove());
    reliefMarkersRef.current = [];

    mapPoints.forEach((point) => {
      const distanceKm = getDistanceKm(userLocation, {
        lat: point.lat,
        lng: point.lng,
      });

      const marker = new vietmapgl.Marker({ color: "#f97316" })
        .setLngLat([point.lng, point.lat])
        .setPopup(
          new vietmapgl.Popup({ offset: 10 }).setHTML(
            `<strong>${point.title}</strong><br/>${point.addressText}<br/>Cách vị trí của bạn: ${distanceKm.toFixed(2)} km`,
          ),
        )
        .addTo(mapRef.current!);

      reliefMarkersRef.current.push(marker);
    });
  }, [canUseVietmap, isMapReady, mapPoints, userLocation]);

  const closeRequestModal = () => {
    setIsRequestModalOpen(false);
    navigate("/citizen", { replace: true });
  };

  const closeReliefModal = () => {
    setIsReliefModalOpen(false);
    navigate("/citizen", { replace: true });
  };

  const nearestReliefPoint = useMemo(() => {
    if (mapPoints.length === 0) {
      return null;
    }

    return mapPoints
      .map((point) => ({
        point,
        distanceKm: getDistanceKm(userLocation, {
          lat: point.lat,
          lng: point.lng,
        }),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];
  }, [mapPoints, userLocation]);

  const focusCurrentLocation = () => {
    if (!canUseVietmap || !mapRef.current) {
      return;
    }

    mapRef.current.easeTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 15,
      duration: 500,
      essential: true,
    });

    userMarkerRef.current?.togglePopup();
  };

  const focusNearestReliefPoint = () => {
    if (!canUseVietmap || !mapRef.current || !nearestReliefPoint) {
      return;
    }

    const { point, distanceKm } = nearestReliefPoint;

    mapRef.current.easeTo({
      center: [point.lng, point.lat],
      zoom: 15,
      duration: 500,
      essential: true,
    });

    if (focusPopupRef.current) {
      focusPopupRef.current.remove();
      focusPopupRef.current = null;
    }

    focusPopupRef.current = new vietmapgl.Popup({ offset: 12 })
      .setLngLat([point.lng, point.lat])
      .setHTML(
        `<strong>${point.title}</strong><br/>${point.addressText}<br/>Cách vị trí của bạn: ${distanceKm.toFixed(2)} km`,
      )
      .addTo(mapRef.current);
  };

  return (
    <>
      <div className="h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)]">
        <section className="relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-full min-h-0 w-full bg-slate-100">
            {canUseVietmap ? (
              <>
                <div ref={mapContainerRef} className="h-full w-full" />
                {mapErrorMessage ? (
                  <div className="absolute inset-x-6 top-6 rounded-xl border border-amber-200 bg-amber-50/95 px-4 py-3 text-sm text-amber-800 shadow-sm">
                    {mapErrorMessage}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-600">
                Thiếu VITE_VIETMAP_API_KEY, chưa thể hiển thị bản đồ.
              </div>
            )}

            <div className="absolute left-4 top-4 z-10 w-[250px] max-w-[calc(100%-2rem)] space-y-2.5">
              <button
                type="button"
                onClick={focusCurrentLocation}
                className="w-full rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 text-left shadow-lg backdrop-blur transition hover:bg-white"
                title="Di chuyển đến vị trí hiện tại"
              >
                <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-700">
                  <LocateFixed size={12} />
                  Vị trí hiện tại
                </p>
                <p className="mt-1 text-[15px] font-extrabold text-slate-900 leading-tight">
                  {userLocation.lat.toFixed(5)}°, {userLocation.lng.toFixed(5)}°
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {locationStatus === "granted" && "Đã định vị thiết bị"}
                  {locationStatus === "locating" &&
                    "Đang lấy vị trí của bạn..."}
                  {locationStatus === "denied" &&
                    "Bạn từ chối GPS, đang dùng vị trí mặc định"}
                  {locationStatus === "unsupported" &&
                    "Trình duyệt không hỗ trợ GPS"}
                </p>
                {locationStatus === "granted" &&
                  locationAccuracyMeters !== null && (
                    <p className="mt-0.5 text-xs text-slate-600">
                      Độ chính xác: ~
                      {locationAccuracyMeters < 1000
                        ? `${Math.round(locationAccuracyMeters)} m`
                        : `${(locationAccuracyMeters / 1000).toFixed(1)} km`}
                    </p>
                  )}
              </button>

              <button
                type="button"
                onClick={focusNearestReliefPoint}
                disabled={!nearestReliefPoint}
                className="w-full rounded-2xl border border-slate-200 bg-white/95 px-3 py-2.5 text-left shadow-lg backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                title="Di chuyển đến điểm cứu trợ gần nhất"
              >
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-red-500">
                  <MapPin size={14} />
                  Điểm cứu trợ gần nhất
                </p>
                {nearestReliefPoint ? (
                  <>
                    <p className="mt-1 text-[15px] font-extrabold leading-tight text-slate-900 line-clamp-2">
                      {nearestReliefPoint.point.title}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-700 line-clamp-2">
                      {nearestReliefPoint.point.addressText}
                    </p>
                    <p className="mt-2 text-xs font-bold text-slate-700">
                      Cách bạn khoảng {nearestReliefPoint.distanceKm.toFixed(2)}{" "}
                      km
                    </p>
                    <span className="mt-2 inline-block rounded-xl bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                      {normalizeReliefStatus(
                        nearestReliefPoint.point.statusName,
                        nearestReliefPoint.point.statusCode,
                      )}
                    </span>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">
                    {isMapDataLoading
                      ? "Đang tải điểm cứu trợ..."
                      : "Chưa có dữ liệu điểm cứu trợ"}
                  </p>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate("/citizen?request=1")}
              className="absolute bottom-8 left-1/2 z-10 h-24 w-24 -translate-x-1/2 rounded-full bg-red-600 text-3xl font-black text-white shadow-[0_16px_28px_rgba(220,38,38,0.4)] transition hover:scale-[1.03] active:scale-95"
            >
              SOS
            </button>

            <div className="absolute bottom-8 right-4 z-10 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(true)}
                className="h-14 w-14 rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-500"
                title="Tạo yêu cầu cứu hộ"
              >
                <Send size={22} className="mx-auto" />
              </button>
              <button
                type="button"
                onClick={() => setIsReliefModalOpen(true)}
                className="h-14 w-14 rounded-full bg-blue-950 text-white shadow-lg transition hover:bg-blue-900"
                title="Tạo yêu cầu cứu trợ"
              >
                <LifeBuoy size={22} className="mx-auto" />
              </button>
              <a
                href="tel:1900xxxx"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-950 shadow-lg transition hover:bg-slate-100"
                title="Gọi hotline"
              >
                <Phone size={22} />
              </a>
            </div>
          </div>
        </section>
      </div>

      <RescueRequestModal
        isOpen={isRequestModalOpen}
        onClose={closeRequestModal}
        defaultLocation={userLocation}
        defaultReporterName={defaultReporterName}
        defaultReporterPhone={defaultReporterPhone}
        lockReporterInfo
      />

      <ReliefRequestModal
        isOpen={isReliefModalOpen}
        onClose={closeReliefModal}
        defaultRequesterName={defaultReporterName}
        defaultRequesterPhone={defaultReporterPhone}
        defaultLocation={userLocation}
        lockRequesterInfo
      />
    </>
  );
};
