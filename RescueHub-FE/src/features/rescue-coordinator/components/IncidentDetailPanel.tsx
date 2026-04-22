import React, { useState } from "react";
import {
  MapPin,
  Phone,
  User,
  Clock,
  AlertTriangle,
  Flame,
  Radio,
  Users,
  Heart,
  Shield,
  Navigation,
  FileText,
  Info,
  ChevronLeft,
  ChevronRight,
  ImageOff,
} from "lucide-react";
import type { IncidentDetail } from "../services/incidentServices";
import { IncidentMiniMap } from "./IncidentMiniMap";
import incidentPlaceholder from "../../../assets/incident-placeholder.png";

interface IncidentDetailPanelProps {
  detail: IncidentDetail;
  onVerify: () => void;
  onAssess: () => void;
  onDispatch: () => void;
  requestStatus: string;
  handlingTeams?: Array<{
    teamId: string;
    teamCode: string;
    teamName: string;
    isPrimaryTeam: boolean;
    missionId: string;
    missionCode: string;
    missionStatusCode: string;
    assignedAt: string;
  }>;
  onFollowMission?: () => void;
}

const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  CRITICAL: {
    label: "Rất nghiêm trọng",
    color: "text-red-700",
    bg: "bg-red-100",
    border: "border-red-300",
    dot: "bg-red-500",
  },
  HIGH: {
    label: "Cao",
    color: "text-orange-700",
    bg: "bg-orange-100",
    border: "border-orange-300",
    dot: "bg-orange-500",
  },
  MEDIUM: {
    label: "Trung bình",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
    border: "border-yellow-300",
    dot: "bg-yellow-500",
  },
  LOW: {
    label: "Thấp",
    color: "text-blue-700",
    bg: "bg-blue-100",
    border: "border-blue-300",
    dot: "bg-blue-500",
  },
};

const INCIDENT_TYPE_ICON: Record<string, React.ReactNode> = {
  FLOOD: <Flame size={14} />,
  FIRE: <Flame size={14} />,
  ACCIDENT: <AlertTriangle size={14} />,
};

function getPriorityConfig(code?: string | null) {
  return PRIORITY_CONFIG[code ?? ""] ?? PRIORITY_CONFIG["MEDIUM"];
}

function formatTime(isoDate: string) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Mission status helpers
const getMissionStatusColor = (missionStatusCode: string): string => {
  const colors: Record<string, string> = {
    EN_ROUTE: "bg-blue-500",
    ON_SITE: "bg-amber-500",
    RESCUING: "bg-red-500",
    IN_PROGRESS: "bg-amber-500",
    COMPLETED: "bg-green-500",
    RETURNING: "bg-gray-500",
    ASSIGNED: "bg-indigo-500",
    DISPATCHED: "bg-blue-500",
  };
  return colors[missionStatusCode] || "bg-gray-500";
};

const getMissionStatusLabel = (missionStatusCode: string): string => {
  const labels: Record<string, string> = {
    EN_ROUTE: "Đang di chuyển",
    ON_SITE: "Tại hiện trường",
    RESCUING: "Đang cứu hộ",
    IN_PROGRESS: "Đang xử lý",
    COMPLETED: "Hoàn thành",
    RETURNING: "Đang quay về",
    ASSIGNED: "Đã phân công",
    DISPATCHED: "Đã điều phối",
  };
  return labels[missionStatusCode] || missionStatusCode;
};

// ─── Image Gallery Component ───────────────────────────────────────────────────
interface ImageGalleryProps {
  images: Array<{ fileId: string; url: string }>;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [current, setCurrent] = useState(0);
  const [errored, setErrored] = useState<Record<number, boolean>>({});

  if (images.length === 0) {
    return (
      <div
        className="relative rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center bg-gray-50"
        style={{ height: 140 }}
      >
        <img
          src={incidentPlaceholder}
          alt="Ảnh minh họa"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <p className="absolute bottom-2 left-3 text-white text-xs font-semibold opacity-80">
          Chưa có ảnh hiện trường
        </p>
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);
  const isErr = errored[current];

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-gray-100 shadow-sm"
      style={{ height: 160 }}
    >
      {isErr ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 gap-2">
          <ImageOff size={24} className="text-gray-400" />
          <p className="text-xs text-gray-400">Không thể tải ảnh</p>
        </div>
      ) : (
        <img
          key={images[current].fileId}
          src={images[current].url}
          alt={`Ảnh hiện trường ${current + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={() => setErrored((p) => ({ ...p, [current]: true }))}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

      {/* Nav buttons — only if more than 1 image */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-2">
        <p className="text-white text-xs font-semibold drop-shadow">
          Ảnh hiện trường
        </p>
        {images.length > 1 && (
          <div className="flex items-center gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === current ? "bg-white w-3" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
        <span className="text-white/70 text-[10px] font-mono">
          {current + 1}/{images.length}
        </span>
      </div>
    </div>
  );
};

export const IncidentDetailPanel: React.FC<IncidentDetailPanelProps> = ({
  detail,
  onVerify,
  onAssess,
  onDispatch,
  requestStatus,
  handlingTeams,
  onFollowMission,
}) => {
  const priority = getPriorityConfig(detail.severity?.code);
  const hasLocation = detail.location?.lat && detail.location?.lng;
  const hasHandlingTeams = handlingTeams && handlingTeams.length > 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ gap: 0 }}>
      {/* ── Header Badge ── */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Mã sự cố
            </p>
            <h2 className="text-xl font-bold text-gray-800 leading-tight">
              {detail.incidentCode}
            </h2>
          </div>

          {/* Priority Badge - Simplified */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium flex-shrink-0 border border-gray-200 text-gray-700">
            <span className={`w-2 h-2 rounded-full ${priority.dot}`} />
            {priority.label}
          </div>
        </div>

        {/* Incident type row - Simplified */}
        <div className="flex items-center gap-2 mt-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
            {INCIDENT_TYPE_ICON[detail.incidentType?.code ?? ""] ?? (
              <AlertTriangle size={14} />
            )}
            {detail.incidentType?.name ?? "Chưa phân loại"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 ml-2">
            <Radio size={12} />
            {detail.channel?.name ?? "—"}
          </span>
          {detail.isSOS && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-medium ml-2">
              🆘 SOS
            </span>
          )}
        </div>
      </div>

      {/* ── Incident Image Gallery ── */}
      <div className="mx-5 my-3">
        <ImageGallery
          images={(detail.files ?? []).filter((f) => f.contentType === "IMAGE")}
        />
      </div>

      {/* ── Mini Map ── */}
      <div className="mx-5 mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Navigation size={13} className="text-gray-500" />
          <p className="text-xs text-gray-500 uppercase">Vị trí sự cố</p>
        </div>
        <div
          className="rounded-lg overflow-hidden border border-gray-200"
          style={{ height: 180 }}
        >
          {hasLocation ? (
            <IncidentMiniMap
              lat={detail.location.lat}
              lng={detail.location.lng}
              addressText={detail.location.addressText}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <MapPin className="text-gray-400" size={24} />
            </div>
          )}
        </div>
        {/* Address below map */}
        <div className="mt-2 flex items-start gap-2">
          <MapPin size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-700">
              {detail.location?.addressText ?? "Chưa có địa chỉ"}
            </p>
            {detail.location?.landmark && (
              <p className="text-xs text-gray-500">
                {detail.location.landmark}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-5 border-t border-gray-100 mb-3" />

      {/* ── Reporter ── */}
      <div className="mx-5 mb-3 border border-gray-100 rounded-lg p-3">
        <p className="text-xs text-gray-500 uppercase mb-2">Người báo cáo</p>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-gray-500" />
          </div>
          <div>
            <p className="text-sm text-gray-700">
              {detail.reporter?.name ?? "Chưa cập nhật"}
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Phone size={11} />
              <span>{detail.reporter?.phone ?? "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Victim Stats ── */}
      <div className="mx-5 mb-3 grid grid-cols-3 gap-2">
        <div className="border border-gray-200 rounded-lg p-2.5 text-center">
          <Users size={14} className="text-gray-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-700">
            {detail.victimCountEstimate ?? 0}
          </p>
          <p className="text-xs text-gray-500 leading-tight">Nạn nhân</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-2.5 text-center">
          <Heart size={14} className="text-gray-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-700">
            {detail.injuredCountEstimate ?? 0}
          </p>
          <p className="text-xs text-gray-500 leading-tight">Bị thương</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-2.5 text-center">
          <Shield size={14} className="text-gray-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-700">
            {detail.vulnerableCountEstimate ?? 0}
          </p>
          <p className="text-xs text-gray-500 leading-tight">Dễ tổn thương</p>
        </div>
      </div>

      {/* ── Handling Teams ── */}
      {hasHandlingTeams && (
        <div className="mx-5 mb-3 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600 uppercase">
              Đội đang xử lý ({handlingTeams?.length})
            </p>
            {onFollowMission && (
              <button
                onClick={onFollowMission}
                className="text-xs px-2 py-1 bg-gray-700 text-white rounded font-medium hover:bg-gray-800 transition-colors flex items-center gap-1"
              >
                <span>📍</span>
                Theo dõi
              </button>
            )}
          </div>
          <div className="space-y-2">
            {handlingTeams?.map((team) => (
              <div
                key={team.teamId}
                className="flex items-center justify-between bg-white rounded p-2 border border-gray-100"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Users size={12} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      {team.teamName}
                      {team.isPrimaryTeam && (
                        <span className="ml-1 text-[10px] px-1 py-0.5 bg-gray-100 text-gray-700 rounded">
                          Chính
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{team.teamCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {team.missionCode}
                  </span>
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${getMissionStatusColor(team.missionStatusCode)}`}
                    title={getMissionStatusLabel(team.missionStatusCode)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Time & Description ── */}
      <div className="mx-5 mb-3 space-y-2">
        <div className="flex items-start gap-2">
          <Clock size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Thời gian tiếp nhận</p>
            <p className="text-sm text-gray-700">
              {formatTime(detail.reportedAt)}
            </p>
          </div>
        </div>

        {detail.description && (
          <div className="flex items-start gap-2">
            <FileText
              size={13}
              className="text-gray-400 mt-0.5 flex-shrink-0"
            />
            <div>
              <p className="text-xs text-gray-500">Mô tả</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {detail.description}
              </p>
            </div>
          </div>
        )}

        {detail.needRelief && (
          <div className="flex items-center gap-2 px-3 py-2 rounded border border-gray-200">
            <Info size={13} className="text-gray-600 flex-shrink-0" />
            <p className="text-xs text-gray-700">Cần hỗ trợ cứu trợ khẩn cấp</p>
          </div>
        )}
      </div>

      {/* ── Spacer push buttons to bottom ── */}
      <div className="flex-1" />

      {/* ── Action Buttons ── */}
      <div className="px-5 py-4 border-t border-gray-100 space-y-2 bg-white">
        {requestStatus === "dispatched" ? (
          /* Only show Follow Mission button when status is dispatched */
          hasHandlingTeams &&
          onFollowMission && (
            <button
              onClick={onFollowMission}
              className="w-full bg-gray-800 text-white font-medium py-2.5 rounded text-sm transition-all hover:bg-gray-700 flex items-center justify-center gap-2"
            >
              <span>📍</span>
              Theo dõi nhiệm vụ
            </button>
          )
        ) : (
          /* Show all action buttons for other statuses */
          <>
            <button
              onClick={onVerify}
              className="w-full bg-gray-800 text-white font-medium py-2.5 rounded text-sm transition-all hover:bg-gray-700"
            >
              Xác minh thông tin
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onAssess}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-medium py-2.5 rounded text-sm transition-all"
              >
                Đánh giá mức độ
              </button>
              <button
                onClick={onDispatch}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-medium py-2.5 rounded text-sm transition-all"
              >
                Điều phối ngay
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
