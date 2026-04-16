import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface CreateImportRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ImportRequestData) => Promise<void>;
}

export interface ImportRequestData {
  product: string;
  quantity: number;
  supplier: string;
  expectedDate: string;
  notes: string;
}

const products = [
  { id: "SKU001", name: "Dây an toàn cứu hộ" },
  { id: "SKU002", name: "Mũ bảo hiểm chuyên dụng" },
  { id: "SKU003", name: "Áo phao cứu sinh" },
  { id: "SKU004", name: "Bộ cứu hộ di động" },
  { id: "SKU005", name: "Dụng cụ cắt cứu hộ" },
  { id: "SKU006", name: "Đèn chiếu sáng chuyên dụng" },
];

const suppliers = [
  { id: 1, name: "Công ty TNHH An Toàn Plus" },
  { id: 2, name: "Công ty Cứu Hộ Việt" },
  { id: 3, name: "Công ty Thiết bị Cứu hộ Toàn Cầu" },
  { id: 4, name: "Nhà cung cấp khác" },
];

export function CreateImportRequestModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateImportRequestModalProps) {
  const [formData, setFormData] = useState<ImportRequestData>({
    product: "",
    quantity: 0,
    supplier: "",
    expectedDate: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? parseInt(value) || 0 : value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.product || !formData.supplier || formData.quantity <= 0) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (!formData.expectedDate) {
      setError("Vui lòng chọn ngày dự kiến");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        product: "",
        quantity: 0,
        supplier: "",
        expectedDate: "",
        notes: "",
      });
      onClose();
    } catch (err) {
      setError("Lỗi khi tạo yêu cầu. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2
            className="text-xl font-bold text-slate-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Tạo yêu cầu nhập kho
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Select */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Sản phẩm <span className="text-red-500">*</span>
            </label>
            <select
              name="product"
              value={formData.product}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
            >
              <option value="">Chọn sản phẩm</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Số lượng <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              min="1"
              value={formData.quantity || ""}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Nhập số lượng"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 placeholder:text-slate-400"
            />
          </div>

          {/* Supplier Select */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Nhà cung cấp <span className="text-red-500">*</span>
            </label>
            <select
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
            >
              <option value="">Chọn nhà cung cấp</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id.toString()}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          {/* Expected Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Ngày dự kiến <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="expectedDate"
              value={formData.expectedDate}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Ghi chú
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Nhập ghi chú (tùy chọn)"
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 placeholder:text-slate-400"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
              style={{ backgroundColor: "var(--color-blue-950)" }}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Đang xử lý..." : "Tạo yêu cầu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
