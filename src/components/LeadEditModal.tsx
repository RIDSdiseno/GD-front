// src/components/leads/LeadEditModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { X, Loader2 } from "lucide-react";
import type { Catalogo, TipoCliente } from "./LeadCreateModal";

/* ===== Tipos ===== */
export type LeadRow = {
  id: number;
  codigoCliente: string;
  nombreCliente: string;
  email?: string | null;
  telefono?: string | null;
  marca?: { id: number; nombre: string } | null;
  categoria?: { id: number; nombre: string } | null;
  tipoCliente?: { id: number; nombre: string; descripcion?: string | null } | null;
  comuna?: { id: number; nombre: string } | null;
  estado?: { id: number; nombre: string } | null;
  segmentacion?: { id: number; nombre: string } | null;
  updatedAt: string;
};

export type LeadCatalogs = {
  marcas: Catalogo[];
  categorias: Catalogo[];
  tipos: TipoCliente[];
  estados: Catalogo[];
  segmentos: Catalogo[];
  comunas: Catalogo[];
};

export type LeadUpdatePayload = Partial<{
  codigoCliente: string;
  nombreCliente: string;
  email: string | null;
  telefono: string | null;

  // catálogos por nombre
  marcaNombre: string | null;
  categoriaNombre: string | null;
  tipoClienteNombre: string | null;
  comunaNombre: string | null;
  estadoNombre: string | null;
  segmentacionNombre: string | null;

  montoCotizado: string | number | null;
  fechaIngreso: string | null; // ISO
}>;

type Props = {
  open: boolean;
  lead: LeadRow;
  catalogs: LeadCatalogs;
  onClose: () => void;
  onSubmit: (payload: LeadUpdatePayload) => void | Promise<void>;
};

/* ===== Helpers UI ===== */
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");

/** Modal con layout flex: body scrollea, footer fijo (no se superpone) */
const ModalShell: React.FC<{
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  disableClose?: boolean;
}> = ({ open, onClose, title, children, footer, disableClose = false }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (!disableClose && e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, disableClose, onClose]);

  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[60]">
      {/* Overlay */}
      <div
        className={cls("absolute inset-0 bg-black/70 backdrop-blur-[2px]", disableClose && "cursor-not-allowed")}
        onClick={disableClose ? undefined : onClose}
      />
      {/* Card */}
      <div className="absolute left-1/2 top-1/2 w-[95vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-neutral-900/90 text-white ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,.60)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-white/10 shrink-0">
          <h3 className="text-base sm:text-lg font-extrabold tracking-wide drop-shadow-[0_0_12px_rgba(255,214,10,.35)]">
            {title ?? "Editar"}
          </h3>
          <button
            onClick={disableClose ? undefined : onClose}
            aria-label="Cerrar"
            disabled={disableClose}
            className={cls(
              "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80",
              "hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20",
              disableClose && "opacity-50 cursor-not-allowed"
            )}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body (scrollea) */}
        <div className="p-4 sm:p-5 overflow-auto grow">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-white/10 bg-neutral-900/90 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode; colSpan?: boolean }> = ({ label, children, colSpan }) => (
  <label className={cls("grid gap-1 min-w-0", colSpan && "sm:col-span-2 md:col-span-3")}>
    <span className="text-xs sm:text-sm font-semibold text-white/85">{label}</span>
    {children}
  </label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={cls(
      "w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/60 px-3 py-2",
      "focus:outline-none focus:ring-2 focus:ring-white/20",
      props.disabled && "opacity-60 cursor-not-allowed",
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
      props.disabled && "opacity-60 cursor-not-allowed",
      props.className
    )}
  />
);

/* ===== Diff & Form ===== */
const norm = (v?: string | null) => (v ?? "").trim();
const changed = (a?: string | null, b?: string | null) => norm(a) !== norm(b);

function buildDiffPayload(initial: LeadRow, form: FormState): LeadUpdatePayload {
  const out: LeadUpdatePayload = {};

  if (changed(initial.codigoCliente, form.codigoCliente)) out.codigoCliente = form.codigoCliente;
  if (changed(initial.nombreCliente, form.nombreCliente)) out.nombreCliente = form.nombreCliente;

  if (changed(initial.email ?? null, form.email)) out.email = form.email === "" ? null : form.email;
  if (changed(initial.telefono ?? null, form.telefono)) out.telefono = form.telefono === "" ? null : form.telefono;

  const ini = {
    marca: initial.marca?.nombre ?? "",
    categoria: initial.categoria?.nombre ?? "",
    tipo: initial.tipoCliente?.nombre ?? "",
    comuna: initial.comuna?.nombre ?? "",
    estado: initial.estado?.nombre ?? "",
    segmentacion: initial.segmentacion?.nombre ?? "",
  };

  if (changed(ini.marca, form.marcaNombre)) out.marcaNombre = form.marcaNombre || null;
  if (changed(ini.categoria, form.categoriaNombre)) out.categoriaNombre = form.categoriaNombre || null;
  if (changed(ini.tipo, form.tipoClienteNombre)) out.tipoClienteNombre = form.tipoClienteNombre || null;
  if (changed(ini.comuna, form.comunaNombre)) out.comunaNombre = form.comunaNombre || null;
  if (changed(ini.estado, form.estadoNombre)) out.estadoNombre = form.estadoNombre || null;
  if (changed(ini.segmentacion, form.segmentacionNombre)) out.segmentacionNombre = form.segmentacionNombre || null;

  if (form.montoCotizadoTouched) out.montoCotizado = form.montoCotizado === "" ? null : form.montoCotizado;
  if (form.fechaIngresoTouched) out.fechaIngreso = form.fechaIngreso === "" ? null : form.fechaIngreso;

  return out;
}

type FormState = {
  codigoCliente: string;
  nombreCliente: string;
  email: string;
  telefono: string;

  marcaNombre: string;
  categoriaNombre: string;
  tipoClienteNombre: string;
  comunaNombre: string;
  estadoNombre: string;
  segmentacionNombre: string;

  montoCotizado: string;
  montoCotizadoTouched: boolean;

  fechaIngreso: string;
  fechaIngresoTouched: boolean;
};

const LeadEditModal: React.FC<Props> = ({ open, onClose, catalogs, lead, onSubmit }) => {
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const initial: FormState = useMemo(
    () => ({
      codigoCliente: lead.codigoCliente,
      nombreCliente: lead.nombreCliente,
      email: lead.email ?? "",
      telefono: lead.telefono ?? "",

      marcaNombre: lead.marca?.nombre ?? "",
      categoriaNombre: lead.categoria?.nombre ?? "",
      tipoClienteNombre: lead.tipoCliente?.nombre ?? "",
      comunaNombre: lead.comuna?.nombre ?? "",
      estadoNombre: lead.estado?.nombre ?? "",
      segmentacionNombre: lead.segmentacion?.nombre ?? "",

      montoCotizado: "",
      montoCotizadoTouched: false,

      fechaIngreso: "",
      fechaIngresoTouched: false,
    }),
    [lead]
  );

  const [form, setForm] = useState<FormState>(initial);
  useEffect(() => setForm(initial), [initial, open]);

  // Bloquea interacciones del formulario durante el guardado
  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    if (saving) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
  }, [saving]);

  // Submit centralizado: controla saving y cierra/modal
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = buildDiffPayload(lead, form);

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      await onSubmit(payload);
      setToast(`Lead #${lead.id} actualizado`);
      onClose();
    } catch {
      setToast("No se pudo actualizar, intenta nuevamente.");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 2000);
    }
  };

  if (!open) return null;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={`Editar Lead #${lead.id}`}
      disableClose={saving}
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {toast ? (
            <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/85">
              {toast}
            </div>
          ) : (
            <span />
          )}

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={cls(
                "rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white hover:bg-white/10",
                "focus:outline-none focus:ring-2 focus:ring-white/20",
                saving && "opacity-60 cursor-not-allowed",
                "w-full sm:w-auto"
              )}
            >
              Cancelar
            </button>

            <button
              type="submit"
              form="lead-edit-form"
              disabled={saving}
              className={cls(
                "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold transition",
                saving
                  ? "border-white/10 bg-white/10 text-white/60"
                  : "border-emerald-400/50 bg-emerald-500/15 text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,.35)] hover:bg-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-400/40",
                "w-full sm:w-auto"
              )}
              title="Guardar cambios"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : null}
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      }
    >
      <div className="relative">
        <form
          ref={formRef}
          id="lead-edit-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
          aria-busy={saving}
        >
          <Field label="Código Cliente">
            <Input
              value={form.codigoCliente}
              onChange={(e) => setForm((s) => ({ ...s, codigoCliente: e.target.value }))}
              disabled={saving}
            />
          </Field>

          <Field label="Nombre Cliente">
            <Input
              value={form.nombreCliente}
              onChange={(e) => setForm((s) => ({ ...s, nombreCliente: e.target.value }))}
              disabled={saving}
            />
          </Field>

          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              disabled={saving}
            />
          </Field>

          <Field label="Teléfono">
            <Input
              value={form.telefono}
              onChange={(e) => setForm((s) => ({ ...s, telefono: e.target.value }))}
              disabled={saving}
            />
          </Field>

          <Field label="Marca">
            <Select
              value={form.marcaNombre}
              onChange={(e) => setForm((s) => ({ ...s, marcaNombre: e.target.value }))}
              disabled={saving}
            >
              <option className="text-black" value="">
                (Sin especificar)
              </option>
              {catalogs.marcas.map((m) => (
                <option className="text-black" key={m.id} value={m.nombre}>
                  {m.nombre}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Categoría">
            <Select
              value={form.categoriaNombre}
              onChange={(e) => setForm((s) => ({ ...s, categoriaNombre: e.target.value }))}
              disabled={saving}
            >
              <option className="text-black" value="">
                (Sin especificar)
              </option>
              {catalogs.categorias.map((c) => (
                <option className="text-black" key={c.id} value={c.nombre}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Tipo Cliente">
            <Select
              value={form.tipoClienteNombre}
              onChange={(e) => setForm((s) => ({ ...s, tipoClienteNombre: e.target.value }))}
              disabled={saving}
            >
              <option className="text-black" value="">
                (Sin especificar)
              </option>
              {catalogs.tipos.map((t) => (
                <option className="text-black" key={t.id} value={t.nombre}>
                  {t.nombre}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Estado">
            <Select
              value={form.estadoNombre}
              onChange={(e) => setForm((s) => ({ ...s, estadoNombre: e.target.value }))}
              disabled={saving}
            >
              <option className="text-black" value="">
                (Sin especificar)
              </option>
              {catalogs.estados.map((e) => (
                <option className="text-black" key={e.id} value={e.nombre}>
                  {e.nombre}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Segmentación">
            <Select
              value={form.segmentacionNombre}
              onChange={(e) => setForm((s) => ({ ...s, segmentacionNombre: e.target.value }))}
              disabled={saving}
            >
              <option className="text-black" value="">
                (Sin especificar)
              </option>
              {catalogs.segmentos.map((s) => (
                <option className="text-black" key={s.id} value={s.nombre}>
                  {s.nombre}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Comuna (buscar por nombre)">
            <input
              list="comunas-edit-list"
              value={form.comunaNombre}
              onChange={(e) => setForm((s) => ({ ...s, comunaNombre: e.target.value }))}
              placeholder="Ej: Ñuñoa"
              disabled={saving}
              className={cls(
                "w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/60 px-3 py-2",
                "focus:outline-none focus:ring-2 focus:ring-white/20",
                saving && "opacity-60 cursor-not-allowed"
              )}
            />
            <datalist id="comunas-edit-list">
              {catalogs.comunas.map((c) => (
                <option key={c.id} value={c.nombre} />
              ))}
            </datalist>
          </Field>

          <Field label="Monto cotizado (vacío = no cambiar)" colSpan>
            <Input
              value={form.montoCotizado}
              onChange={(e) =>
                setForm((s) => ({ ...s, montoCotizado: e.target.value, montoCotizadoTouched: true }))
              }
              placeholder="Ej: 1200000"
              disabled={saving}
            />
          </Field>

          <Field label="Fecha ingreso (YYYY-MM-DD) — opcional" colSpan>
            <Input
              value={form.fechaIngreso}
              onChange={(e) =>
                setForm((s) => ({ ...s, fechaIngreso: e.target.value, fechaIngresoTouched: true }))
              }
              placeholder="2025-09-15"
              disabled={saving}
            />
          </Field>
        </form>

        {saving && (
          <div className="pointer-events-auto absolute inset-0 grid place-items-center rounded-2xl bg-black/40">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-900/80 px-4 py-2">
              <Loader2 className="animate-spin" size={18} />
              <span className="text-sm">Guardando cambios…</span>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
};

export default LeadEditModal;
