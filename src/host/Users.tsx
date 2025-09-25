// src/pages/Users.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Loader2, CheckCircle2, XCircle, Search, Plus, Trash2 } from "lucide-react";
import NewUserModal, { type User as CreatedUser } from "../components/NewUserModal";

type Nivel = "ADMIN" | "SUB_ADMIN" | "USER";
type User = { id: number; nombreUsuario: string; email: string; nivel: Nivel; status: boolean };
type ApiResponse = { users: User[] };

const API_URL = import.meta.env.VITE_API_URL as string;

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Ocurrió un error inesperado";
}
function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}
function getAccessToken(): string | null {
  return (
    localStorage.getItem("accessToken") ??
    localStorage.getItem("auth_token") ??
    sessionStorage.getItem("accessToken") ??
    sessionStorage.getItem("auth_token") ??
    null
  );
}

/** Modal de confirmación reutilizable */
function ConfirmDialog(props: {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { open, title, message, confirmText = "Eliminar", cancelText = "Cancelar", busy, onConfirm, onCancel } = props;
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900/90 ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,.6)]">
          <div className="px-5 pt-5 pb-3">
            <h3 className="text-lg font-extrabold text-white tracking-wide drop-shadow-[0_0_12px_rgba(255,214,10,.35)]">
              {title}
            </h3>
            <p className="mt-2 text-sm text-white/80">{message}</p>
          </div>
          <div className="flex items-center justify-end gap-3 px-5 pb-5">
            <button
              onClick={busy ? undefined : onCancel}
              disabled={busy}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-60"
            >
              {cancelText}
            </button>
            <button
              onClick={busy ? undefined : onConfirm}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300/50 bg-rose-500/15 px-4 py-2 text-sm font-bold text-rose-100 shadow-[0_0_14px_rgba(244,63,94,.45)] hover:bg-rose-500/25 focus:outline-none focus:ring-2 focus:ring-rose-400/40 disabled:opacity-60"
            >
              {busy ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
              {busy ? "Eliminando…" : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [openNew, setOpenNew] = useState(false);

  // eliminar
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!API_URL) {
      setErr("Falta VITE_API_URL en el entorno.");
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();

    const fetchJSON = async <T,>(
      path: string,
      init: RequestInit = {},
      tryRefresh = true
    ): Promise<T> => {
      const headers = new Headers(init.headers);
      const token = getAccessToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);

      const resp = await fetch(`${API_URL}${path}`, {
        credentials: "include",
        cache: "no-store",
        signal: ctrl.signal,
        ...init,
        headers,
      });

      if (resp.ok) return (await resp.json()) as T;

      if (resp.status === 401 && tryRefresh) {
        const r = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (r.ok) {
          const refreshed: { token?: string } = await r.json();
          if (refreshed.token) localStorage.setItem("accessToken", refreshed.token);
          return fetchJSON<T>(path, init, false);
        }
      }

      let message = "Error de red";
      try {
        const text = await resp.text();
        try {
          const j = JSON.parse(text) as { error?: string; message?: string };
          message = (j.error ?? j.message ?? text) || message;
        } catch {
          message = text || message;
        }
      } catch {
        /* ignore */
      }
      throw new Error(message);
    };

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const json = await fetchJSON<ApiResponse>("/users");
        if (!ctrl.signal.aborted) setUsers(json.users ?? []);
      } catch (e: unknown) {
        if (isAbortError(e)) return;
        if (!ctrl.signal.aborted) setErr(getErrorMessage(e));
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) =>
        String(u.id).includes(term) ||
        u.nombreUsuario.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.nivel.toLowerCase().includes(term)
    );
  }, [q, users]);

  // === eliminar ===
  const askDelete = (u: User) => {
    setUserToDelete(u);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      setErr(null);

      // intento 1
      const token = getAccessToken();
      const headers = new Headers({ "Content-Type": "application/json" });
      if (token) headers.set("Authorization", `Bearer ${token}`);

      let resp = await fetch(`${API_URL}/users/${userToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });

      // si 401, intenta refresh y reintenta una vez
      if (resp.status === 401) {
        const r = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
        if (r.ok) {
          const refreshed: { token?: string } = await r.json();
          if (refreshed.token) {
            try { sessionStorage.setItem("accessToken", refreshed.token); } catch { /* ignore */ }
          }
          const headers2 = new Headers({ "Content-Type": "application/json" });
          const t2 = getAccessToken();
          if (t2) headers2.set("Authorization", `Bearer ${t2}`);
          resp = await fetch(`${API_URL}/users/${userToDelete.id}`, {
            method: "DELETE",
            credentials: "include",
            headers: headers2,
          });
        }
      }

      if (!resp.ok) {
        let message = "No se pudo eliminar el usuario";
        try {
          const txt = await resp.text();
          try {
            const j = JSON.parse(txt) as { error?: string; message?: string };
            message = j.error ?? j.message ?? txt ?? message;
          } catch {
            message = txt || message;
          }
        } catch { /* ignore */ }
        throw new Error(message);
      }

      // éxito
      setUsers((prev) => prev.filter((x) => x.id !== userToDelete.id));
      setConfirmOpen(false);
      setUserToDelete(null);
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="relative h-[100svh] overflow-hidden">
      {/* Fondo */}
      <div className="fixed inset-0 -z-10">
        <img src="/fondo2.png" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_0%,rgba(255,214,10,.16),transparent_60%),radial-gradient(900px_500px_at_90%_10%,rgba(0,224,182,.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
      </div>

      {/* Contenido a pantalla completa */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-10 h-full flex flex-col">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-white drop-shadow-[0_0_18px_rgba(255,214,10,.35)]">
            Gestión de Usuarios
          </h1>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-blue-400/50 bg-blue-500/10 px-4 py-2 text-blue-100 font-semibold shadow-[0_0_16px_rgba(59,130,246,.35)] hover:bg-blue-500/20 hover:shadow-[0_0_22px_rgba(59,130,246,.5)] focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition"
            onClick={() => setOpenNew(true)}
            disabled={deleting}
          >
            <Plus size={18} /> Nuevo Usuario
          </button>
        </div>

        {/* Buscador + contador */}
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xl">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300/80">
              <Search size={18} />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por ID, nombre, email o rol…"
              className="w-full rounded-2xl bg-white/5 text-white placeholder-white/60 border border-white/10 focus:border-yellow-300/70 focus:ring-2 focus:ring-yellow-300/40 pl-10 pr-3 py-3 outline-none transition backdrop-blur-xl"
              disabled={deleting}
            />
          </div>

          <div className="self-end sm:self-auto rounded-xl bg-black/30 border border-white/10 text-white/90 px-4 py-2 backdrop-blur-md shadow-[0_0_14px_rgba(255,255,255,.08)]">
            Usuarios encontrados:{" "}
            <span className="font-extrabold text-yellow-300 drop-shadow-[0_0_10px_rgba(255,214,10,.6)]">
              {filtered.length}
            </span>
          </div>
        </div>

        {/* Región scrollable (sólo la tabla) */}
        <div className="flex-1 min-h-0 relative">
          {loading ? (
            <div className="flex items-center gap-2 text-white/90">
              <Loader2 className="animate-spin" /> Cargando…
            </div>
          ) : err ? (
            <div className="rounded-2xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur-md">
              {err}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-white/80 backdrop-blur-md">
              No hay usuarios para mostrar.
            </div>
          ) : (
            <div className="h-full overflow-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,.45)] ring-1 ring-white/5 relative">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white/10 text-white/80 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,.08)]">
                  <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left">
                    <th>ID</th>
                    <th>NOMBRE DE USUARIO</th>
                    <th>EMAIL</th>
                    <th>NIVEL</th>
                    <th>ESTADO</th>
                    <th className="text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/90">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3">{u.id}</td>
                      <td className="px-4 py-3 font-semibold">{u.nombreUsuario}</td>
                      <td className="px-4 py-3 text-white/80">{u.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide border
                          ${
                            u.nivel === "ADMIN"
                              ? "bg-yellow-400/15 text-yellow-200 border-yellow-300/50 shadow-[0_0_14px_rgba(255,214,10,.45)]"
                              : u.nivel === "SUB_ADMIN"
                              ? "bg-cyan-400/15 text-cyan-200 border-cyan-300/50 shadow-[0_0_14px_rgba(34,211,238,.45)]"
                              : "bg-white/10 text-white/80 border-white/20"
                          }`}
                        >
                          {u.nivel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.status ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/50 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,.45)]">
                            <CheckCircle2 size={14} /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-300/50 bg-rose-400/10 px-2.5 py-1 text-[11px] font-semibold text-rose-200 shadow-[0_0_14px_rgba(244,63,94,.4)]">
                            <XCircle size={14} /> Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="rounded-lg px-3 py-1.5 border border-cyan-300/50 text-cyan-100 bg-cyan-400/10 hover:bg-cyan-400/20 shadow-[0_0_14px_rgba(34,211,238,.45)] transition disabled:opacity-60"
                            disabled={deleting}
                            onClick={() => { /* TODO: editar */ }}
                          >
                            Editar
                          </button>
                          <button
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 border border-rose-300/50 text-rose-100 bg-rose-400/10 hover:bg-rose-400/20 shadow-[0_0_14px_rgba(244,63,94,.45)] transition disabled:opacity-60"
                            disabled={deleting}
                            onClick={() => askDelete(u)}
                          >
                            <Trash2 size={16} /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Overlay de bloqueo + spinner global (mientras borra) */}
              {deleting && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-black/40 backdrop-blur-[1px]">
                  <div className="inline-flex items-center gap-2 rounded-xl bg-neutral-900/90 border border-white/10 px-4 py-2 text-white">
                    <Loader2 className="animate-spin" size={18} /> Eliminando usuario…
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Confirmar eliminación */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar eliminación"
        message={
          userToDelete
            ? `¿Seguro que deseas eliminar al usuario “${userToDelete.nombreUsuario}” (ID: ${userToDelete.id})? Esta acción no se puede deshacer.`
            : "¿Seguro que deseas eliminar este usuario?"
        }
        busy={deleting}
        onCancel={() => (deleting ? undefined : setConfirmOpen(false))}
        onConfirm={doDelete}
        confirmText="Eliminar usuario"
        cancelText="Cancelar"
      />

      {/* Modal: Nuevo Usuario */}
      <NewUserModal
        open={openNew}
        onClose={() => setOpenNew(false)}
        onCreated={(u: CreatedUser) => {
          setUsers((prev) => [...prev, u].sort((a, b) => a.id - b.id));
        }}
      />
    </div>
  );
};

export default Users;
