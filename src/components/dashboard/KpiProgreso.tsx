import React from "react";

type Props = {
  totalHoy: number;
  totalEtapas: number;
  progresoPct: number; // 0..100
};

const KpiProgreso: React.FC<Props> = ({ totalHoy, totalEtapas, progresoPct }) => {
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center justify-between text-sm text-zinc-600">
          <span>Leads de hoy</span>
          <span className="badge">{totalEtapas} etapas totales</span>
        </div>

        <div className="mt-1 text-4xl font-extrabold tracking-tight text-zinc-900">{totalHoy}</div>

        <div className="mt-4">
          <div className="h-2.5 w-full rounded-full bg-zinc-200">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-orange-500 to-emerald-400 transition-[width] duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progresoPct))}%` }}
            />
          </div>
          <div className="mt-2 text-right text-sm text-zinc-600">{progresoPct}%</div>
        </div>
      </div>
    </div>
  );
};

export default KpiProgreso;
