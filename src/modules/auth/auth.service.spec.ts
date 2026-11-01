import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsersService: Partial<UsersService>;

  beforeEach(() => {
    mockUsersService = {
      findByEmail: vi.fn(),
      findByUsername: vi.fn(),
      findByIdentifier: vi.fn(),
      create: vi.fn(),
    };
    authService = new AuthService(mockUsersService as UsersService);
  });

  it('debe registrar un usuario exitosamente con contraseña encriptada', async () => {
    vi.spyOn(mockUsersService, 'findByEmail').mockResolvedValue(null);
    vi.spyOn(mockUsersService, 'findByUsername').mockResolvedValue(null);

    const mockSavedUser = {
      _id: '123',
      firstName: 'Luca',
      lastName: 'Areco',
      email: 'luca@example.com',
      username: 'lucaa',
      password: 'hashedpassword',
      birthdate: '2000-01-01',
      bio: 'Bio de prueba',
      avatarUrl: '',
      role: 'usuario',
      isActive: true,
      toObject: () => ({
        _id: '123',
        firstName: 'Luca',
        lastName: 'Areco',
        email: 'luca@example.com',
        username: 'lucaa',
        password: 'hashedpassword',
        birthdate: '2000-01-01',
        bio: 'Bio de prueba',
        avatarUrl: '',
        role: 'usuario',
        isActive: true,
      }),
    };

    vi.spyOn(mockUsersService, 'create').mockResolvedValue(mockSavedUser as any);

    const result = await authService.register({
      firstName: 'Luca',
      lastName: 'Areco',
      email: 'luca@example.com',
      username: 'lucaa',
      password: 'Password123',
      birthdate: '2000-01-01',
      bio: 'Bio de prueba',
    });

    expect(result.username).toBe('lucaa');
    expect(result.email).toBe('luca@example.com');
    expect((result as any).password).toBeUndefined();
  });

  it('debe fallar si el email ya existe', async () => {
    vi.spyOn(mockUsersService, 'findByEmail').mockResolvedValue({ id: '1' } as any);

    await expect(
      authService.register({
        firstName: 'Luca',
        lastName: 'Areco',
        email: 'luca@example.com',
        username: 'lucaa',
        password: 'Password123',
        birthdate: '2000-01-01',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe autenticar credenciales correctas en login', async () => {
    const hashedPassword = await bcrypt.hash('Password123', 10);
    const mockUser = {
      _id: '123',
      email: 'luca@example.com',
      username: 'lucaa',
      password: hashedPassword,
      isActive: true,
      toObject: () => ({
        _id: '123',
        email: 'luca@example.com',
        username: 'lucaa',
        password: hashedPassword,
        isActive: true,
      }),
    };

    vi.spyOn(mockUsersService, 'findByIdentifier').mockResolvedValue(mockUser as any);

    const result = await authService.login({
      identifier: 'lucaa',
      password: 'Password123',
    });

    expect(result.username).toBe('lucaa');
    expect((result as any).password).toBeUndefined();
  });

  it('debe rechazar login si la contraseña es incorrecta', async () => {
    const hashedPassword = await bcrypt.hash('Password123', 10);
    const mockUser = {
      _id: '123',
      email: 'luca@example.com',
      username: 'lucaa',
      password: hashedPassword,
      isActive: true,
      toObject: () => mockUser,
    };

    vi.spyOn(mockUsersService, 'findByIdentifier').mockResolvedValue(mockUser as any);

    await expect(
      authService.login({
        identifier: 'lucaa',
        password: 'WrongPassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});

