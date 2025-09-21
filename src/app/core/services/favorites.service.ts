import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Aceite } from '../models';

interface FavoritesResponse<T> {
  status: string;
  data: { favoritos: T };
}

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly http = inject(HttpClient);

  private get baseUrl(): string {
    return `${environment.apiUrl}/favoritos/index.php`;
  }

  getFavorites(withDetail = true): Observable<Aceite[] | Array<{ aceite_id: number }>> {
    const params = new HttpParams().set('detalle', withDetail ? '1' : '0');
    return this.http
      .get<FavoritesResponse<Aceite[] | Array<{ aceite_id: number }>>>(this.baseUrl, { params })
      .pipe(map((response) => response.data.favoritos));
  }

  addFavorite(aceiteId: number): Observable<boolean> {
    return this.http
      .post<{ status: string; data: { added?: boolean; alreadyFavorite?: boolean } }>(this.baseUrl, {
        aceiteId,
      })
      .pipe(map((response) => Boolean(response.data.added ?? true)));
  }

  removeFavorite(aceiteId: number): Observable<boolean> {
    const params = new HttpParams().set('aceiteId', String(aceiteId));
    return this.http
      .delete<{ status: string; data: { deleted: boolean } }>(this.baseUrl, { params })
      .pipe(map((response) => Boolean(response.data.deleted)));
  }
}