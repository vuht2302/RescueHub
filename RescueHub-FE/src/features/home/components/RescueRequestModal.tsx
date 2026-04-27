import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Camera, Trash2, Send } from "lucide-react";
import { toast } from "react-toastify";
import {
  createPublicIncident,
  getPublicRescueForm,
  type BootstrapIncidentType,
} from "../../../shared/services/publicApi";
import { uploadIncidentMedia } from "../../tracking/services/upload.services";

type Coordinate = {
  lat: number;
  lng: number;
};

type AddressSuggestion = {
  id: string;
  label: string;
  value: string;
};

const PHONE_REGEX = /^\d{10}$/;

interface RescueRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLocation: Coordinate;
  defaultAddress?: string;
  defaultReporterName?: string;
  defaultReporterPhone?: string;
  lockReporterInfo?: boolean;
  onSubmitted?: (trackingCode: string) => void;
}

export const RescueRequestModal: React.FC<RescueRequestModalProps> = ({
  isOpen,
  onClose,
  defaultLocation,
  defaultAddress,
  defaultReporterName,
  defaultReporterPhone,
  lockReporterInfo = false,
  onSubmitted,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addressSearchDebounceRef = useRef<number | null>(null);

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
  const [addressSuggestions, setAddressSuggestions] = useState<
    AddressSuggestion[]
  >([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const [isLoadingCurrentAddress, setIsLoadingCurrentAddress] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadBootstrap = async () => {
      try {
        const formData = await getPublicRescueForm();
        const nextIncidentTypes = Array.isArray(formData.incidentTypes)
          ? formData.incidentTypes
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

    const fetchAddressFromCoords = async () => {
      if (
        defaultAddress &&
        defaultAddress.trim().length > 0 &&
        !defaultAddress.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/)
      ) {
        setAddressText(defaultAddress.trim());
        return;
      }

      setIsLoadingCurrentAddress(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${defaultLocation.lat}&lon=${defaultLocation.lng}&accept-language=vi`,
          {
            headers: {
              "Accept-Language": "vi",
            },
          },
        );

        if (response.ok) {
          const data = (await response.json()) as { display_name?: string };
          if (data.display_name) {
            setAddressText(data.display_name);
            return;
          }
        }
        setAddressText("");
      } catch {
        setAddressText("");
      } finally {
        setIsLoadingCurrentAddress(false);
      }
    };

    void fetchAddressFromCoords();
  }, [isOpen, defaultAddress, defaultLocation.lat, defaultLocation.lng]);

  useEffect(() => {
    if (!isOpen) return;
    setReporterName(defaultReporterName?.trim() ?? "");
    setReporterPhone(
      (defaultReporterPhone?.trim() ?? "").replace(/\D/g, "").slice(0, 10),
    );
  }, [defaultReporterName, defaultReporterPhone, isOpen]);

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
    PHONE_REGEX.test(reporterPhone.trim()) &&
    description.trim().length > 0;

  useEffect(() => {
    if (!isOpen) return;

    const query = addressText.trim();

    if (addressSearchDebounceRef.current) {
      window.clearTimeout(addressSearchDebounceRef.current);
      addressSearchDebounceRef.current = null;
    }

    if (query.length < 3) {
      setAddressSuggestions([]);
      setIsSearchingAddress(false);
      return;
    }

    const controller = new AbortController();
    setIsSearchingAddress(true);

    addressSearchDebounceRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=vn&q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
            headers: {
              "Accept-Language": "vi",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Search address failed");
        }

        const data = (await response.json()) as Array<{
          place_id: number;
          display_name: string;
        }>;

        const nextSuggestions = data
          .filter((item) => item.display_name)
          .map((item) => ({
            id: String(item.place_id),
            label: item.display_name,
            value: item.display_name,
          }));

        setAddressSuggestions(nextSuggestions);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setAddressSuggestions([]);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 350);

    return () => {
      controller.abort();
      if (addressSearchDebounceRef.current) {
        window.clearTimeout(addressSearchDebounceRef.current);
        addressSearchDebounceRef.current = null;
      }
    };
  }, [addressText, isOpen]);

  const mergedAddressSuggestions = useMemo(
    () => addressSuggestions,
    [addressSuggestions],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedReporterPhone = reporterPhone.trim();

    if (!canSubmit) {
      setSubmitError(
        "Vui lòng nhập đầy đủ loại sự cố, họ tên, số điện thoại và mô tả.",
      );
      return;
    }

    if (!PHONE_REGEX.test(normalizedReporterPhone)) {
      setSubmitError("Số điện thoại phải gồm đúng 10 chữ số.");
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

      const response = await createPublicIncident({
        incidentTypeCode: incidentTypeCode.trim(),
        reporterName: reporterName.trim(),
        reporterPhone: normalizedReporterPhone,
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

      toast.success(
        `Đã tạo yêu cầu cứu hộ thành công. Mã theo dõi: ${response.trackingCode}`,
      );
      onSubmitted?.(response.trackingCode);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gửi yêu cầu thất bại";
      setSubmitError(message);
      toast.error(message);
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
              Vị trí hiện tại:{" "}
              {isLoadingCurrentAddress ? (
                <span className="italic">Đang xác định địa chỉ...</span>
              ) : addressText ? (
                addressText
              ) : (
                "Chưa xác định địa chỉ"
              )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest">
                Họ tên người báo
              </label>
              <input
                value={reporterName}
                onChange={(event) => setReporterName(event.target.value)}
                readOnly={lockReporterInfo}
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
                onChange={(event) => {
                  const digitsOnly = event.target.value.replace(/\D/g, "");
                  setReporterPhone(digitsOnly.slice(0, 10));
                }}
                readOnly={lockReporterInfo}
                inputMode="numeric"
                maxLength={10}
                className="w-full bg-surface-container-high border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                placeholder="Nhập số điện thoại"
              />
            </div>
          </div>

          <div className="grid grid-cols-1  gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest">
                Địa chỉ
              </label>
              <div className="relative">
                <input
                  value={addressText}
                  onChange={(event) => {
                    setAddressText(event.target.value);
                    setIsAddressDropdownOpen(true);
                  }}
                  onFocus={() => setIsAddressDropdownOpen(true)}
                  onBlur={() => {
                    window.setTimeout(
                      () => setIsAddressDropdownOpen(false),
                      120,
                    );
                  }}
                  className="w-full bg-surface-container-high border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                  placeholder="Nhập địa chỉ để tìm kiếm..."
                />

                {isAddressDropdownOpen && (
                  <div className="absolute z-30 mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container shadow-lg overflow-hidden">
                    {isSearchingAddress && (
                      <div className="px-4 py-3 text-sm text-on-surface-variant">
                        Đang tìm địa chỉ...
                      </div>
                    )}

                    {!isSearchingAddress &&
                      mergedAddressSuggestions.length === 0 && (
                        <div className="px-4 py-3 text-sm text-on-surface-variant">
                          Nhập ít nhất 3 ký tự để tìm địa chỉ
                        </div>
                      )}

                    {!isSearchingAddress &&
                      mergedAddressSuggestions.length > 0 && (
                        <ul className="max-h-60 overflow-y-auto py-1">
                          {mergedAddressSuggestions.map((item) => (
                            <li key={item.id}>
                              <button
                                type="button"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  setAddressText(item.value);
                                  setIsAddressDropdownOpen(false);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-on-surface hover:bg-surface-container-high"
                              >
                                {item.label}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>
                )}
              </div>
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
