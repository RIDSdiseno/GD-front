import React from "react";

type Props = {
  totalHoy: number;
  totalEtapas: number;
  progresoPct: number; // 0..100
};

const KpiProgreso: React.FC<Props> = ({ totalHoy, totalEtapas, progresoPct }) => {
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
    <div className="text-white">
      {/* encabezado */}
      <div className="flex items-center justify-between text-sm text-white/70">
        <span>Leads de hoy</span>
        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
          {totalEtapas} etapas totales
        </span>
      </div>

      {/* número grande con gradiente */}
      <div className="mt-1 bg-gradient-to-r from-yellow-200 to-amber-100 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent drop-shadow-[0_0_14px_rgba(255,214,10,.35)]">
        {totalHoy}
      </div>

      {/* barra de progreso */}
      <div className="mt-4">
        <div
          className="h-3 w-full rounded-full border border-white/10 bg-white/10 backdrop-blur-sm"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="Progreso del día"
        >
          <div
            className={`h-full rounded-full bg-gradient-to-r ${grad} ${glow} transition-[width] duration-700`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-white/70">
          <span>Progreso del día</span>
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/90">
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default KpiProgreso;
