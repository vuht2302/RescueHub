/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { TopBar } from "../shared/components/TopBar";
import { HomeView } from "../features/home/pages/HomeView";
import { AlertCenter } from "../features/alerts/pages/AlertCenter";
import { RescueTrack } from "../features/tracking/pages/RescueTrack";
import { CreateRequest } from "../features/request/pages/CreateRequest";
import { SupportConfirmed } from "../features/request/pages/SupportConfirmed";

export default function App() {
  return (
    <div className="min-h-screen bg-surface selection:bg-primary/20 selection:text-primary">
      <TopBar />

      <div className="flex pt-20">
        <main className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/alerts" element={<AlertCenter />} />
            <Route path="/track" element={<RescueTrack />} />
            <Route path="/request" element={<CreateRequest />} />
            <Route path="/confirmed" element={<SupportConfirmed />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
