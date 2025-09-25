import React, { useMemo, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaHome, FaUsers, FaCogs, FaSignOutAlt } from "react-icons/fa";
import clsx from "clsx";
import axios from "axios";

/* ========= Helpers ========= */
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
  localStorage.getItem("accessToken") ??
  localStorage.getItem("auth_token") ??
  sessionStorage.getItem("accessToken") ??
  sessionStorage.getItem("auth_token") ??
  null;

const getDisplayName = (): string => {
  const u = getStoredUser();
  if (u?.nombreUsuario) return u.nombreUsuario;

  const t = getToken();
  if (t) {
    try {
      const p = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as JwtPayload;
      if (p?.nombreUsuario) return p.nombreUsuario;
      if (p?.email) return p.email.split("@")[0];
    } catch {/* ignore */}
  }
  if (u?.email) return u.email.split("@")[0];
  return "Usuario";
};

const getInitials = (name: string): string => {
  const p = name.trim().split(/\s+/);
  const out = ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase();
  return out || (name[0]?.toUpperCase() ?? "U");
};
/* =================================== */

type SidebarProps = {
  isOpen: boolean;
  toggleSidebar: () => void;
  onLogout?: () => void;
};

type ItemProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
};

const Item: React.FC<ItemProps> = ({ to, icon, label, isOpen }) => (
  <NavLink to={to} title={!isOpen ? label : undefined}>
    {({ isActive }) => (
      <div
        className={clsx(
          "group relative flex items-center transition",
          // tamaño/espaciado por modo
          isOpen
            ? "gap-3 px-3 py-2 rounded-xl justify-start"
            : "h-10 w-10 mx-auto rounded-full justify-center", // círculo compacto
          // colores/hover
          "hover:bg-white/10",
          isActive ? "bg-white/15 ring-1 ring-white/15 text-white" : "text-zinc-200"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        {/* Indicador activo (más corto cuando está cerrado) */}
        <span
          className={clsx(
            "absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full transition-all",
            isOpen ? "h-6 w-1" : "left-1 h-5 w-1",
            isActive ? "bg-yellow-300 shadow-[0_0_10px_rgba(255,214,10,.9)] opacity-100" : "opacity-0"
          )}
          aria-hidden
        />
        {/* Icono escalado */}
        <span className={clsx(isOpen ? "text-[18px]" : "text-[20px]")}>{icon}</span>
        {isOpen && <span className="text-zinc-50">{label}</span>}
      </div>
    )}
  </NavLink>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, onLogout }) => {
  const name = useMemo(() => getDisplayName(), []);
  const initials = useMemo(() => getInitials(name), [name]);
  const navigate = useNavigate();

  // Axios
  const API_URL = import.meta.env.VITE_API_URL as string;
  const api = useMemo(
    () => axios.create({ baseURL: API_URL, withCredentials: true }),
    [API_URL]
  );

  const handleLogout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch { /* ignore */ }
    finally {
      try {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("user");
      } catch { /* ignore */ }
      try { localStorage.setItem("app:logout", String(Date.now())); } catch { /* ignore */ }
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
      {/* Fondo glass + neón */}
      <div className="absolute inset-0 bg-zinc-900/90 backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_-10%,rgba(255,214,10,0.10),transparent_60%),radial-gradient(60%_40%_at_50%_120%,rgba(0,224,182,0.08),transparent_60%)]" />
        <div className="absolute inset-y-0 left-0 w-px bg-white/10" />
      </div>

      <div className="relative flex h-full flex-col">
        {/* Header: logo grande arriba + toggle debajo, centrados */}
        <div className="flex flex-col items-center gap-3 px-3 pt-3">
          <div
            className={clsx(
              "overflow-hidden rounded-2xl ring-1 ring-white/20 shadow-[0_8px_30px_rgba(0,0,0,.35)]",
              isOpen ? "h-18 w-18" : "h-[72px] w-[72px]" // ~72px en modo cerrado
            )}
            aria-label="Logo"
          >
            <img src="/login/LOGO2.jpg" alt="Logo" className="h-full w-full object-cover" />
          </div>

          <button
            onClick={toggleSidebar}
            className={clsx(
              "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 text-zinc-100 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20",
              isOpen ? "h-10 w-10 text-sm" : "h-10 w-10 text-sm"
            )}
            aria-expanded={isOpen}
            aria-label="Alternar sidebar"
            title={isOpen ? "Colapsar" : "Expandir"}
          >
            {isOpen ? "«" : "»"}
          </button>
        </div>

        {/* Separador */}
        <div className="mx-3 my-3 h-px bg-white/10" />

        {/* NAV */}
        <nav className={clsx("px-3 pb-3", isOpen ? "flex-1 overflow-y-auto" : "flex-1")}>
          {isOpen && (
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400/80">
              General
            </div>
          )}

          <ul className={clsx("space-y-1", !isOpen && "space-y-2")}>
            <li>
              <Item to="/" icon={<FaHome />} label="Dashboard" isOpen={isOpen} />
            </li>
            <li>
              <Item to="/users" icon={<FaUsers />} label="Usuarios" isOpen={isOpen} />
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
              "mt-1 w-full text-sm transition",
              isOpen
                ? "flex items-center gap-3 rounded-xl px-3 py-2 text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
                : "mx-auto flex h-10 w-10 items-center justify-center rounded-full text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
            )}
          >
            <FaSignOutAlt className={clsx(isOpen ? "text-[18px]" : "text-[20px]")} />
            {isOpen && <span>Cerrar sesión</span>}
          </button>
        </nav>

        {/* FOOTER: Usuario */}
        <div className="border-t border-white/10 px-3 py-3">
          <div
            className={clsx(
              "ring-1 ring-white/10 bg-white/5",
              isOpen
                ? "flex items-center gap-3 rounded-xl px-2 py-2"
                : "mx-auto grid h-12 w-12 place-items-center rounded-xl"
            )}
            title={!isOpen ? name : undefined}
          >
            <div className="relative">
              <div className="pointer-events-none absolute -inset-1 rounded-lg blur-md bg-gradient-to-tr from-yellow-300/40 via-cyan-300/30 to-transparent" />
              <div className={clsx(
                "relative grid place-items-center bg-zinc-900/60 text-yellow-200 ring-1 ring-white/15 rounded-lg",
                isOpen ? "h-9 w-9" : "h-10 w-10"
              )}>
                <span className={clsx("font-bold", isOpen ? "text-sm" : "text-base")}>{initials}</span>
              </div>
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
