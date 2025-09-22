// src/utils/auth.ts

// Tipo de usuario autenticado, útil para frontend
export interface AuthUser {
  id: number;
  email: string;
  nombreUsuario: string;
  nivel: string;
  isAdmin: boolean;
  status?: boolean;
  createdAt?: string;
  exp?: number; // si el JWT incluye expiración
}

// Obtener usuario almacenado (de localStorage o sessionStorage)
export function getUser(): AuthUser | null {
  const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

// Obtener token almacenado
export function getToken(): string | null {
  return localStorage.getItem("auth_token") ?? sessionStorage.getItem("auth_token");
}

// Guardar usuario y token (según remember)
export function storeSession(user: AuthUser, token: string, remember: boolean) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("auth_token", token);
  storage.setItem("user", JSON.stringify(user));
}

// Limpiar ambos storages (localStorage y sessionStorage)
export function clearStoredAuth() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("auth_token");
  sessionStorage.removeItem("user");
}
