import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Search,
  Users,
} from "lucide-react";
import UserModal from "./UserModal";
import {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
} from "@/src/shared/services/adminUser.service";
import { getRoles } from "@/src/shared/services/role.service";

// helper
const getUserRoleText = (roles: any[]) => {
  if (!roles || roles.length === 0) return "Không có";
  return roles.map((r) => r.name).join(", ");
};

// Confirm Delete Modal
function ConfirmDelete({
  name,
  onConfirm,
  onCancel,
  loading,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-center mb-1">Xóa người dùng?</h3>
        <p className="text-sm text-gray-600 text-center mb-6">
          Xóa <strong>{name}</strong>? Thao tác không thể hoàn tác.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-sm"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm disabled:opacity-60"
          >
            {loading ? "Đang xóa..." : "Xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // ===== LOAD DATA =====
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userRes = await getUsers();
      const roleRes = await getRoles();

      setUsers(userRes.items);
      setRoles(roleRes.items);
    } catch (err: any) {
      console.error(err);
      setError("Load dữ liệu thất bại");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===== FILTER =====
  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) &&
      (roleFilter === "all" || u.roles.some((r: any) => r.code === roleFilter)),
  );

  // ===== ADD USER =====
  const handleAdd = async (data: any) => {
    try {
      await createUser({
        username: data.username,
        displayName: data.displayName,
        phone: data.phone,
        email: data.email,
        password: data.password,
        isActive: data.status === "active",
        roleCodes: [data.role],
      });
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ===== EDIT USER =====
  const handleEdit = async (data: any) => {
    try {
      await updateUser(data.id, {
        username: data.username,
        displayName: data.displayName,
        phone: data.phone,
        email: data.email,
        isActive: data.status === "active",
        roleCodes: [data.role],
      });
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ===== DELETE USER =====
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Lỗi xóa người dùng");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2
            className="text-2xl font-black text-gray-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Quản lý người dùng
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý tài khoản và phân quyền hệ thống
          </p>
        </div>

        <button
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg,#1e3a5f,#1e40af)" }}
        >
          <Plus size={15} /> Thêm người dùng
        </button>
      </div>

      {/* FILTER */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        {/* SEARCH */}
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-full md:w-1/3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
          <Search size={16} className="text-gray-400" />
          <input
            placeholder="Tìm tên người dùng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="outline-none w-full text-sm bg-transparent"
          />
        </div>

        {/* ROLE FILTER */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tất cả vai trò</option>
          {roles.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Username", "Tên", "Email", "Vai trò", "Trạng thái", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  Đang tải...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Users size={32} className="text-gray-300" />
                    <p className="text-gray-400 text-sm">Chưa có người dùng</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">
                    {u.username}
                  </td>

                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {u.displayName}
                  </td>

                  <td className="px-4 py-3 text-gray-600">{u.email}</td>

                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                      {getUserRoleText(u.roles)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        u.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.isActive ? "bg-emerald-500" : "bg-gray-400"
                        }`}
                      />
                      {u.isActive ? "Hoạt động" : "Ngưng"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setShowModal(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600"
                        title="Sửa"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 text-right">
        {filteredUsers.length} người dùng
      </p>

      {/* MODAL */}
      {showModal && (
        <UserModal
          roles={roles}
          defaultData={editingUser}
          onClose={() => setShowModal(false)}
          onSubmit={editingUser ? handleEdit : handleAdd}
        />
      )}

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.displayName}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
};

export default UserManagement;
