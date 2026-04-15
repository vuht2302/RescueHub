import React, { useState } from "react";

const modules = {
  users: ["view", "create", "edit", "delete"],
  requests: ["view", "verify", "dispatch"],
  teams: ["view", "assign"],
  reports: ["view"],
};

const RoleModal = ({ onClose, onSubmit, defaultData }) => {
  const [name, setName] = useState(defaultData?.name || "");
  const [permissions, setPermissions] = useState(
    defaultData?.permissions || {}
  );

  const togglePermission = (module, perm) => {
    const current = permissions[module] || [];

    const updated = current.includes(perm)
      ? current.filter((p) => p !== perm)
      : [...current, perm];

    setPermissions({
      ...permissions,
      [module]: updated,
    });
  };

  const handleSubmit = () => {
    if (!name) {
      alert("Nhập tên role!");
      return;
    }

    onSubmit({
      id: defaultData?.id,
      name,
      permissions,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-xl w-[500px] space-y-4">
        <h2 className="text-xl font-bold">
          {defaultData ? "Sửa role" : "Thêm role"}
        </h2>

        {/* NAME */}
        <input
          placeholder="Tên role"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
        />

        {/* PERMISSION MATRIX */}
        <div className="space-y-3">
          {Object.entries(modules).map(([module, perms]) => (
            <div key={module}>
              <p className="font-semibold capitalize">{module}</p>
              <div className="flex gap-3 flex-wrap">
                {perms.map((perm) => (
                  <label
                    key={perm}
                    className="flex items-center gap-1 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={
                        permissions[module]?.includes(perm) || false
                      }
                      onChange={() =>
                        togglePermission(module, perm)
                      }
                    />
                    {perm}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

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

export default RoleModal;