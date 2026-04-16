import React, { useState } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import Dashboard from "../components/Dashboard";
import UserManagement from "../components/UserManagement";
import RoleManagement from "../components/RoleManagement";
import ReportDashboard from "../components/ReportDashboard";
import MasterDataPage from "../components/MasterDataPage";
import WorkflowPage from "../components/WorkflowPage";
import CatalogManagement from "../components/CatalogManagement";
import SystemSettingsPage from "../components/SystemSettingsPage";


export const AdminPage = () => {
  const [activeMenu, setActiveMenu] = useState("reports");

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return <Dashboard />;
      case "users":
        return <UserManagement />;
     case "roles":
        return <RoleManagement />;
      case "master-data":
        return <MasterDataPage />;
      case "catalog":
        return <CatalogManagement />;
      case "workflow":
        return <WorkflowPage />;
      case "system-setting":
        return <SystemSettingsPage />;
      case "reports":
        return <ReportDashboard />;
        default: return <ReportDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar active={activeMenu} setActive={setActiveMenu} />

      {/* Content */}
      <div className="ml-12 p-6">{renderContent()}</div>
    </div>
  );
};