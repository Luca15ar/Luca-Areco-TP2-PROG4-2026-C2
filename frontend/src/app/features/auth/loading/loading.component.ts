import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.css',
})
export class LoadingComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService.authorize(token).subscribe({
      next: () => {
        this.router.navigate(['/posts']);
      },
      error: (err) => {
        this.authService.logout();
        const isDeactivated =
          err?.status === 401 &&
          (err?.error?.message?.includes('deshabilitado') ||
            err?.error?.message?.includes('desactivado'));
        this.router.navigate(['/login'], {
          queryParams: isDeactivated
            ? { deactivated: 'true' }
            : { expired: 'true' },
        });
      },
    });
  }
}
