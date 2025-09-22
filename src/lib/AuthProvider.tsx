import React, { createContext, useEffect, useState, type ReactNode } from "react";
import { getUser, getToken, storeSession, clearStoredAuth, type AuthUser } from "../utils/auth";
import type { AuthContextType } from "./authHelpers";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => getUser());
  const [token, setToken] = useState<string | null>(() => getToken());

  const login = async (email: string, password: string, remember = false) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, remember }),
    });

    if (!res.ok) throw new Error("Login fallido");

    const data = await res.json();
    setUser(data.user);
    setToken(data.token);
    storeSession(data.user, data.token, remember);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    clearStoredAuth();
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    if (!user || !token) {
      (async () => {
        try {
          const res = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
          });
          if (!res.ok) return;
          const data = await res.json();
          const meRes = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${data.token}` },
          });
          if (!meRes.ok) return;
          const me = await meRes.json();
          setToken(data.token);
          setUser(me.user);
          storeSession(me.user, data.token, false);
        } catch (err) {
          console.warn("No se pudo refrescar sesión:", err);
        }
      })();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
