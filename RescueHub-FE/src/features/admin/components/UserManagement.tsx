import React, { useState } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import UserModal from "./UserModal";

// ===== DATA FAKE =====
const initialUsers = [
  {
    id: "U001",
    name: "Nguyễn Văn An",
    email: "an@gmail.com",
    role: "Admin",
    status: "active",
  },
  {
    id: "U002",
    name: "Trần Thị Bình",
    email: "binh@gmail.com",
    role: "Coordinator",
    status: "active",
  },
];

const UserManagement = () => {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // ===== FILTER =====
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) &&
      (roleFilter === "all" || u.role === roleFilter)
  );

  // ===== ADD USER =====
  const handleAdd = (data) => {
    setUsers((prev) => [
      ...prev,
      { ...data, id: "U" + Date.now() },
    ]);
  };

  // ===== EDIT USER =====
  const handleEdit = (data) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === data.id ? data : u))
    );
  };

  // ===== DELETE =====
  const handleDelete = (id) => {
    if (confirm("Bạn có chắc muốn xoá?")) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-950 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={18} /> Thêm
        </button>
      </div>

      {/* FILTER */}
      <div className="flex gap-4">
        <input
          placeholder="Tìm tên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded"
        />
        <select
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="all">All</option>
          <option value="Admin">Admin</option>
          <option value="Coordinator">Coordinator</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Tên</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} className="border-t text-center">
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  {u.status === "active" ? "Hoạt động" : "Ngưng"}
                </td>
                <td className="flex justify-center gap-3 py-2">
                  <button
                    onClick={() => {
                      setEditingUser(u);
                      setShowModal(true);
                    }}
                  >
                    <Edit size={18} />
                  </button>

                  <button onClick={() => handleDelete(u.id)}>
                    <Trash2 size={18} className="text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <UserModal
          onClose={() => setShowModal(false)}
          onSubmit={editingUser ? handleEdit : handleAdd}
          defaultData={editingUser}
        />
      )}
    </div>
  );
};

export default UserManagement;