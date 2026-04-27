import React, { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, X, Search } from "lucide-react";

export interface AddressSuggestion {
  id: string;
  display: string;
  address: string;
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Using Nominatim (OpenStreetMap) - free, no API key required
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const LOCATION_HINTS = [
  "ho chi minh",
  "hcm",
  "tp hcm",
  "ha noi",
  "hn",
  "da nang",
  "can tho",
  "hai phong",
];

const removeDiacritics = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const hasLocationHint = (query: string) => {
  const normalized = removeDiacritics(query);
  return LOCATION_HINTS.some((hint) => normalized.includes(hint));
};

async function fetchNominatimSuggestions(query: string) {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    limit: "8",
    countrycodes: "vn",
  });

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: {
      "Accept-Language": "vi",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Nhập địa chỉ...",
  disabled = false,
}: AddressAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external value changes
  useEffect(() => {
    setSearch(value);
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!search.trim() || search.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      void searchAddress(search);
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search]);

  const searchAddress = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const primaryData = await fetchNominatimSuggestions(query);

      let combinedData: any[] = Array.isArray(primaryData) ? primaryData : [];
      const normalizedQuery = removeDiacritics(query);
      const shouldBoostHcm =
        normalizedQuery.includes("fpt") && !hasLocationHint(normalizedQuery);

      if (shouldBoostHcm) {
        const hcmData = await fetchNominatimSuggestions(`${query} Ho Chi Minh`);
        if (Array.isArray(hcmData) && hcmData.length > 0) {
          combinedData = [...combinedData, ...hcmData];
        }
      }

      if (combinedData.length > 0) {
        const uniqueByPlaceId = new Map<string, any>();
        combinedData.forEach((item: any, index: number) => {
          const key =
            item?.place_id != null ? String(item.place_id) : `${index}`;
          if (!uniqueByPlaceId.has(key)) {
            uniqueByPlaceId.set(key, item);
          }
        });

        const dedupedData = Array.from(uniqueByPlaceId.values());

        const results: AddressSuggestion[] = dedupedData.map(
          (item: any, index: number) => {
            // Build formatted address from components
            const addr = item.address || {};
            const parts = [
              item.house_number,
              addr.road || addr.pedestrian || addr.footway || addr.cycleway,
              addr.neighbourhood || addr.suburb || addr.quarter,
              addr.village ||
                addr.town ||
                addr.city_district ||
                addr.city ||
                addr.municipality,
              addr.county,
              addr.state,
            ].filter(Boolean);

            const displayAddress =
              parts.length > 0 ? parts.join(", ") : item.display_name;
            const shortAddress = displayAddress
              .split(", ")
              .slice(0, 5)
              .join(", ");

            return {
              id: item.place_id?.toString() ?? String(index),
              display: shortAddress,
              address: shortAddress,
              lat: parseFloat(item.lat) || 0,
              lng: parseFloat(item.lon) || 0,
            };
          },
        );

        if (shouldBoostHcm) {
          const hcmKeywords = ["ho chi minh", "hcm", "sai gon", "thu duc"];
          results.sort((a, b) => {
            const aNorm = removeDiacritics(a.address);
            const bNorm = removeDiacritics(b.address);
            const aHasHcm = hcmKeywords.some((k) => aNorm.includes(k));
            const bHasHcm = hcmKeywords.some((k) => bNorm.includes(k));
            if (aHasHcm === bHasHcm) return 0;
            return aHasHcm ? -1 : 1;
          });
        }

        setSuggestions(results.slice(0, 8));
        if (results.length > 0) {
          setIsOpen(true);
        }
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Address search error:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (suggestion: AddressSuggestion) => {
    setSearch(suggestion.address);
    onChange(suggestion.address);
    onSelect(suggestion);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    setSearch("");
    onChange("");
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    onChange(val);
    if (val.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full border border-gray-200 rounded-lg pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:border-green-400 bg-white disabled:bg-gray-100"
        />
        {loading && (
          <Loader2
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
          />
        )}
        {!loading && search && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
          >
            <X size={14} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full px-3 py-2.5 text-left hover:bg-green-50 transition-colors border-b border-gray-50 last:border-b-0"
            >
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    {suggestion.address}
                  </p>
                  <p className="text-xs text-gray-400">
                    {suggestion.lat.toFixed(5)}, {suggestion.lng.toFixed(5)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && search.length >= 3 && !loading && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
          <p className="text-sm text-gray-400">Không tìm thấy địa chỉ</p>
          <p className="text-[10px] text-gray-300 mt-1">
            Thử nhập địa chỉ cụ thể hơn (vd: "123 Lê Lợi, Ninh Kiều, Cần Thơ")
          </p>
        </div>
      )}
    </div>
  );
}
