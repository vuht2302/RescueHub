import React, { useState, useEffect } from "react";
import {
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Star,
  Users,
  X,
} from "lucide-react";
import { UiTeamMember, TeamViewProps } from "../types/mission";
import { updateTeamStatus } from "../services/teamDashboardService";

const LEVEL_LABELS: Record<string, string> = {
  LEVEL_1: "Sơ cấp",
  LEVEL_2: "Trung cấp",
  LEVEL_3: "Cao cấp",
  LEVEL_4: "Chuyên gia",
};

const MemberDetailModal: React.FC<{
  member: UiTeamMember;
  onClose: () => void;
}> = ({ member, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-950 to-blue-800 px-6 py-6 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full p-1.5 hover:bg-white/20 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 grid place-items-center text-xl font-black">
              {member.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{member.fullName}</h3>
                {member.isTeamLeader && (
                  <ShieldCheck size={16} className="text-yellow-300" />
                )}
              </div>
              <p className="text-sm text-blue-200">{member.role}</p>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                member.status === "Sẵn sàng"
                  ? "bg-emerald-400/30 text-emerald-100"
                  : "bg-rose-400/30 text-rose-100"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  member.status === "Sẵn sàng"
                    ? "bg-emerald-300"
                    : "bg-rose-300"
                }`}
              />
              {member.status === "Sẵn sàng" ? "Sẵn sàng" : "Không sẵn sàng"}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Contact Info */}
          <section>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Thông tin liên hệ
            </h4>
            <div className="space-y-2.5">
              {member.phone ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Phone size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Số điện thoại</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {member.phone}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Phone size={14} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400 italic">
                    Chưa cập nhật số điện thoại
                  </p>
                </div>
              )}

              {member.username && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xs">@</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Tài khoản</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {member.username}
                    </p>
                  </div>
                </div>
              )}

              {member.lastKnownLocation && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <MapPin size={14} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Vị trí gần nhất</p>
                    <p className="text-sm font-semibold text-gray-800 font-mono">
                      {member.lastKnownLocation.lat.toFixed(4)}°N,{" "}
                      {member.lastKnownLocation.lng.toFixed(4)}°E
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Skills */}
          {member.skills.length > 0 && (
            <section>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Kỹ năng
              </h4>
              <div className="space-y-2">
                {member.skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      {skill.isPrimary && (
                        <Star
                          size={12}
                          className="text-amber-500 fill-amber-500"
                        />
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {skill.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {skill.isPrimary && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          Chính
                        </span>
                      )}
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {LEVEL_LABELS[skill.levelCode] ?? skill.levelCode}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {member.notes && (
            <section>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Ghi chú
              </h4>
              <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
                <p className="text-sm text-amber-800">{member.notes}</p>
              </div>
            </section>
          )}

          {/* Meta */}
          <section className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-400">
              Tham gia:{" "}
              {new Date(member.createdAt).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export const TeamView: React.FC<TeamViewProps> = ({
  teamMembers,
  isLeader = false,
  isLoading = false,
  error = null,
  onRetry,
  onReloadData,
  isReloadingData = false,
  currentTeamStatus = "AVAILABLE",
  onStatusUpdated,
}) => {
  const [members, setMembers] = useState<UiTeamMember[]>(teamMembers);
  const [selectedMember, setSelectedMember] = useState<UiTeamMember | null>(
    null,
  );
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  useEffect(() => {
    setMembers(teamMembers);
  }, [teamMembers]);

  const isAvailable = (status: string) => status === "Sẵn sàng";

  const availableCount = members.filter((m) => isAvailable(m.status)).length;
  const unavailableCount = members.length - availableCount;
  const allAvailable = members.length > 0 && unavailableCount === 0;

  const isTeamOn = currentTeamStatus === "AVAILABLE";

  const handleToggleTeamStatus = async () => {
    const nextStatus = isTeamOn ? "BUSY" : "AVAILABLE";

    setIsToggling(true);
    setToggleError(null);

    try {
      await updateTeamStatus({ statusCode: nextStatus });
      onStatusUpdated?.();
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

      <div className="col-span-1 xl:col-span-2 rounded-xl bg-white border border-gray-200 p-6 overflow-auto shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-blue-950 font-primary flex items-center gap-2">
              <Users size={24} />
              Trạng thái đội ngũ
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Quản lý và theo dõi tình trạng của các thành viên trong đội
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onReloadData && (
              <button
                type="button"
                onClick={onReloadData}
                disabled={isReloadingData}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
              >
                <RefreshCw
                  size={14}
                  className={isReloadingData ? "animate-spin" : undefined}
                />
                {isReloadingData ? "Đang tải..." : "Làm mới"}
              </button>
            )}

            {isLeader && (
              <button
                type="button"
                onClick={() => {
                  void handleToggleTeamStatus();
                }}
                disabled={isToggling}
                aria-pressed={isTeamOn}
                className={`group inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold font-primary text-white whitespace-nowrap transition-colors disabled:opacity-60 ${
                  isTeamOn
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-slate-600 hover:bg-slate-700"
                }`}
              >
                <span>{isTeamOn ? "ON" : "OFF"}</span>
                <span
                  className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
                    isTeamOn ? "bg-emerald-400/70" : "bg-white/30"
                  }`}
                >
                  <span
                    className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                      isTeamOn ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </span>
              </button>
            )}
          </div>
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
            <p className="text-sm font-semibold text-rose-900">
              Không sẵn sàng
            </p>
            <p className="text-3xl font-black text-rose-600 mt-1">
              {unavailableCount}
            </p>
          </div>
        </div>

        {/* Team Members Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          {isLoading ? (
            <div className="p-6 text-sm text-gray-500 text-center">
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
              <thead className="bg-gray-50 text-gray-600">
                <tr className="text-left border-b border-gray-200">
                  <th className="px-4 py-3 font-primary font-bold">
                    Thành viên
                  </th>
                  <th className="px-4 py-3 font-primary font-bold">Vai trò</th>
                  <th className="px-4 py-3 font-primary font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-blue-950 text-white grid place-items-center text-xs font-bold">
                            {member.avatar}
                          </div>
                          {member.isTeamLeader && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                              <ShieldCheck size={8} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-gray-800">
                              {member.fullName}
                            </span>
                            {member.isTeamLeader && (
                              <ShieldCheck
                                size={12}
                                className="text-yellow-500"
                              />
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {member.phone ?? "—"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {member.isTeamLeader ? "Đội trưởng" : "Thành viên"}
                        </p>
                        {!member.isTeamLeader && member.skills[0] && (
                          <p className="text-xs text-gray-500">
                            {member.skills[0].name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedMember(member)}
                        className="text-xs bg-blue-950 text-white px-3 py-1.5 rounded-lg font-bold font-primary hover:bg-blue-900 transition-colors"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-6 text-sm text-gray-500 text-center"
                      colSpan={3}
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
    </>
  );
};
