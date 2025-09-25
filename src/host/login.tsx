// src/host/login.tsx (o donde tengas este componente)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Loader2, LogIn } from "lucide-react";
import LoginCarousel from "../components/LoginCarrusel";
import { storeSession } from "../utils/auth";

const LoginGD: React.FC = () => {
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const readError = async (res: Response) => {
    try {
      const txt = await res.text();
      try {
        const data = JSON.parse(txt) as { error?: string; message?: string };
        return (data.error ?? data.message ?? txt) || "Error al iniciar sesión";
      } catch {
        return txt || "Error al iniciar sesión";
      }
    } catch {
      return "Error al iniciar sesión";
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    const API_URL = import.meta.env.VITE_API_URL;
    if (!API_URL) {
      setLoading(false);
      setError("Falta VITE_API_URL en el entorno.");
      return;
    }

    const ctrl = new AbortController();

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // importante para la cookie de refresh (rt)
        signal: ctrl.signal,
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          remember: form.remember,
        }),
      });

      if (!response.ok) {
        setError(await readError(response));
        return;
      }

      const data = (await response.json()) as {
        token?: string;
        user?: {
          id: number;
          nombreUsuario: string;
          email: string;
          nivel: "ADMIN" | "SUB_ADMIN" | "USER";
          status: boolean;
          isAdmin?: boolean;
        };
      };

      const token = data?.token ?? "";
      const user = data?.user;

      if (!token || !user) {
        setError("Faltan datos en la respuesta del servidor.");
        return;
      }

      // Guarda sesión centralizada
      storeSession(user, token, form.remember);
      // Asegura compatibilidad con lectores que esperan "accessToken"
      try {
        localStorage.setItem("accessToken", token);
        if (!form.remember) sessionStorage.setItem("accessToken", token);
      } catch {
        /* ignore */
      }

      // Redirige al Dashboard index
      navigate("/", { replace: true });
    } catch {
      setError("Error de red, por favor intente nuevamente.");
    } finally {
      setLoading(false);
    }

    return () => ctrl.abort();
  };

  return (
    <div className="w-full min-h-[100svh] overflow-y-auto md:fixed md:inset-0 md:h-[100svh] md:overflow-hidden flex items-center justify-center p-2 sm:p-3 md:p-4">
      {/* Fondo */}
      <div className="fixed inset-0 -z-10">
        <img src="/login/FONDOLOGIN.PNG" alt="Fondo" aria-hidden className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/35 md:bg-black/30 backdrop-blur-[1px]" />
      </div>

      {/* Marco */}
      <div className="w-full max-w-[1900px]">
        <div className="md:relative md:rounded-[24px] md:p-[1px] md:bg-gradient-to-br md:from-[#FFD60A]/60 md:via-[#FFD60A]/15 md:to-transparent md:shadow-[0_16px_48px_rgba(0,0,0,.40)]">
          <div className="rounded-[16px] md:rounded-[23px] bg-black/20 md:backdrop-blur-xl">
            <div className="md:h-[94svh] lg:h-[95svh]">
              <div className="grid h-full w-full items-stretch gap-3 sm:gap-4 md:gap-5 p-2 sm:p-3 md:p-4 grid-cols-1 lg:grid-cols-[1.9fr_1.1fr] xl:grid-cols-[2fr_1.05fr] 2xl:grid-cols-[2.1fr_.9fr]">
                {/* IZQUIERDA */}
                <div className="relative overflow-hidden rounded-[12px] sm:rounded-[16px] md:rounded-[20px] ring-1 ring-white/5 border border-[#FFD60A]/30 bg-black/15 h-auto lg:h-full min-h-[46svh] lg:min-h-0">
                  <LoginCarousel
                    images={Array.from({ length: 22 }, (_, i) => `/login/evento${i + 1}.jpg`)}
                    intervalMs={4000}
                    pauseOnHover
                    showControls
                    showIndicators
                  />
                  <img
                    src="/login/LOGO2.jpg"
                    alt="Logo"
                    className="absolute z-10 top-2 left-2 sm:top-4 sm:left-4 w-[clamp(56px,7.5vw,115px)] h-auto object-contain select-none pointer-events-none rounded-xl ring-1 ring-white/60 drop-shadow-[0_8px_18px_rgba(0,0,0,.45)] [filter:drop-shadow(0_0_.75px_#ffffffcc)]"
                  />
                  <div className="absolute left-2 right-2 bottom-2 sm:left-4 sm:right-4 sm:bottom-4 md:left-4 md:right-auto md:max-w-[560px] z-10">
                    <div className="rounded-md bg-black/55 px-3 py-2 text-center md:text-left text-[#00e0b6] text-[12.5px] sm:text-sm font-medium shadow-[0_6px_20px_rgba(0,0,0,.25)]">
                      La mejor atención y sabor para tus invitados.
                    </div>
                  </div>
                </div>

                {/* DERECHA */}
                <div className="relative rounded-[12px] sm:rounded-[16px] md:rounded-[20px] border border-[#FFD60A]/30 bg-neutral-900/85 backdrop-blur-xl ring-1 ring-white/5 px-5 py-6 sm:px-6 sm:py-7 lg:px-7 lg:py-9 h-auto lg:h-full">
                  <form onSubmit={onSubmit} className="mx-auto w-full h-full max-w-[520px] xl:max-w-[560px] 2xl:max-w-[580px] flex flex-col" noValidate>
                    <h2 className="text-center text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-wide text-[#FFD60A] mb-4 sm:mb-6">
                      Iniciar Sesión
                    </h2>

                    <div className="flex-1 overflow-auto">
                      {/* Email */}
                      <label htmlFor="email" className="block text-sm lg:text-[15px] text-neutral-300 mb-2">
                        Correo electrónico
                      </label>
                      <div className="relative mb-4">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                          <Mail size={18} />
                        </span>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          spellCheck={false}
                          value={form.email}
                          onChange={onChange}
                          placeholder="correo@dominio.com"
                          disabled={loading}
                          aria-invalid={!!error}
                          className="w-full rounded-2xl bg-neutral-800/70 text-neutral-100 placeholder-neutral-400 border border-neutral-700 focus:border-[#FFD60A] focus:ring-2 focus:ring-[#FFD60A]/50 pl-10 pr-4 py-3 lg:py-3.5 text-[15px] outline-none transition disabled:opacity-60"
                        />
                      </div>

                      {/* Password */}
                      <label htmlFor="password" className="block text-sm lg:text-[15px] text-neutral-300 mb-2">
                        Contraseña
                      </label>
                      <div className="relative mb-5">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                          <Lock size={18} />
                        </span>
                        <input
                          id="password"
                          name="password"
                          type={showPwd ? "text" : "password"}
                          autoComplete="current-password"
                          value={form.password}
                          onChange={onChange}
                          placeholder="••••••••"
                          disabled={loading}
                          aria-invalid={!!error}
                          className="w-full rounded-2xl bg-neutral-800/70 text-neutral-100 placeholder-neutral-400 border border-neutral-700 focus:border-[#FFD60A] focus:ring-2 focus:ring-[#FFD60A]/50 pl-10 pr-12 py-3 lg:py-3.5 text-[15px] outline-none transition disabled:opacity-60"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd((s) => !s)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-neutral-300 hover:bg-neutral-700/40 focus:outline-none focus:ring-2 focus:ring-[#FFD60A]/40"
                          aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                          title={showPwd ? "Ocultar" : "Mostrar"}
                          disabled={loading}
                        >
                          {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      {/* Remember / Forgot */}
                      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <label className="inline-flex items-center gap-2 text-neutral-200 text-sm select-none">
                          <input
                            type="checkbox"
                            name="remember"
                            checked={form.remember}
                            onChange={onChange}
                            disabled={loading}
                            className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 accent-[#FFD60A]"
                          />
                          Recordar sesión
                        </label>
                        <a href="#/forgot" className="text-[#FFD60A] hover:underline text-sm font-semibold">
                          ¿Olvidaste tu contraseña?
                        </a>
                      </div>

                      {/* Error */}
                      {error && (
                        <div className="mb-5 rounded-2xl border border-red-400/60 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                          {error}
                        </div>
                      )}
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="group w-full rounded-2xl bg-gradient-to-b from-[#FFE45A] to-[#FFD60A] px-6 py-3.5 lg:py-4 text-black text-[15px] lg:text-[16px] font-extrabold shadow-[0_8px_26px_rgba(255,214,10,.5)] hover:shadow-[0_10px_32px_rgba(255,214,10,.65)] active:translate-y-[1px] focus:outline-none focus:ring-4 focus:ring-[#FFD60A]/35 disabled:opacity-60 transition inline-flex items-center justify-center gap-2"
                    >
                      {loading ? (<><Loader2 className="animate-spin" size={18} /> Entrando…</>) : (<><LogIn size={18} /> Entrar</>)}
                    </button>

                    <p className="mt-4 sm:mt-6 text-center text-[11px] sm:text-xs text-neutral-400">
                      © {new Date().getFullYear()} GDGROUP — Todos los derechos reservados
                    </p>
                  </form>
                </div>
                {/* /DERECHA */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginGD;
