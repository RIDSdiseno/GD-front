import React, { useEffect, useMemo, useState } from "react";

/* ===== Tipos de tu API listLeads ===== */
type LeadEstado = { id: number; nombre: string };
type Lead = {
  id: number;
  estadoId?: number;
  estado?: LeadEstado | null;
  fechaIngreso?: string | null;
  updatedAt?: string;
};
type ListLeadsResponse = {
  page: number;
  pageSize: number;
  total: number;
  leads: Lead[];
};

type Props = { className?: string };

/** ISO con offset local, no “Z” (UTC). */
function toLocalOffsetISO(d: Date) {
  const pad = (n: number, l = 2) => n.toString().padStart(l, "0");
  const offMin = -d.getTimezoneOffset(); // ej. -180 => -03:00
  const sign = offMin >= 0 ? "+" : "-";
  const abs = Math.abs(offMin);
  const hh = pad(Math.floor(abs / 60));
  const mm = pad(abs % 60);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}` +
    `${sign}${hh}:${mm}`
  );
}
function startOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function endOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

const KpiProgreso: React.FC<Props> = ({ className }) => {
  const API_URL = useMemo(
    () => ((import.meta.env.VITE_API_URL as string) || "").replace(/\/+$/, ""),
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalHoy, setTotalHoy] = useState(0);
  const [totalEtapas, setTotalEtapas] = useState(0);
  const [progresoPct, setProgresoPct] = useState(0);

  useEffect(() => {
    const ac = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const desdeISO = encodeURIComponent(toLocalOffsetISO(startOfLocalDay()));
        const hastaISO = encodeURIComponent(toLocalOffsetISO(endOfLocalDay()));

        // VITE_API_URL ya incluye /api ⇒ solo /leads
        const url = `${API_URL}/leads?desde=${desdeISO}&hasta=${hastaISO}`;

        const resp = await fetch(url, {
          signal: ac.signal,
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const data: ListLeadsResponse = await resp.json();

        const totalDeHoy = data.total || 0;
        setTotalHoy(totalDeHoy);

        // estados distintos
        const estadosSet = new Set(
          (data.leads ?? [])
            .map((l) => l.estado?.id ?? l.estadoId)
            .filter((v): v is number => typeof v === "number")
        );
        setTotalEtapas(estadosSet.size || 0);

        // % finalizados
        const finalizados =
          (data.leads ?? []).filter(
            (l) => (l.estado?.nombre ?? "").trim().toLowerCase() === "finalizado"
          ).length;
        setProgresoPct(totalDeHoy ? Math.round((finalizados / totalDeHoy) * 100) : 0);
      } catch (e) {
        if (!ac.signal.aborted) {
          console.error(e);
          setError("No se pudo cargar el KPI de hoy.");
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    };

    fetchData();
    return () => ac.abort();
  }, [API_URL]);

  const pct = Math.min(100, Math.max(0, progresoPct));

  const grad =
    pct >= 66
      ? "from-cyan-400 to-emerald-300"
      : pct >= 33
      ? "from-yellow-300 to-amber-300"
      : "from-rose-400 to-orange-300";

  const glow =
    pct >= 66
      ? "shadow-[0_0_16px_rgba(16,185,129,.45)]"
      : pct >= 33
      ? "shadow-[0_0_16px_rgba(255,214,10,.45)]"
      : "shadow-[0_0_16px_rgba(244,63,94,.45)]";

  return (
    <div className={["kpi", className].filter(Boolean).join(" ")}>
      <div className="flex items-center justify-between text-sm">
        <span>Leads de hoy</span>
        <span className="pill inline-flex items-center px-2 py-1 text-[11px] font-semibold">
          {loading ? "Cargando…" : `${totalEtapas} etapas totales`}
        </span>
      </div>

      <div className="big-number mt-1 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-300 text-4xl font-extrabold tracking-tight">
        {loading ? "—" : totalHoy}
      </div>

      <div className="mt-4">
        <div
          className="track h-3 w-full overflow-hidden"
          role="progressbar"
          aria-valuenow={loading ? 0 : pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`fill bg-gradient-to-r ${grad} ${glow} transition-[width] duration-700`}
            style={{ width: loading ? "0%" : `${pct}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs">
          <span>Progreso del día</span>
          <span className="pill inline-flex items-center px-2 py-0.5 text-[11px] font-semibold">
            {loading ? "—" : `${pct}%`}
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-[12px] text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-100">
          {error}
        </div>
      )}
    </div>
  );
};

export default KpiProgreso;
