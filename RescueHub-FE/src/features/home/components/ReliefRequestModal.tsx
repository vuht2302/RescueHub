import React, { useState } from "react";
import { Plus, Send, Trash2, X } from "lucide-react";
import {
  createPublicReliefRequest,
  type PublicReliefRequest,
} from "../../../shared/services/publicApi";

type ReliefRequestItemInput = {
  supportTypeCode: string;
  requestedQty: number;
  unitCode: string;
};

interface ReliefRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const createEmptyItem = (): ReliefRequestItemInput => ({
  supportTypeCode: "",
  requestedQty: 1,
  unitCode: "",
});

export const ReliefRequestModal: React.FC<ReliefRequestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [requesterName, setRequesterName] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [householdCount, setHouseholdCount] = useState(1);
  const [note, setNote] = useState("");
  const [items, setItems] = useState<ReliefRequestItemInput[]>([
    createEmptyItem(),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  if (!isOpen) {
    return null;
  }

  const canSubmit =
    requesterName.trim().length > 0 &&
    requesterPhone.trim().length > 0 &&
    items.length > 0 &&
    items.every(
      (item) =>
        item.supportTypeCode.trim().length > 0 &&
        item.unitCode.trim().length > 0 &&
        item.requestedQty > 0,
    );

  const handleChangeItem = (
    index: number,
    patch: Partial<ReliefRequestItemInput>,
  ) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      setSubmitError(
        "Vui lòng nhập đầy đủ người yêu cầu và ít nhất một vật phẩm cứu trợ hợp lệ.",
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    const payload: PublicReliefRequest = {
      requesterName: requesterName.trim(),
      requesterPhone: requesterPhone.trim(),
      householdCount,
      note: note.trim(),
      items: items.map((item) => ({
        supportTypeCode: item.supportTypeCode.trim(),
        requestedQty: item.requestedQty,
        unitCode: item.unitCode.trim(),
      })),
    };

    try {
      const response = await createPublicReliefRequest(payload);
      setSubmitSuccess(
        `Đã tạo yêu cầu cứu trợ thành công. Mã theo dõi: ${response.requestCode}`,
      );
      setRequesterName("");
      setRequesterPhone("");
      setHouseholdCount(1);
      setNote("");
      setItems([createEmptyItem()]);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Tạo yêu cầu cứu trợ thất bại.",
      );
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
              Nhập thông tin hộ dân và vật phẩm cần hỗ trợ.
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
                onChange={(event) => setRequesterPhone(event.target.value)}
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">
                Danh sách vật phẩm
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-2 bg-surface-container-high hover:bg-surface-container-highest px-3 py-2 rounded-lg text-sm font-semibold"
              >
                <Plus size={16} />
                Thêm vật phẩm
              </button>
            </div>

            {items.map((item, index) => (
              <div
                key={`relief-item-${index}`}
                className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4 grid grid-cols-1 md:grid-cols-[1fr_140px_140px_auto] gap-3"
              >
                <input
                  value={item.supportTypeCode}
                  onChange={(event) =>
                    handleChangeItem(index, {
                      supportTypeCode: event.target.value,
                    })
                  }
                  className="w-full bg-surface-container-high border-none rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary"
                  placeholder="SupportTypeCode (ví dụ: RICE_5KG)"
                />
                <input
                  type="number"
                  min={1}
                  step="0.5"
                  value={item.requestedQty}
                  onChange={(event) =>
                    handleChangeItem(index, {
                      requestedQty: Math.max(
                        1,
                        Number(event.target.value) || 1,
                      ),
                    })
                  }
                  className="w-full bg-surface-container-high border-none rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary"
                  placeholder="Số lượng"
                />
                <input
                  value={item.unitCode}
                  onChange={(event) =>
                    handleChangeItem(index, {
                      unitCode: event.target.value,
                    })
                  }
                  className="w-full bg-surface-container-high border-none rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary"
                  placeholder="UnitCode"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="inline-flex items-center justify-center rounded-xl bg-red-50 text-red-700 hover:bg-red-100 px-3"
                  disabled={items.length === 1}
                  title="Xóa vật phẩm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
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
