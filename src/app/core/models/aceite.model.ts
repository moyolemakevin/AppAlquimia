export interface Aceite {
  id: number;
  nombre: string;
  imagen_url?: string | null;
  descripcion?: string | null;
  beneficios?: string | null;
  usos?: string | null;
  precauciones?: string | null;
  emociones_relacionadas?: string | null;
  audio_url?: string | null;
  video_url?: string | null;
  fecha_agregado?: string;
  isFavorite?: boolean;
}