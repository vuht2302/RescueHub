import React from "react";
import { useManager } from "../../../shared/context/ManagerContext";
import { InventorySection } from "../components/InventorySection";
import { ImportExportSection } from "../components/ImportExportSection";
import { VehicleManagementSection } from "../components/VehicleManagementSection";
import { PendingVerificationSection } from "../components/PendingVerificationSection";
import { ReliefHotspotMap } from "../components/ReliefHotspotMap";
import { RescueTeamManagementSection } from "../components/RescueTeamManagementSection";
import { ReliefRequestsPage } from "../../rescue-coordinator/pages/ReliefRequestsPage";
import { ReliefDistributionPage } from "../pages/ReliefDistributionPage";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import { ManagerOverviewPanel } from "../components/ManagerOverviewPanel";

export default function ManagerDashboard() {
  const { activeMenu } = useManager();

  return (
    <div className="p-6 md:p-8 bg-gradient-to-b from-slate-50 to-white min-h-screen">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Overview Section */}
        {activeMenu === "overview" && (
          <>
            {/* Pending Verification Section */}
            {(() => {
              const session = getAuthSession();
              return session?.accessToken ? (
                <>
                  <ManagerOverviewPanel accessToken={session.accessToken} />
                  <PendingVerificationSection
                    accessToken={session.accessToken}
                  />
                </>
              ) : null;
            })()}
          </>
        )}

        {/* Inventory Management Section */}
        {activeMenu === "inventory" && <InventorySection />}

        {/* Import/Export Section */}
        {activeMenu === "import-export" && <ImportExportSection />}

        {/* Vehicle Management Section */}
        {activeMenu === "vehicle" && <VehicleManagementSection />}

        {/* Rescue Team Management Section */}
        {activeMenu === "rescue-team" && <RescueTeamManagementSection />}

        {/* Relief Distribution Section */}
        {activeMenu === "relief-distribution" && (
          <ReliefDistributionPage className="h-[calc(100vh-120px)]" />
        )}

        {/* Relief Hotspot Section */}
        {activeMenu === "relief-hotspot" && (
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            <ReliefHotspotMap className="h-[calc(100vh-140px)]" />
          </div>
        )}

        {/* Relief List Section */}
        {activeMenu === "relief-list" && (
          <ReliefRequestsPage className="h-[calc(100vh-120px)]" />
        )}

        {/* Reports Section - Placeholder */}
        {activeMenu === "reports" && (
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3
              className="text-xl font-bold text-slate-900"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Báo cáo & thống kê
            </h3>
            <p className="mt-2 text-slate-600">
              Phần báo cáo đang được phát triển. Sẽ hiển thị các biểu đồ thống
              kê, phân tích tồn kho, và xu hướng tiêu thụ.
            </p>
          </article>
        )}
      </div>
    </div>
  );
}
