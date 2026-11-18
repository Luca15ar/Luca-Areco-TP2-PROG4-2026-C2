import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionService } from './session.service';
import { AuthService } from './auth.service';

describe('SessionService', () => {
  let sessionService: SessionService;
  let authService: AuthService;

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
});
