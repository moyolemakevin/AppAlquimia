import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
    const authService = inject(AuthService);
    const token = authService.token;

    let updatedRequest: HttpRequest<unknown> = request;

    if (token && request.url.startsWith(environment.apiUrl)) {
        updatedRequest = request.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    return next(updatedRequest).pipe(
        catchError((error) => {
            if (error?.status === 401) {
                authService.logout();
            }
            return throwError(() => error);
        }),
    );
};