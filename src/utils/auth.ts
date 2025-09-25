// src/utils/auth.ts

export type Nivel = "ADMIN" | "SUB_ADMIN" | "USER";

export type BackendUser = {
  id: number;
  email: string;
  nombreUsuario: string;
  nivel: string;          // se normaliza a Nivel
  isAdmin?: boolean;      // puede venir opcional desde el backend
  status?: boolean;
  createdAt?: string;
  exp?: number;           // si el JWT incluye expiración
};

// En el front queremos nivel tipado y isAdmin SIEMPRE boolean
export type AuthUser = Omit<BackendUser, "nivel" | "isAdmin"> & {
  nivel: Nivel;
  isAdmin: boolean;
};

// Claves que usamos para el token (compatibilidad con código viejo/nuevo)
const TOKEN_KEYS = ["accessToken", "auth_token"] as const;
const USER_KEY = "user";

const set = (key: string, value: string, remember: boolean) => {
  (remember ? localStorage : sessionStorage).setItem(key, value);
};

const getFromBoth = (key: string): string | null =>
  localStorage.getItem(key) ?? sessionStorage.getItem(key);

export function normalizeUser(u: BackendUser): AuthUser {
  const raw = (u.nivel ?? "USER").toString().toUpperCase();
  const nivel: Nivel = (raw === "ADMIN" || raw === "SUB_ADMIN" || raw === "USER") ? (raw as Nivel) : "USER";
  return {
    ...u,
    nivel,
    isAdmin: u.isAdmin ?? (nivel === "ADMIN"),
  };
}

// Obtener usuario almacenado (normalizado)
export function getUser(): AuthUser | null {
  const raw = getFromBoth(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BackendUser;
    return normalizeUser(parsed);
  } catch {
    return null;
  }
}

// Obtener token almacenado (busca en ambas claves y en ambos storages)
export function getToken(): string | null {
  for (const k of TOKEN_KEYS) {
    const v = getFromBoth(k);
    if (v) return v;
  }
  return null;
}

// Guardar usuario y token (según remember) – acepta BackendUser o AuthUser
export function storeSession(user: BackendUser | AuthUser, token: string, remember: boolean) {
  const u = normalizeUser(user as BackendUser);
  // Guarda en ambas claves para compatibilidad
  for (const k of TOKEN_KEYS) set(k, token, remember);
  set(USER_KEY, JSON.stringify(u), remember);
}

// Limpiar ambos storages (localStorage y sessionStorage)
export function clearSession() {
  try {
    for (const k of TOKEN_KEYS) {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    }
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

// Alias para mantener compatibilidad con imports existentes
export const clearStoredAuth = clearSession;

// Helpers de rol
export function hasAnyRole(roles: Nivel[]): boolean {
  const u = getUser();
  return !!u && roles.includes(u.nivel);
}

export function isAdminOrSubAdmin(): boolean {
  return hasAnyRole(["ADMIN", "SUB_ADMIN"]);
}
