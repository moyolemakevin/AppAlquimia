import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { User } from '../models';

interface RawUser {
  id: number;
  uid: string;
  nombre_usuario: string;
  nombre_completo?: string | null;
  email: string;
  telefono?: string | null;
  rol: string;
  nivel?: string | null;
  activo?: number;
  fecha_registro?: string | null;
}

interface UsersResponse {
  status: string;
  data: { usuarios: RawUser[] };
}

interface MutationResponse<T = unknown> {
  status: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  private get baseUrl(): string {
    return `${environment.apiUrl}/usuarios/index.php`;
  }

  getUsers(): Observable<User[]> {
    return this.http
      .get<UsersResponse>(this.baseUrl)
      .pipe(map((response) => response.data.usuarios.map((raw) => this.normalizeUser(raw))));
  }

  updateUser(
    id: number,
    payload: { rol?: string; nivel?: string; activo?: boolean | number },
  ): Observable<boolean> {
    const params = new HttpParams().set('id', String(id));
    const body: Record<string, unknown> = {};

    if (payload.rol !== undefined) {
      body['rol'] = payload.rol;
    }
    if (payload.nivel !== undefined) {
      body['nivel'] = payload.nivel;
    }
    if (payload.activo !== undefined) {
      body['activo'] = typeof payload.activo === 'boolean' ? (payload.activo ? 1 : 0) : payload.activo;
    }

    return this.http
      .patch<MutationResponse<{ updated: boolean }>>(this.baseUrl, body, { params })
      .pipe(map((response) => Boolean((response.data as { updated?: boolean }).updated)));
  }

  private normalizeUser(raw: RawUser): User {
    return {
      id: raw.id,
      uid: raw.uid,
      username: raw.nombre_usuario,
      name: raw.nombre_completo ?? raw.nombre_usuario,
      email: raw.email,
      phone: raw.telefono ?? undefined,
      role: (raw.rol as 'admin' | 'usuario') ?? 'usuario',
      level: raw.nivel ?? undefined,
      registeredAt: raw.fecha_registro ?? undefined,
      active: raw.activo === 1,
    };
  }
}

