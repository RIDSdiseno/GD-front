import React from "react";

export type Summary = {
  marcas: number;
  comunas: number;
  categorias: number;
  estados: number;
  tipo_cliente: number;
  segmentacion: number;
  usuario_marcas: number;
};

type ConfigResumenProps = {
  summary: Summary;
  title?: string;
  className?: string;
  /** Muestra skeletons y oculta valores reales */
  isLoading?: boolean;
};

const TOKENS = {
  cardBase:
    "config-card group relative h-28 overflow-hidden rounded-2xl p-4 transition " +
    // Light: base blanca
    "bg-white border border-neutral-200 shadow-[0_10px_30px_rgba(0,0,0,.06)] " +
    // Dark: el CSS global forza fondo oscuro; aquí solo borde
    "dark:border-white/10",

  label:  "card-label text-[12px] uppercase tracking-wide font-semibold",
  number:
    "card-number text-4xl font-extrabold leading-none tracking-tight " +
    "drop-shadow-[0_1px_1px_rgba(0,0,0,.25)]",

  // Gradientes decorativos para hover (opcionales)
  grad: {
    marcas:         { from:"from-amber-500/40",   to:"to-orange-400/30",  fromDark:"dark:from-amber-300/20",  toDark:"dark:to-orange-200/10" },
    usuario_marcas: { from:"from-cyan-500/40",    to:"to-teal-400/30",    fromDark:"dark:from-cyan-300/20",   toDark:"dark:to-teal-200/10" },
    comunas:        { from:"from-violet-500/40",  to:"to-fuchsia-400/30", fromDark:"dark:from-violet-300/20", toDark:"dark:to-fuchsia-200/10" },
    estados:        { from:"from-emerald-500/40", to:"to-green-400/30",   fromDark:"dark:from-emerald-300/20",toDark:"dark:to-green-200/10" },
    categorias:     { from:"from-rose-500/40",    to:"to-pink-400/30",    fromDark:"dark:from-rose-300/20",   toDark:"dark:to-pink-200/10" },
    tipo_cliente:   { from:"from-sky-500/40",     to:"to-blue-400/30",    fromDark:"dark:from-sky-300/20",    toDark:"dark:to-blue-200/10" },
    segmentacion:   { from:"from-orange-500/40",  to:"to-amber-400/30",   fromDark:"dark:from-orange-300/20", toDark:"dark:to-amber-200/10" },
  },
} as const;

const ITEMS: Array<{ key: keyof Summary; label: string }> = [
  { key: "marcas", label: "Marcas" },
  { key: "usuario_marcas", label: "Usuarios x Marca" },
  { key: "comunas", label: "Comunas" },
  { key: "estados", label: "Estados" },
  { key: "categorias", label: "Categorías clientes" },
  { key: "tipo_cliente", label: "Tipo de cliente" },
  { key: "segmentacion", label: "Segmentación" },
];

const nf = new Intl.NumberFormat(); // separadores de miles

/** Bloque de resumen de configuración con gradientes decorativos */
const ConfigResumen: React.FC<ConfigResumenProps> = ({
  summary,
  title = "Resumen de configuración",
  className,
  isLoading = false,
}) => {
  const titleId = "config-resumen-title";

  return (
    <section className={className} role="region" aria-labelledby={titleId}>
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,.7)] dark:bg-emerald-400" aria-hidden />
        <h3 id={titleId} className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {ITEMS.map(({ key, label }) => {
          const value = summary?.[key] ?? 0;
          const g = TOKENS.grad[key];

          return (
            <article key={key} className={TOKENS.cardBase} aria-label={label}>
              {/* Gradiente decorativo al hover */}
              <div
                className={[
                  "pointer-events-none absolute -inset-12 opacity-0 group-hover:opacity-100 transition duration-300 blur-2xl",
                  "bg-gradient-to-br",
                  g.from, g.to, g.fromDark, g.toDark,
                ].join(" ")}
                aria-hidden
              />

              {/* Contenido */}
              <div className="relative flex h-full flex-col justify-between">
                <div className={TOKENS.label}>{label.toUpperCase()}</div>

                {/* Línea interna tenue (opcional) */}
                <div className="absolute inset-x-2 top-[46%] h-px rounded-full bg-black/5 dark:bg-white/10" />

                {isLoading ? (
                  <div className="h-8 w-16 rounded-md bg-neutral-200 animate-pulse dark:bg-white/10" aria-hidden />
                ) : (
                  <div className={TOKENS.number} aria-live="polite">
                    {nf.format(value)}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default ConfigResumen;
