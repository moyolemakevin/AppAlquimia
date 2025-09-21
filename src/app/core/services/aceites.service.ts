import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Aceite } from '../models';

export interface AceiteFilters {
  q?: string;
  categoria?: string;
}

interface AceitesResponse {
  status: string;
  data: { aceites: Aceite[] };
}

interface AceiteResponse {
  status: string;
  data: { aceite: Aceite };
}

interface MutationResponse<T = unknown> {
  status: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AceitesService {
  private readonly http = inject(HttpClient);

  private get baseUrl(): string {
    return `${environment.apiUrl}/aceites/index.php`;
  }

  getAceites(filters: AceiteFilters = {}): Observable<Aceite[]> {
    let params = new HttpParams();
    if (filters.q) {
      params = params.set('q', filters.q);
    }
    if (filters.categoria) {
      params = params.set('categoria', filters.categoria);
    }

    return this.http
      .get<AceitesResponse>(this.baseUrl, { params })
      .pipe(map((response) => response.data.aceites));
  }

  getAceite(id: number): Observable<Aceite> {
    const params = new HttpParams().set('id', String(id));
    return this.http
      .get<AceiteResponse>(this.baseUrl, { params })
      .pipe(map((response) => response.data.aceite));
  }

  createAceite(payload: Partial<Aceite>): Observable<number> {
    return this.http
      .post<MutationResponse<{ id: number }>>(this.baseUrl, payload)
      .pipe(map((response) => response.data.id));
  }

  updateAceite(id: number, payload: Partial<Aceite>): Observable<boolean> {
    const params = new HttpParams().set('id', String(id));
    return this.http
      .put<MutationResponse<{ updated: boolean }>>(this.baseUrl, payload, { params })
      .pipe(map((response) => Boolean((response.data as { updated?: boolean }).updated)));
  }

  deleteAceite(id: number): Observable<boolean> {
    const params = new HttpParams().set('id', String(id));
    return this.http
      .delete<MutationResponse<{ deleted: boolean }>>(this.baseUrl, { params })
      .pipe(map((response) => Boolean((response.data as { deleted?: boolean }).deleted)));
  }
}