import React, { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import RoleModal from "./RoleModal";

const initialRoles = [
  {
    id: "R1",
    name: "Admin",
    permissions: {
      users: ["view", "create", "edit", "delete"],
      requests: ["view", "verify", "dispatch"],
      teams: ["view", "assign"],
      reports: ["view"],
    },
  },
  {
    id: "R2",
    name: "Coordinator",
    permissions: {
      users: ["view"],
      requests: ["view", "verify", "dispatch"],
      teams: ["view", "assign"],
      reports: ["view"],
    },
  },
];

const RoleManagement = () => {
  const [roles, setRoles] = useState(initialRoles);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  // ===== ADD =====
  const handleAdd = (data) => {
    setRoles((prev) => [...prev, { ...data, id: "R" + Date.now() }]);
  };

  // ===== EDIT =====
  const handleEdit = (data) => {
    setRoles((prev) =>
      prev.map((r) => (r.id === data.id ? data : r))
    );
  };

  // ===== DELETE =====
  const handleDelete = (id) => {
    if (confirm("Xoá role này?")) {
      setRoles((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Quản lý vai trò</h1>
        <button
          onClick={() => {
            setEditingRole(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-950 text-white px-4 py-2 rounded"
        >
          <Plus size={18} /> Thêm role
        </button>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-2 gap-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white p-4 rounded-xl shadow space-y-3"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold">{role.name}</h3>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingRole(role);
                    setShowModal(true);
                  }}
                >
                  <Edit size={18} />
                </button>
                <button onClick={() => handleDelete(role.id)}>
                  <Trash2 size={18} className="text-red-500" />
                </button>
              </div>
            </div>

            {/* Permissions */}
            <div className="text-sm text-gray-600 space-y-1">
              {Object.entries(role.permissions).map(
                ([module, perms]) => (
                  <div key={module}>
                    <strong className="capitalize">{module}: </strong>
                    {perms.join(", ")}
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <RoleModal
          onClose={() => setShowModal(false)}
          onSubmit={editingRole ? handleEdit : handleAdd}
          defaultData={editingRole}
        />
      )}
    </div>
  );
};

export default RoleManagement;