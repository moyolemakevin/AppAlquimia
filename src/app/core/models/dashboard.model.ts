export interface DashboardCounts {
  aceites: number;
  usuarios: number;
  tips: number;
  favoritos: number;
}

export interface DashboardData {
  counts: DashboardCounts;
  latestAceites: Array<{ id: number; nombre: string; beneficios?: string | null; fecha_agregado?: string }>;
  latestTips: Array<{ id: number; titulo: string; tipo?: string | null; fecha_publicacion?: string }>;
  recentUsers: Array<{ id: number; nombre_usuario: string; nombre_completo?: string | null; rol: string; fecha_registro?: string }>;
}