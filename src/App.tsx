// src/App.tsx

import type { ReactElement } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginRids from "./host/login";
import Dashboard from "./host/Dashboard";
import Layout from "./host/Layout";
import Users from "./host/Users";

type Nivel = "ADMIN" | "SUB_ADMIN" | "USER";

function isNivel(v: unknown): v is Nivel {
  return v === "ADMIN" || v === "SUB_ADMIN" || v === "USER";
}

function getToken(): string | null {
  return (
    localStorage.getItem("accessToken") ??
    sessionStorage.getItem("accessToken") ??
    localStorage.getItem("auth_token") ??
    sessionStorage.getItem("auth_token")
  );
}

function getUserNivel(): Nivel | null {
  try {
    const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { nivel?: unknown };
    return isNivel(parsed.nivel) ? parsed.nivel : null;
  } catch {
    return null;
  }
}

/** Guarda que solo exige estar autenticado (para Dashboard, etc.) */
function AuthGuard({ children }: { children: ReactElement }) {
  const location = useLocation();
  const token = getToken();
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

/** Guarda por rol para rutas específicas (Users) */
function RoleGuard({ roles, children }: { roles: Nivel[]; children: ReactElement }) {
  const location = useLocation();
  const token = getToken();
  const nivel = getUserNivel();
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!nivel || !roles.includes(nivel)) return <Navigate to="/denied" replace />;
  return children;
}

function Denied() {
  return (
    <div className="p-6 text-center text-red-300">
      Acceso denegado. No tienes permisos para ver esta sección.
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<LoginRids />} />

      {/* Con layout (área autenticada) */}
      <Route
        path="/"
        element={
          <AuthGuard>
            <Layout />
          </AuthGuard>
        }
      >
        {/* Dashboard: cualquier usuario autenticado */}
        <Route index element={<Dashboard />} />

        {/* Users: solo ADMIN / SUB_ADMIN */}
        <Route
          path="users"
          element={
            <RoleGuard roles={["ADMIN", "SUB_ADMIN"]}>
              <Users />
            </RoleGuard>
          }
        />

        {/* compatibilidad antigua */}
        <Route path="usuarios" element={<Navigate to="/users" replace />} />
      </Route>

      {/* Denegado */}
      <Route path="/denied" element={<Denied />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
