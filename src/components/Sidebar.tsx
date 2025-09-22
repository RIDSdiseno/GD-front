import React, { useMemo, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaHome, FaUsers, FaCogs, FaSignOutAlt } from "react-icons/fa";
import clsx from "clsx";
import axios from "axios";

/* ========= Helpers locales tipadas para obtener el usuario ========= */
type StoredUser = {
  id: number;
  nombreUsuario: string;
  email: string;
  nivel: string;
  isAdmin: boolean;
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
  const p = name.trim().split(/\s+/);
  const out = ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase();
  return out || (name[0]?.toUpperCase() ?? "U");
};
/* =================================================================== */

type SidebarProps = {
  isOpen: boolean;
  toggleSidebar: () => void;
  onLogout?: () => void;
};

const Item: React.FC<
  React.PropsWithChildren<{
    to: string;
    icon: React.ReactNode;
    label: string;
    isOpen: boolean;
  }>
> = ({ to, icon, label, isOpen, children }) => (
  <NavLink
    to={to}
    title={!isOpen ? label : undefined}
    className={({ isActive }) =>
      clsx(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
        "hover:bg-white/10",
        isActive ? "bg-white/15 ring-1 ring-white/15" : "text-zinc-200"
      )
    }
  >
    {/* Indicador activo a la izquierda */}
    <span
      className={clsx(
        "absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full transition-all",
        "h-6 w-1 bg-emerald-400",
        "[&[aria-current]]:opacity-100 opacity-0"
      )}
      aria-hidden
    />
    <span className="text-zinc-100">{icon}</span>
    {isOpen && <span className="text-zinc-50">{label}</span>}
    {children}
  </NavLink>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, onLogout }) => {
  const name = useMemo(() => getDisplayName(), []);
  const initials = useMemo(() => getInitials(name), [name]);
  const navigate = useNavigate();

  // === Axios + Vite API URL ===
  const API_URL = import.meta.env.VITE_API_URL as string;
  const api = useMemo(
    () => axios.create({ baseURL: API_URL, withCredentials: true }),
    [API_URL]
  );

  const handleLogout = useCallback(async () => {
    try {
      // Llama al backend para limpiar cookie `rt`
      await api.post("/auth/logout");
    } catch {
      // Si falla igual limpiamos el lado cliente
    } finally {
      // Limpieza local
      try {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("user");
      } catch {//
        }
      // Propagar a otras pestañas (opcional)
      try {
        localStorage.setItem("app:logout", String(Date.now()));
      } catch {//
        }
      // Redirigir al login
      navigate("/login", { replace: true });
    }
  }, [api, navigate]);

  return (
    <aside
      className={clsx(
        "fixed inset-y-0 left-0 z-40",
        "transition-[width] duration-300",
        isOpen ? "w-64" : "w-20"
      )}
      aria-label="Sidebar principal"
    >
      {/* Fondo */}
      <div className="absolute inset-0 rounded-none bg-zinc-900/90 backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_-10%,rgba(16,185,129,0.10),transparent_60%)]" />
      </div>

      <div className="relative flex h-full flex-col">
        {/* Header + Toggle */}
        <div className="flex items-center justify-between px-3 pt-4">
          <div
            className={clsx(
              "overflow-hidden rounded-xl",
              isOpen ? "h-10 w-10" : "h-8 w-8"
            )}
            aria-label="Logo"
          >
            <img
              src="/login/LOGO2.jpg"
              alt="Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <button
            onClick={toggleSidebar}
            className="ml-auto inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-white/15"
            aria-expanded={isOpen}
            aria-label="Alternar sidebar"
            title={isOpen ? "Colapsar" : "Expandir"}
          >
            {isOpen ? "«" : "»"}
          </button>
        </div>

        {/* NAV */}
        <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-3">
          {isOpen && (
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400/80">
              General
            </div>
          )}

          <ul className="space-y-1">
            <li>
              <Item to="/dashboard" icon={<FaHome />} label="Dashboard" isOpen={isOpen} />
            </li>
            <li>
              <Item to="/usuarios" icon={<FaUsers />} label="Usuarios" isOpen={isOpen} />
            </li>
            <li>
              <Item to="/settings" icon={<FaCogs />} label="Configuración" isOpen={isOpen} />
            </li>
          </ul>

          <div className="my-4 h-px w-full bg-white/10" />

          {isOpen && (
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400/80">
              Sesión
            </div>
          )}

          <button
            onClick={onLogout ?? handleLogout}
            title={!isOpen ? "Cerrar sesión" : undefined}
            className={clsx(
              "mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm",
              "text-red-300 hover:bg-red-500/10 hover:text-red-200"
            )}
          >
            <FaSignOutAlt />
            {isOpen && <span>Cerrar sesión</span>}
          </button>
        </nav>

        {/* FOOTER: Usuario */}
        <div className="border-t border-white/10 px-3 py-3">
          <div
            className={clsx(
              "flex items-center gap-3 rounded-xl bg-white/5 ring-1 ring-white/10",
              "px-2 py-2"
            )}
            title={!isOpen ? name : undefined}
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-300/30">
              <span className="text-sm font-bold">{initials}</span>
            </div>

            {isOpen && (
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">{name}</div>
                <div className="truncate text-[11px] text-emerald-200/80">
                  {getStoredUser()?.nivel ?? "Usuario"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
