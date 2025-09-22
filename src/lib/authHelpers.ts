import type { AuthUser } from "../utils/auth";

export type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
};
