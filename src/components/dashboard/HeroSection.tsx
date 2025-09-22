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
    <section className="relative overflow-visible">
      {/* Píldora completa */}
      <div className="
        relative flex items-center justify-between gap-4
        rounded-[28px] md:rounded-[32px]
        px-4 md:px-6 lg:px-8 py-4
        bg-gradient-to-r from-emerald-50 via-rose-50 to-emerald-50
        ring-1 ring-zinc-200/60 shadow-sm
      ">
        {/* Izquierda: avatar + textos */}
        <div className="flex items-center gap-4 md:gap-5">
          <div className="grid size-14 place-items-center rounded-2xl bg-emerald-200 text-zinc-900 font-bold text-lg ring-1 ring-white shadow">
            {initials}
          </div>
          <div>
            <div className="text-xs md:text-sm font-medium text-orange-600">{saludo}</div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 leading-tight">
              {userName}
            </h1>
            <p className="text-[13px] md:text-sm text-zinc-600">
              Resumen de operación (hoy) y estado del proyecto.
            </p>
          </div>
        </div>

        {/* Derecha: grupo de acciones “glass” unido visualmente */}
        <div className="
          hidden sm:flex items-center gap-2 rounded-full
          bg-white/60 backdrop-blur-md ring-1 ring-zinc-200 shadow
          px-2 py-1
        ">
          <button
            onClick={onNewLead}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-white"
          >
            <Plus className="size-4" /> Nuevo lead
          </button>
          <div className="h-6 w-px bg-zinc-200/80" />
          <button
            onClick={onSearch}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-white"
          >
            <Search className="size-4" /> Buscar
          </button>
          <button
            onClick={onLogout}
            className="ml-1 inline-flex items-center gap-2 rounded-full bg-orange-500 px-3.5 py-2 text-sm font-bold text-white shadow hover:bg-orange-600"
          >
            <LogOut className="size-4" /> Salir
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
