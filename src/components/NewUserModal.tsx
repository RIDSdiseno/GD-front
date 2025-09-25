// src/components/users/NewUserModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { UserPlus, X, Mail, Lock, Shield, Loader2, Eye, EyeOff } from "lucide-react";

export type Nivel = "ADMIN" | "SUB_ADMIN" | "USER";
export type User = {
  id: number;
  nombreUsuario: string;
  email: string;
  nivel: Nivel;
  status: boolean;
};

type NewUserInput = {
  nombreUsuario: string;
  email: string;
  password: string;
  nivel: Nivel | "";
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Se invoca cuando el backend crea el usuario con éxito */
  onCreated?: (user: User) => void;
  /** Nivel del usuario actual para validar permisos (si no se pasa, se lee desde storage) */
  currentUserNivel?: Nivel;
};

const getStoredNivel = (): Nivel | null => {
  try {
    const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
    if (!raw) return null;
    const u = JSON.parse(raw) as { nivel?: string } | null;
    const nv = (u?.nivel ?? "").toUpperCase();
    return (nv === "ADMIN" || nv === "SUB_ADMIN" || nv === "USER") ? (nv as Nivel) : null;
  } catch {
    return null;
  }
};

const emailOk = (v: string) => /\S+@\S+\.\S+/.test(v);
const min = (v: string, n: number) => v.trim().length >= n;

const API_URL = import.meta.env.VITE_API_URL as string;

const NewUserModal: React.FC<Props> = ({ open, onClose, onCreated, currentUserNivel }) => {
  const nivelActual = (currentUserNivel ?? getStoredNivel() ?? "USER") as Nivel;
  const canCreateAdmin = nivelActual === "ADMIN";
  const availableNiveles: Nivel[] = canCreateAdmin ? ["ADMIN", "SUB_ADMIN", "USER"] : ["USER"];

  const [form, setForm] = useState<NewUserInput>({
    nombreUsuario: "",
    email: "",
    password: "",
    nivel: availableNiveles[availableNiveles.length - 1] ?? "USER",
  });

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // focus inicial
  const firstInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 0);
      setErr(null);
    }
  }, [open]);

  // cierra con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !loading && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  // Si cambia permiso (ej. cambia de SUB_ADMIN a ADMIN), revalida nivel del form
  useEffect(() => {
    if (!availableNiveles.includes(form.nivel as Nivel)) {
      setForm((f) => ({ ...f, nivel: availableNiveles[availableNiveles.length - 1] ?? "USER" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nivelActual]);

  const canSubmit = useMemo(() => {
    return (
      min(form.nombreUsuario, 2) &&
      emailOk(form.email) &&
      min(form.password, 6) &&
      (form.nivel === "ADMIN" || form.nivel === "SUB_ADMIN" || form.nivel === "USER")
    );
  }, [form]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const readErrorText = async (resp: Response): Promise<string> => {
    try {
        const txt = await resp.text();
        try {
        const j = JSON.parse(txt) as { error?: string; message?: string };
        // 👇 agrupación para no mezclar ?? y ||
        return (j.error ?? j.message ?? txt) || "Error al crear usuario";
        } catch {
        return txt || "Error al crear usuario";
        }
    } catch {
        return "Error al crear usuario";
    }
    };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!API_URL) return setErr("Falta VITE_API_URL en el entorno.");
    if (!canSubmit || loading) return;

    setLoading(true);
    setErr(null);
    try {
      const token =
        localStorage.getItem("accessToken") ??
        localStorage.getItem("auth_token") ??
        sessionStorage.getItem("accessToken") ??
        sessionStorage.getItem("auth_token") ??
        "";

      const resp = await fetch(`${API_URL}/users`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nombreUsuario: form.nombreUsuario.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          nivel: form.nivel,
        }),
      });

      if (!resp.ok) {
        setErr(await readErrorText(resp));
        return;
        }

      const data = (await resp.json()) as { user?: User };
      if (!data?.user) {
        setErr("Respuesta del servidor incompleta.");
        return;
      }

      onCreated?.(data.user);
      // reset & close
      setForm({
        nombreUsuario: "",
        email: "",
        password: "",
        nivel: availableNiveles[availableNiveles.length - 1] ?? "USER",
      });
      onClose();
    } catch {
      setErr("Error de red. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // click fuera para cerrar
  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (loading) return;
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4"
      aria-modal="true"
      role="dialog"
      onMouseDown={onBackdrop}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,.55)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <UserPlus size={18} />
            <h3 className="text-base font-semibold">Nuevo Usuario</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            title="Cerrar"
            disabled={loading}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-white/80">Nombre</label>
            <input
              ref={firstInputRef}
              name="nombreUsuario"
              value={form.nombreUsuario}
              onChange={onChange}
              placeholder="Nombre y apellido"
              autoComplete="off"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-yellow-300/70 focus:ring-2 focus:ring-yellow-300/30"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/80">Correo</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
                <Mail size={16} />
              </span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="correo@dominio.com"
                autoComplete="email"
                className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-2 outline-none focus:border-yellow-300/70 focus:ring-2 focus:ring-yellow-300/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/80">Contraseña</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
                <Lock size={16} />
              </span>
              <input
                name="password"
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={onChange}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-10 py-2 outline-none focus:border-yellow-300/70 focus:ring-2 focus:ring-yellow-300/30"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-white/80 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/80">Nivel</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
                <Shield size={16} />
              </span>
              <select
                name="nivel"
                value={form.nivel}
                onChange={onChange}
                className="w-full appearance-none rounded-xl bg-white/5 border border-white/10 pl-9 pr-8 py-2 outline-none focus:border-yellow-300/70 focus:ring-2 focus:ring-yellow-300/30"
              >
                {availableNiveles.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            {!canCreateAdmin && (
              <p className="mt-1 text-xs text-white/60">Con tu rol sólo puedes crear usuarios <b>USER</b>.</p>
            )}
          </div>

          {err && (
            <div className="rounded-xl border border-rose-300/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {err}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/50 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,.35)] hover:bg-cyan-400/20 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
              Crear usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewUserModal;
