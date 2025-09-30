// src/pages/Leads.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Loader2, Plus, Search, RefreshCw, ChevronDown, Check } from "lucide-react";
import LeadCreateModal, { type LeadCatalogs } from "../components/LeadCreateModal";
import LeadEditModal, { type LeadUpdatePayload, type LeadRow } from "../components/LeadEditModal";

/** ========= Tipos ========= */
type Catalogo = { id: number; nombre: string };
type TipoCliente = { id: number; nombre: string; descripcion?: string | null };
type Lead = {
  id: number;
  codigoCliente: string;
  nombreCliente: string;
  email?: string | null;
  telefono?: string | null;
  marca?: Catalogo | null;
  categoria?: Catalogo | null;
  tipoCliente?: TipoCliente | null;
  comuna?: Catalogo | null;
  estado?: { id: number; nombre: string } | null;
  segmentacion?: Catalogo | null;
  updatedAt: string;
};
type ListRes = { page: number; pageSize: number; total: number; leads: Lead[] };
type ApiErrorData = { error?: unknown; message?: unknown; raw?: unknown };

/** ========= Helpers ========= */
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");

type AxiosErrorLike<T = unknown> = { message: string; response?: { data?: T }; code?: string };
function isAxiosErrorLike<T = unknown>(err: unknown): err is AxiosErrorLike<T> {
  if (typeof err !== "object" || err === null) return false;
  const r = err as Record<string, unknown>;
  return typeof r["message"] === "string" && "response" in r;
}
function extractErrorMessage(err: unknown): string {
  if (isAxiosErrorLike<ApiErrorData>(err)) {
    const data = err.response?.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const d = data as ApiErrorData;
      if (typeof d.error === "string") return d.error;
      if (typeof d.message === "string") return d.message;
      if (typeof d.raw === "string") return d.raw;
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  try { return JSON.stringify(err); } catch { return String(err); }
}
const isDOMAbort = (e: unknown) => e instanceof DOMException && e.name === "AbortError";

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const getToken = (): string =>
  localStorage.getItem("accessToken") ||
  localStorage.getItem("auth_token") ||
  sessionStorage.getItem("accessToken") ||
  sessionStorage.getItem("auth_token") ||
  "";

/** ========= Axios ========= */
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});
api.interceptors.request.use((config) => {
  const t = getToken();
  const headers: Record<string, string> = {
    ...(config.headers as Record<string, string> | undefined),
  };
  if (t) headers["Authorization"] = `Bearer ${t}`;
  if (!("Content-Type" in headers)) headers["Content-Type"] = "application/json";
  return { ...config, headers };
});

const chipColorByEstado = (nombre?: string) => {
  const n = (nombre ?? "").toLowerCase();
  if (n.includes("confirm")) return "border-emerald-300/50 bg-emerald-400/10 text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,.45)]";
  if (n.includes("pend")) return "border-yellow-300/50 bg-yellow-400/10 text-yellow-200 shadow-[0_0_14px_rgba(255,214,10,.45)]";
  if (n.includes("nego")) return "border-cyan-300/50 bg-cyan-400/10 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,.45)]";
  if (n.includes("decla") || n.includes("declin")) return "border-rose-300/50 bg-rose-400/10 text-rose-200 shadow-[0_0_14px_rgba(244,63,94,.45)]";
  if (n.includes("contact")) return "border-indigo-300/50 bg-indigo-400/10 text-indigo-200 shadow-[0_0_14px_rgba(99,102,241,.45)]";
  if (n.includes("cotiz")) return "border-fuchsia-300/50 bg-fuchsia-400/10 text-fuchsia-200 shadow-[0_0_14px_rgba(217,70,239,.45)]";
  return "border-white/20 bg-white/10 text-white/80";
};

/** ========= Página ========= */
const Leads: React.FC = () => {
  const [toast, setToast] = useState<string | null>(null);

  // Catálogos
  const [marcas, setMarcas] = useState<Catalogo[]>([]);
  const [categorias, setCategorias] = useState<Catalogo[]>([]);
  const [tipos, setTipos] = useState<TipoCliente[]>([]);
  const [estados, setEstados] = useState<Catalogo[]>([]);
  const [segmentos, setSegmentos] = useState<Catalogo[]>([]);
  const [comunas, setComunas] = useState<Catalogo[]>([]);

  // Tabla / filtros
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [orderBy, setOrderBy] = useState<"updatedAt" | "createdAt" | "fechaIngreso">("updatedAt");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);

  // Modales
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState<string | null>(null);

  // AbortController para cancelar la búsqueda anterior
  const reqCtrlRef = useRef<AbortController | null>(null);

  // Cargar catálogos una vez
  useEffect(() => {
    (async () => {
      try {
        const [m, c, t, e, s, co] = await Promise.all([
          api.get<{ marcas: Catalogo[] }>("/marcas"),
          api.get<{ categorias: Catalogo[] }>("/categorias"),
          api.get<{ tiposCliente: TipoCliente[] }>("/tipo-cliente"),
          api.get<{ estados: Catalogo[] }>("/estados"),
          api.get<{ segmentaciones: Catalogo[] }>("/segmentacion"),
          api.get<{ comunas: Catalogo[] }>("/comunas?limit=2000"),
        ]);
        setMarcas(m.data.marcas ?? []);
        setCategorias(c.data.categorias ?? []);
        setTipos(t.data.tiposCliente ?? []);
        setEstados(e.data.estados ?? []);
        setSegmentos(s.data.segmentaciones ?? []);
        setComunas(co.data.comunas ?? []);
      } catch (err) {
        setToast(`Error cargando catálogos: ${extractErrorMessage(err)}`);
      }
    })();
  }, []);

  // Cargar leads (lista)
  const loadList = useMemo(
    () => async () => {
      reqCtrlRef.current?.abort();
      const ctrl = new AbortController();
      reqCtrlRef.current = ctrl;

      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          orderBy,
          orderDir,
        });
        if (q) params.set("q", q);

        const headers = new Headers({ "Content-Type": "application/json" });
        const t = getToken();
        if (t) headers.set("Authorization", `Bearer ${t}`);

        const resp = await fetch(`${API_URL}/leads?${params.toString()}`, {
          method: "GET",
          headers,
          credentials: "include",
          signal: ctrl.signal,
          cache: "no-store",
        });

        if (!resp.ok) {
          let message = `Error ${resp.status}`;
          try {
            const txt = await resp.text();
            try {
              const j = JSON.parse(txt) as ApiErrorData;
              message = (j.error as string) ?? (j.message as string) ?? txt ?? message;
            } catch {
              message = txt || message;
            }
          } catch { /* ignore */ }
          throw new Error(message);
        }

        const data = (await resp.json()) as ListRes;
        setRows(data.leads ?? []);
        setTotal(data.total ?? 0);
      } catch (err) {
        if (isDOMAbort(err)) return;
        setToast(`Error cargando leads: ${extractErrorMessage(err)}`);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    },
    [page, pageSize, orderBy, orderDir, q]
  );

  useEffect(() => {
    void loadList();
  }, [loadList]);

  // Acciones (axios)
  const changeEstadoTo = async (leadId: number, nombre: string) => {
    try {
      await api.patch(`/leads/${leadId}/estado`, { estadoNombre: nombre });
      setToast(`Estado actualizado (#${leadId} → ${nombre})`);
      await loadList();
    } catch (err) {
      setToast(`No se pudo cambiar el estado: ${extractErrorMessage(err)}`);
    }
  };

  // === Asignar MARCA ===
  const assignMarca = async (leadId: number, marcaNombre: string) => {
    try {
      await api.patch(`/leads/${leadId}`, { marcaNombre });
      setToast(`Lead #${leadId} asignado a marca "${marcaNombre}"`);
      await loadList();
    } catch (err) {
      setToast(`No se pudo asignar marca: ${extractErrorMessage(err)}`);
    }
  };

  // === Editar ===
  const openEdit = (lead: Lead) => setEditing(lead);
  const submitEdit = async (id: number, payload: LeadUpdatePayload) => {
    try {
      await api.patch(`/leads/${id}`, payload);
      setToast(`Lead #${id} actualizado`);
      setEditing(null);
      await loadList();
    } catch (err) {
      setToast(`No se pudo actualizar: ${extractErrorMessage(err)}`);
    }
  };

  // === Eliminar ===
  const confirmDelete = (id: number) => {
    setDeletingId(id);
    setDeletingLoading(false);
    setDeletingMessage(null);
  };

  const doDelete = async () => {
    if (!deletingId) return;
    try {
      setDeletingLoading(true);
      setDeletingMessage("Eliminando…");
      await api.delete(`/leads/${deletingId}`);
      setDeletingLoading(false);
      setDeletingMessage("lead eliminado correctamente");
      const wasLast = rows.length === 1;
      if (wasLast && page > 1) setPage((p) => p - 1);
      await loadList();
      // cerrar después de un pequeño delay para que el usuario vea el mensaje
      setTimeout(() => {
        setDeletingId(null);
        setDeletingMessage(null);
      }, 1200);
    } catch (err) {
      setDeletingLoading(false);
      setDeletingMessage(null);
      setToast(`No se pudo eliminar: ${extractErrorMessage(err)}`);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Catálogos tipados para pasar a los modales (sin any)
  const catalogsForModals: LeadCatalogs = {
    marcas,
    categorias,
    tipos,
    estados,
    segmentos,
    comunas,
  };

  return (
    <div className="relative h-[100svh] overflow-hidden">
      {/* Fondo */}
      <div className="fixed inset-0 -z-10">
        <img src="/fondo2.png" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_0%,rgba(255,214,10,.16),transparent_60%),radial-gradient(900px_500px_at_90%_10%,rgba(0,224,182,.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-10 h-full flex flex-col">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-white drop-shadow-[0_0_18px_rgba(255,214,10,.35)]">
            Gestión de Leads
          </h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              onClick={() => void loadList()}
              title="Refrescar"
            >
              <RefreshCw size={16} className={cls(loading && "animate-spin")} /> Refrescar
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-400/50 bg-blue-500/10 px-4 py-2 text-blue-100 font-semibold shadow-[0_0_16px_rgba(59,130,246,.35)] hover:bg-blue-500/20 hover:shadow-[0_0_22px_rgba(59,130,246,.5)] focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition"
              onClick={() => setOpenCreate(true)}
            >
              <Plus size={18} /> Nuevo Lead
            </button>
          </div>
        </div>

        {/* Buscador + controles */}
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xl">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300/80">
              <Search size={18} />
            </span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre, email, teléfono, código o cotización…"
              className="w-full rounded-2xl bg-white/5 text-white placeholder-white/60 border border-white/10 focus:border-yellow-300/70 focus:ring-2 focus:ring-yellow-300/40 pl-10 pr-9 py-3 outline-none transición backdrop-blur-xl"
            />
            {loading && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70">
                <Loader2 size={16} className="animate-spin" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Tamaño de página */}
            <MenuSelect
              value={String(pageSize) as "10" | "20" | "50" | "100"}
              options={[
                { value: "10", label: "10 / pág." },
                { value: "20", label: "20 / pág." },
                { value: "50", label: "50 / pág." },
                { value: "100", label: "100 / pág." },
              ]}
              onChange={(v) => {
                const n = Number(v);
                if (Number.isFinite(n)) {
                  setPageSize(n);
                  setPage(1);
                }
              }}
            />

            {/* Ordenar por */}
            <MenuSelect
              value={orderBy}
              options={[
                { value: "updatedAt", label: "Actualizado" },
                { value: "createdAt", label: "Creado" },
                { value: "fechaIngreso", label: "Ingreso" },
              ]}
              onChange={(v) => setOrderBy(v)}
            />

            {/* Dirección */}
            <MenuSelect
              value={orderDir}
              options={[
                { value: "desc", label: "Desc" },
                { value: "asc", label: "Asc" },
              ]}
              onChange={(v) => setOrderDir(v)}
              align="right"
            />

            <div className="rounded-xl bg-black/30 border border-white/10 text-white/90 px-4 py-2 backdrop-blur-md shadow-[0_0_14px_rgba(255,255,255,.08)]">
              Leads:{" "}
              <span className="font-extrabold text-yellow-300 drop-shadow-[0_0_10px_rgba(255,214,10,.6)]">
                {loading ? "…" : rows.length}
              </span>{" "}
              / {loading ? "…" : total}
            </div>
          </div>
        </div>

        {/* Región scrollable: Tabla */}
        <div className="flex-1 min-h-0 relative">
          {loading && rows.length === 0 ? (
            <div className="inline-flex items-center gap-2 text-white/90">
              <Loader2 className="animate-spin" /> Cargando…
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-white/80 backdrop-blur-md">
              No hay leads para mostrar.
            </div>
          ) : (
            <div className="h-full overflow-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,.45)] ring-1 ring-white/5">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white/10 text-white/80 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,.08)]">
                  <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left">
                    <th>ID</th>
                    <th>CÓDIGO</th>
                    <th>CLIENTE</th>
                    <th>EMAIL</th>
                    <th>TELÉFONO</th>
                    <th>MARCA</th>
                    <th>TIPO</th>
                    <th>ESTADO</th>
                    <th className="text-center">ACCIONES</th>
                    <th>ACTUALIZADO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/90">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3">{r.id}</td>
                      <td className="px-4 py-3">{r.codigoCliente}</td>
                      <td className="px-4 py-3 font-semibold">{r.nombreCliente}</td>
                      <td className="px-4 py-3 text-white/80">{r.email || "-"}</td>
                      <td className="px-4 py-3 text-white/80">{r.telefono || "-"}</td>
                      <td className="px-4 py-3">{r.marca?.nombre || "-"}</td>
                      <td className="px-4 py-3">{r.tipoCliente?.nombre || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cls(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border",
                            chipColorByEstado(r.estado?.nombre)
                          )}
                        >
                          {r.estado?.nombre || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <RowActions
                            leadId={r.id}
                            estados={estados}
                            marcas={marcas}
                            currentEstado={r.estado?.nombre}
                            onPickEstado={changeEstadoTo}
                            onAssignMarca={assignMarca}
                          />
                          <button
                            type="button"
                            className="rounded-lg border border-blue-300/50 bg-blue-400/10 px-3 py-1.5 text-xs text-blue-100 hover:bg-blue-400/20 shadow-[0_0_14px_rgba(59,130,246,.35)]"
                            onClick={() => openEdit(r)}
                            title="Editar lead"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-rose-300/50 bg-rose-400/10 px-3 py-1.5 text-xs text-rose-100 hover:bg-rose-400/20 shadow-[0_0_14px_rgba(244,63,94,.35)]"
                            onClick={() => confirmDelete(r.id)}
                            title="Eliminar lead"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">{new Date(r.updatedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer / Paginación */}
              <div className="sticky bottom-0 z-10 bg-white/10 backdrop-blur-xl shadow-[0_-1px_0_rgba(255,255,255,.08)] px-4 py-3 flex items-center justify-between text-white/80">
                <div className="text-sm">
                  Total: {total} • Página {page}/{totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 disabled:opacity-40"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    type="button"
                  >
                    Anterior
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 disabled:opacity-40"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    type="button"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-neutral-900/90 text-white px-4 py-2 rounded-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,.6)] ring-1 ring-white/10">
            {toast}
          </div>
        )}
      </div>

      {/* Modal: Crear Lead */}
      <LeadCreateModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        catalogs={catalogsForModals}
        onCreated={() => { setOpenCreate(false); void loadList(); }}
      />

      {/* Modal: Editar Lead */}
      {editing && (
        <LeadEditModal
          open={true}
          lead={editing as LeadRow}
          catalogs={catalogsForModals}
          onClose={() => setEditing(null)}
          onSubmit={(payload) => submitEdit(editing.id, payload)}
        />
      )}

      {/* Confirmación de eliminación con spinner y mensaje */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={() => (deletingLoading ? null : setDeletingId(null))} />
          <div className="relative w-[min(420px,92vw)] rounded-2xl border border-white/10 bg-neutral-900/95 text-white p-5 shadow-[0_20px_60px_rgba(0,0,0,.65)] ring-1 ring-white/5">
            <h3 className="text-lg font-bold mb-2">Eliminar lead #{deletingId}</h3>

            {/* Estado visual */}
            {deletingMessage ? (
              <div className="flex items-center gap-3 mb-4 text-sm">
                {deletingLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Check />
                )}
                <span className={cls(deletingLoading ? "text-white/80" : "text-emerald-200")}>
                  {deletingMessage}
                </span>
              </div>
            ) : (
              <p className="text-white/70 mb-4 text-sm">Esta acción no se puede deshacer.</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 hover:bg-white/10 disabled:opacity-50"
                onClick={() => setDeletingId(null)}
                type="button"
                disabled={deletingLoading}
              >
                Cancelar
              </button>
              <button
                className="rounded-lg border border-rose-300/50 bg-rose-400/10 px-4 py-2 text-rose-100 hover:bg-rose-400/20 shadow-[0_0_14px_rgba(244,63,94,.45)] disabled:opacity-50"
                onClick={() => void doDelete()}
                type="button"
                disabled={deletingLoading}
              >
                {deletingLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    Eliminando…
                  </span>
                ) : deletingMessage ? (
                  "Cerrar"
                ) : (
                  "Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/** ========= Acciones por fila (popover) ========= */
function RowActions(props: {
  leadId: number;
  estados: { id: number; nombre: string }[];
  marcas: { id: number; nombre: string }[];
  currentEstado?: string;
  onPickEstado: (leadId: number, nombre: string) => void | Promise<void>;
  onAssignMarca: (leadId: number, marcaNombre: string) => void | Promise<void>;
}) {
  const { leadId, estados, marcas, currentEstado, onPickEstado, onAssignMarca } = props;
  const [open, setOpen] = useState<"estado" | "assignMarca" | null>(null);
  const estadoBtnRef = useRef<HTMLButtonElement | null>(null);
  const assignBtnRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        estadoBtnRef.current?.contains(target) ||
        assignBtnRef.current?.contains(target)
      ) return;
      setOpen(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="relative inline-flex items-center gap-2">
      <button
        ref={estadoBtnRef}
        onClick={() => setOpen(open === "estado" ? null : "estado")}
        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
        title={currentEstado ? `Estado actual: ${currentEstado}` : "Cambiar estado"}
        type="button"
      >
        Estado
      </button>

      <button
        ref={assignBtnRef}
        onClick={() => setOpen(open === "assignMarca" ? null : "assignMarca")}
        className="rounded-lg border border-fuchsia-300/50 bg-fuchsia-400/10 px-3 py-1.5 text-xs text-fuchsia-100 hover:bg-fuchsia-400/20 shadow-[0_0_14px_rgba(217,70,239,.45)]"
        type="button"
        title="Asignar marca"
      >
        Asignar marca
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-[110%] z-20 w-64 rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl text-white shadow-[0_20px_60px_rgba(0,0,0,.55)] ring-1 ring-white/5"
        >
          {open === "estado" ? (
            <div className="py-1">
              <div className="px-3 py-2 text:[11px] uppercase tracking-wide text-white/60 border-b border-white/10">
                Cambiar estado {currentEstado ? <span className="text-white/80">({currentEstado})</span> : null}
              </div>
              <ul className="max-h-56 overflow-auto p-1">
                {estados.map((e) => (
                  <li key={e.id}>
                    <button
                      className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-white/10"
                      onClick={() => { void onPickEstado(leadId, e.nombre); setOpen(null); }}
                      type="button"
                    >
                      {e.nombre}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="py-1">
              <div className="px-3 py-2 text:[11px] uppercase tracking-wide text-white/60 border-b border-white/10">
                Asignar marca
              </div>
              <ul className="max-h-56 overflow-auto p-1">
                {marcas.map((m) => (
                  <li key={m.id}>
                    <button
                      className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-white/10"
                      onClick={() => { void onAssignMarca(leadId, m.nombre); setOpen(null); }}
                      type="button"
                    >
                      {m.nombre}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** ========= MenuSelect headless (para 10/pág, Actualizado, Desc) ========= */
type MenuOption<T extends string> = { value: T; label: string };

function MenuSelect<T extends string>(props: {
  value: T;
  options: MenuOption<T>[];
  onChange: (v: T) => void;
  buttonClassName?: string;
  placeholder?: string;
  align?: "left" | "right";
}) {
  const { value, options, onChange, buttonClassName, placeholder = "Seleccionar…", align = "left" } = props;
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  const current = options.find((o) => o.value === value);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          buttonClassName ??
          "inline-flex items-center gap-2 rounded-xl bg-white/5 text-white border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
        }
        title={current?.label ?? placeholder}
      >
        <span className="truncate max-w-[9rem]">{current?.label ?? placeholder}</span>
        <ChevronDown size={16} className="opacity-80" />
      </button>

      {open && (
        <div
          ref={popRef}
          className={`absolute z-20 mt-2 w-44 rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl text-white shadow-[0_20px_60px_rgba(0,0,0,.55)] ring-1 ring-white/5 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <ul className="max-h-60 overflow-auto p-1">
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-white/10 ${
                    opt.value === value ? "bg-white/5" : ""
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Leads;
