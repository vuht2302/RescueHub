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
    <div className="relative rounded-xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: 160 }}>
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
        <p className="text-white text-xs font-semibold drop-shadow">Ảnh hiện trường</p>
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
}) => {
  const priority = getPriorityConfig(detail.severity?.code);
  const hasLocation = detail.location?.lat && detail.location?.lng;

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ gap: 0 }}>
      {/* ── Header Badge ── */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Mã sự cố
            </p>
            <h2 className="text-xl font-black text-gray-900 leading-tight">
              {detail.incidentCode}
            </h2>
          </div>

          {/* Priority Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold flex-shrink-0 ${priority.bg} ${priority.color} ${priority.border}`}
          >
            <span className={`w-2 h-2 rounded-full ${priority.dot}`} />
            {priority.label}
          </div>
        </div>

        {/* Incident type row */}
        <div className="flex items-center gap-2 mt-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">
            {INCIDENT_TYPE_ICON[detail.incidentType?.code ?? ""] ?? (
              <AlertTriangle size={14} />
            )}
            {detail.incidentType?.name ?? "Chưa phân loại"}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">
            <Radio size={12} />
            {detail.channel?.name ?? "—"}
          </span>
          {detail.isSOS && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-600 text-white text-xs font-bold animate-pulse">
              🆘 SOS
            </span>
          )}
        </div>
      </div>

      {/* ── Incident Image Gallery ── */}
      <div className="mx-5 mb-3">
        <ImageGallery
          images={(detail.files ?? []).filter((f) => f.contentType === "IMAGE")}
        />
      </div>

      {/* ── Mini Map ── */}
      <div className="mx-5 mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Navigation size={13} className="text-gray-500" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Vị trí sự cố
          </p>
        </div>
        <div
          className="rounded-xl overflow-hidden border border-gray-200 shadow-sm"
          style={{ height: 180 }}
        >
          {hasLocation ? (
            <IncidentMiniMap
              lat={detail.location.lat}
              lng={detail.location.lng}
              addressText={detail.location.addressText}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <MapPin className="text-gray-400" size={24} />
            </div>
          )}
        </div>
        {/* Address below map */}
        <div className="mt-2 flex items-start gap-2">
          <MapPin size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {detail.location?.addressText ?? "Chưa có địa chỉ"}
            </p>
            {detail.location?.landmark && (
              <p className="text-xs text-gray-500">
                🏛 {detail.location.landmark}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-5 border-t border-gray-100 mb-3" />

      {/* ── Reporter ── */}
      <div className="mx-5 mb-3 bg-gray-50 rounded-xl p-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Người báo cáo
        </p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              {detail.reporter?.name ?? "Chưa cập nhật"}
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Phone size={11} />
              <span>{detail.reporter?.phone ?? "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Victim Stats ── */}
      <div className="mx-5 mb-3 grid grid-cols-3 gap-2">
        <div className="bg-red-50 rounded-lg p-2.5 text-center border border-red-100">
          <Users size={14} className="text-red-500 mx-auto mb-1" />
          <p className="text-lg font-black text-red-700">
            {detail.victimCountEstimate ?? 0}
          </p>
          <p className="text-xs text-red-600 font-medium leading-tight">
            Nạn nhân
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-2.5 text-center border border-orange-100">
          <Heart size={14} className="text-orange-500 mx-auto mb-1" />
          <p className="text-lg font-black text-orange-700">
            {detail.injuredCountEstimate ?? 0}
          </p>
          <p className="text-xs text-orange-600 font-medium leading-tight">
            Bị thương
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-2.5 text-center border border-blue-100">
          <Shield size={14} className="text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-black text-blue-700">
            {detail.vulnerableCountEstimate ?? 0}
          </p>
          <p className="text-xs text-blue-600 font-medium leading-tight">
            Dễ tổn thương
          </p>
        </div>
      </div>

      {/* ── Time & Description ── */}
      <div className="mx-5 mb-3 space-y-2">
        <div className="flex items-start gap-2">
          <Clock size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400 font-medium">
              Thời gian tiếp nhận
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {formatTime(detail.reportedAt)}
            </p>
          </div>
        </div>

        {detail.description && (
          <div className="flex items-start gap-2">
            <FileText size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400 font-medium">Mô tả</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {detail.description}
              </p>
            </div>
          </div>
        )}

        {detail.needRelief && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
            <Info size={13} className="text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700 font-semibold">
              ⚠️ Cần hỗ trợ cứu trợ khẩn cấp
            </p>
          </div>
        )}
      </div>

      {/* ── Spacer push buttons to bottom ── */}
      <div className="flex-1" />

      {/* ── Action Buttons ── */}
      <div className="px-5 py-4 border-t border-gray-100 space-y-2 bg-white">
        <button
          onClick={onVerify}
          className="w-full text-white font-bold py-2.5 rounded-xl text-sm transition-all active:scale-95 hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #1e3a5f, #1e40af)" }}
        >
           Xác minh thông tin
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onAssess}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-sm transition-all active:scale-95"
          >
             Đánh giá mức độ
          </button>
          <button
            onClick={onDispatch}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all active:scale-95"
          >
             Điều phối ngay
          </button>
        </div>
      </div>
    </div>
  );
};
