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

  private readonly activityEvents = [
    'mousemove',
    'keydown',
    'touchstart',
    'scroll',
    'click',
  ];

  private readonly boundResetInactivity = () => this.handleUserActivity();

  constructor() {
    effect(() => {
      const loggedIn = this.authService.isLoggedIn();
      if (loggedIn) {
        this.startMonitoring();
      } else {
        this.stopMonitoring();
      }
    });
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.attachActivityListeners();
    this.resetTimers();
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    this.detachActivityListeners();
    this.clearAllTimers();
    this.showWarningModal.set(false);
  }

  extendSession(): void {
    this.isRefreshing.set(true);
    this.authService.refreshToken().subscribe({
      next: () => {
        this.isRefreshing.set(false);
        this.showWarningModal.set(false);
        this.resetTimers();
      },
      error: () => {
        this.isRefreshing.set(false);
        this.logoutAndRedirect();
      },
    });
  }

  logoutAndRedirect(): void {
    this.stopMonitoring();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private handleUserActivity(): void {
    if (this.showWarningModal()) {
      return;
    }
    this.resetTimers();
  }

  private resetTimers(): void {
    this.clearAllTimers();
    this.showWarningModal.set(false);

    if (typeof window === 'undefined') return;

    this.ngZone.runOutsideAngular(() => {
      this.warningTimer = setTimeout(() => {
        this.ngZone.run(() => {
          this.triggerWarning();
        });
      }, SESSION_CONFIG.WARNING_TIME_MS);
    });
  }

  private triggerWarning(): void {
    this.showWarningModal.set(true);
    this.secondsRemaining.set(SESSION_CONFIG.COUNTDOWN_SECONDS);

    this.clearCountdown();

    this.ngZone.runOutsideAngular(() => {
      this.countdownInterval = setInterval(() => {
        this.ngZone.run(() => {
          const remaining = this.secondsRemaining() - 1;
          this.secondsRemaining.set(remaining);

          if (remaining <= 0) {
            this.clearCountdown();
            this.logoutAndRedirect();
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

  private attachActivityListeners(): void {
    if (typeof window === 'undefined') return;
    this.activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, this.boundResetInactivity, {
        passive: true,
      });
    });
  }

  private detachActivityListeners(): void {
    if (typeof window === 'undefined') return;
    this.activityEvents.forEach((eventName) => {
      window.removeEventListener(eventName, this.boundResetInactivity);
    });
  }
}
