import React, { useState } from "react";
import { X } from "lucide-react";

const RoleModal = ({ onClose, onSubmit, defaultData }) => {
  const [form, setForm] = useState(
    defaultData
      ? {
          id: defaultData.id,
          code: defaultData.code,
          name: defaultData.name,
          description: defaultData.description,
        }
      : {
          code: "",
          name: "",
          description: "",
        },
  );

  const handleSubmit = () => {
    if (!form.code || !form.name) {
      alert("Nhập đầy đủ thông tin!");
      return;
    }

    onSubmit(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">
            {defaultData ? "Chỉnh sửa vai trò" : "Thêm vai trò"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* FORM */}
        <div className="p-6 space-y-4">
          {/* CODE & NAME */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Mã vai trò *
              </label>
              <input
                placeholder="VD: ADMIN"
                value={form.code}
                disabled={!!defaultData}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Tên vai trò *
              </label>
              <input
                placeholder="Nhập tên vai trò"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">
              Mô tả
            </label>
            <textarea
              placeholder="Nhập mô tả vai trò..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: "linear-gradient(135deg,#1e3a5f,#1e40af)" }}
          >
            {defaultData ? "Cập nhật" : "Thêm mới"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleModal;
