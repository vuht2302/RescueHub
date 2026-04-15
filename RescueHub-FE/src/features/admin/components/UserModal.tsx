import React, { useState } from "react";

const UserModal = ({ onClose, onSubmit, defaultData }) => {
  const [form, setForm] = useState(
    defaultData || {
      name: "",
      email: "",
      role: "Admin",
      status: "active",
    }
  );

  const handleSubmit = () => {
    if (!form.name || !form.email) {
      alert("Nhập đầy đủ thông tin!");
      return;
    }

    onSubmit(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-[400px] space-y-4">
        <h2 className="text-xl font-bold">
          {defaultData ? "Sửa user" : "Thêm user"}
        </h2>

        <input
          placeholder="Tên"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          className="w-full border p-2 rounded"
        />

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          className="w-full border p-2 rounded"
        />

        <select
          value={form.role}
          onChange={(e) =>
            setForm({ ...form, role: e.target.value })
          }
          className="w-full border p-2 rounded"
        >
          <option>Admin</option>
          <option>Coordinator</option>
          <option>Rescue Team</option>
        </select>

        <select
          value={form.status}
          onChange={(e) =>
            setForm({ ...form, status: e.target.value })
          }
          className="w-full border p-2 rounded"
        >
          <option value="active">Hoạt động</option>
          <option value="inactive">Ngưng</option>
        </select>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1 bg-blue-950 text-white rounded"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserModal;