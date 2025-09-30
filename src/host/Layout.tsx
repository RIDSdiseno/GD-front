import { Outlet } from "react-router-dom";
import Header from "../components/Header";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header fijo arriba */}
      <Header />

      {/* Contenido principal */}
      <main className="flex-1 mt-0">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-10 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
