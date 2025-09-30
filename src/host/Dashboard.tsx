// src/pages/Dashboard.tsx
import React, { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeroSection from "../components/dashboard/HeroSection";
import KpiProgreso from "../components/dashboard/KpiProgreso";
import LeadsEstado from "../components/dashboard/LeadsEstado";
import ConfigResumen from "../components/dashboard/ConfigResumen";

/* ========= Helpers ========= */
type StoredUser = {
  id: number;
  nombreUsuario: string;
  email: string;
  nivel: string;
  isAdmin: boolean;
  status?: boolean;
  createdAt?: string;
};
type JwtPayload = {
  id: number;
  email: string;
  nivel: string;
  isAdmin: boolean;
  nombreUsuario?: string;
  exp?: number;
  iat?: number;
};

const getStoredUser = (): StoredUser | null => {
  const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
};
const getToken = (): string | null =>
  localStorage.getItem("accessToken") ??
  localStorage.getItem("auth_token") ??
  sessionStorage.getItem("accessToken") ??
  sessionStorage.getItem("auth_token") ??
  null;

const decodeJwt = (t: string | null): JwtPayload | null => {
  if (!t) return null;
  const p = t.split(".");
  if (p.length !== 3) return null;
  try {
    const json = atob(p[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
};

const getDisplayName = (): string => {
  const u = getStoredUser();
  if (u?.nombreUsuario) return u.nombreUsuario;
  const jwt = decodeJwt(getToken());
  if (jwt?.nombreUsuario) return jwt.nombreUsuario;
  if (u?.email) return u.email.split("@")[0];
  if (jwt?.email) return jwt.email.split("@")[0];
  return "Usuario";
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  const out = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  return out || (name[0]?.toUpperCase() ?? "U");
};
/* ============================================ */

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const displayName = useMemo(() => getDisplayName(), []);
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  // Observa <html class="dark"> para saber el modo activo
  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const root = document.documentElement;
    const mo = new MutationObserver(() =>
      setIsDark(root.classList.contains("dark"))
    );
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  // Datos demo para tarjetas auxiliares
  const counts = { Nuevo: 5, "En proceso": 10, Finalizado: 5 };
  const config = {
    marcas: 10,
    comunas: 10,
    categorias: 5,
    estados: 3,
    tipo_cliente: 2,
    segmentacion: 1,
    usuario_marcas: 4,
  };

  // Demo: leads por marca (filtra vacíos y ordena por count desc)
  const leadsPorMarcaRaw: Array<{
    name: string;
    count: number;
    href: string;
    dot: string;
  }> = [
    { name: "General", count: 8, href: "/reportes/marca/general", dot: "#f97316" },
    { name: "CAMALEON", count: 6, href: "/reportes/marca/camaleon", dot: "#22c55e" },
    { name: "GOURMET", count: 4, href: "/reportes/marca/gourmet", dot: "#3b82f6" },
    { name: "", count: 2, href: "/reportes/marca/vacio", dot: "#a78bfa" },
    { name: "DEL SABOR", count: 2, href: "/reportes/marca/del-sabor", dot: "#a78bfa" },
  ];
  const leadsPorMarca = useMemo(
    () =>
      leadsPorMarcaRaw
        .filter((m) => m.name && m.name.trim().length > 0)
        .sort((a, b) => b.count - a.count),
    [leadsPorMarcaRaw]
  );
  const totalLeadsMarcas = useMemo(
    () => leadsPorMarca.reduce((a, b) => a + b.count, 0),
    [leadsPorMarca]
  );

  // Superficies: opacas en claro, glass en oscuro
  const surfaceLight =
    "rounded-2xl border border-zinc-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,.06)]";
  const surfaceDark =
    "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl ring-1 ring-white/5 shadow-[0_20px_60px_rgba(0,0,0,.45)]";
  const surface = isDark ? surfaceDark : surfaceLight;
  const pad = "p-4 sm:p-5 md:p-6";

  return (
    <main className="relative min-h-[100svh]">
      {/* Fondo */}
      <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <img src="/FONDO1.png" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(1200px_600px_at_10%_0%,rgba(255,214,10,.16),transparent_60%),radial-gradient(900px_500px_at_90%_10%,rgba(0,224,182,.16),transparent_60%)]" />
        <div className="absolute inset-0 block dark:hidden bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(168,230,207,0.12),transparent_60%),radial-gradient(900px_500px_at_110%_0%,rgba(255,140,102,0.12),transparent_55%)]" />
        {/* Velos para legibilidad */}
        <div className="absolute inset-0 block dark:hidden bg-white/55 backdrop-blur-[1px]" />
        <div className="absolute inset-0 hidden dark:block bg-black/65 backdrop-blur-[2px]" />
      </div>

      {/* Contenido */}
      <div
        className="
          mx-auto w-full max-w-7xl
          px-3 sm:px-4 md:px-6
          pt-3 sm:pt-4 md:pt-6
          pb-6 sm:pb-8 md:pb-10
        "
      >
        {/* Título */}
        <div className="mb-3 sm:mb-5 md:mb-8 flex items-center justify-between">
          <h1 className="text-zinc-900 dark:text-white text-xl sm:text-2xl md:text-3xl font-extrabold tracking-wide dark:drop-shadow-[0_0_18px_rgba(255,214,10,.35)]">
            Panel de Control
          </h1>
        </div>

        {/* Hero */}
        <section className={`${surface} ${pad} mb-4 sm:mb-6 md:mb-8`}>
          <HeroSection
            userName={displayName}
            initials={initials}
            onNewLead={() => navigate("/leads/nuevo")}
            onSearch={() => navigate("/leads/buscar")}
            onLogout={() => navigate("/login")}
          />
        </section>

        {/* Fila 1 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 md:gap-6">
          <section
            className={`md:col-span-6 lg:col-span-4 ${surface} ${pad}`}
            aria-label="Progreso"
          >
            <div className="kpi">
              {/* KpiProgreso ahora obtiene datos de la API internamente */}
              <KpiProgreso />
            </div>
          </section>

          <section
            className={`md:col-span-6 lg:col-span-8 ${surface} ${pad}`}
            aria-label="Estado de leads"
          >
            <div className="leads">
              <LeadsEstado counts={counts} />
            </div>
          </section>
        </div>

        {/* Fila 2 */}
        <div className="mt-4 sm:mt-5 md:mt-6 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 md:gap-6">
          <section
            className={`md:col-span-7 lg:col-span-8 ${surface} ${pad}`}
            aria-label="Resumen de configuración"
          >
            <ConfigResumen summary={config} />
          </section>

          {/* Leads por marca */}
          <section
            className={`md:col-span-5 lg:col-span-4 ${surface} ${pad}`}
            aria-label="Leads por marca"
          >
            <div className="brand-list">
              <div className="mb-2 sm:mb-3 flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-semibold">Reportes por Marca</h3>

                <span
                  className="brand-count rounded-full px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold"
                  title={`Total: ${totalLeadsMarcas}`}
                >
                  Total: {totalLeadsMarcas}
                </span>
              </div>

              {leadsPorMarca.length === 0 ? (
                <div className="text-sm opacity-70">No hay marcas para mostrar.</div>
              ) : (
                <ul className="space-y-2 text-sm">
                  {leadsPorMarca.map((m) => (
                    <li key={m.name}>
                      <a
                        href={m.href}
                        className={[
                          "brand-item",
                          "w-full flex items-center justify-between rounded-xl transition",
                          "px-3 py-2 sm:px-3.5 sm:py-2.5",
                          "hover:translate-y-[-1px] hover:shadow-md",
                          "focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-cyan-300/30",
                        ].join(" ")}
                        title={`Ver reporte de ${m.name}`}
                        aria-label={`Reporte de ${m.name}, ${m.count} lead(s)`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            aria-hidden
                            className="brand-dot"
                            style={{ backgroundColor: m.dot }}
                          />
                          <span className="brand-name truncate text-[13px] sm:text-sm">
                            {m.name}
                          </span>
                        </span>

                        <span
                          className="brand-count rounded-md px-2 py-0.5 text-[11px] sm:text-[12px] font-semibold"
                          title={`${m.count} lead(s)`}
                        >
                          {m.count}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
