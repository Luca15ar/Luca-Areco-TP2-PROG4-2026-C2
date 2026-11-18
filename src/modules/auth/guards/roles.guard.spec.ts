import { describe, expect, it, vi } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  const createMockContext = (user?: any): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  };

  it('debe permitir acceso si no hay roles requeridos', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe permitir acceso si el usuario posee el rol requerido', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['administrador']);
    const context = createMockContext({ role: 'administrador' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe denegar acceso con ForbiddenException si no hay usuario autenticado', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['administrador']);
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('debe denegar acceso con ForbiddenException si el rol no coincide', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['administrador']);
    const context = createMockContext({ role: 'usuario' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
