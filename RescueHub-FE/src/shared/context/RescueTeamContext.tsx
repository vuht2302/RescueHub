import React, { createContext, useContext, useState, ReactNode } from "react";

interface RescueTeamContextType {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

const RescueTeamContext = createContext<RescueTeamContextType | undefined>(
  undefined,
);

export const RescueTeamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeMenu, setActiveMenu] = useState("dashboard");

  return (
    <RescueTeamContext.Provider value={{ activeMenu, setActiveMenu }}>
      {children}
    </RescueTeamContext.Provider>
  );
};

export const useRescueTeam = () => {
  const context = useContext(RescueTeamContext);
  if (!context) {
    throw new Error("useRescueTeam must be used within RescueTeamProvider");
  }
  return context;
};
