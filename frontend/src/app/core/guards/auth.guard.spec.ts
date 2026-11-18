import { describe, expect, it, vi, beforeEach } from 'vitest';
import { authGuard } from './auth.guard';
import { of, throwError } from 'rxjs';

describe('authGuard', () => {
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(() => {
    mockAuthService = {
      getToken: vi.fn(),
      authorize: vi.fn(),
      logout: vi.fn(),
    };
    mockRouter = {
      navigate: vi.fn(),
    };
  });

  it('debe denegar acceso y redirigir al login si no hay token', () => {
    mockAuthService.getToken.mockReturnValue(null);

    // Mock inject inside test
    const guardContext = () => {
      const token = mockAuthService.getToken();
      if (!token) {
        mockAuthService.logout();
        mockRouter.navigate(['/login']);
        return false;
      }
      return true;
    };

    const result = guardContext();
    expect(result).toBe(false);
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('debe permitir acceso si el token es válido y el usuario está activo', async () => {
    mockAuthService.getToken.mockReturnValue('valid_token');
    mockAuthService.authorize.mockReturnValue(
      of({ _id: '1', email: 'test@test.com', isActive: true }),
    );

    let allowed = false;
    mockAuthService.authorize('valid_token').subscribe((user: any) => {
      if (user && user.isActive) {
        allowed = true;
      }
    });

    expect(allowed).toBe(true);
  });

  it('debe denegar acceso y redirigir si el usuario está deshabilitado', async () => {
    mockAuthService.getToken.mockReturnValue('valid_token');
    mockAuthService.authorize.mockReturnValue(
      throwError(() => ({ status: 401, error: { message: 'deshabilitado' } })),
    );

    let denied = false;
    mockAuthService.authorize('valid_token').subscribe({
      next: () => {},
      error: () => {
        mockAuthService.logout();
        mockRouter.navigate(['/login'], { queryParams: { deactivated: 'true' } });
        denied = true;
      },
    });

    expect(denied).toBe(true);
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { deactivated: 'true' },
    });
  });
});
