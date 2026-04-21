import React, { useEffect, useState } from "react";
import { Plus, Edit, Search } from "lucide-react";
import UserModal from "./UserModal";
import {
  createUser,
  getUsers,
  updateUser,
} from "@/src/shared/services/adminUser.service";
import { getRoles } from "@/src/shared/services/role.service";

// helper
const getUserRoleText = (roles: any[]) => {
  if (!roles || roles.length === 0) return "Không có";
  return roles.map((r) => r.name).join(", ");
};

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  // ===== LOAD DATA =====
  const fetchData = async () => {
    try {
      setLoading(true);
      const userRes = await getUsers();
      const roleRes = await getRoles();

      setUsers(userRes.items);
      setRoles(roleRes.items);
    } catch (err) {
      console.error(err);
      alert("Load dữ liệu thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===== FILTER =====
  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) &&
      (roleFilter === "all" ||
        u.roles.some((r: any) => r.code === roleFilter))
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

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-950">
            Quản lý người dùng
          </h1>
          <p className="text-gray-500 text-sm">
            Quản lý tài khoản và phân quyền hệ thống
          </p>
        </div>

        <button
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-950 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-900"
        >
          <Plus size={18} /> Thêm người dùng
        </button>
      </div>

      {/* FILTER */}
      <div className="bg-white p-4 rounded-xl shadow flex flex-col md:flex-row gap-4">
        {/* SEARCH */}
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 w-full md:w-1/3">
          <Search size={16} className="text-gray-400" />
          <input
            placeholder="Tìm tên người dùng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="outline-none w-full text-sm"
          />
        </div>

        {/* ROLE FILTER */}
        <select
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border px-3 py-2 rounded-lg text-sm"
        >
          <option value="all">Tất cả role</option>
          {roles.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">
            Đang tải dữ liệu...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Username</th>
                <th className="px-4 py-3 text-left">Tên</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3 font-semibold text-blue-950">
                    {u.username}
                  </td>

                  <td className="px-4 py-3">{u.displayName}</td>

                  <td className="px-4 py-3 text-gray-600">
                    {u.email}
                  </td>

                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                      {getUserRoleText(u.roles)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        u.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {u.isActive ? "Hoạt động" : "Ngưng"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setShowModal(true);
                        }}
                        className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                        title="Sửa"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-6 text-gray-500"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <UserModal
          roles={roles}
          defaultData={editingUser}
          onClose={() => setShowModal(false)}
          onSubmit={editingUser ? handleEdit : handleAdd}
        />
      )}
    </div>
  );
};

export default UserManagement;