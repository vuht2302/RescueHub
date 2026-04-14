import React, { createContext, useContext, useState, ReactNode } from "react";

interface CoordinatorContextType {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

const CoordinatorContext = createContext<CoordinatorContextType | undefined>(
  undefined,
);

export const CoordinatorProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeMenu, setActiveMenu] = useState("overview");

  return (
    <CoordinatorContext.Provider value={{ activeMenu, setActiveMenu }}>
      {children}
    </CoordinatorContext.Provider>
  );
};

export const useCoordinator = () => {
  const context = useContext(CoordinatorContext);
  if (!context) {
    throw new Error("useCoordinator must be used within CoordinatorProvider");
  }
  return context;
};
