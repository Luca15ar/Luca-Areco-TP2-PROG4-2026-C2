import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUser();
  if (currentUser && currentUser.role === 'administrador' && currentUser.isActive !== false) {
    return true;
  }

  router.navigate(['/posts']);
  return false;
};
