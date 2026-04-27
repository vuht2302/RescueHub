import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw, Search, MapPin } from "lucide-react";
import { getAuthSession } from "@/src/features/auth/services/authStorage";
import { getDispatchTeams, Team } from "../services/dispatchService";

export function TeamManagementSection() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const session = getAuthSession();
      if (!session?.accessToken) throw new Error("Chưa đăng nhập");

      const data = await getDispatchTeams(session.accessToken);
      setTeams(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tải danh sách đội",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTeams();
  }, [fetchTeams]);

  const getStatusStyle = (statusCode: string) => {
    switch (statusCode) {
      case "AVAILABLE":
        return "bg-emerald-50 text-emerald-600";
      case "BUSY":
      case "IN_USE":
        return "bg-blue-50 text-blue-600";
      case "OFFLINE":
        return "bg-gray-50 text-gray-600";
      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  const getStatusPoint = (statusCode: string) => {
    switch (statusCode) {
      case "AVAILABLE":
        return "bg-emerald-600";
      case "BUSY":
        return "bg-blue-600";
      case "OFFLINE":
        return "bg-gray-600";
      default:
        return "bg-slate-600";
    }
  };

  const getStatusText = (status: { code: string; name: string }) => {
    switch (status.code) {
      case "AVAILABLE":
        return "Sẵn sàng";
      case "BUSY":
        return "Đang bận";
      case "IN_USE":
        return "Đang làm nhiệm vụ";
      case "OFFLINE":
        return "Ngoại tuyến";
      default:
        return status.name;
    }
  };

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            className="text-xl font-bold text-slate-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Quản lý Đội Cứu Hộ
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Xem và theo dõi trạng thái các đội đang hoạt động
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => void fetchTeams()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-950"
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Làm mới
          </button>
          <div className="relative flex-1 sm:flex-none">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã đội..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:border-blue-950 focus:outline-none w-full sm:w-72 text-sm"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 m-6 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div
            className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"
            style={{ borderWidth: 3 }}
          ></div>
          <p className="mt-3 text-sm text-slate-500">
            Đang tải danh sách đội...
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <th className="px-6 py-4">Đội cứu hộ</th>
                <th className="px-6 py-4">Đội trưởng</th>
                <th className="px-6 py-4">Năng lực</th>
                <th className="px-6 py-4">Khu vực</th>
                <th className="px-6 py-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-slate-500 text-sm"
                  >
                    Không tìm thấy đội cứu hộ nào phù hợp.
                  </td>
                </tr>
              )}
              {filteredTeams.map((team) => (
                <tr
                  key={team.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{team.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{team.code}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800">
                      {team.leader?.displayName || "Chưa có"}
                    </p>
                    {team.leader?.phone && (
                      <p className="text-xs text-slate-500">
                        {team.leader.phone}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium text-slate-900">
                        {team.memberCount}
                      </span>{" "}
                      thành viên
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {team.vehicleCount} phương tiện
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400" />
                        {team.homeAdminArea?.name || "Không xác định"}
                      </span>
                      {team.notes && (
                        <span
                          className="text-xs text-slate-500 mt-1 truncate max-w-50"
                          title={team.notes}
                        >
                          {team.notes}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold leading-none ${getStatusStyle(team.status.code)}`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${getStatusPoint(team.status.code)}`}
                      />
                      {getStatusText(team.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
