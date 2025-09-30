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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] dark:bg-black/70 dark:backdrop-blur-[2px]" />
      {/* Card */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border ring-1 shadow transition-colors
                        bg-white text-zinc-900 border-zinc-200 ring-black/5 shadow-black/10
                        dark:bg-zinc-900/90 dark:text-white dark:border-white/10 dark:ring-white/10 dark:shadow-[0_20px_60px_rgba(0,0,0,.6)]">
          <div className="px-5 pt-5 pb-3">
            <h3 className="text-lg font-extrabold tracking-wide
                           text-zinc-900 drop-shadow-none
                           dark:text-white dark:drop-shadow-[0_0_12px_rgba(255,214,10,.35)]">
              {title}
            </h3>
            <p className="mt-2 text-sm text-zinc-700 dark:text-white/80">{message}</p>
          </div>
          <div className="flex items-center justify-end gap-3 px-5 pb-5">
            <button
              onClick={busy ? undefined : onCancel}
              disabled={busy}
              className="rounded-xl border px-4 py-2 text-sm font-semibold transition
                         bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-black/10
                         disabled:opacity-60
                         dark:bg-white/5 dark:text-white dark:border-white/10 dark:hover:bg-white/10 dark:focus:ring-white/20"
            >
              {cancelText}
            </button>
            <button
              onClick={busy ? undefined : onConfirm}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition
                         bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-200
                         disabled:opacity-60
                         dark:bg-rose-500/15 dark:text-rose-100 dark:border-rose-300/50 dark:hover:bg-rose-500/25 dark:focus:ring-rose-400/40"
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
        //
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

  const askDelete = (u: User) => { setUserToDelete(u); setConfirmOpen(true); };

  const doDelete = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      setErr(null);

      const token = getAccessToken();
      const headers = new Headers({ "Content-Type": "application/json" });
      if (token) headers.set("Authorization", `Bearer ${token}`);

      let resp = await fetch(`${API_URL}/users/${userToDelete.id}`, { method: "DELETE", credentials: "include", headers });

      if (resp.status === 401) {
        const r = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include", cache: "no-store" });
        if (r.ok) {
          const refreshed: { token?: string } = await r.json();
          if (refreshed.token) { try { sessionStorage.setItem("accessToken", refreshed.token); } catch { /* ignore */ } }
          const headers2 = new Headers({ "Content-Type": "application/json" });
          const t2 = getAccessToken();
          if (t2) headers2.set("Authorization", `Bearer ${t2}`);
          resp = await fetch(`${API_URL}/users/${userToDelete.id}`, { method: "DELETE", credentials: "include", headers: headers2 });
        }
      }

      if (!resp.ok) {
        let message = "No se pudo eliminar el usuario";
        try {
          const txt = await resp.text();
          try {
            const j = JSON.parse(txt) as { error?: string; message?: string };
            message = j.error ?? j.message ?? txt ?? message;
          } catch { message = txt || message; }
        } catch { /* ignore */ }
        throw new Error(message);
      }

      setUsers(prev => prev.filter(x => x.id !== userToDelete.id));
      setConfirmOpen(false);
      setUserToDelete(null);
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  return (
  <div className="page-shell">
    {/* Superficie principal (opaca en claro, sólida en oscuro) */}
    <section
      className="page-surface [color-scheme:light] dark:[color-scheme:dark]"
      role="region"
      aria-labelledby="users-title"
    >
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex items-center justify-between">
        <h1
          id="users-title"
          className="force-ink text-2xl sm:text-3xl font-extrabold tracking-wide"
        >
          Gestión de Usuarios
        </h1>


        <button
          type="button"
          className="btn-new"
          onClick={() => setOpenNew(true)}
          disabled={deleting}
        >
          <Plus size={18} /> Nuevo Usuario
        </button>

      </div>

      {/* Buscador + contador */}
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xl">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-300/80">
            <Search size={18} />
          </span>
          <input
            type="search"
            autoComplete="off"
            inputMode="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por ID, nombre, email o rol…"
            className="field pl-10 [color-scheme:light] dark:[color-scheme:dark]"
            disabled={deleting}
            aria-label="Buscar usuarios"
          />
        </div>

        <div className="users-counter self-end sm:self-auto text-neutral-900 dark:text-white/90">
          Usuarios encontrados:{" "}
          <span className="font-extrabold text-yellow-600 dark:text-yellow-300">
            {filtered.length}
          </span>
        </div>
      </div>

      {/* Tabla / estados */}
      <div className="flex-1 min-h-0 relative">
        {loading ? (
          <div className="flex items-center gap-2 text-neutral-800 dark:text-white/90" aria-busy="true">
            <Loader2 className="animate-spin" /> Cargando…
          </div>
        ) : err ? (
          <div className="rounded-2xl border px-4 py-3 text-sm
                          bg-red-50 text-red-700 border-red-200
                          dark:border-red-400/50 dark:bg-red-500/10 dark:text-red-200">
            {err}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border px-4 py-6
                          bg-white text-neutral-700 border-zinc-200
                          dark:bg-transparent dark:text-white/80 dark:border-white/10">
            No hay usuarios para mostrar.
          </div>
        ) : (
          <div className="users-shell relative overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="users-thead">
                <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left">
                  <th>ID</th>
                  <th>NOMBRE DE USUARIO</th>
                  <th>EMAIL</th>
                  <th>NIVEL</th>
                  <th>ESTADO</th>
                  <th className="text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filtered.map((u) => (
                  <tr key={u.id} className="transition hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="px-4 py-3">{u.id}</td>
                    <td className="px-4 py-3 font-semibold">{u.nombreUsuario}</td>
                    <td className="px-4 py-3 text-neutral-700 dark:text-white/80">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "pill " +
                          (u.nivel === "ADMIN"
                            ? "pill--role-admin"
                            : u.nivel === "SUB_ADMIN"
                            ? "pill--role-sub"
                            : "pill--role-user")
                        }
                      >
                        {u.nivel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`pill ${u.status ? "pill--ok" : "pill--off"}`}>
                        {u.status ? <CheckCircle2 size={14} /> : <XCircle size={14} />}{" "}
                        {u.status ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="btn btn--cyan disabled:opacity-60"
                          disabled={deleting}
                          onClick={() => {}}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn--rose disabled:opacity-60"
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
              <div className="absolute inset-0 z-10 grid place-items-center bg-black/10 dark:bg-black/40">
                <div className="inline-flex items-center gap-2 rounded-xl border px-4 py-2
                                bg-white text-zinc-900 border-zinc-200
                                dark:bg-zinc-900/90 dark:text-white dark:border-white/10">
                  <Loader2 className="animate-spin" size={18} /> Eliminando usuario…
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>

    {/* Modales fuera de la superficie para no recortar sombras */}
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
