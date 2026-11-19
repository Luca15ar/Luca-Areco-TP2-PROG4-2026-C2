import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = ():
  | boolean
  | UrlTree
  | Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  if (!token) {
    authService.logout();
    return router.createUrlTree(['/login']);
  }

  return authService.authorize(token).pipe(
    map((user) => {
      if (!user || user.isActive === false) {
        authService.logout();
        return router.createUrlTree(['/login'], {
          queryParams: { deactivated: 'true' },
        });
      }
      return true;
    }),
    catchError((error) => {
      authService.logout();
      const message = error?.error?.message;
      const isDeactivated =
        typeof message === 'string' &&
        (message.includes('deshabilitad') || message.includes('desactivad'));
      return of(
        router.createUrlTree(['/login'], {
          queryParams: isDeactivated
            ? { deactivated: 'true' }
            : { expired: 'true' },
        }),
      );
    }),
  );
};
