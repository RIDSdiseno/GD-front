import React, { useMemo } from "react";

type Counts = Record<string, number>;

// Paleta de colores (ajústala si quieres)
const palette = ["#f97316", "#22c55e", "#3b82f6", "#a78bfa", "#14b8a6", "#f43f5e"];

const LeadsEstado: React.FC<{ counts: Counts }> = ({ counts }) => {
  const entries = Object.entries(counts);
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1;

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const ink = isDark ? "#ffffff" : "#0b1220";       // tinta base (negra en claro, blanca en oscuro)
  const inkMuted = isDark ? "rgba(255,255,255,.7)" : "#374151"; // para % en leyenda

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
    <div className="relative">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3
          className="text-base font-semibold"
          style={{ color: ink }} // 🔒 forzado
        >
          Leads por estado (hoy)
        </h3>

        <span
          className="inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold border"
          style={{
            color: ink,
            background: isDark ? "rgba(255,255,255,.10)" : "#f3f4f6",
            borderColor: isDark ? "rgba(255,255,255,.15)" : "#e5e7eb",
            backdropFilter: isDark ? ("blur(4px)" as React.CSSProperties["backdropFilter"]) : undefined,
          }}
        >
          Total: {total}
        </span>
      </div>

      {/* Barra apilada */}
      <div
        className="relative h-4 w-full overflow-hidden rounded-full border"
        style={{
          background: isDark ? "rgba(255,255,255,.10)" : "#e5e7eb",
          borderColor: isDark ? "rgba(255,255,255,.10)" : "#d1d5db",
          boxShadow: isDark
            ? "0 0 0 1px rgba(255,255,255,.06) inset"
            : "0 0 0 1px rgba(0,0,0,.02) inset",
          backdropFilter: isDark ? "blur(4px)" : undefined,
        }}
        role="group"
        aria-label="Distribución de leads por estado"
      >
        {segments.map((s, idx) => (
          <div
            key={s.label}
            className="relative h-full inline-block align-top transition-[width] duration-700"
            style={{
              width: `${s.pct}%`,
              background: `${s.color}CC`,
              boxShadow: `0 0 14px ${s.color}66 inset, 0 0 10px ${s.color}55`,
              borderLeft:
                idx > 0
                  ? isDark
                    ? "1px solid rgba(255,255,255,.15)"
                    : "1px solid rgba(0,0,0,.10)"
                  : undefined,
            }}
            title={`${s.label}: ${s.value} (${s.pct}%)`}
            aria-label={`${s.label}: ${s.value} de ${total} (${s.pct}%)`}
          >
            {/* % dentro de la barra (si hay espacio) */}
            {s.pct >= 10 && (
              <span
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 grid place-items-center px-1 text-[10px] font-extrabold whitespace-nowrap"
                style={{ color: "#ffffff", textShadow: "0 1px 2px rgba(0,0,0,.55)" }}
              >
                {s.pct}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 min-w-0">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ background: s.color, boxShadow: `0 0 10px ${s.color}66` }}
              aria-hidden
            />
            {/* Etiqueta del estado */}
            <span className="truncate" style={{ color: ink }}>
              {s.label}
            </span>

            <span className="ml-auto inline-flex items-center gap-1">
              {/* Valor */}
              <span
                className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold border"
                style={{
                  color: ink,
                  background: isDark ? "rgba(255,255,255,.10)" : "#f3f4f6",
                  borderColor: isDark ? "rgba(255,255,255,.15)" : "#e5e7eb",
                }}
                title={`${s.value} de ${total}`}
              >
                {s.value}
              </span>
              {/* Porcentaje */}
              <span
                className="rounded-md px-1.5 py-0.5 text-[10px] border"
                style={{
                  color: inkMuted,
                  background: isDark ? "rgba(255,255,255,.10)" : "#f3f4f6",
                  borderColor: isDark ? "rgba(255,255,255,.10)" : "#e5e7eb",
                }}
                title={`${s.pct}%`}
              >
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
