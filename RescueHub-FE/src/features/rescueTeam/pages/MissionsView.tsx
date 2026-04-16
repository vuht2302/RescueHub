import React, { useState } from "react";
import {
  AlertCircle,
  Car,
  Eye,
  FileText,
  Loader,
  MapPinned,
  UsersRound,
  X,
} from "lucide-react";
import { Mission, MissionStatus } from "../types/mission";
import { respondToMission } from "../services/teamMissionService";

interface MissionsViewProps {
  missions: Mission[];
  statusMap: Record<string, MissionStatus>;
  priorityStyles: Record<string, string>;
  statusStyles: Record<string, string>;
  onAcceptMission: (missionId: string) => void;
  onViewMission: (missionId: string, status: MissionStatus) => void;
  onRequestMissionAction: (
    missionId: string,
    action: "Xin hủy" | "Xin chi viện",
  ) => void;
}

export const MissionsView: React.FC<MissionsViewProps> = ({
  missions,
  statusMap,
  priorityStyles,
  statusStyles,
  onAcceptMission,
  onViewMission,
  onRequestMissionAction,
}) => {
  const [selectedMissionId, setSelectedMissionId] = useState<string>(
    missions[0]?.id ?? "",
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [acceptingMissionId, setAcceptingMissionId] = useState<string | null>(
    null,
  );
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const pendingCount = missions.filter(
    (m) => (statusMap[m.id] ?? "Chờ nhận") === "Chờ nhận",
  ).length;

  const inProgressCount = missions.filter((m) =>
    ["Đang di chuyển", "Đang xử lý"].includes(statusMap[m.id] ?? "Chờ nhận"),
  ).length;

  const selectedMission =
    missions.find((mission) => mission.id === selectedMissionId) ?? missions[0];

  const openDetail = (missionId: string) => {
    setSelectedMissionId(missionId);
    setIsDetailOpen(true);
  };

  const handleAcceptMissionClick = async (missionId: string) => {
    setAcceptingMissionId(missionId);
    setAcceptError(null);

    try {
      console.log("[MissionsView] Chấp nhận nhiệm vụ:", missionId);
      const response = await respondToMission(missionId, {
        response: "ACCEPT",
        note: "Đội chấp nhận nhiệm vụ",
      });
      console.log("[MissionsView] Phản hồi chấp nhận:", response);

      onAcceptMission(missionId);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể chấp nhận nhiệm vụ. Vui lòng thử lại.";
      console.error("[MissionsView] Lỗi chấp nhận:", error);
      setAcceptError(errorMessage);
    } finally {
      setAcceptingMissionId(null);
    }
  };

  return (
    <div className="col-span-1 xl:col-span-2 rounded-2xl bg-white border border-[#c8ced6] p-6 overflow-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-blue-950 font-primary">
          Nhiệm vụ của đội
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Xem nhanh mục tiêu, vị trí, mô tả hiện trường, nhân sự và phương tiện
          được gán cho từng nhiệm vụ.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm font-semibold text-blue-900">Tổng nhiệm vụ</p>
          <p className="text-3xl font-black text-blue-950 mt-1">
            {missions.length}
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm font-semibold text-amber-900">Chờ nhận</p>
          <p className="text-3xl font-black text-amber-700 mt-1">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
          <p className="text-sm font-semibold text-purple-900">
            Đang thực hiện
          </p>
          <p className="text-3xl font-black text-purple-700 mt-1">
            {inProgressCount}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#c7ced7]">
        <table className="w-full text-sm">
          <thead className="bg-[#f0f2f5] text-on-surface-variant">
            <tr className="text-left border-b border-[#c7ced7]">
              <th className="px-4 py-3 font-primary font-bold">Mã</th>
              <th className="px-4 py-3 font-primary font-bold">Nhiệm vụ</th>
              <th className="px-4 py-3 font-primary font-bold">Vị trí</th>
              <th className="px-4 py-3 font-primary font-bold">Ưu tiên</th>
              <th className="px-4 py-3 font-primary font-bold">Trạng thái</th>
              <th className="px-4 py-3 font-primary font-bold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {missions.map((mission) => {
              const missionStatus = statusMap[mission.id] ?? "Chờ nhận";
              const isSelected =
                selectedMissionId === mission.id && isDetailOpen;

              return (
                <tr
                  key={mission.id}
                  onClick={() => setSelectedMissionId(mission.id)}
                  className={`border-t border-[#c7ced7] cursor-pointer ${
                    isSelected ? "bg-blue-50" : "hover:bg-[#f9fafb]"
                  }`}
                >
                  <td className="px-4 py-3 font-primary font-black text-blue-950">
                    {mission.code}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-on-surface">
                      {mission.title}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {mission.type} - {mission.assignedTeam}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">
                    {mission.address}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-md font-bold uppercase ${priorityStyles[mission.priority]}`}
                    >
                      {mission.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-md font-semibold ${statusStyles[missionStatus]}`}
                    >
                      {missionStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {missionStatus === "Chờ nhận" ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleAcceptMissionClick(mission.id);
                        }}
                        disabled={acceptingMissionId === mission.id}
                        className="text-xs bg-blue-950 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-900 disabled:bg-slate-400 flex items-center gap-1 transition-colors"
                      >
                        {acceptingMissionId === mission.id ? (
                          <>
                            <Loader size={14} className="animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          "Nhận và xem"
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onViewMission(mission.id, missionStatus);
                          }}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                          aria-label="Xem bản đồ"
                          title="Xem bản đồ"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openDetail(mission.id);
                          }}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-950 text-white hover:bg-blue-900"
                          aria-label="Xem chi tiết nhiệm vụ"
                          title="Xem chi tiết nhiệm vụ"
                        >
                          <FileText size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {missions.length === 0 && (
        <p className="text-sm text-on-surface-variant text-center py-8">
          Chưa có nhiệm vụ nào.
        </p>
      )}

      {acceptError && (
        <div className="fixed bottom-5 left-5 right-5 md:left-auto md:right-5 md:w-96 z-50 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle
            size={20}
            className="text-red-600 flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="text-sm font-semibold text-red-700">
              Lỗi chấp nhận nhiệm vụ
            </p>
            <p className="text-sm text-red-600 mt-1">{acceptError}</p>
            <button
              onClick={() => setAcceptError(null)}
              className="mt-3 text-xs font-semibold text-red-700 hover:text-red-800"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {isDetailOpen && selectedMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-[#c8ced6] overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-[#e2e8f0] bg-[#f8fafc] px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-on-surface-variant">
                  Chi tiết nhiệm vụ
                </p>
                <h3 className="text-2xl font-black text-blue-950 font-primary mt-1">
                  {selectedMission.code} - {selectedMission.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-[#d6dde6] text-gray-600 hover:bg-gray-100"
                aria-label="Đóng chi tiết nhiệm vụ"
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm bg-[#f8fafc]">
              <div className="rounded-xl bg-white border border-[#d6dde6] p-4">
                <p className="text-xs uppercase tracking-[0.15em] font-bold text-on-surface-variant">
                  Vị trí hiện trường
                </p>
                <p className="mt-2 flex items-start gap-2 text-on-surface">
                  <MapPinned size={16} className="text-blue-900 mt-0.5" />
                  <span>
                    {selectedMission.address}
                    <br />
                    <span className="text-xs text-on-surface-variant">
                      {selectedMission.coord.lat.toFixed(4)} /{" "}
                      {selectedMission.coord.lng.toFixed(4)}
                    </span>
                  </span>
                </p>
              </div>

              <div className="rounded-xl bg-white border border-[#d6dde6] p-4">
                <p className="text-xs uppercase tracking-[0.15em] font-bold text-on-surface-variant">
                  Mô tả hiện trường
                </p>
                <p className="mt-2 flex items-start gap-2 text-on-surface leading-relaxed">
                  <FileText size={16} className="text-blue-900 mt-0.5" />
                  <span>{selectedMission.summary}</span>
                </p>
              </div>

              <div className="rounded-xl bg-white border border-[#d6dde6] p-4">
                <p className="text-xs uppercase tracking-[0.15em] font-bold text-on-surface-variant">
                  Người được gán
                </p>
                <p className="mt-2 flex items-start gap-2 text-on-surface">
                  <UsersRound size={16} className="text-blue-900 mt-0.5" />
                  <span>{selectedMission.assignedMembers.join(", ")}</span>
                </p>
                <p className="text-xs text-on-surface-variant mt-2">
                  Đơn vị: {selectedMission.assignedTeam}
                </p>
              </div>

              <div className="rounded-xl bg-white border border-[#d6dde6] p-4">
                <p className="text-xs uppercase tracking-[0.15em] font-bold text-on-surface-variant">
                  Phương tiện được gán
                </p>
                <p className="mt-2 flex items-start gap-2 text-on-surface">
                  <Car size={16} className="text-blue-900 mt-0.5" />
                  <span>{selectedMission.assignedVehicles.join(", ")}</span>
                </p>
                <p className="text-xs text-on-surface-variant mt-2">
                  Người liên hệ: {selectedMission.requester} -{" "}
                  {selectedMission.phone}
                </p>
              </div>
            </div>

            <div className="border-t border-[#e2e8f0] bg-white px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end">
              {(statusMap[selectedMission.id] ?? "Chờ nhận") === "Chờ nhận" && (
                <button
                  type="button"
                  disabled={acceptingMissionId === selectedMission.id}
                  onClick={() => {
                    if (selectedMission.id) {
                      handleAcceptMissionClick(selectedMission.id);
                      setIsDetailOpen(false);
                    }
                  }}
                  className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {acceptingMissionId === selectedMission.id ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Đang chấp nhận...
                    </>
                  ) : (
                    "Chấp nhận nhiệm vụ"
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onRequestMissionAction(selectedMission.id, "Xin hủy");
                  setIsDetailOpen(false);
                }}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100"
              >
                Xin hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
