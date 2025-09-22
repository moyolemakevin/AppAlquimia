import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../models';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email: string;
  name: string;
  phone?: string;
}

export interface ForgotPasswordPayload {
  username: string;
  answer?: string;
  newPassword?: string;
}

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

interface ForgotPasswordResult {
  question?: string;
  requiresAnswer?: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storageKey = 'alquimia_session';
  private readonly userSubject = new BehaviorSubject<User | null>(null);
  readonly user$ = this.userSubject.asObservable();
  readonly isAuthenticated$ = this.user$.pipe(map((user) => !!user));

  constructor() {
    this.restoreSession();
  }

  get apiUrl(): string {
    return environment.apiUrl;
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    const session = this.getStoredSession();
    return session?.token ?? null;
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/login.php`, payload)
      .pipe(
        map((response) => response.data),
        tap((authResponse) => this.persistSession(authResponse)),
      );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/register.php`, payload)
      .pipe(
        map((response) => response.data),
        tap((authResponse) => this.persistSession(authResponse)),
      );
  }

  forgotPassword(payload: ForgotPasswordPayload): Observable<ForgotPasswordResult> {
    return this.http
      .post<ApiResponse<ForgotPasswordResult>>(`${this.apiUrl}/auth/forgot-password.php`, payload)
      .pipe(map((response) => response.data));
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.userSubject.next(null);
  }

  updateCachedUser(user: User): void {
    const session = this.getStoredSession();

    if (session) {
      session.user = user;
      this.persistSession(session);
    } else {
      this.userSubject.next(user);
    }
  }

  private persistSession(response: AuthResponse): void {
    localStorage.setItem(this.storageKey, JSON.stringify(response));
    this.userSubject.next(response.user);
  }

  private getStoredSession(): AuthResponse | null {
    const raw = localStorage.getItem(this.storageKey);

    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw);

      if (parsed && typeof parsed === 'object') {
        if ('user' in parsed && parsed.user) {
          return parsed as AuthResponse;
        }

        if ('data' in parsed && (parsed.data as AuthResponse | undefined)?.user) {
          const normalized = parsed.data as AuthResponse;
          this.persistSession(normalized);
          return normalized;
        }
      }

      return null;
    } catch (error) {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private restoreSession(): void {
    const session = this.getStoredSession();

    if (session?.user) {
      this.userSubject.next(session.user);
    }
  }
}
