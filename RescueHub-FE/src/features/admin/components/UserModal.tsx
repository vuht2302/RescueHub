import React, { useState } from "react";
import { X } from "lucide-react";

const UserModal = ({ onClose, onSubmit, defaultData, roles }) => {
  const [form, setForm] = useState(
    defaultData
      ? {
          id: defaultData.id,
          username: defaultData.username,
          displayName: defaultData.displayName,
          email: defaultData.email,
          phone: defaultData.phone,
          role: defaultData.roles?.[0]?.code,
          status: defaultData.isActive ? "active" : "inactive",
          password: "",
        }
      : {
          username: "",
          displayName: "",
          email: "",
          phone: "",
          role: roles?.[0]?.code,
          status: "active",
          password: "",
        },
  );

  const handleSubmit = () => {
    if (!form.displayName || !form.email || !form.username) {
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
            {defaultData ? "Chỉnh sửa người dùng" : "Thêm người dùng"}
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
          {/* USERNAME & NAME */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Username *
              </label>
              <input
                placeholder="Nhập username"
                value={form.username}
                disabled={!!defaultData}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Tên hiển thị *
              </label>
              <input
                placeholder="Nhập tên"
                value={form.displayName}
                onChange={(e) =>
                  setForm({ ...form, displayName: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* EMAIL & PHONE */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Email *
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Số điện thoại
              </label>
              <input
                placeholder="Nhập SĐT"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* PASSWORD (only create) */}
          {!defaultData && (
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Mật khẩu *
              </label>
              <input
                type="password"
                placeholder="Nhập mật khẩu"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* ROLE & STATUS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Vai trò
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {roles.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Trạng thái
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngưng</option>
              </select>
            </div>
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

export default UserModal;
