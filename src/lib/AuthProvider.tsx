import { createContext, useEffect, useState, type ReactNode } from "react";
import {
  getUser,
  getToken,
  storeSession,
  clearSession,
  normalizeUser,
  type AuthUser,
  type BackendUser,
} from "../utils/auth";
import type { AuthContextType } from "./authHelpers";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = { children: ReactNode };

const API_URL = import.meta.env.VITE_API_URL as string;

// === Tipos de respuestas del backend ===
type LoginResponse = {
  token: string;
  user: BackendUser;
};
type RefreshResponse = {
  token: string;
};
type MeResponse = {
  user: BackendUser;
};

async function readJSON<T>(resp: Response): Promise<T> {
  const txt = await resp.text();
  try {
    return JSON.parse(txt) as T;
  } catch {
    // No exponemos 'any'; devolvemos un error tipado
    throw new Error(txt || "Respuesta inválida");
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => getUser());
  const [token, setToken] = useState<string | null>(() => getToken());

  const login = async (email: string, password: string, remember = false) => {
    if (!API_URL) throw new Error("Falta VITE_API_URL");

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, remember }),
    });

    if (!res.ok) {
      const txt = await res.text();
      try {
        const j = JSON.parse(txt) as { error?: string; message?: string };
        throw new Error((j.error ?? j.message ?? txt) || "Login fallido");
      } catch {
        throw new Error(txt || "Login fallido");
      }
    }

    const data = await readJSON<LoginResponse>(res);
    // normaliza a AuthUser (isAdmin boolean requerido, nivel a union type)
    const normalized = normalizeUser(data.user);
    setUser(normalized);
    setToken(data.token);
    storeSession(normalized, data.token, remember);

    // Espejo opcional por compatibilidad con código que espera "accessToken"
    try {
      if (remember) localStorage.setItem("accessToken", data.token);
      else sessionStorage.setItem("accessToken", data.token);
    } catch {
      /* ignore */
    }
  };

  const logout = async () => {
    if (API_URL) {
      try {
        await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
      } catch {
        /* ignore */
      }
    }
    clearSession();
    setUser(null);
    setToken(null);
  };

  // Hydrate: si falta user/token → intenta refresh + /users/me
  useEffect(() => {
    if (user && token) return;
    if (!API_URL) return;

    const ctrl = new AbortController();

    (async () => {
      try {
        // 1) refresh (devuelve nuevo access token)
        const r = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          signal: ctrl.signal,
        });
        if (!r.ok) return;

        const rjson = await readJSON<RefreshResponse>(r);
        if (!rjson.token) return;

        // 2) me (tu backend expone /users/me)
        const me = await fetch(`${API_URL}/users/me`, {
          method: "GET",
          headers: { Authorization: `Bearer ${rjson.token}` },
          credentials: "include",
          signal: ctrl.signal,
        });
        if (!me.ok) return;

        const mejson = await readJSON<MeResponse>(me);
        const normalized = normalizeUser(mejson.user);

        setToken(rjson.token);
        setUser(normalized);
        storeSession(normalized, rjson.token, false);

        try {
          sessionStorage.setItem("accessToken", rjson.token);
        } catch {
          /* ignore */
        }
      } catch {
        // silencioso: usuario no autenticado
      }
    })();

    return () => ctrl.abort();
  }, [API_URL, user, token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
