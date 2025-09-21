import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Tip } from '../models';

interface TipsResponse {
  status: string;
  data: { tips: Tip[] };
}

interface MutationResponse<T = unknown> {
  status: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class TipsService {
  private readonly http = inject(HttpClient);

  private get baseUrl(): string {
    return `${environment.apiUrl}/tips/index.php`;
  }

  getTips(filters: { q?: string; tipo?: string } = {}): Observable<Tip[]> {
    let params = new HttpParams();
    if (filters.q) {
      params = params.set('q', filters.q);
    }
    if (filters.tipo) {
      params = params.set('tipo', filters.tipo);
    }

    return this.http
      .get<TipsResponse>(this.baseUrl, { params })
      .pipe(map((response) => response.data.tips));
  }

  createTip(payload: Partial<Tip>): Observable<number> {
    return this.http
      .post<MutationResponse<{ id: number }>>(this.baseUrl, payload)
      .pipe(map((response) => response.data.id));
  }

  updateTip(id: number, payload: Partial<Tip>): Observable<boolean> {
    const params = new HttpParams().set('id', String(id));
    return this.http
      .put<MutationResponse<{ updated: boolean }>>(this.baseUrl, payload, { params })
      .pipe(map((response) => Boolean((response.data as { updated?: boolean }).updated)));
  }

  deleteTip(id: number): Observable<boolean> {
    const params = new HttpParams().set('id', String(id));
    return this.http
      .delete<MutationResponse<{ deleted: boolean }>>(this.baseUrl, { params })
      .pipe(map((response) => Boolean((response.data as { deleted?: boolean }).deleted)));
  }
}