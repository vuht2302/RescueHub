import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Camera, Trash2, Send } from "lucide-react";
import {
  createPublicIncident,
  getPublicBootstrap,
  type BootstrapIncidentType,
  uploadIncidentMedia,
} from "../../../shared/services/publicApi";

type Coordinate = {
  lat: number;
  lng: number;
};

interface RescueRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLocation: Coordinate;
  defaultAddress?: string;
  onSubmitted?: () => void;
}

export const RescueRequestModal: React.FC<RescueRequestModalProps> = ({
  isOpen,
  onClose,
  defaultLocation,
  defaultAddress,
  onSubmitted,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [incidentTypes, setIncidentTypes] = useState<BootstrapIncidentType[]>(
    [],
  );
  const [incidentTypeCode, setIncidentTypeCode] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [description, setDescription] = useState("");
  const [victimCountEstimate, setVictimCountEstimate] = useState(1);
  const [injuredCountEstimate, setInjuredCountEstimate] = useState(0);
  const [vulnerableCountEstimate, setVulnerableCountEstimate] = useState(0);
  const [addressText, setAddressText] = useState(defaultAddress ?? "");
  const [landmark, setLandmark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const loadBootstrap = async () => {
      try {
        const bootstrapData = await getPublicBootstrap();
        const nextIncidentTypes = Array.isArray(
          bootstrapData.quickIncidentTypes,
        )
          ? bootstrapData.quickIncidentTypes
          : [];

        setIncidentTypes(nextIncidentTypes);
        setIncidentTypeCode(
          (current) => current || nextIncidentTypes[0]?.code || "",
        );
      } catch {
        // Keep fallback if bootstrap cannot be loaded.
      }
    };

    void loadBootstrap();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setAddressText(defaultAddress ?? "");
  }, [defaultAddress, isOpen]);

  const filePreviews = useMemo(
    () =>
      selectedFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [selectedFiles],
  );

  useEffect(() => {
    return () => {
      filePreviews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [filePreviews]);

  const handleSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const accepted = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );

    setSelectedFiles((prev) => [...prev, ...accepted]);
    event.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const canSubmit =
    incidentTypeCode.trim().length > 0 &&
    reporterName.trim().length > 0 &&
    reporterPhone.trim().length > 0 &&
    description.trim().length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit) {
      setSubmitError(
        "Vui lòng nhập đầy đủ loại sự cố, họ tên, số điện thoại và mô tả.",
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const uploadedFileIds: string[] = [];

      for (const file of selectedFiles) {
        const fileId = await uploadIncidentMedia(file);
        uploadedFileIds.push(fileId);
      }

      await createPublicIncident({
        incidentTypeCode: incidentTypeCode.trim(),
        reporterName: reporterName.trim(),
        reporterPhone: reporterPhone.trim(),
        description: description.trim(),
        victimCountEstimate,
        injuredCountEstimate,
        vulnerableCountEstimate,
        location: {
          lat: defaultLocation.lat,
          lng: defaultLocation.lng,
          addressText: addressText.trim(),
          landmark: landmark.trim(),
        },
        sceneDetails: [],
        fileIds: uploadedFileIds,
      });

      onSubmitted?.();
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Gửi yêu cầu thất bại",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/55 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-2xl">
        <div className="sticky top-0 z-20 bg-surface-container-lowest/95 backdrop-blur-sm px-6 py-4 border-b border-outline-variant/10 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface">
              Tạo yêu cầu cứu hộ
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Vị trí hiện tại: {defaultLocation.lat.toFixed(5)},{" "}
              {defaultLocation.lng.toFixed(5)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest">
              Loại sự cố
            </label>
            <select
              value={incidentTypeCode}
              onChange={(event) => setIncidentTypeCode(event.target.value)}
              className="w-full bg-surface-container-high border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
            >
              <option value="">Chọn loại sự cố</option>
              {incidentTypes.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest">
                Họ tên người báo
              </label>
              <input
                value={reporterName}
                onChange={(event) => setReporterName(event.target.value)}
                className="w-full bg-surface-container-high border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                placeholder="Nhập họ tên"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest">
                Số điện thoại
              </label>
              <input
                value={reporterPhone}
                onChange={(event) => setReporterPhone(event.target.value)}
                className="w-full bg-surface-container-high border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                placeholder="Nhập số điện thoại"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest">
                Số nạn nhân
              </label>
              <input
                type="number"
                min={0}
                value={victimCountEstimate}
                onChange={(event) =>
                  setVictimCountEstimate(Number(event.target.value) || 0)
                }
                className="w-full bg-surface-container-high border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest">
                Số người bị thương
              </label>
              <input
                type="number"
                min={0}
                value={injuredCountEstimate}
                onChange={(event) =>
                  setInjuredCountEstimate(Number(event.target.value) || 0)
                }
                className="w-full bg-surface-container-high border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest">
                Người dễ bị tổn thương
              </label>
              <input
                type="number"
                min={0}
                value={vulnerableCountEstimate}
                onChange={(event) =>
                  setVulnerableCountEstimate(Number(event.target.value) || 0)
                }
                className="w-full bg-surface-container-high border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest">
                Địa chỉ
              </label>
              <input
                value={addressText}
                onChange={(event) => setAddressText(event.target.value)}
                className="w-full bg-surface-container-high border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                placeholder="Số nhà, đường, phường/xã"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest">
                Mốc để nhận diện
              </label>
              <input
                value={landmark}
                onChange={(event) => setLandmark(event.target.value)}
                className="w-full bg-surface-container-high border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                placeholder="Gần cầu, trường học..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest">
              Chi tiết quan trọng
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full bg-surface-container-high border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary placeholder:text-on-surface-variant/60"
              placeholder="Mô tả tình huống hiện tại..."
              rows={4}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                Hình ảnh hiện trường
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-surface-container-high hover:bg-surface-container-highest px-3 py-2 rounded-lg text-sm font-semibold"
              >
                <Camera size={16} />
                Tải ảnh lên
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleSelectFiles}
              className="hidden"
            />

            {filePreviews.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {filePreviews.map((item, index) => (
                  <div
                    key={`${item.file.name}-${index}`}
                    className="relative aspect-square rounded-lg overflow-hidden"
                  >
                    <img
                      src={item.url}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-outline-variant/30 px-4 py-6 text-center text-sm text-on-surface-variant">
                Chưa có ảnh được chọn
              </div>
            )}
          </div>

          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl font-bold bg-surface-container-high hover:bg-surface-container-highest"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-primary to-primary-container text-on-primary disabled:opacity-60"
            >
              <Send size={16} />
              {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
