import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(v => !v);

  return (
    <div className="min-h-screen">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <main
        className={`min-h-screen transition-all duration-300
          ${isSidebarOpen ? "lg:ml-64 ml-20" : "ml-20"}`}
      >
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-10 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
