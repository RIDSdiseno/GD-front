import React, { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaHome, FaUsers, FaCogs, FaSignOutAlt, FaBars, FaMoon, FaSun } from "react-icons/fa";
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
  id: number; email: string; nivel: string; isAdmin: boolean;
  nombreUsuario?: string; exp?: number; iat?: number;
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
  sessionStorage.getItem("auth_token") ?? null;

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

/* =============== Tema =============== */
type ThemePref = "light" | "dark" | "system";
const THEME_KEY = "theme";

const getSavedTheme = (): ThemePref => {
  const v = localStorage.getItem(THEME_KEY) as ThemePref | null;
  return v === "light" || v === "dark" || v === "system" ? v : "system";
};
const computeEffective = (pref: ThemePref, sysDark: boolean) =>
  pref === "system" ? (sysDark ? "dark" : "light") : pref;

function setMeta(name: string, value: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
  el.setAttribute("content", value);
}
function applyThemeRuntime(pref: ThemePref) {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const effective = computeEffective(pref, mql.matches);
  const root = document.documentElement;
  root.classList.toggle("dark", effective === "dark");
  (root as HTMLElement).style.colorScheme = effective === "dark" ? "dark" : "light";
  setMeta("color-scheme", effective === "dark" ? "dark" : "light");
  setMeta("theme-color", effective === "dark" ? "#0f1117" : "#ffffff");
  return effective as "light" | "dark";
}

/* =============== NavItem con estados accesibles =============== */
type NavItemProps = { to: string; icon: React.ReactNode; label: string; onClick?: () => void; };
const NavItem: React.FC<NavItemProps> = ({ to, icon, label, onClick }) => (
  <NavLink to={to} onClick={onClick}>
    {({ isActive }) => (
      <div
        className={clsx("navitem nav-ink", isActive && "navitem--active")}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="text-[16px]">{icon}</span>
        <span className="hidden sm:inline">{label}</span>
      </div>
    )}
  </NavLink>
);

/* =============== Header =============== */
const Header: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const name = useMemo(() => getDisplayName(), []);
  const initials = useMemo(() => getInitials(name), [name]);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  // Estado de tema
  const [theme, setTheme] = useState<ThemePref>(() => getSavedTheme());
  const [effective, setEffective] = useState<"light" | "dark">(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    return computeEffective(getSavedTheme(), mql.matches);
  });
  const isDark = effective === "dark";

  // Aplicar cuando cambie la preferencia local
  useEffect(() => {
    const applied = applyThemeRuntime(theme);
    setEffective(applied);
    try { localStorage.setItem(THEME_KEY, theme); } catch {/* ignore */}
  }, [theme]);

  // Seguir al sistema si pref = system
  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setEffective(applyThemeRuntime("system"));
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, [theme]);

  // Sincronizar entre pestañas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY) setTheme(getSavedTheme());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Menú de tema (click fuera + ESC)
  const [openThemeMenu, setOpenThemeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!openThemeMenu) return;
    const onClick = (e: MouseEvent) => { if (!menuRef.current) return; if (!menuRef.current.contains(e.target as Node)) setOpenThemeMenu(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenThemeMenu(false); };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("mousedown", onClick); window.removeEventListener("keydown", onKey); };
  }, [openThemeMenu]);

  // Acciones tema
  const setLight = () => setTheme("light");
  const setDark = () => setTheme("dark");
  const setSystem = () => setTheme("system");
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");
  const themeLabel = theme === "system" ? "Seguir sistema" : theme === "dark" ? "Oscuro" : "Claro";

  // Axios + logout
  const API_URL = import.meta.env.VITE_API_URL as string;
  const api = useMemo(() => axios.create({ baseURL: API_URL, withCredentials: true }), [API_URL]);
  const handleLogout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch {/* ignore */}
    finally {
      try {
        localStorage.removeItem("accessToken"); localStorage.removeItem("auth_token"); localStorage.removeItem("user");
        sessionStorage.removeItem("accessToken"); sessionStorage.removeItem("auth_token"); sessionStorage.removeItem("user");
      } catch {/* ignore */}
      try { localStorage.setItem("app:logout", String(Date.now())); } catch {/* ignore */}
      navigate("/login", { replace: true });
    }
  }, [api, navigate]);

  return (
    <header
      className={clsx(
        "app-header",                         // asegura color-scheme fijo del header
        "sticky top-0 z-50 w-full ring-1 shadow-md",
        "bg-white text-neutral-900 ring-black/10",
        "dark:bg-zinc-950 dark:text-white dark:ring-white/10"
      )}
      aria-label="Barra de navegación principal"
    >
      <div className="relative mx-auto max-w-7xl px-3 sm:px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Izquierda */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-xl ring-1 ring-black/10 dark:ring-white/15" aria-label="Logo">
              <img src="/login/LOGO2.jpg" alt="Logo" className="h-full w-full object-cover" />
            </div>

            {/* Botón hamburguesa */}
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              className="iconbtn nav-ink"
              aria-expanded={open}
              aria-controls="primary-menu"
              aria-label="Abrir/cerrar menú"
              title={open ? "Cerrar menú" : "Abrir menú"}
            >
              <FaBars className="text-[18px]" />
            </button>
          </div>

          {/* Centro */}
          <nav className="hidden sm:flex items-center gap-1" aria-label="Navegación">
            <NavItem to="/"         icon={<FaHome />}  label="Dashboard" />
            <NavItem to="/users"    icon={<FaUsers />} label="Usuarios" />
            <NavItem to="/leads"    icon={<FaUsers />} label="Leads" />
            <NavItem to="/settings" icon={<FaCogs />}  label="Configuración" />
          </nav>

          {/* Derecha */}
          <div className="relative flex items-center gap-2">
            {/* Toggle rápido (sol/luna) */}
            <button
              onClick={toggleTheme}
              className="iconbtn nav-ink"
              aria-label="Cambiar tema"
              title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {isDark ? <FaSun /> : <FaMoon />}
            </button>

            {/* Menú de modos */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpenThemeMenu(v => !v)}
                className="hidden sm:inline-flex chip nav-ink"
                aria-haspopup="menu"
                aria-expanded={openThemeMenu}
                title="Preferencia de tema"
              >
                {themeLabel}
              </button>

              {openThemeMenu && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-48 rounded-lg border bg-white text-neutral-900 shadow-lg border-neutral-200
                             dark:bg-zinc-900 dark:text-white dark:border-white/15"
                >
                  <button onClick={() => { setLight();  setOpenThemeMenu(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-white/10"
                          role="menuitemradio" aria-checked={theme === "light"}>
                    Claro
                  </button>
                  <button onClick={() => { setDark();   setOpenThemeMenu(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-white/10"
                          role="menuitemradio" aria-checked={theme === "dark"}>
                    Oscuro
                  </button>
                  <button onClick={() => { setSystem(); setOpenThemeMenu(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-white/10"
                          role="menuitemradio" aria-checked={theme === "system"}>
                    Seguir sistema
                  </button>
                </div>
              )}
            </div>

            {/* Usuario */}
            <div className="relative" title={name} aria-label={`Usuario: ${name}`}>
              <div className="relative grid h-10 w-10 place-items-center rounded-lg ring-1
                              bg-white text-yellow-700 ring-black/10
                              dark:bg-zinc-900/80 dark:text-yellow-200 dark:ring-white/15">
                <span className="text-sm font-bold">{"{"+initials+"}"}</span>
              </div>
            </div>

            <div className="hidden min-w-0 sm:flex sm:flex-col">
              <div className="truncate text-sm font-semibold nav-ink">{name}</div>
              <div className="truncate text-[11px] nav-ink/70">
                {getStoredUser()?.nivel ?? "Usuario"}
              </div>
            </div>

            <button
              onClick={onLogout ?? handleLogout}
              className="chip nav-ink"
              title="Cerrar sesión"
            >
              <FaSignOutAlt className="text-[16px]" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Menú mobile */}
        <div
          id="primary-menu"
          className={clsx("sm:hidden overflow-hidden transition-[max-height] duration-300", open ? "max-h-64" : "max-h-0")}
        >
          <nav className="grid gap-2 pb-3" aria-label="Navegación móvil">
            <NavItem to="/"         icon={<FaHome />}  label="Dashboard"      onClick={() => setOpen(false)} />
            <NavItem to="/users"    icon={<FaUsers />} label="Usuarios"       onClick={() => setOpen(false)} />
            <NavItem to="/leads"    icon={<FaUsers />} label="Leads"          onClick={() => setOpen(false)} />
            <NavItem to="/settings" icon={<FaCogs />}  label="Configuración"  onClick={() => setOpen(false)} />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
