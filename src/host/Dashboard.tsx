// src/pages/Dashboard.tsx
import React, { useMemo } from "react";
import HeroSection from "../components/dashboard/HeroSection";
import KpiProgreso from "../components/dashboard/KpiProgreso";
import LeadsEstado from "../components/dashboard/LeadsEstado";
import ConfigResumen from "../components/dashboard/ConfigResumen";

/* ========= Helpers locales (tipados) ========= */
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

// lee ambos posibles nombres
const getToken = (): string | null =>
  localStorage.getItem("accessToken") ??
  localStorage.getItem("auth_token") ??
  sessionStorage.getItem("accessToken") ??
  sessionStorage.getItem("auth_token") ??
  null;

const decodeJwt = (token: string | null): JwtPayload | null => {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
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
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  const out = (first + second).toUpperCase();
  return out || (name[0]?.toUpperCase() ?? "U");
};
/* ============================================ */

const Dashboard: React.FC = () => {
  // Nombre real del usuario desde storage/JWT
  const displayName = useMemo(() => getDisplayName(), []);
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  // PLACEHOLDER: reemplaza por tus datos reales (fetch/context)
  const totalHoy = 25;
  const totalEtapas = 10;
  const entregadosOCerrados = 7;
  const progresoPct = Math.round(
    (entregadosOCerrados / Math.max(1, totalEtapas)) * 100
  );
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

  // estilos reutilizables
  const glass =
    "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl ring-1 ring-white/5 shadow-[0_20px_60px_rgba(0,0,0,.45)]";
  const pad = "p-4 sm:p-6";

  return (
    <div className="relative min-h-[100svh]">
      {/* Fondo con imagen y overlays neón (igual Users) */}
      <div className="fixed inset-0 -z-10">
        <img src="/FONDO1.png" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_0%,rgba(255,214,10,.16),transparent_60%),radial-gradient(900px_500px_at_90%_10%,rgba(0,224,182,.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
      </div>

      {/* Contenido */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        {/* Header neon */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-white drop-shadow-[0_0_18px_rgba(255,214,10,.35)]">
            Panel de Control
          </h1>
          {/* podrías agregar acciones globales aquí si quieres */}
        </div>

        {/* Hero (lo envolvemos en glass para que combine) */}
        <div className={`${glass} ${pad} mb-6 sm:mb-8 text-white`}>
          <HeroSection
            userName={displayName}
            initials={initials}
            onNewLead={() => (window.location.href = "/leads/nuevo")}
            onSearch={() => (window.location.href = "/leads/buscar")}
            onLogout={() => (window.location.href = "/login")}
          />
        </div>

        {/* Fila 1 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className={`lg:col-span-4 ${glass} ${pad} text-white`}>
            <KpiProgreso
              totalHoy={totalHoy}
              totalEtapas={totalEtapas}
              progresoPct={progresoPct}
            />
          </div>

          <div className={`lg:col-span-8 ${glass} ${pad} text-white`}>
            <LeadsEstado counts={counts} />
          </div>
        </div>

        {/* Fila 2 */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className={`lg:col-span-8 ${glass} ${pad} text-white`}>
            <ConfigResumen summary={config} />
          </div>

          <div className={`lg:col-span-4 ${glass} ${pad} text-white`}>
            <h3 className="mb-3 text-base font-semibold">
              Reportes
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  className="text-cyan-200 hover:text-cyan-100 hover:underline transition"
                  href="/reportes/ventas"
                >
                  Ventas del día
                </a>
              </li>
              <li>
                <a
                  className="text-cyan-200 hover:text-cyan-100 hover:underline transition"
                  href="/reportes/leads"
                >
                  Leads
                </a>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
