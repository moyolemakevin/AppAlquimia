import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

interface AssistantResponse {
  status: string;
  data: {
    reply: string;
    topic: string;
    suggestions: string[];
  };
}

@Injectable({ providedIn: 'root' })
export class AssistantService {
  private readonly http = inject(HttpClient);

  private get baseUrl(): string {
    return `${environment.apiUrl}/assistant/chat.php`;
  }

  sendMessage(message: string): Observable<{ reply: string; topic: string; suggestions: string[] }> {
    return this.http
      .post<AssistantResponse>(this.baseUrl, { message })
      .pipe(map((response) => response.data));
  }
}