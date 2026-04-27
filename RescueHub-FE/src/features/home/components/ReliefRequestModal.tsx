import React, { useEffect, useMemo, useRef, useState } from "react";
import { Send, X, MapPin } from "lucide-react";
import { toast } from "react-toastify";
import { createPublicReliefRequest } from "../../../shared/services/publicApi";
import { getAuthSession } from "../../auth/services/authStorage";

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

interface ReliefRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRequesterName?: string;
  defaultRequesterPhone?: string;
  defaultLocation?: Coordinate;
  defaultAddress?: string;
  lockRequesterInfo?: boolean;
}

export const ReliefRequestModal: React.FC<ReliefRequestModalProps> = ({
  isOpen,
  onClose,
  defaultRequesterName,
  defaultRequesterPhone,
  defaultLocation,
  defaultAddress,
  lockRequesterInfo = false,
}) => {
  const addressSearchDebounceRef = useRef<number | null>(null);

  const [requesterName, setRequesterName] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [householdCount, setHouseholdCount] = useState(1);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const [addressText, setAddressText] = useState(defaultAddress ?? "");
  const [addressSuggestions, setAddressSuggestions] = useState<
    AddressSuggestion[]
  >([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);

  const currentLocation = useMemo<Coordinate>(
    () =>
      defaultLocation ?? {
        lat: 10.7769,
        lng: 106.7009,
      },
    [defaultLocation],
  );

  const currentLocationAddress = useMemo(() => {
    if (defaultAddress && defaultAddress.trim().length > 0) {
      return defaultAddress.trim();
    }
    return `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`;
  }, [defaultAddress, currentLocation.lat, currentLocation.lng]);

  const currentLocationOption = useMemo<AddressSuggestion>(
    () => ({
      id: "current-location",
      label: `Vị trí hiện tại của bạn`,
      value: currentLocationAddress,
    }),
    [currentLocationAddress, currentLocation.lat, currentLocation.lng],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setRequesterName(defaultRequesterName?.trim() ?? "");
    setRequesterPhone(defaultRequesterPhone?.trim() ?? "");
    setAddressText(defaultAddress ?? "");
    setSubmitError("");
    setSubmitSuccess("");
  }, [isOpen, defaultRequesterName, defaultRequesterPhone, defaultAddress]);

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
          lat: string;
          lon: string;
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
    () => [
      currentLocationOption,
      ...addressSuggestions.filter(
        (item) => item.value !== currentLocationOption.value,
      ),
    ],
    [addressSuggestions, currentLocationOption],
  );

  if (!isOpen) {
    return null;
  }

  const canSubmit =
    requesterName.trim().length > 0 && requesterPhone.trim().length > 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedRequesterPhone = requesterPhone.trim();

    if (!canSubmit) {
      setSubmitError("Vui lòng nhập tên người yêu cầu và số điện thoại.");
      return;
    }

    if (!PHONE_REGEX.test(normalizedRequesterPhone)) {
      setSubmitError("Số điện thoại phải gồm đúng 10 chữ số.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    const payload = {
      requesterName: requesterName.trim(),
      requesterPhone: normalizedRequesterPhone,
      householdCount,
      note: note.trim(),
      location: {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        addressText: addressText.trim(),
        landmark: "",
      },
    };

    try {
      const accessToken = getAuthSession()?.accessToken?.trim();
      const response = await createPublicReliefRequest(payload, accessToken);
      setSubmitSuccess(
        `Đã tạo yêu cầu cứu trợ thành công. Mã theo dõi: ${response.requestCode}`,
      );
      toast.success(
        `Đã tạo yêu cầu cứu trợ thành công. Mã theo dõi: ${response.requestCode}`,
      );
      setRequesterName(defaultRequesterName?.trim() ?? "");
      setRequesterPhone(defaultRequesterPhone?.trim() ?? "");
      setHouseholdCount(1);
      setNote("");
      setAddressText(defaultAddress ?? "");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Tạo yêu cầu cứu trợ thất bại.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[125] bg-black/55 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-2xl">
        <div className="sticky top-0 z-20 bg-surface-container-lowest/95 backdrop-blur-sm px-6 py-4 border-b border-outline-variant/10 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface">
              Tạo yêu cầu cứu trợ
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Nhập thông tin hộ dân cần hỗ trợ.
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest">
                Người yêu cầu
              </label>
              <input
                value={requesterName}
                onChange={(event) => setRequesterName(event.target.value)}
                readOnly={lockRequesterInfo}
                className="w-full bg-surface-container-high border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                placeholder="Nhập họ tên"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest">
                Số điện thoại
              </label>
              <input
                value={requesterPhone}
                onChange={(event) => {
                  const digitsOnly = event.target.value.replace(/\D/g, "");
                  setRequesterPhone(digitsOnly.slice(0, 10));
                }}
                readOnly={lockRequesterInfo}
                inputMode="numeric"
                maxLength={10}
                className="w-full bg-surface-container-high border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest">
                Số hộ dân
              </label>
              <input
                type="number"
                min={1}
                value={householdCount}
                onChange={(event) =>
                  setHouseholdCount(
                    Math.max(1, Number(event.target.value) || 1),
                  )
                }
                className="w-full bg-surface-container-high border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

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
                className="w-full bg-surface-container-high border-none rounded-xl p-4 pl-12 text-on-surface focus:ring-2 focus:ring-primary"
                placeholder="Nhập địa chỉ để tìm kiếm..."
              />
              <MapPin
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
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

          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest">
              Ghi chú
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="w-full bg-surface-container-high border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              placeholder="Mô tả nhu cầu cứu trợ"
            />
          </div>

          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
              {submitSuccess}
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
              {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu cứu trợ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
