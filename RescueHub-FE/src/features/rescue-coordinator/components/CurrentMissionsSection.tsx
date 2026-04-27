import React, { useEffect, useState } from "react";
import { Loader2, MapPin, Clock, Shield, RefreshCw } from "lucide-react";
import { getIncidents, type IncidentItem } from "../services/incidentServices";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import { DispatchModal } from "./DispatchModal";
import { toastError, toastSuccess } from "../../../shared/utils/toast";
import {
  decideMissionAbortRequest,
  getMissionAbortRequests,
  type MissionAbortRequestItem,
} from "../services/missionAbortRequestService";

interface HandlingTeam {
  teamId: string;
  teamCode: string;
  teamName: string;
  isPrimaryTeam: boolean;
  missionId: string;
  missionCode: string;
  missionStatusCode: string;
  assignedAt: string;
}

interface MissionFromIncident {
  id: string;
  incidentCode: string;
  location: string;
  reportedAt: string;
  handlingTeams: HandlingTeam[];
  status: string;
}

interface DispatchContext {
  incidentId: string;
  incidentCode: string;
  location: string;
}

export function CurrentMissionsSection() {
  const [missions, setMissions] = useState<MissionFromIncident[]>([]);
  const [abortRequests, setAbortRequests] = useState<MissionAbortRequestItem[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAbortRequests, setIsLoadingAbortRequests] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abortError, setAbortError] = useState<string | null>(null);
  const [decidingAbortRequestId, setDecidingAbortRequestId] = useState<
    string | null
  >(null);
  const [selectedMission, setSelectedMission] =
    useState<MissionFromIncident | null>(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchContext, setDispatchContext] =
    useState<DispatchContext | null>(null);

  const fetchIncidentsWithTeams = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const session = getAuthSession();
      if (!session?.accessToken) {
        setError("Khong co phien dang nhap");
        return;
      }

      const incidents = await getIncidents(session.accessToken);
      const incidentsWithTeams = incidents.filter(
        (incident: IncidentItem) =>
          incident.handlingTeams && incident.handlingTeams.length > 0,
      );

      const missionsData: MissionFromIncident[] = incidentsWithTeams.map(
        (incident: IncidentItem) => ({
          id: incident.id,
          incidentCode: incident.incidentCode,
          location: incident.location?.addressText || "Chua co vi tri",
          reportedAt: incident.reportedAt,
          // Clone each team object to avoid cross-mission reference side effects.
          handlingTeams: (incident.handlingTeams || []).map((team) => ({
            ...team,
          })),
          status: incident.status?.code || "UNKNOWN",
        }),
      );

      setMissions(missionsData);
      if (missionsData.length === 0) {
        setSelectedMission(null);
        return;
      }

      setSelectedMission((current) => {
        if (!current) return missionsData[0];
        return (
          missionsData.find((mission) => mission.id === current.id) ??
          missionsData[0]
        );
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Loi khi tai nhiem vu");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAbortRequests = async () => {
    setIsLoadingAbortRequests(true);
    setAbortError(null);

    try {
      const session = getAuthSession();
      if (!session?.accessToken) {
        setAbortError("Khong co phien dang nhap");
        return;
      }

      const data = await getMissionAbortRequests(session.accessToken, {
        statusCode: "PENDING",
        page: 1,
        pageSize: 20,
      });
      setAbortRequests(data.items);
    } catch (err) {
      setAbortError(
        err instanceof Error ? err.message : "Loi khi tai yeu cau huy",
      );
    } finally {
      setIsLoadingAbortRequests(false);
    }
  };

  const refreshAllData = async () => {
    await Promise.all([fetchIncidentsWithTeams(), fetchAbortRequests()]);
  };

  useEffect(() => {
    void refreshAllData();
  }, []);

  const findMissionByIncidentId = (incidentId: string) =>
    missions.find((mission) => mission.id === incidentId);

  function getMissionStatusLabel(statusCode: string): string {
    const labels: Record<string, string> = {
      EN_ROUTE: "Đang di chuyển",
      ON_SITE: "ại hiện trường",
      RESCUING: "Đang cứu hộ",
      IN_PROGRESS: "Đang xử lý",
      ACCEPTED: "Đã chấp nhận",
      COMPLETED: "Hoàn thành",
      RETURNING: "Đang quay về",
      ASSIGNED: "Đã phân công",
      DISPATCHED: "Đã điều phối",
      ABORT_PENDING: "Đang chờ hủy",
      ABORTED: "Đã hủy",
      CANCELLED: "Đã hủy",
    };
    return labels[statusCode] || statusCode;
  }

  function getMissionStatusColor(statusCode: string): string {
    const colors: Record<string, string> = {
      EN_ROUTE: "bg-blue-500",
      ON_SITE: "bg-amber-500",
      ACCEPTED: "bg-green-500",
      RESCUING: "bg-red-500",
      IN_PROGRESS: "bg-amber-500",
      COMPLETED: "bg-green-500",
      RETURNING: "bg-gray-500",
      ASSIGNED: "bg-indigo-500",
      DISPATCHED: "bg-blue-500",
      ABORT_PENDING: "bg-orange-500",
      ABORTED: "bg-red-500",
      CANCELLED: "bg-red-500",
    };
    return colors[statusCode] || "bg-gray-500";
  }

  function calculateProgress(statusCode: string): number {
    const progressMap: Record<string, number> = {
      EN_ROUTE: 25,
      ASSIGNED: 25,
      DISPATCHED: 25,
      ON_SITE: 50,
      RESCUING: 75,
      IN_PROGRESS: 75,
      RETURNING: 90,
      COMPLETED: 100,
      ABORT_PENDING: 0,
      ABORTED: 0,
      CANCELLED: 0,
    };
    return progressMap[statusCode] || 0;
  }

  function getAbortReasonLabel(reasonCode: string): string {
    const labels: Record<string, string> = {
      RESOURCE_LIMIT: "Thieu nguon luc",
      SAFETY_RISK: "Rui ro an toan",
      ACCESS_BLOCKED: "Khong tiep can duoc",
      EQUIPMENT_FAILURE: "Su co thiet bi",
      OTHER: "Ly do khac",
    };
    return labels[reasonCode] || reasonCode;
  }

  function getAbortStatusLabel(statusCode: string): string {
    const labels: Record<string, string> = {
      PENDING: "Chờ duyệt",
      APPROVED: "Đã duyệt",
      REJECTED: "Từ chối",
    };
    return labels[statusCode] || statusCode;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const handleAbortDecision = async (
    abortRequest: MissionAbortRequestItem,
    decisionCode: "APPROVE" | "REJECT",
  ) => {
    const session = getAuthSession();
    if (!session?.accessToken) {
      toastError("Khong co phien dang nhap");
      return;
    }

    setDecidingAbortRequestId(abortRequest.abortRequestId);

    try {
      await decideMissionAbortRequest(
        abortRequest.mission.id,
        abortRequest.abortRequestId,
        {
          decisionCode,
          note:
            decisionCode === "APPROVE"
              ? "Coordinator da duyet yeu cau huy"
              : "Coordinator tu choi yeu cau huy",
        },
        session.accessToken,
      );

      toastSuccess(
        decisionCode === "APPROVE"
          ? "Da duyet yeu cau huy nhiem vu"
          : "Da tu choi yeu cau huy nhiem vu",
      );

      const matchedMission = findMissionByIncidentId(abortRequest.incident.id);
      if (decisionCode === "APPROVE") {
        setDispatchContext({
          incidentId: abortRequest.incident.id,
          incidentCode: abortRequest.incident.code,
          location: matchedMission?.location ?? "Chua co vi tri",
        });
        if (matchedMission) {
          setSelectedMission(matchedMission);
        }
        setShowDispatchModal(true);
      }

      await refreshAllData();
    } catch (err) {
      toastError(
        err instanceof Error ? err.message : "Khong the xu ly yeu cau huy",
      );
    } finally {
      setDecidingAbortRequestId(null);
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
          <p className="text-sm text-gray-700">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                  Nhiệm vụ đang thực hiện ({missions.length})
                </h3>
                <button
                  type="button"
                  onClick={() => void refreshAllData()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 transition-colors hover:border-blue-200 hover:text-blue-950"
                  title="Tải lại dữ liệu"
                >
                  <RefreshCw
                    size={12}
                    className={
                      isLoading || isLoadingAbortRequests ? "animate-spin" : ""
                    }
                  />
                  Làm mới
                </button>
              </div>

              {missions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">
                    Không có nhiệm vụ nào đang diễn ra
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {missions.map((mission) => (
                    <button
                      key={mission.id}
                      onClick={() => setSelectedMission(mission)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selectedMission?.id === mission.id
                          ? "border-gray-800 bg-gray-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-xs text-gray-900">
                          {mission.incidentCode}
                        </p>
                        <span className="text-xs text-gray-500">
                          {mission.handlingTeams.length} đội
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-1 mb-2">
                        {mission.location}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} />
                        {formatDate(mission.reportedAt)}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-wide">
                  Yêu cầu huỷ nhiệm vụ ({abortRequests.length})
                </h4>

                {isLoadingAbortRequests ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 size={14} className="animate-spin" />
                    Đang tải yêu cầu huỷ .....
                  </div>
                ) : abortError ? (
                  <p className="text-xs text-red-600">{abortError}</p>
                ) : abortRequests.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    Không có yêu cầu huỷ nhiệm vụ nào đang chờ xử lý
                  </p>
                ) : (
                  <div className="space-y-2">
                    {abortRequests.map((abortRequest) => {
                      const isDeciding =
                        decidingAbortRequestId === abortRequest.abortRequestId;
                      return (
                        <div
                          key={abortRequest.abortRequestId}
                          className="rounded-lg border border-orange-200 bg-orange-50/40 p-3"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <p className="font-semibold text-xs text-gray-900">
                                {abortRequest.incident.code}
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {abortRequest.mission.code} -{" "}
                                {abortRequest.mission.primaryTeam?.teamName ??
                                  "Chưa có đội"}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-500 text-white">
                              {getAbortStatusLabel(abortRequest.statusCode)}
                            </span>
                          </div>

                          <p className="text-xs text-gray-700">
                            Lý do:{" "}
                            {getAbortReasonLabel(abortRequest.reasonCode)}
                          </p>
                          {abortRequest.detailNote && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              Ghi chú: {abortRequest.detailNote}
                            </p>
                          )}
                          <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-2">
                            <Clock size={11} />
                            {formatDate(abortRequest.requestedAt)}
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() =>
                                void handleAbortDecision(
                                  abortRequest,
                                  "APPROVE",
                                )
                              }
                              disabled={isDeciding}
                              className="flex-1 text-xs px-2 py-1.5 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() =>
                                void handleAbortDecision(abortRequest, "REJECT")
                              }
                              disabled={isDeciding}
                              className="flex-1 text-xs px-2 py-1.5 rounded bg-gray-700 text-white font-semibold hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              Từ chối
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedMission ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 p-5 shadow-sm bg-white">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {selectedMission.incidentCode}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                        <MapPin size={16} />
                        {selectedMission.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Báo cáo lúc</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(selectedMission.reportedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Shield size={16} className="text-gray-600" />
                    <span className="text-sm text-gray-700">
                      Trạng thái:{" "}
                      <span className="font-medium">
                        {getMissionStatusLabel(selectedMission.status)}
                      </span>
                    </span>
                  </div>
                </div>

                <div
                  key={selectedMission.id}
                  className="bg-white rounded-lg shadow-sm p-5 border border-gray-200"
                >
                  <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                    Đội được phân công ({selectedMission.handlingTeams.length})
                  </h4>

                  <div className="space-y-3">
                    {selectedMission.handlingTeams.map((team) => {
                      const progress = calculateProgress(
                        team.missionStatusCode,
                      );
                      return (
                        <div
                          key={`${selectedMission.id}-${team.missionId}-${team.teamId}`}
                          className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm text-gray-900">
                                  {team.teamName}
                                </p>
                                {team.isPrimaryTeam && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                                    Chính
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Ma doi: {team.teamCode} | Ma nhiem vu:{" "}
                                {team.missionCode}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Phân công lúc: {formatDate(team.assignedAt)}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap ${getMissionStatusColor(team.missionStatusCode)}`}
                            >
                              {getMissionStatusLabel(team.missionStatusCode)}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-700">
                                Tiến độ
                              </span>
                              <span className="text-xs font-bold text-gray-900">
                                {progress}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all bg-gray-800"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 flex items-center justify-center h-96">
                <p className="text-gray-500">
                  Chọn một nhiệm vụ để xem chi tiết
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {dispatchContext && (
        <DispatchModal
          isOpen={showDispatchModal}
          onClose={() => {
            setShowDispatchModal(false);
            setDispatchContext(null);
          }}
          requestId={dispatchContext.incidentId}
          requestTitle={`Su co ${dispatchContext.incidentCode}`}
          location={dispatchContext.location}
          victimCount={0}
          onDispatch={() => {
            setShowDispatchModal(false);
            setDispatchContext(null);
            void refreshAllData();
          }}
        />
      )}
    </>
  );
}
