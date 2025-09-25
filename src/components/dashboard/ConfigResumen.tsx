import React from "react";

type Summary = {
  marcas: number;
  comunas: number;
  categorias: number;
  estados: number;
  tipo_cliente: number;
  segmentacion: number;
  usuario_marcas: number;
};

const ITEMS: Array<{ key: keyof Summary; label: string }> = [
  { key: "marcas", label: "Marcas" },
  { key: "usuario_marcas", label: "Usuarios x Marca" },
  { key: "comunas", label: "Comunas" },
  { key: "estados", label: "Estados" },
  { key: "categorias", label: "Categorías clientes" },
  { key: "tipo_cliente", label: "Tipo de cliente" },
  { key: "segmentacion", label: "Segmentación" },
];

// Acentos por tarjeta (texto gradiente + glow sutil)
const ACCENT_TEXT: Record<keyof Summary, string> = {
  marcas: "from-yellow-300 to-amber-200",
  usuario_marcas: "from-cyan-300 to-teal-200",
  comunas: "from-violet-300 to-fuchsia-200",
  estados: "from-emerald-300 to-green-200",
  categorias: "from-pink-300 to-rose-200",
  tipo_cliente: "from-sky-300 to-blue-200",
  segmentacion: "from-orange-300 to-amber-200",
};
const ACCENT_GLOW: Record<keyof Summary, string> = {
  marcas: "shadow-[0_0_18px_rgba(255,214,10,.35)]",
  usuario_marcas: "shadow-[0_0_18px_rgba(34,211,238,.35)]",
  comunas: "shadow-[0_0_18px_rgba(167,139,250,.35)]",
  estados: "shadow-[0_0_18px_rgba(16,185,129,.4)]",
  categorias: "shadow-[0_0_18px_rgba(244,114,182,.35)]",
  tipo_cliente: "shadow-[0_0_18px_rgba(59,130,246,.35)]",
  segmentacion: "shadow-[0_0_18px_rgba(251,146,60,.35)]",
};

const ConfigResumen: React.FC<{ summary: Summary }> = ({ summary }) => {
  return (
    <div className="text-white">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400/90 shadow-[0_0_12px_rgba(52,211,153,.9)]" />
        <h3 className="text-base font-semibold">Resumen de configuración</h3>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {ITEMS.map(({ key, label }) => {
          const value = summary[key] ?? 0;
          return (
            <div
              key={key}
              className={`group h-24 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 relative overflow-hidden ring-1 ring-white/5 hover:ring-white/20 transition`}
            >
              {/* glow de fondo al hover */}
              <div
                className={`pointer-events-none absolute -inset-10 opacity-0 group-hover:opacity-100 transition duration-300 blur-2xl bg-gradient-to-br ${ACCENT_TEXT[key].replace(
                  /text-/g,
                  ""
                )}`}
              />
              <div className="relative flex h-full flex-col justify-between">
                <div className="text-[11px] uppercase tracking-wide text-white/70">
                  {label}
                </div>
                <div
                  className={`text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${ACCENT_TEXT[key]} ${ACCENT_GLOW[key]}`}
                >
                  {value}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConfigResumen;
