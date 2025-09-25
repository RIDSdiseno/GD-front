import React from "react";
import { Plus, Search, LogOut } from "lucide-react";

type Props = {
  userName: string;
  initials: string;
  onNewLead?: () => void;
  onSearch?: () => void;
  onLogout?: () => void;
};

const HeroSection: React.FC<Props> = ({ userName, initials, onNewLead, onSearch, onLogout }) => {
  const h = new Date().getHours();
  const saludo = h < 12 ? "¡Buenos días" : h < 19 ? "¡Buenas tardes" : "¡Buenas noches";

  return (
    <section className="relative">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-white">
        {/* Izquierda: avatar + textos */}
        <div className="flex items-center gap-4 md:gap-5">
          {/* Aura + avatar */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-2 rounded-2xl blur-xl bg-gradient-to-tr from-yellow-300/40 via-cyan-300/30 to-transparent" />
            <div className="grid size-14 place-items-center rounded-2xl bg-white/10 border border-white/15 ring-1 ring-white/10 text-white font-extrabold text-lg backdrop-blur-md">
              {initials}
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2">
              <span className="text-xs md:text-sm text-white/70">{saludo}</span>
              <span className="h-1 w-1 rounded-full bg-yellow-300/80 shadow-[0_0_10px_rgba(255,214,10,.9)]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight drop-shadow-[0_0_14px_rgba(255,214,10,.35)]">
              {userName}
            </h1>
            <p className="text-[13px] md:text-sm text-white/70">
              Resumen de operación (hoy) y estado del proyecto.
            </p>
          </div>
        </div>

        {/* Derecha: acciones */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNewLead}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/50 bg-cyan-400/10 px-3.5 py-2 text-sm font-semibold text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,.35)] hover:bg-cyan-400/20 hover:shadow-[0_0_22px_rgba(34,211,238,.55)] focus:outline-none focus:ring-2 focus:ring-cyan-300/50 transition"
          >
            <Plus className="size-4" /> Nuevo lead
          </button>

          <button
            onClick={onSearch}
            className="inline-flex items-center gap-2 rounded-xl border border-yellow-300/50 bg-yellow-400/10 px-3.5 py-2 text-sm font-semibold text-yellow-100 shadow-[0_0_16px_rgba(255,214,10,.35)] hover:bg-yellow-400/20 hover:shadow-[0_0_22px_rgba(255,214,10,.55)] focus:outline-none focus:ring-2 focus:ring-yellow-300/50 transition"
          >
            <Search className="size-4" /> Buscar
          </button>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-300/50 bg-rose-400/10 px-3.5 py-2 text-sm font-bold text-rose-100 shadow-[0_0_16px_rgba(244,63,94,.35)] hover:bg-rose-400/20 hover:shadow-[0_0_22px_rgba(244,63,94,.55)] focus:outline-none focus:ring-2 focus:ring-rose-300/50 transition"
          >
            <LogOut className="size-4" /> Salir
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
