import { useContext } from "react";
import AuthContext from "./AuthProvider.tsx";
import type { AuthContextType } from "./authHelpers";

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un <AuthProvider />");
  return context;
}
