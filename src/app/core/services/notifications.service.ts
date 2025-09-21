import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { NotificationItem } from '../models';

interface NotificationsResponse {
  status: string;
  data: { notifications: NotificationItem[] };
}

interface MutationResponse<T = unknown> {
  status: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);

  private get baseUrl(): string {
    return `${environment.apiUrl}/notificaciones/index.php`;
  }

  getNotifications(): Observable<NotificationItem[]> {
    return this.http
      .get<NotificationsResponse>(this.baseUrl)
      .pipe(map((response) => response.data.notifications));
  }

  markAsRead(id: number, read = true): Observable<boolean> {
    const params = new HttpParams().set('id', String(id));
    return this.http
      .patch<MutationResponse<{ updated: boolean }>>(this.baseUrl, { leida: read }, { params })
      .pipe(map((response) => Boolean((response.data as { updated?: boolean }).updated)));
  }

  createNotification(payload: {
    titulo: string;
    contenido: string;
    tipo?: string;
    usuarios?: number[];
  }): Observable<{ id: number; recipients: number }> {
    return this.http
      .post<MutationResponse<{ id: number; recipients: number }>>(this.baseUrl, payload)
      .pipe(map((response) => response.data));
  }
}