import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Shield,
  Search,
} from "lucide-react";
import RoleModal from "./RoleModal";

import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from "@/src/shared/services/role.service";

// Confirm Delete Modal
function ConfirmDelete({
  name,
  onConfirm,
  onCancel,
  loading,
  disabled,
  disabledMessage,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${disabled ? "bg-gray-100" : "bg-red-100"}`}
        >
          <Trash2
            size={22}
            className={disabled ? "text-gray-500" : "text-red-600"}
          />
        </div>
        <h3 className="text-lg font-bold text-center mb-1">
          {disabled ? "Không thể xóa" : "Xóa vai trò?"}
        </h3>
        <p className="text-sm text-gray-600 text-center mb-6">
          {disabled ? (
            disabledMessage
          ) : (
            <>
              Xóa <strong>{name}</strong>? Thao tác không thể hoàn tác.
            </>
          )}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-sm"
          >
            {disabled ? "Đóng" : "Hủy"}
          </button>
          {!disabled && (
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm disabled:opacity-60"
            >
              {loading ? "Đang xóa..." : "Xóa"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const RoleManagement = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Search
  const [search, setSearch] = useState("");

  // ===== LOAD DATA =====
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRoles();
      setRoles(res.items);
    } catch (err) {
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
  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase()),
  );

  // ===== ADD =====
  const handleAdd = async (data: any) => {
    try {
      await createRole({
        code: data.code,
        name: data.name,
        description: data.description,
      });

      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ===== EDIT =====
  const handleEdit = async (data: any) => {
    try {
      await updateRole(data.id, {
        code: data.code,
        name: data.name,
        description: data.description,
      });

      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ===== DELETE =====
  const handleDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.assignedUserCount > 0) {
      return; // Should not reach here as we disable delete button
    }

    setDeleting(true);
    try {
      await deleteRole(deleteTarget.id);
      setDeleteTarget(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Lỗi xóa vai trò");
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
            Quản lý vai trò
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý phân quyền và vai trò người dùng trong hệ thống
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRole(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg,#1e3a5f,#1e40af)" }}
        >
          <Plus size={15} /> Thêm vai trò
        </button>
      </div>

      {/* FILTER */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        {/* SEARCH */}
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-full md:w-1/3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
          <Search size={16} className="text-gray-400" />
          <input
            placeholder="Tìm vai trò..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="outline-none w-full text-sm bg-transparent"
          />
        </div>
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
              {[
                "Mã vai trò",
                "Tên vai trò",
                "Mô tả",
                "Số người dùng",
                "Trạng thái",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  Đang tải...
                </td>
              </tr>
            ) : filteredRoles.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Shield size={32} className="text-gray-300" />
                    <p className="text-gray-400 text-sm">Chưa có vai trò</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRoles.map((role) => (
                <tr
                  key={role.id}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">
                    {role.code}
                  </td>

                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {role.name}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {role.description || "—"}
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      {role.assignedUserCount || 0} người dùng
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        role.assignedUserCount > 0
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          role.assignedUserCount > 0
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      {role.assignedUserCount > 0 ? "Đang sử dụng" : "Có sẵn"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingRole(role);
                          setShowModal(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600"
                        title="Sửa"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(role)}
                        className={`p-1.5 rounded-lg ${
                          role.assignedUserCount > 0
                            ? "text-gray-300 cursor-not-allowed"
                            : "hover:bg-red-100 text-red-500"
                        }`}
                        title={
                          role.assignedUserCount > 0
                            ? "Không thể xóa (đang được sử dụng)"
                            : "Xóa"
                        }
                        disabled={role.assignedUserCount > 0}
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
        {filteredRoles.length} vai trò
      </p>

      {/* MODAL */}
      {showModal && (
        <RoleModal
          onClose={() => setShowModal(false)}
          onSubmit={editingRole ? handleEdit : handleAdd}
          defaultData={editingRole}
        />
      )}

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
          disabled={deleteTarget.assignedUserCount > 0}
          disabledMessage="Vai trò này đang được sử dụng bởi người dùng, không thể xóa."
        />
      )}
    </div>
  );
};

export default RoleManagement;
