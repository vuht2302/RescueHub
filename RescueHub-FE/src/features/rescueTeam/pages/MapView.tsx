import React, { useEffect, useRef } from "react";
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";
import {
  AlertCircle,
  MapPin,
  Phone,
  RefreshCw,
  UserRound,
  Users,
} from "lucide-react";
import { Mission, MissionStatus, MissionLog } from "../types/mission";
import {
  requestMissionAbort,
  updateMissionStatus,
} from "../services/teamMissionService";

interface MapViewProps {
  selectedMission: Mission;
  statusMap: Record<string, MissionStatus>;
  logs: MissionLog[];
  priorityStyles: Record<string, string>;
  missions: Mission[];
  onReloadData: () => void;
  isReloadingData: boolean;
  onMissionSelect: (missionId: string) => void;
  onStatusChange: (status: MissionStatus) => void;
  onSubmitReport: (status: MissionStatus, text: string) => void;
  onAbortRequestSubmitted: (reasonCode: string, detailNote: string) => void;
  reportStatus: MissionStatus;
}

const statusProgression: MissionStatus[] = [
  "Chờ nhận",
  "Đang di chuyển",
  "Đang xử lý",
  "Đã hoàn tất",
];

const pauseStatus: MissionStatus = "Tạm dừng";

const getAllowedStatusOptions = (currentStatus: MissionStatus) => {
  const currentIndex = statusProgression.indexOf(currentStatus);

  if (currentStatus === pauseStatus) {
    return [pauseStatus, "Đang xử lý", "Đã hoàn tất"];
  }

  if (currentIndex === -1) {
    return [currentStatus];
  }

  if (currentStatus === "Đã hoàn tất") {
    return ["Đã hoàn tất"];
  }

  return [...statusProgression.slice(currentIndex), pauseStatus];
};

export const MapView: React.FC<MapViewProps> = ({
  selectedMission,
  priorityStyles,
  statusMap,
  missions,
  onReloadData,
  isReloadingData,
  onMissionSelect,
  reportStatus,
  onStatusChange,
  onSubmitReport,
  onAbortRequestSubmitted,
  logs,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<vietmapgl.Map | null>(null);
  const markersRef = useRef<vietmapgl.Marker[]>([]);
  const [reportText, setReportText] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [abortReasonCode, setAbortReasonCode] =
    React.useState<string>("RESOURCE_LIMIT");
  const [abortDetailNote, setAbortDetailNote] = React.useState("");
  const [isAbortSubmitting, setIsAbortSubmitting] = React.useState(false);
  const [abortError, setAbortError] = React.useState<string | null>(null);
  const [abortSuccessMessage, setAbortSuccessMessage] = React.useState<
    string | null
  >(null);

  const vietmapApiKey = (import.meta.env.VITE_VIETMAP_API_KEY ?? "").trim();
  const hasVietmapKey = vietmapApiKey.length > 0;

  const isWithinVietnamBounds = (lat: number, lng: number) =>
    lat >= 8.0 && lat <= 24.5 && lng >= 102.0 && lng <= 110.0;

  const canUseVietmap =
    hasVietmapKey &&
    isWithinVietnamBounds(selectedMission.coord.lat, selectedMission.coord.lng);

  const persistedMissionStatus = statusMap[selectedMission.id] ?? reportStatus;
  const allowedStatusOptions = getAllowedStatusOptions(persistedMissionStatus);
  const selectedReportStatus = allowedStatusOptions.includes(reportStatus)
    ? reportStatus
    : persistedMissionStatus;

  useEffect(() => {
    if (allowedStatusOptions.includes(reportStatus)) {
      return;
    }

    onStatusChange(persistedMissionStatus);
  }, [
    allowedStatusOptions,
    onStatusChange,
    persistedMissionStatus,
    reportStatus,
  ]);

  useEffect(() => {
    if (!canUseVietmap || !mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new vietmapgl.Map({
      container: mapContainerRef.current,
      style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${vietmapApiKey}`,
      center: [selectedMission.coord.lng, selectedMission.coord.lat],
      zoom: 13,
    });

    map.addControl(new vietmapgl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [
    canUseVietmap,
    selectedMission.coord.lat,
    selectedMission.coord.lng,
    vietmapApiKey,
  ]);

  useEffect(() => {
    if (!canUseVietmap || !mapRef.current) {
      return;
    }

    const map = mapRef.current;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = missions.map((mission) => {
      const isSelected = mission.id === selectedMission.id;
      const marker = new vietmapgl.Marker({
        color: isSelected ? "#ba1a1a" : "#001f3f",
      })
        .setLngLat([mission.coord.lng, mission.coord.lat])
        .setPopup(
          new vietmapgl.Popup({ offset: 12 }).setHTML(
            `<strong>${mission.code}</strong><br/>${mission.title}`,
          ),
        )
        .addTo(map);

      marker.getElement().addEventListener("click", () => {
        onMissionSelect(mission.id);
      });

      return marker;
    });

    map.flyTo({
      center: [selectedMission.coord.lng, selectedMission.coord.lat],
      zoom: 14,
      essential: true,
      duration: 900,
    });
  }, [canUseVietmap, selectedMission, missions, onMissionSelect]);

  const currentLogs = logs
    .filter((item) => item.missionId === selectedMission.id)
    .slice()
    .reverse();

  const handleSubmitReport = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!reportText.trim()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const statusCodeMap: Record<MissionStatus, string> = {
        "Chờ nhận": "DEPART",
        "Đang di chuyển": "ARRIVED",
        "Đang xử lý": "START_RESCUE",
        "Đã hoàn tất": "COMPLETE",
        "Tạm dừng": "ABORTED",
      };

      const actionCode = statusCodeMap[selectedReportStatus] || "START_RESCUE";

      console.log("[MapView] Gửi cập nhật nhiệm vụ:", {
        missionId: selectedMission.id,
        reportStatus: selectedReportStatus,
        actionCode,
        note: reportText,
      });

      const response = await updateMissionStatus(selectedMission.id, {
        actionCode,
        note: reportText,
      });

      console.log("[MapView] Phản hồi từ server:", response);
      onSubmitReport(selectedReportStatus, reportText);
      setReportText("");
    } catch (error) {
      console.error("[MapView] Lỗi cập nhật nhiệm vụ:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Gửi cập nhật thất bại. Vui lòng kiểm tra lại.";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAbortRequest = async () => {
    const trimmedDetailNote = abortDetailNote.trim();
    if (!trimmedDetailNote) {
      setAbortError("Vui lòng nhập chi tiết lý do hủy nhiệm vụ.");
      return;
    }

    setIsAbortSubmitting(true);
    setAbortError(null);
    setAbortSuccessMessage(null);

    try {
      await requestMissionAbort(selectedMission.id, {
        reasonCode: abortReasonCode,
        detailNote: trimmedDetailNote,
      });

      onAbortRequestSubmitted(abortReasonCode, trimmedDetailNote);
      setAbortDetailNote("");
      setAbortSuccessMessage("Đã gửi yêu cầu hủy nhiệm vụ thành công.");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Gửi yêu cầu hủy thất bại. Vui lòng thử lại.";
      setAbortError(errorMessage);
    } finally {
      setIsAbortSubmitting(false);
    }
  };

  return (
    <>
      <article className="relative rounded-2xl overflow-hidden bg-[#cfd4db] min-h-[520px] h-full">
        {canUseVietmap ? (
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            aria-label="Bản đồ nhiệm vụ cứu hộ"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <div className="rounded-xl bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 border border-slate-200 shadow-sm">
              Tạm thời không hiển thị bản đồ.
            </div>
          </div>
        )}

        {hasVietmapKey && !canUseVietmap && (
          <div className="absolute top-5 right-5 bg-amber-100 text-amber-900 px-3 py-2 rounded-lg text-xs font-bold border border-amber-300 max-w-[280px]">
            Tọa độ nhiệm vụ đang ngoài vùng phủ dữ liệu Việt Nam của Vietmap,
            đang hiển thị bản đồ dự phòng.
          </div>
        )}

        <div className="absolute top-5 left-5 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-md border border-white/70">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">
            Tọa độ trực tiếp
          </p>
          <p className="text-sm font-black font-primary text-on-surface mt-1">
            {selectedMission.coord.lat.toFixed(4)}° N,{" "}
            {selectedMission.coord.lng.toFixed(4)}° E
          </p>
        </div>

        <div className="absolute bottom-5 left-5 bg-blue-950 text-white px-4 py-2 rounded-xl font-primary font-bold text-sm shadow-lg">
          {selectedMission.address}
        </div>
      </article>

      <aside className="rounded-2xl bg-[#d7dce2] border border-[#c8ced6] p-5 md:p-6 overflow-auto">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm uppercase tracking-[0.18em] font-bold text-on-surface-variant font-primary">
            Nhiệm vụ hiện tại
          </h3>
        </div>

        <div className="mt-5 rounded-2xl bg-[#e7ebef] border border-[#d4dbe3] p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-black text-[#1f2329] font-primary">
              Chi tiết yêu cầu
            </h3>
            <span
              className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase ${priorityStyles[selectedMission.priority]}`}
            >
              {selectedMission.priority}
            </span>
          </div>

          <h4 className="text-2xl font-black text-[#1f2329] mt-2 font-primary">
            {selectedMission.title}
          </h4>

          <div className="space-y-2 mt-3 text-sm text-[#3f4650]">
            <p className="flex items-start gap-2">
              <MapPin size={15} className="text-blue-950 mt-0.5" />
              {selectedMission.address}
            </p>
            <p className="flex items-start gap-2">
              <UserRound size={15} className="text-blue-950 mt-0.5" />
              Người báo tin: {selectedMission.requester}
            </p>
            <p className="flex items-start gap-2">
              <Phone size={15} className="text-blue-950 mt-0.5" />
              Số liên hệ: {selectedMission.phone}
            </p>
            <p className="flex items-start gap-2">
              <Users size={15} className="text-blue-950 mt-0.5" />
              Đơn vị tiếp nhận: {selectedMission.assignedTeam}
            </p>
          </div>

          <p className="mt-3 text-sm text-[#3f4650] leading-relaxed">
            {selectedMission.summary}
          </p>
        </div>

        <form className="mt-5 space-y-3" onSubmit={handleSubmitReport}>
          <h3 className="text-sm uppercase tracking-[0.16em] font-bold text-on-surface-variant font-primary">
            Cập nhật trạng thái và báo cáo kết quả
          </h3>

          {submitError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
              <AlertCircle
                size={16}
                className="text-red-600 mt-0.5 flex-shrink-0"
              />
              <p className="text-xs text-red-700">{submitError}</p>
            </div>
          )}

          <label className="block text-xs font-semibold text-on-surface-variant">
            Trạng thái thực hiện
            <select
              value={selectedReportStatus}
              onChange={(event) =>
                onStatusChange(event.target.value as MissionStatus)
              }
              className="w-full mt-1 rounded-lg border border-[#c7ced7] bg-[#eef2f5] px-3 py-2 text-sm"
            >
              {allowedStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold text-on-surface-variant">
            Báo cáo hiện trường
            <textarea
              value={reportText}
              onChange={(event) => setReportText(event.target.value)}
              rows={3}
              placeholder="Nhập diễn biến, kết quả xử lý, nhu cầu hỗ trợ bổ sung..."
              className="w-full mt-1 rounded-lg border border-[#c7ced7] bg-[#eef2f5] px-3 py-2 text-sm resize-none"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#007399] hover:bg-[#006483] disabled:bg-slate-400 text-white py-3 font-black font-primary text-lg shadow-md transition-colors"
          >
            {isSubmitting ? "Đang gửi..." : "Gửi cập nhật cứu hộ"}
          </button>
        </form>

        <div className="mt-5 space-y-3">
          <h3 className="text-sm uppercase tracking-[0.16em] font-bold text-on-surface-variant font-primary">
            Yêu cầu hủy nhiệm vụ
          </h3>

          {abortError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
              <AlertCircle
                size={16}
                className="text-red-600 mt-0.5 flex-shrink-0"
              />
              <p className="text-xs text-red-700">{abortError}</p>
            </div>
          )}

          {abortSuccessMessage && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
              <p className="text-xs text-emerald-700">{abortSuccessMessage}</p>
            </div>
          )}

          <label className="block text-xs font-semibold text-on-surface-variant">
            Lý do hủy
            <select
              value={abortReasonCode}
              onChange={(event) => setAbortReasonCode(event.target.value)}
              className="w-full mt-1 rounded-lg border border-[#c7ced7] bg-[#eef2f5] px-3 py-2 text-sm"
            >
              <option value="RESOURCE_LIMIT">Thiếu nguồn lực</option>
              <option value="SAFETY_RISK">Rủi ro an toàn</option>
              <option value="WEATHER_CONDITION">Điều kiện thời tiết</option>
              <option value="OTHER">Khác</option>
            </select>
          </label>

          <label className="block text-xs font-semibold text-on-surface-variant">
            Chi tiết lý do hủy
            <textarea
              value={abortDetailNote}
              onChange={(event) => setAbortDetailNote(event.target.value)}
              rows={3}
              placeholder="Mô tả lý do cần hủy nhiệm vụ..."
              className="w-full mt-1 rounded-lg border border-[#c7ced7] bg-[#eef2f5] px-3 py-2 text-sm resize-none"
            />
          </label>

          <button
            type="button"
            onClick={handleSubmitAbortRequest}
            disabled={isAbortSubmitting}
            className="w-full rounded-xl bg-[#ba1a1a] hover:bg-[#8f1515] disabled:bg-slate-400 text-white py-3 font-black font-primary text-lg shadow-md transition-colors"
          >
            {isAbortSubmitting ? "Đang gửi yêu cầu..." : "Gửi yêu cầu hủy"}
          </button>
        </div>

        <div className="mt-5">
          <h3 className="text-sm uppercase tracking-[0.16em] font-bold text-on-surface-variant font-primary mb-3">
            Nhật ký cập nhật
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {currentLogs.length > 0 ? (
              currentLogs.map((log) => (
                <div
                  key={log.id}
                  className="text-xs rounded-lg bg-[#eef2f5] p-2.5 border-l-2 border-blue-950"
                >
                  <p className="font-bold text-[#1f2329]">{log.time}</p>
                  <p className="text-[#3f4650] mt-1">{log.content}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-on-surface-variant text-center py-2">
                Chưa có cập nhật
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
