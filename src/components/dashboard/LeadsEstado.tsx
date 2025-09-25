import React, { useMemo } from "react";

type Counts = Record<string, number>;

// Paleta neón (puedes ajustar los tonos)
const palette = ["#f97316", "#22c55e", "#3b82f6", "#a78bfa", "#14b8a6", "#f43f5e"];

const LeadsEstado: React.FC<{ counts: Counts }> = ({ counts }) => {
  const entries = Object.entries(counts);
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1;

  const segments = useMemo(
    () =>
      entries.map(([label, v], i) => {
        const pct = Math.round((v / total) * 100);
        const color = palette[i % palette.length];
        return { label, value: v, pct, color };
      }),
    [entries, total]
  );

  return (
    <div className="text-white">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">Leads por estado (hoy)</h3>
        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
          Total: {total}
        </span>
      </div>

      {/* Barra apilada con glow */}
      <div
        className="h-3 w-full overflow-hidden rounded-full border border-white/10 bg-white/10 backdrop-blur-sm ring-1 ring-white/5"
        role="group"
        aria-label="Distribución de leads por estado"
      >
        {segments.map((s, idx) => (
          <div
            key={s.label}
            className="h-full inline-block transition-[width] duration-700"
            style={{
              width: `${s.pct}%`,
              background: `${s.color}CC`,
              boxShadow: `0 0 14px ${s.color}66 inset, 0 0 10px ${s.color}55`,
              // separador sutil entre segmentos (excepto el primero)
              ...(idx > 0 ? { borderLeft: "1px solid rgba(255,255,255,.12)" } : {}),
            }}
            title={`${s.label}: ${s.value} (${s.pct}%)`}
            aria-label={`${s.label}: ${s.value} de ${total} (${s.pct}%)`}
          />
        ))}
      </div>

      {/* Leyenda */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 min-w-0">
            <span
              className="inline-block size-2.5 rounded-sm"
              style={{ background: s.color, boxShadow: `0 0 10px ${s.color}88` }}
              aria-hidden
            />
            <span className="truncate text-white/85">{s.label}</span>
            <span className="ml-auto inline-flex items-center gap-1">
              <span className="rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 text-[11px] font-semibold text-white/90">
                {s.value}
              </span>
              <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/70">
                {s.pct}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadsEstado;
