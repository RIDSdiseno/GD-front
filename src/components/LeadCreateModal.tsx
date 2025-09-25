// src/components/leads/LeadCreateModal.tsx
import React, { useMemo, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { X, Loader2 } from "lucide-react";

/** ========= Tipos ========= */
export type Catalogo = { id: number; nombre: string };
export type TipoCliente = { id: number; nombre: string; descripcion?: string | null };
type Lead = {
  id: number;
  codigoCliente: string;
  nombreCliente: string;
};

export type LeadCatalogs = {
  marcas: Catalogo[];
  categorias: Catalogo[];
  tipos: TipoCliente[];
  estados: Catalogo[];
  segmentos: Catalogo[];
  comunas: Catalogo[];
};

type CreateLeadPayload = {
  codigoCliente: string;
  nombreCliente: string;
  email?: string;
  telefono?: string;
  marcaNombre?: string;
  categoriaNombre?: string;
  tipoClienteNombre?: string;
  comunaNombre?: string;
  estadoNombre?: string;
  segmentacionNombre?: string;
  montoCotizado?: string;
  fechaIngreso?: string; // ISO
};

type ApiErrorData = { error?: unknown; message?: unknown; raw?: unknown };

/** ========= Helpers ========= */
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");

const localDateTimeValue = (d = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
};

const getToken = (): string =>
  localStorage.getItem("accessToken") ||
  localStorage.getItem("auth_token") ||
  sessionStorage.getItem("accessToken") ||
  sessionStorage.getItem("auth_token") ||
  "";

/** Guard de error compatible con múltiples versiones de axios */
type AxiosErrorLike<T = unknown> = { message: string; response?: { data?: T } };
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
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

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

/** ========= Modal “glass/neón” ========= */
const ModalShell: React.FC<{
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ open, onClose, title, children, footer }) => {
  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[60]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      {/* Card */}
      <div className="absolute left-1/2 top-1/2 w-[95vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-neutral-900/90 text-white ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,.60)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/10">
          <h3 className="text-lg font-extrabold tracking-wide drop-shadow-[0_0_12px_rgba(255,214,10,.35)]">
            {title ?? "Modal"}
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="p-5">{children}</div>
        {/* Footer */}
        {footer && <div className="px-5 pb-5">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

/** ========= UI helpers (tema oscuro) ========= */
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="grid gap-1 min-w-0">
    <span className="text-sm font-semibold text-white/85">{label}</span>
    {children}
  </label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={cls(
      "w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/60 px-3 py-2",
      "focus:outline-none focus:ring-2 focus:ring-white/20",
      props.className
    )}
  />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className={cls(
      "w-full rounded-xl border border-white/10 bg-white/5 text-white px-3 py-2",
      "focus:outline-none focus:ring-2 focus:ring-white/20",
      props.className
    )}
  />
);

/** ========= Componente principal ========= */
type Props = {
  open: boolean;
  onClose: () => void;
  catalogs: LeadCatalogs;
  onCreated: (lead: Lead) => void; // el padre refresca la lista
};

const LeadCreateModal: React.FC<Props> = ({ open, onClose, catalogs, onCreated }) => {
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Campos del formulario
  const [codigoCliente, setCodigoCliente] = useState(`CLI-${Math.floor(1000 + Math.random() * 9000)}`);
  const [nombreCliente, setNombreCliente] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [montoCotizado, setMontoCotizado] = useState("");
  const [fechaIngreso, setFechaIngreso] = useState(localDateTimeValue());

  const [marcaNombre, setMarcaNombre] = useState("");
  const [categoriaNombre, setCategoriaNombre] = useState("");
  const [tipoClienteNombre, setTipoClienteNombre] = useState("");
  const [estadoNombre, setEstadoNombre] = useState("Pendiente");
  const [segmentacionNombre, setSegmentacionNombre] = useState("Sin Clasificar");
  const [comunaNombre, setComunaNombre] = useState("");

  const disabled = useMemo(() => !codigoCliente || !nombreCliente || creating, [codigoCliente, nombreCliente, creating]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;
    setCreating(true);
    try {
      const payload: CreateLeadPayload = {
        codigoCliente,
        nombreCliente,
        email: email || undefined,
        telefono: telefono || undefined,
        marcaNombre: marcaNombre || undefined,
        categoriaNombre: categoriaNombre || undefined,
        tipoClienteNombre: tipoClienteNombre || undefined,
        comunaNombre: comunaNombre || undefined,
        estadoNombre: estadoNombre || undefined,
        segmentacionNombre: segmentacionNombre || undefined,
        montoCotizado: montoCotizado || undefined,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso).toISOString() : undefined,
      };

      const { data } = await api.post<{ lead: Lead }>("/leads", payload);
      setToast(`Lead #${data.lead.id} creado`);
      onCreated(data.lead);

      // Reset mínimos
      setCodigoCliente(`CLI-${Math.floor(1000 + Math.random() * 9000)}`);
      setNombreCliente("");
      setEmail("");
      setTelefono("");
      setMontoCotizado("");
      setComunaNombre("");

      onClose();
    } catch (err) {
      setToast(`No se pudo crear: ${extractErrorMessage(err)}`);
    } finally {
      setCreating(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Crear Lead"
      footer={
        toast ? (
          <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/85">
            {toast}
          </div>
        ) : null
      }
    >
      <form onSubmit={onSubmit} className="grid md:grid-cols-3 gap-4">
        <Field label="Código Cliente *">
          <Input value={codigoCliente} onChange={(e) => setCodigoCliente(e.target.value)} required />
        </Field>
        <Field label="Nombre Cliente *">
          <Input value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} required />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>

        <Field label="Teléfono">
          <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </Field>
        <Field label="Monto Cotizado">
          <Input type="number" step="0.01" value={montoCotizado} onChange={(e) => setMontoCotizado(e.target.value)} />
        </Field>
        <Field label="Fecha Ingreso">
          <Input type="datetime-local" value={fechaIngreso} onChange={(e) => setFechaIngreso(e.target.value)} />
        </Field>
        <Field label="Marca">
          <Select value={marcaNombre} onChange={(e) => setMarcaNombre(e.target.value)}>
            <option className="text-black" value="">(Sin especificar)</option>
            {catalogs.marcas.map((m) => (
              <option className="text-black" key={m.id} value={m.nombre}>
                {m.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Categoría">
          <Select value={categoriaNombre} onChange={(e) => setCategoriaNombre(e.target.value)}>
            <option className="text-black" value="">(Sin especificar)</option>
            {catalogs.categorias.map((c) => (
              <option className="text-black" key={c.id} value={c.nombre}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Tipo Cliente">
          <Select value={tipoClienteNombre} onChange={(e) => setTipoClienteNombre(e.target.value)}>
            <option className="text-black" value="">(Sin especificar)</option>
            {catalogs.tipos.map((t) => (
              <option className="text-black" key={t.id} value={t.nombre}>
                {t.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Estado">
          <Select value={estadoNombre} onChange={(e) => setEstadoNombre(e.target.value)}>
            <option className="text-black" value="">(Por defecto: Pendiente)</option>
            {catalogs.estados.map((e) => (
              <option className="text-black" key={e.id} value={e.nombre}>
                {e.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Segmentación">
          <Select value={segmentacionNombre} onChange={(e) => setSegmentacionNombre(e.target.value)}>
            <option className="text-black" value="">(Por defecto: Sin Clasificar)</option>
            {catalogs.segmentos.map((s) => (
              <option className="text-black" key={s.id} value={s.nombre}>
                {s.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Comuna (buscar por nombre)">
          <input
            list="comunas-list"
            value={comunaNombre}
            onChange={(e) => setComunaNombre(e.target.value)}
            placeholder="Ej: Ñuñoa"
            className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          <datalist id="comunas-list">
            {catalogs.comunas.map((c) => (
              <option key={c.id} value={c.nombre} />
            ))}
          </datalist>
        </Field>

        <div className="md:col-span-3 flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={disabled}
            className={cls(
              "inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 font-semibold transition",
              disabled
                ? "border-white/10 bg-white/10 text-white/60"
                : "border-blue-400/50 bg-blue-500/15 text-blue-100 shadow-[0_0_16px_rgba(59,130,246,.35)] hover:bg-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
            )}
          >
            {creating ? <Loader2 size={18} className="animate-spin" /> : null}
            {creating ? "Creando…" : "Crear Lead"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default LeadCreateModal;
