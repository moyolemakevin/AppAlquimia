import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DashboardData } from '../models';

interface DashboardResponse {
  status: string;
  data: DashboardData;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  private get baseUrl(): string {
    return `${environment.apiUrl}/dashboard/stats.php`;
  }

  getDashboard(): Observable<DashboardData> {
    return this.http
      .get<DashboardResponse>(this.baseUrl)
      .pipe(map((response) => response.data));
  }
}