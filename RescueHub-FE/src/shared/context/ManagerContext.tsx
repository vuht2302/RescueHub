import React, { createContext, useContext, useState, ReactNode } from "react";

type ManagerMenuItemType =
  | "overview"
  | "inventory"
  | "rescue-team"
  | "vehicle"
  | "reports"
  | "event"
  | "import-export"
  | "settings"
  | "relief-hotspot"
  | "relief-list"
  | "relief-distribution";

interface ManagerContextType {
  activeMenu: ManagerMenuItemType;
  setActiveMenu: (menu: ManagerMenuItemType) => void;
}

const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

export const ManagerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeMenu, setActiveMenu] = useState<ManagerMenuItemType>("overview");

  return (
    <ManagerContext.Provider value={{ activeMenu, setActiveMenu }}>
      {children}
    </ManagerContext.Provider>
  );
};

export const useManager = () => {
  const context = useContext(ManagerContext);
  if (!context) {
    throw new Error("useManager must be used within ManagerProvider");
  }
  return context;
};

export type { ManagerMenuItemType };
