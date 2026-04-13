/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { TopBar } from "../shared/components/TopBar";
import { Sidebar } from "../shared/components/Sidebar";
import { HomeView } from "../features/home/pages/HomeView";
import { AlertCenter } from "../features/alerts/pages/AlertCenter";
import { RescueTrack } from "../features/tracking/pages/RescueTrack";
import { CreateRequest } from "../features/request/pages/CreateRequest";
import { SupportConfirmed } from "../features/request/pages/SupportConfirmed";

import { RescueTeamMission } from "../features/rescueTeam/pages/RescueTeamMission";

export default function App() {
  const location = useLocation();
  const isRescueTeamRoute = location.pathname === "/rescue-team";

  if (isRescueTeamRoute) {
    return (
      <div className="min-h-screen bg-surface selection:bg-blue-950/20 selection:text-blue-950">
        <Routes>
          <Route path="/rescue-team" element={<RescueTeamMission />} />
          <Route path="*" element={<Navigate to="/rescue-team" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface selection:bg-blue-950/20 selection:text-blue-950">
      <TopBar />

      <div className="flex pt-20">
        <Sidebar />

        <main className="flex-1 p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomeView />} />
            <Route path="/alerts" element={<AlertCenter />} />
            <Route path="/track" element={<RescueTrack />} />
            <Route path="/rescue-team" element={<RescueTeamMission />} />
            <Route path="/request" element={<CreateRequest />} />
            <Route path="/confirmed" element={<SupportConfirmed />} />
            <Route path="*" element={<Navigate to="/rescue-team" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
