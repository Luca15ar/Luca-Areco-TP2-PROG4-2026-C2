import { Injectable, inject, signal, effect, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { SESSION_CONFIG } from '../config/session.config';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  readonly showWarningModal = signal<boolean>(false);
  readonly secondsRemaining = signal<number>(SESSION_CONFIG.COUNTDOWN_SECONDS);
  readonly isRefreshing = signal<boolean>(false);

  private warningTimer: any = null;
  private countdownInterval: any = null;
  private isMonitoring = false;

  constructor() {
    effect(() => {
      const loggedIn = this.authService.isLoggedIn();
      const token = this.authService.currentToken();

      if (loggedIn && token) {
        if (!this.isMonitoring) {
          this.isMonitoring = true;
        }
        this.scheduleWarning();
      } else {
        this.stopMonitoring();
      }
    });
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.scheduleWarning();
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    this.clearAllTimers();
    this.showWarningModal.set(false);
  }

  extendSession(): void {
    this.isRefreshing.set(true);
    this.authService.refreshToken().subscribe({
      next: (res) => {
        this.isRefreshing.set(false);
        this.showWarningModal.set(false);
        if (res && res.token) {
          this.authService.setToken(res.token);
        }
        this.scheduleWarning();
      },
      error: () => {
        this.isRefreshing.set(false);
        this.logoutAndRedirect();
      },
    });
  }

  logoutAndRedirect(isExpired: boolean = false): void {
    this.stopMonitoring();
    this.authService.logout();
    this.router.navigate(['/login'], {
      queryParams: isExpired ? { expired: 'true' } : undefined,
    });
  }

  /**
   * Programa la alarma preventiva basada en la caducidad real del token JWT.
   * La alerta se muestra exactamente cuando resta el tiempo configurado para el conteo regresivo,
   * garantizando que el usuario sea alertado incluso mientras interactúa con la aplicación.
   */
  scheduleWarning(): void {
    this.clearAllTimers();
    this.showWarningModal.set(false);

    if (typeof window === 'undefined') return;

    const expMs = this.getTokenExpMs();
    let delayMs: number;
    let countdownSec: number;

    if (expMs) {
      const totalRemainingMs = expMs - Date.now();
      const countdownMs = SESSION_CONFIG.COUNTDOWN_SECONDS * 1000;

      if (totalRemainingMs <= 0) {
        this.logoutAndRedirect(true);
        return;
      }

      if (totalRemainingMs <= countdownMs) {
        countdownSec = Math.max(1, Math.floor(totalRemainingMs / 1000));
        this.triggerWarning(countdownSec);
        return;
      }

      delayMs = totalRemainingMs - countdownMs;
      countdownSec = SESSION_CONFIG.COUNTDOWN_SECONDS;
    } else {
      delayMs = SESSION_CONFIG.WARNING_TIME_MS;
      countdownSec = SESSION_CONFIG.COUNTDOWN_SECONDS;
    }

    this.ngZone.runOutsideAngular(() => {
      this.warningTimer = setTimeout(() => {
        this.ngZone.run(() => {
          this.triggerWarning(countdownSec);
        });
      }, delayMs);
    });
  }

  private triggerWarning(initialCountdown: number = SESSION_CONFIG.COUNTDOWN_SECONDS): void {
    this.showWarningModal.set(true);
    this.secondsRemaining.set(initialCountdown);

    this.clearCountdown();

    this.ngZone.runOutsideAngular(() => {
      this.countdownInterval = setInterval(() => {
        this.ngZone.run(() => {
          const expMs = this.getTokenExpMs();
          let remaining: number;

          if (expMs) {
            remaining = Math.floor((expMs - Date.now()) / 1000);
          } else {
            remaining = this.secondsRemaining() - 1;
          }

          if (remaining <= 0) {
            this.secondsRemaining.set(0);
            this.clearCountdown();
            this.logoutAndRedirect(true);
          } else {
            this.secondsRemaining.set(remaining);
          }
        });
      }, 1000);
    });
  }

  private clearAllTimers(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    this.clearCountdown();
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private getTokenExpMs(): number | null {
    const token = this.authService.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      const payload = JSON.parse(jsonPayload);
      if (typeof payload.exp === 'number') {
        return payload.exp * 1000;
      }
    } catch {
      return null;
    }
    return null;
  }
}
