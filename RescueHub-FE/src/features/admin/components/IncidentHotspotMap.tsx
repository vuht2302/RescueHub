import React, { useEffect, useRef, useState } from "react";
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";
import { MapPin, RefreshCw, AlertCircle } from "lucide-react";
import type { HotspotItem } from "../../../shared/services/report.service";

interface IncidentHotspotMapProps {
  hotspots: HotspotItem[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  className?: string;
}

const IncidentHotspotMap: React.FC<IncidentHotspotMapProps> = ({
  hotspots,
  isLoading = false,
  error = null,
  onRefresh,
  className = "",
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<vietmapgl.Map | null>(null);
  const markersRef = useRef<vietmapgl.Marker[]>([]);

  const [selectedHotspot, setSelectedHotspot] = useState<HotspotItem | null>(
    null,
  );

  const vietmapApiKey = (import.meta.env.VITE_VIETMAP_API_KEY ?? "").trim();
  const canUseVietmap = vietmapApiKey.length > 0;

  // Initialize Map
  useEffect(() => {
    if (!canUseVietmap || !mapContainerRef.current || mapRef.current) return;

    const map = new vietmapgl.Map({
      container: mapContainerRef.current,
      style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${vietmapApiKey}`,
      center: [105.767, 10.03], // Can Tho center
      zoom: 11,
    });

    map.addControl(new vietmapgl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [canUseVietmap, vietmapApiKey]);

  // Update markers on map
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Filter hotspots with valid coordinates
    const validHotspots = hotspots.filter((h) => h.lat && h.lng);

    if (validHotspots.length === 0) return;

    const maxCount = Math.max(...validHotspots.map((h) => h.incidentCount), 1);

    validHotspots.forEach((hotspot, index) => {
      const { lat, lng } = hotspot;
      const intensity = hotspot.incidentCount / maxCount;

      // Minimal color scheme - grayscale with single accent
      let markerColor = "#6b7280"; // gray - low
      if (index < 3)
        markerColor = "#001f3f"; // dark blue - top 3
      else if (index < 6) markerColor = "#374151"; // dark gray - top 6

      // Size based on incident count
      const baseSize = 24;
      const scaledSize = baseSize + Math.round(intensity * 16);

      // Create minimal circle marker element
      const el = document.createElement("div");
      el.style.width = `${scaledSize}px`;
      el.style.height = `${scaledSize}px`;
      el.style.borderRadius = "50%";
      el.style.background = markerColor;
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.cursor = "pointer";

      // Rank number inside
      const rankLabel = document.createElement("span");
      rankLabel.textContent = String(index + 1);
      rankLabel.style.color = "white";
      rankLabel.style.fontSize = "11px";
      rankLabel.style.fontWeight = "600";
      el.appendChild(rankLabel);

      const marker = new vietmapgl.Marker({ element: el, anchor: "center" })
        .setLngLat([lng!, lat!])
        .addTo(map);

      const areaName =
        hotspot.adminAreaName || hotspot.fallbackAddress || "Không xác định";
      const popup = new vietmapgl.Popup({
        offset: 15,
        closeButton: false,
      }).setHTML(
        `<div style="font-family:system-ui,sans-serif;padding:8px;min-width:160px">
          <div style="font-size:13px;font-weight:600;color:#111827;margin-bottom:4px">${areaName}</div>
          <div style="font-size:12px;color:#4b5563">Sự cố: <b style="color:#001f3f">${hotspot.incidentCount}</b></div>
          <div style="font-size:11px;color:#9ca3af;margin-top:2px">Hạng #${index + 1}</div>
        </div>`,
      );
      marker.setPopup(popup);

      el.addEventListener("click", () => {
        setSelectedHotspot(hotspot);
        map.flyTo({
          center: [lng!, lat!],
          zoom: 14,
          essential: true,
          duration: 600,
        });
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if hotspots exist
    if (validHotspots.length > 0) {
      const bounds = new vietmapgl.LngLatBounds();
      validHotspots.forEach((h) => {
        if (h.lng && h.lat) bounds.extend([h.lng, h.lat]);
      });
      map.fitBounds(bounds, { padding: 50, maxZoom: 13, duration: 600 });
    }
  }, [hotspots]);

  const totalIncidents = hotspots.reduce((sum, h) => sum + h.incidentCount, 0);
  const validLocationCount = hotspots.filter((h) => h.lat && h.lng).length;

  return (
    <div
      className={`flex flex-col lg:flex-row gap-4 h-full min-h-[500px] ${className}`}
    >
      {/* MAP AREA */}
      <div className="relative flex-1 min-h-[400px] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
        {canUseVietmap ? (
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            aria-label="Bản đồ khu vực sự cố"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <MapPin size={32} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Không có khóa API Vietmap</p>
            </div>
          </div>
        )}

        {/* Minimal Info Overlay */}
        {selectedHotspot && selectedHotspot.lat && selectedHotspot.lng && (
          <div className="absolute top-4 left-4 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200 max-w-xs z-10">
            <p className="text-xs font-medium text-gray-900 truncate">
              {selectedHotspot.adminAreaName ||
                selectedHotspot.fallbackAddress ||
                "Không xác định"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {selectedHotspot.incidentCount} sự cố · Mã:{" "}
              {selectedHotspot.adminAreaCode || "N/A"}
            </p>
          </div>
        )}

        {/* Minimal Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200 z-10">
          <p className="text-[10px] font-medium text-gray-600 mb-1.5">Mức độ</p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#001f3f] border border-white" />
              <span className="text-[10px] text-gray-600">Cao (Top 3)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gray-700 border border-white" />
              <span className="text-[10px] text-gray-600">Trung bình</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gray-500 border border-white" />
              <span className="text-[10px] text-gray-600">Thấp</span>
            </div>
          </div>
        </div>
      </div>

      {/* SIDEBAR - Minimal Design */}
      <div className="w-full lg:w-80 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Khu vực sự cố
            </h3>
            <p className="text-xs text-gray-500">
              {hotspots.length} khu vực · {totalIncidents} sự cố
            </p>
          </div>
          {onRefresh && (
            <button
              onClick={() => void onRefresh()}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors"
              title="Làm mới"
            >
              <RefreshCw
                size={14}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-2.5 flex items-start gap-2">
            <AlertCircle
              size={14}
              className="text-red-600 mt-0.5 flex-shrink-0"
            />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Hotspot List - Minimal */}
        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-white">
          {isLoading && hotspots.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          ) : hotspots.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MapPin size={20} className="text-gray-300 mb-2" />
              <p className="text-xs text-gray-500">Chưa có dữ liệu</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {hotspots.map((hotspot, idx) => {
                const isSelected =
                  selectedHotspot?.adminAreaCode === hotspot.adminAreaCode;
                const hasLocation = hotspot.lat && hotspot.lng;

                return (
                  <div
                    key={`${hotspot.adminAreaCode || idx}-${idx}`}
                    onClick={() => {
                      setSelectedHotspot(hotspot);
                      if (mapRef.current && hasLocation) {
                        mapRef.current.flyTo({
                          center: [hotspot.lng!, hotspot.lat!],
                          zoom: 14,
                          essential: true,
                          duration: 600,
                        });
                      }
                    }}
                    className={`px-3 py-2.5 cursor-pointer transition-colors ${
                      isSelected ? "bg-gray-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                          idx < 3
                            ? "bg-[#001f3f] text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {idx + 1}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm truncate ${isSelected ? "font-medium text-gray-900" : "text-gray-700"}`}
                        >
                          {hotspot.adminAreaName ||
                            hotspot.fallbackAddress ||
                            "Không xác định"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">
                            {hotspot.incidentCount} sự cố
                          </span>
                          {hotspot.adminAreaLevelCode && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {hotspot.adminAreaLevelCode}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Location indicator */}
                      {!hasLocation && (
                        <AlertCircle
                          size={12}
                          className="text-amber-500 flex-shrink-0"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary footer */}
        <div className="text-xs text-gray-500 text-center">
          {validLocationCount}/{hotspots.length} khu vực có tọa độ bản đồ
        </div>
      </div>
    </div>
  );
};

export { IncidentHotspotMap };
