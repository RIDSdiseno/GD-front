// Tipos para las métricas
export type StageCounts = Record<string, number>;

export type ConfigSummary = {
  marcas: number;
  comunas: number;
  categorias: number;
  estados: number;
  tipo_cliente: number;
  segmentacion: number;
  usuario_marcas: number;
};

export type LeadsTodayResponse = {
  total: number;
  byEstado: { estado: string; count: number }[];
};

// Tipos de usuario
export type User = {
  nombre?: string;
  email?: string;
};
