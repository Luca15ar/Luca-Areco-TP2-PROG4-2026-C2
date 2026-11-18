import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  let authReq = req;
  if (token && !req.headers.has('Authorization')) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const isAuthEndpoint =
          req.url.includes('/api/auth/login') ||
          req.url.includes('/api/auth/register') ||
          req.url.includes('/api/auth/refresh') ||
          req.url.includes('/api/auth/authorize');
        if (!isAuthEndpoint) {
          authService.logout();
          const isDeactivated =
            typeof error.error?.message === 'string' &&
            (error.error.message.includes('deshabilitad') ||
              error.error.message.includes('desactivad'));
          router.navigate(['/login'], {
            queryParams: isDeactivated ? { deactivated: 'true' } : undefined,
          });
        }
      }
      return throwError(() => error);
    }),
  );
};
