import React from "react";
import { RefreshCw, Users } from "lucide-react";
import { TeamMember } from "../types/mission";

interface TeamViewProps {
  teamMembers: TeamMember[];
  isLeader?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  teamMembers,
  isLeader = false,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const [members, setMembers] = React.useState<TeamMember[]>(teamMembers);

  React.useEffect(() => {
    setMembers(teamMembers);
  }, [teamMembers]);

  const availableCount = members.filter((m) => m.status === "Available").length;
  const unavailableCount = members.length - availableCount;
  const allAvailable = members.length > 0 && unavailableCount === 0;

  const handleUpdateAllStatuses = () => {
    const nextStatus: TeamMember["status"] = allAvailable
      ? "Unavailable"
      : "Available";

    setMembers((prev) =>
      prev.map((member) => ({ ...member, status: nextStatus })),
    );
  };

  return (
    <div className="col-span-1 xl:col-span-2 rounded-2xl bg-white border border-[#c8ced6] p-6 overflow-auto">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-blue-950 font-primary flex items-center gap-2">
            <Users size={24} />
            Trạng thái đội ngũ
          </h2>
          <p className="text-sm text-on-surface-variant mt-2">
            Quản lý và theo dõi tình trạng của các thành viên trong đội
          </p>
        </div>

        {isLeader && (
          <button
            type="button"
            onClick={handleUpdateAllStatuses}
            aria-pressed={allAvailable}
            className={`group inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-xs font-bold font-primary text-white whitespace-nowrap transition-colors ${
              allAvailable
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-slate-600 hover:bg-slate-700"
            }`}
          >
            <span className="px-1">{allAvailable ? "ON" : "OFF"}</span>
            <span
              className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
                allAvailable ? "bg-emerald-400/70" : "bg-white/30"
              }`}
            >
              <span
                className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                  allAvailable ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </span>
          </button>
        )}
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
          <p className="text-sm font-semibold text-emerald-900">Sẵn sàng</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">
            {availableCount}
          </p>
        </div>
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
          <p className="text-sm font-semibold text-rose-900">Không sẵn sàng</p>
          <p className="text-3xl font-black text-rose-600 mt-1">
            {unavailableCount}
          </p>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="overflow-x-auto rounded-xl border border-[#c7ced7]">
        {isLoading ? (
          <div className="p-6 text-sm text-on-surface-variant text-center">
            Đang tải danh sách thành viên...
          </div>
        ) : error ? (
          <div className="p-6 flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm font-semibold text-red-600">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-3 py-2 text-xs font-bold text-white hover:bg-blue-900"
              >
                <RefreshCw size={14} />
                Tải lại
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#f0f2f5] text-on-surface-variant">
              <tr className="text-left border-b border-[#c7ced7]">
                <th className="px-4 py-3 font-primary font-bold">Thành viên</th>
                <th className="px-4 py-3 font-primary font-bold">Vai trò</th>
                <th className="px-4 py-3 font-primary font-bold">Trạng thái</th>
                <th className="px-4 py-3 font-primary font-bold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="border-t border-[#c7ced7] hover:bg-[#f9fafb]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-950 text-white grid place-items-center text-xs font-bold">
                        {member.avatar}
                      </div>
                      <span className="font-semibold text-on-surface">
                        {member.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">
                    {member.role}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        member.status === "Available"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {member.status === "Available"
                        ? "Sẵn sàng"
                        : "Không sẵn sàng"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-xs bg-blue-950 text-white px-3 py-1.5 rounded-lg font-bold font-primary hover:bg-blue-900"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-6 text-sm text-on-surface-variant text-center"
                    colSpan={4}
                  >
                    Chưa có thành viên trong đội.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
