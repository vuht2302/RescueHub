import React, { useState } from "react";

const CatalogModal = ({ onClose, onSubmit, defaultData }) => {
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
        }
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
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-xl w-[400px] space-y-4">
        <h2 className="text-xl font-bold">
          {defaultData ? "Sửa danh mục" : "Thêm danh mục"}
        </h2>

        {/* CODE */}
        <input
          placeholder="Code"
          value={form.code}
          disabled={!!defaultData}
          onChange={(e) =>
            setForm({ ...form, code: e.target.value })
          }
          className="w-full border p-2 rounded"
        />

        {/* NAME */}
        <input
          placeholder="Tên"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          className="w-full border p-2 rounded"
        />

        {/* DESCRIPTION */}
        <textarea
          placeholder="Mô tả"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          className="w-full border p-2 rounded"
        />

        {/* ACTION */}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="border px-3 py-1 rounded">
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-950 text-white px-3 py-1 rounded"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

export default CatalogModal;