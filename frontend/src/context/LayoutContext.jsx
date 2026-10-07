import React, { createContext, useContext, useState } from "react";

const LayoutContext = createContext({
  sidebarOpen: false,
  toggleSidebar: () => {},
  closeSidebar: () => {},
  setSidebarOpen: () => {},
});

export function LayoutProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <LayoutContext.Provider value={{ sidebarOpen, toggleSidebar, closeSidebar, setSidebarOpen }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}
