export interface Tip {
  id: number;
  titulo: string;
  contenido: string;
  imagen_url?: string | null;
  video_url?: string | null;
  tipo?: string | null;
  fecha_publicacion?: string;
  likes?: number;
  dislikes?: number;
}