import React, { createContext, useContext, useState, ReactNode } from "react";

interface ManagerContextType {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

export const ManagerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeMenu, setActiveMenu] = useState("overview");

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
