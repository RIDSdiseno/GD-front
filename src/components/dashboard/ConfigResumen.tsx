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

const ConfigResumen: React.FC<{ summary: Summary }> = ({ summary }) => {
  return (
    <div className="card">
      <div className="card-body">
        <div className="mb-4 flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500" />
          <h3 className="text-base font-semibold text-zinc-900">Resumen de configuración</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {ITEMS.map((it) => (
            <div key={it.key} className="h-24 rounded-xl border border-zinc-200 bg-white p-4 flex flex-col justify-between">
              <div className="text-xs text-zinc-500">{it.label}</div>
              <div className="text-2xl font-bold text-zinc-900">{summary[it.key] ?? 0}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConfigResumen;
