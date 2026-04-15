import { createContext, useContext, useState } from "react";

type AdminMenu =
  | "dashboard"
  | "users"
  | "roles"
  | "config"
  | "workflow"
  | "reports";

interface AdminContextType {
  activeMenu: AdminMenu;
  setActiveMenu: (menu: AdminMenu) => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider = ({ children }: any) => {
  const [activeMenu, setActiveMenu] = useState<AdminMenu>("dashboard");

  return (
    <AdminContext.Provider value={{ activeMenu, setActiveMenu }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used inside AdminProvider");
  return context;
};