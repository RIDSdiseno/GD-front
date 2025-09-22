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
  try { return JSON.parse(raw) as StoredUser; } catch { return null; }
};

const getToken = (): string | null =>
  localStorage.getItem("auth_token") ?? sessionStorage.getItem("auth_token");

const decodeJwt = (token: string | null): JwtPayload | null => {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtPayload;
  } catch { return null; }
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
  const progresoPct = Math.round((entregadosOCerrados / Math.max(1, totalEtapas)) * 100);
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

  return (
    <div className="space-y-8 lg:space-y-10">
      <HeroSection
        userName={displayName}
        initials={initials}
        onNewLead={() => (window.location.href = "/leads/nuevo")}
        onSearch={() => (window.location.href = "/leads/buscar")}
        onLogout={() => (window.location.href = "/login")}
      />

      {/* Fila 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <KpiProgreso totalHoy={totalHoy} totalEtapas={totalEtapas} progresoPct={progresoPct} />
        </div>
        <div className="lg:col-span-8">
          <LeadsEstado counts={counts} />
        </div>
      </div>

      {/* Fila 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <ConfigResumen summary={config} />
        </div>
        <div className="lg:col-span-4">
          <div className="card">
            <div className="card-body">
              <h3 className="mb-3 text-base font-semibold text-zinc-900">Reportes</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a className="text-blue-600 hover:underline" href="/reportes/ventas">
                    Ventas del día
                  </a>
                </li>
                <li>
                  <a className="text-blue-600 hover:underline" href="/reportes/leads">
                    Leads
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
