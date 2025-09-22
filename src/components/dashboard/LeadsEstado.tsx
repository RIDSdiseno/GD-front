import React, { useMemo } from "react";

type Counts = Record<string, number>;
const palette = ["#f97316","#22c55e","#3b82f6","#a78bfa","#14b8a6","#f43f5e"];

const LeadsEstado: React.FC<{ counts: Counts }> = ({ counts }) => {
  const entries = Object.entries(counts);
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1;

  const segments = useMemo(
    () =>
      entries.map(([label, v], i) => ({
        label,
        value: v,
        pct: Math.round((v / total) * 100),
        color: palette[i % palette.length],
      })),
    [counts, total]
  );

  return (
    <div className="card">
      <div className="card-body">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-900">Leads por estado (hoy)</h3>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200">
          {segments.map((s) => (
            <div key={s.label} className="h-full inline-block" style={{ width: `${s.pct}%`, background: `${s.color}CC` }} title={`${s.label}: ${s.value}`} />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="inline-block size-2 rounded-sm" style={{ background: s.color }} />
              <span className="truncate text-zinc-700">{s.label}</span>
              <span className="ml-auto font-semibold text-zinc-900">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeadsEstado;
