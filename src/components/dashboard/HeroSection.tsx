import React from "react";
import { Plus, Search, LogOut } from "lucide-react";

type Props = {
  userName: string;
  initials: string;
  onNewLead?: () => void;
  onSearch?: () => void;
  onLogout?: () => void;
};

/** Avatar monograma anti-herencia:
 *  - Dibuja SVG con fill de fondo y texto explícitos.
 *  - Detecta el tema leyendo <html>.classList.contains('dark')
 *  - NO depende de Tailwind para color del texto/fondo (no lo “blanquea” nada).
 */
const Avatar: React.FC<{ initials: string; title?: string }> = ({ initials, title }) => {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const bg = isDark ? "rgba(255,255,255,0.10)" : "#e9f0ff"; // fondo
  const border = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.10)";
  const txt = isDark ? "#ffffff" : "#0b1220"; // texto SIEMPRE correcto

  return (
    <div className="relative isolate" title={title} aria-label={`Usuario: ${title ?? initials}`}>
      {/* Aura decorativa */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-3 rounded-2xl blur-xl"
        style={{
          background: isDark
            ? "radial-gradient(40% 40% at 50% 50%, rgba(2,132,199,.35), transparent 65%)"
            : "radial-gradient(40% 40% at 50% 50%, rgba(2,132,199,.22), transparent 65%)",
        }}
      />
      {/* Tile+texto en SVG (colores inline, no heredan) */}
      <svg
        width={56}
        height={56}
        viewBox="0 0 56 56"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", borderRadius: 12, overflow: "hidden" }}
      >
        <rect x="0.5" y="0.5" width="55" height="55" rx="12"
              fill={bg} stroke={border} />
        <text
          x="50%" y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans"
          fontWeight={800}
          fontSize={18}
          fill={txt}   /* 👈 color del texto fijado aquí */
        >
          {initials || "?"}
        </text>
      </svg>
    </div>
  );
};

const HeroSection: React.FC<Props> = ({ userName, initials, onNewLead, onSearch, onLogout }) => {
  const h = new Date().getHours();
  const saludo = h < 12 ? "¡Buenos días!" : h < 19 ? "¡Buenas tardes!" : "¡Buenas noches!";

  return (
    <section className="relative antialiased">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Izquierda: avatar + textos */}
        <div className="flex items-center gap-4 md:gap-5">
          <Avatar initials={initials} title={userName} />

          <div>
            <div className="inline-flex items-center gap-2">
              <span className="force-ink text-xs md:text-sm">{saludo}</span>
              <span className="h-1 w-1 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(255,214,10,.8)]" />
            </div>

            <h1 className="force-ink text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
              {userName}
            </h1>

            <p className="force-ink/80 text-[13px] md:text-sm">
              Resumen de operación (hoy) y estado del proyecto.
            </p>
          </div>
        </div>

        {/* Derecha: acciones – botones sólidos con texto blanco */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNewLead}
            disabled={!onNewLead}
            className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-white
                       bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300
                       disabled:opacity-60 disabled:cursor-not-allowed
                       dark:bg-cyan-500 dark:hover:bg-cyan-600 dark:focus:ring-cyan-400 transition"
          >
            <Plus className="h-4 w-4" /> Nuevo lead
          </button>

          <button
            onClick={onSearch}
            disabled={!onSearch}
            className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-white
                       bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-300
                       disabled:opacity-60 disabled:cursor-not-allowed
                       dark:bg-amber-500 dark:hover:bg-amber-600 dark:focus:ring-amber-400 transition"
          >
            <Search className="h-4 w-4" /> Buscar
          </button>

          <button
            onClick={onLogout}
            disabled={!onLogout}
            className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-white
                       bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300
                       disabled:opacity-60 disabled:cursor-not-allowed
                       dark:bg-rose-500 dark:hover:bg-rose-600 dark:focus:ring-rose-400 transition"
          >
            <LogOut className="h-4 w-4" /> Salir
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
