import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, catchError, forkJoin, map, of, timer } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

const MIN_LOADING_DURATION_MS = 2500;

@Component({
  selector: 'app-loading',
  standalone: true,
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.css',
})
export class LoadingComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private subscription?: Subscription;

  ngOnInit(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.subscription = timer(MIN_LOADING_DURATION_MS).subscribe(() => {
        this.router.navigate(['/login']);
      });
      return;
    }

    this.subscription = forkJoin({
      auth: this.authService.authorize(token).pipe(
        map(() => ({ ok: true as const })),
        catchError((err: unknown) => of({ ok: false as const, err })),
      ),
      minDelay: timer(MIN_LOADING_DURATION_MS),
    }).subscribe(({ auth }) => {
      if (auth.ok) {
        this.router.navigate(['/posts']);
        return;
      }

      this.handleAuthError(auth.err);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private handleAuthError(err: unknown): void {
    this.authService.logout();
    const errorObj = err as { status?: number; error?: { message?: string } } | null;
    const message = errorObj?.error?.message ?? '';
    const isDeactivated =
      errorObj?.status === 401 &&
      (message.includes('deshabilitado') || message.includes('desactivado'));

    this.router.navigate(['/login'], {
      queryParams: isDeactivated
        ? { deactivated: 'true' }
        : { expired: 'true' },
    });
  }
}
