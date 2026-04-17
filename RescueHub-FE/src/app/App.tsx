/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { TopBar } from "../shared/components/TopBar";
import { Sidebar } from "../shared/components/Sidebar";
import { ManagerProvider } from "../shared/context/ManagerContext";
import { CoordinatorProvider } from "../shared/context/CoordinatorContext";
import { RescueTeamProvider } from "../shared/context/RescueTeamContext";
import { HomeView } from "../features/home/pages/HomeView";
import { RescueTrack } from "../features/tracking/pages/RescueTrack";
import { SupportConfirmed } from "../features/request/pages/SupportConfirmed";
import { RescueTeamMission } from "../features/rescueTeam/pages/RescueTeamMission";
import { RescueCoordinator } from "../features/rescue-coordinator/pages/RescueCoordinator";
import ManagerDashboard from "../features/manager/pages/dashboard";
import { AdminPage } from "../features/admin/pages/AdminPage";
import { getDefaultRouteForRoles } from "../features/auth/services/authService";
import {
  getAuthSession,
  hasAnyRole,
} from "../features/auth/services/authStorage";

export default function App() {
  const location = useLocation();
  const authSession = getAuthSession();
  const fallbackRoute = getDefaultRouteForRoles(authSession?.user.roles ?? []);
  const isHomeRoute =
    location.pathname === "/" || location.pathname === "/home";
  const isRescueTeamRoute = location.pathname === "/rescue-team";
  const isCoordinatorRoute = location.pathname.startsWith(
    "/rescue-coordinator",
  );
  const isManagerRoute = location.pathname.startsWith("/manager");
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (isAdminRoute && !hasAnyRole(authSession, ["ADMIN"])) {
    return <Navigate to={fallbackRoute} replace />;
  }

  if (isManagerRoute && !hasAnyRole(authSession, ["MANAGER"])) {
    return <Navigate to={fallbackRoute} replace />;
  }

  if (isCoordinatorRoute && !hasAnyRole(authSession, ["COORDINATOR"])) {
    return <Navigate to={fallbackRoute} replace />;
  }

  if (
    isRescueTeamRoute &&
    !hasAnyRole(authSession, ["TEAM_LEADER", "TEAM_MEMBER"])
  ) {
    return <Navigate to={fallbackRoute} replace />;
  }

  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64">
          <Routes>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </div>
    );
  }
  if (isRescueTeamRoute) {
    return (
      <div className="min-h-screen bg-surface selection:bg-blue-950/20 selection:text-blue-950">
        <RescueTeamProvider>
          <Sidebar />
          <div className="ml-64">
            <Routes>
              <Route path="/rescue-team" element={<RescueTeamMission />} />
              <Route
                path="*"
                element={<Navigate to="/rescue-team" replace />}
              />
            </Routes>
          </div>
        </RescueTeamProvider>
      </div>
    );
  }
  if (isCoordinatorRoute) {
    return (
      <div className="min-h-screen bg-yellow-50">
        <CoordinatorProvider>
          <Sidebar />
          <div className="ml-64">
            <Routes>
              <Route
                path="/rescue-coordinator"
                element={<RescueCoordinator />}
              />

              <Route
                path="*"
                element={<Navigate to="/rescue-coordinator" replace />}
              />
            </Routes>
          </div>
        </CoordinatorProvider>
      </div>
    );
  }

  if (isManagerRoute) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <ManagerProvider>
          <Sidebar />
          <div className="ml-64">
            <Routes>
              <Route path="/manager" element={<ManagerDashboard />} />
              <Route path="*" element={<Navigate to="/manager" replace />} />
            </Routes>
          </div>
        </ManagerProvider>
      </div>
    );
  }

  return (
    <div
      className={
        isHomeRoute
          ? "h-screen overflow-hidden bg-surface selection:bg-blue-950/20 selection:text-blue-950"
          : "min-h-screen bg-surface selection:bg-blue-950/20 selection:text-blue-950"
      }
    >
      <TopBar />

      <div
        className={
          isHomeRoute ? "flex pt-20 h-screen overflow-hidden" : "flex pt-20"
        }
      >
        {!isHomeRoute && <Sidebar />}

        <main
          className={
            isHomeRoute
              ? "flex-1 h-[calc(100vh-80px)] overflow-hidden p-0"
              : "flex-1 p-4 md:p-8"
          }
        >
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomeView />} />
            <Route path="/track" element={<RescueTrack />} />
            <Route path="/rescue-team" element={<RescueTeamMission />} />
            <Route path="/confirmed" element={<SupportConfirmed />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
