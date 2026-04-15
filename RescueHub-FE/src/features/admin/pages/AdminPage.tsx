import React, { useState } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import Dashboard from "../components/Dashboard";
import UserManagement from "../components/UserManagement";
import RoleManagement from "../components/RoleManagement";
import ReportDashboard from "../components/ReportDashboard";
import MasterDataPage from "../components/MasterDataPage";


export const AdminPage = () => {
  const [activeMenu, setActiveMenu] = useState("dashboard");

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
    //   case "workflow":
    //     return <Workflow />;
      case "reports":
        return <ReportDashboard />;
        default: return <Dashboard />;
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