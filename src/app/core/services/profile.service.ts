import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { User } from '../models';

export interface UpdateProfilePayload {
  nombre_completo?: string;
  email?: string;
  telefono?: string;
  password?: string;
}

interface RawProfile {
  id: number;
  uid: string;
  nombre_usuario: string;
  nombre_completo?: string | null;
  email: string;
  telefono?: string | null;
  rol: string;
  nivel?: string | null;
  modo?: string | null;
  fecha_registro?: string | null;
}

interface RawStats {
  total_aceites_explorados?: number;
  favoritos_total?: number;
  tips_recibidos?: number;
  tiempo_uso_app?: number;
  ultimos_aceites?: string | null;
  ultimo_login?: string | null;
}

export type ProfileStats = RawStats;

interface ProfileData {
  profile: RawProfile;
  stats: RawStats | null;
}

interface ProfileResponse {
  status: string;
  data: ProfileData;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  private get baseUrl(): string {
    return `${environment.apiUrl}/usuarios/profile.php`;
  }

  getProfile(): Observable<{ profile: User; stats: ProfileStats | null }> {
    return this.http
      .get<ProfileResponse>(this.baseUrl)
      .pipe(map((response) => ({ profile: this.normalizeUser(response.data.profile), stats: response.data.stats })));
  }

  updateProfile(payload: UpdateProfilePayload): Observable<User> {
    return this.http
      .put<ProfileResponse>(this.baseUrl, payload)
      .pipe(map((response) => this.normalizeUser(response.data.profile)));
  }

  private normalizeUser(raw: RawProfile): User {
    return {
      id: raw.id,
      uid: raw.uid,
      username: raw.nombre_usuario,
      name: raw.nombre_completo ?? raw.nombre_usuario,
      email: raw.email,
      phone: raw.telefono ?? undefined,
      role: (raw.rol as 'admin' | 'usuario') ?? 'usuario',
      level: raw.nivel ?? undefined,
      mode: raw.modo ?? undefined,
      registeredAt: raw.fecha_registro ?? undefined,
    };
  }
}