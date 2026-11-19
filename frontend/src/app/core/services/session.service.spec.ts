import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionService } from './session.service';
import { AuthService } from './auth.service';

function createMockJwt(expSecondsFromNow: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: '123',
      exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
    }),
  );
  return `${header}.${payload}.signature`;
}

describe('SessionService', () => {
  let sessionService: SessionService;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    sessionService = TestBed.inject(SessionService);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    sessionService.stopMonitoring();
  });

  it('debe crearse correctamente', () => {
    expect(sessionService).toBeTruthy();
    expect(sessionService.showWarningModal()).toBe(false);
  });

  it('debe extender la sesión al llamar a extendSession', () => {
    const refreshSpy = vi
      .spyOn(authService, 'refreshToken')
      .mockReturnValue(of({ token: 'new.token' }));

    sessionService.extendSession();
    expect(refreshSpy).toHaveBeenCalled();
    expect(sessionService.showWarningModal()).toBe(false);
  });

  it('debe mostrar el modal preventivo inmediatamente si al token le restan menos de 60 segundos', () => {
    const mockToken = createMockJwt(45); // Restan 45 segundos
    vi.spyOn(authService, 'getToken').mockReturnValue(mockToken);

    sessionService.scheduleWarning();

    expect(sessionService.showWarningModal()).toBe(true);
    expect(sessionService.secondsRemaining()).toBeLessThanOrEqual(45);
    expect(sessionService.secondsRemaining()).toBeGreaterThan(0);
  });

  it('debe cerrar la sesión si el token ya está vencido al momento de verificar', () => {
    const mockExpiredToken = createMockJwt(-10); // Expiró hace 10 segundos
    vi.spyOn(authService, 'getToken').mockReturnValue(mockExpiredToken);
    const logoutSpy = vi.spyOn(authService, 'logout').mockImplementation(() => {});
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    sessionService.scheduleWarning();

    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], {
      queryParams: { expired: 'true' },
    });
  });
});
