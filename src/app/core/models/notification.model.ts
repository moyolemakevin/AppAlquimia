export interface NotificationItem {
  id: number;
  notificacion_id?: number;
  titulo: string;
  contenido: string;
  tipo: string;
  fecha: string;
  leida: number | boolean;
}