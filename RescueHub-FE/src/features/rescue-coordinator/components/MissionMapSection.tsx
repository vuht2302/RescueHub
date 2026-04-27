import React, { useCallback, useEffect, useRef, useState } from "react";
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";
import { AlertCircle, MapPin, RefreshCw } from "lucide-react";
import { getAuthSession } from "../../auth/services/authStorage";
import { getIncidents, IncidentItem } from "../services/incidentServices";

export const MissionMapSection: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<vietmapgl.Map | null>(null);
  const markersRef = useRef<vietmapgl.Marker[]>([]);

  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vietmapApiKey = (import.meta.env.VITE_VIETMAP_API_KEY ?? "").trim();
  const hasVietmapKey = vietmapApiKey.length > 0;
  const canUseVietmap = hasVietmapKey;

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authSession = getAuthSession();
      if (!authSession?.accessToken) {
        throw new Error("Không có token xác thực.");
      }
      const data = await getIncidents(authSession.accessToken);
      setIncidents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi tải sự cố");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load incidents
  useEffect(() => {
    void fetchIncidents();
  }, [fetchIncidents]);

  // Initialize Map
  useEffect(() => {
    if (!canUseVietmap || !mapContainerRef.current || mapRef.current) return;

    const map = new vietmapgl.Map({
      container: mapContainerRef.current,
      style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${vietmapApiKey}`,
      center: [106.6953, 10.7782], // Default Ho Chi Minh City coordinates
      zoom: 12,
    });

    map.addControl(new vietmapgl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [canUseVietmap, vietmapApiKey]);

  // Update Markers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    incidents.forEach((incident) => {
      if (!incident.location?.lat || !incident.location?.lng) return;

      const isSelected = selectedIncident?.id === incident.id;
      const markerColor = isSelected ? "#ba1a1a" : "#007399"; // Red if selected, secondary blue otherwise

      const marker = new vietmapgl.Marker({
        color: markerColor,
      })
        .setLngLat([incident.location.lng, incident.location.lat])
        .addTo(map);

      // Standard popup behavior
      const popup = new vietmapgl.Popup({ offset: 12 }).setHTML(
        `<strong>${incident.incidentCode}</strong><br/>${incident.location.addressText || "Vị trí sự cố"}`,
      );
      marker.setPopup(popup);

      marker.getElement().addEventListener("click", () => {
        setSelectedIncident(incident);
        map.flyTo({
          center: [incident.location.lng, incident.location.lat],
          zoom: 15,
          essential: true,
          duration: 900,
        });
      });

      markersRef.current.push(marker);
    });

    // If there is a selected incident, ensure we fly to it
    if (selectedIncident?.location?.lat && selectedIncident?.location?.lng) {
      map.flyTo({
        center: [selectedIncident.location.lng, selectedIncident.location.lat],
        zoom: 14,
        essential: true,
      });
    }
  }, [incidents, selectedIncident]);

  const getStatusLabel = (code: string) => {
    switch (code) {
      case "NEW":
      case "PENDING":
        return "Chờ xác minh";
      case "VERIFIED":
      case "ASSESSED":
        return "Đã xác minh";
      case "ASSIGNED":
      case "DISPATCHED":
        return "Đã phân công";
      case "IN_PROGRESS":
      case "RESCUING":
        return "Đang xử lý";
      case "COMPLETED":
        return "Hoàn thành";
      default:
        return "Không xác định";
    }
  };

  const getStatusColor = (code: string) => {
    switch (code) {
      case "NEW":
      case "PENDING":
        return "bg-gray-100 text-gray-700";
      case "VERIFIED":
      case "ASSESSED":
        return "bg-green-100 text-green-800";
      case "ASSIGNED":
      case "DISPATCHED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
      case "RESCUING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-5">
      {/* MAP AREA */}
      <article className="relative rounded-2xl overflow-hidden bg-[#cfd4db] flex-1 min-h-125">
        {canUseVietmap ? (
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            aria-label="Bản đồ điều phối cứu hộ"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <div className="rounded-xl bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 border border-slate-200 shadow-sm">
              Không có khóa API Vietmap, không thể tải bản đồ trực tiếp.
            </div>
          </div>
        )}

        {/* Selected Incident Info overlay */}
        {selectedIncident && selectedIncident.location && (
          <div className="absolute top-5 left-5 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-md border border-white/70 max-w-75">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant flex items-center gap-1.5">
              <MapPin size={12} className="text-blue-950" /> Vị trí chọn
            </p>
            <p className="text-sm font-black font-primary text-on-surface mt-1 truncate">
              {selectedIncident.incidentCode}
            </p>
            <p className="text-xs text-[#3f4650] mt-0.5 leading-tight line-clamp-2">
              {selectedIncident.location.addressText ||
                "Chưa có địa chỉ cụ thể"}
            </p>
            <p className="text-xs font-mono text-[#3f4650] mt-1">
              Lat: {selectedIncident.location.lat.toFixed(4)}, Lng:{" "}
              {selectedIncident.location.lng.toFixed(4)}
            </p>
          </div>
        )}
      </article>

      {/* SIDEBAR AREA */}
      <aside className="rounded-2xl bg-[#d7dce2] border border-[#c8ced6] p-4 md:p-5 overflow-auto w-full md:w-100 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs uppercase tracking-widest font-bold text-on-surface-variant font-primary">
            Sự cố trên bản đồ
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchIncidents()}
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-bold text-blue-950 transition-colors hover:bg-blue-50"
              title="Tải lại dữ liệu"
            >
              <RefreshCw
                size={12}
                className={isLoading ? "animate-spin" : ""}
              />
              Làm mới
            </button>
            <span className="text-xs font-bold text-blue-950 bg-blue-100 px-2 py-0.5 rounded-full">
              {incidents.length}
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2 mb-4">
            <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center p-6 flex-1">
            <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-800 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {incidents.map((incident) => {
              const isSelected = selectedIncident?.id === incident.id;
              return (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className={`rounded-xl p-3 cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-white border-[#007399] shadow-sm transform scale-[1.02]"
                      : "bg-[#e7ebef] border-[#d4dbe3] hover:border-[#007399]/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h4
                      className={`text-sm font-bold font-primary truncate ${isSelected ? "text-blue-950" : "text-[#1f2329]"}`}
                    >
                      {incident.incidentCode}
                    </h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase whitespace-nowrap ${getStatusColor(
                        incident.status?.code || "PENDING",
                      )}`}
                    >
                      {getStatusLabel(incident.status?.code || "PENDING")}
                    </span>
                  </div>

                  <div className="flex items-start gap-1.5 text-xs text-[#3f4650] mt-1.5">
                    <MapPin
                      size={14}
                      className="mt-0.5 shrink-0 text-blue-900/60"
                    />
                    <span className="line-clamp-2">
                      {incident.location?.addressText || "Đang tải vị trí..."}
                    </span>
                  </div>

                  {incident.handlingTeams &&
                    incident.handlingTeams.length > 0 && (
                      <div className="mt-2 text-xs">
                        <span className="inline-block px-2 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-md font-medium truncate w-full">
                          Đội: {incident.handlingTeams[0].teamName}
                        </span>
                      </div>
                    )}
                </div>
              );
            })}

            {incidents.length === 0 && !error && (
              <p className="text-sm text-center text-on-surface-variant mt-10">
                Không có sự cố nào để hiển thị.
              </p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
};
