import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsersService: Partial<UsersService>;
  let mockCloudinaryService: Partial<CloudinaryService>;
  let mockJwtService: Partial<JwtService>;

  beforeEach(() => {
    mockUsersService = {
      findByEmail: vi.fn(),
      findByUsername: vi.fn(),
      findByIdentifier: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
    };
    mockCloudinaryService = {
      uploadFile: vi.fn().mockResolvedValue('https://res.cloudinary.com/demo/image/upload/sample.jpg'),
    };
    mockJwtService = {
      signAsync: vi.fn().mockResolvedValue('mocked.jwt.token'),
      verifyAsync: vi.fn().mockResolvedValue({
        sub: '123',
        email: 'luca@example.com',
        username: 'lucaa',
        role: 'usuario',
      }),
    };
    authService = new AuthService(
      mockUsersService as UsersService,
      mockCloudinaryService as CloudinaryService,
      mockJwtService as JwtService,
    );
  });

  it('debe registrar un usuario exitosamente con contraseña encriptada y token', async () => {
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

    vi.spyOn(mockUsersService, 'create').mockResolvedValue(
      mockSavedUser as any,
    );

    const result = await authService.register({
      firstName: 'Luca',
      lastName: 'Areco',
      email: 'luca@example.com',
      username: 'lucaa',
      password: 'Password123',
      birthdate: '2000-01-01',
      bio: 'Bio de prueba',
    });

    expect(result.user.username).toBe('lucaa');
    expect(result.user.email).toBe('luca@example.com');
    expect((result.user as any).password).toBeUndefined();
    expect(result.token).toBe('mocked.jwt.token');
  });

  it('debe fallar si el email ya existe', async () => {
    vi.spyOn(mockUsersService, 'findByEmail').mockResolvedValue({
      id: '1',
    } as any);

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

  it('debe autenticar credenciales correctas en login y retornar token', async () => {
    const hashedPassword = await bcrypt.hash('Password123', 10);
    const mockUser = {
      _id: '123',
      email: 'luca@example.com',
      username: 'lucaa',
      password: hashedPassword,
      role: 'usuario',
      isActive: true,
      toObject: () => ({
        _id: '123',
        email: 'luca@example.com',
        username: 'lucaa',
        password: hashedPassword,
        role: 'usuario',
        isActive: true,
      }),
    };

    vi.spyOn(mockUsersService, 'findByIdentifier').mockResolvedValue(
      mockUser as any,
    );

    const result = await authService.login({
      identifier: 'lucaa',
      password: 'Password123',
    });

    expect(result.user.username).toBe('lucaa');
    expect((result.user as any).password).toBeUndefined();
    expect(result.token).toBe('mocked.jwt.token');
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

    vi.spyOn(mockUsersService, 'findByIdentifier').mockResolvedValue(
      mockUser as any,
    );

    await expect(
      authService.login({
        identifier: 'lucaa',
        password: 'WrongPassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debe autorizar un token válido y devolver el usuario', async () => {
    const mockUser = {
      _id: '123',
      email: 'luca@example.com',
      username: 'lucaa',
      role: 'usuario',
      isActive: true,
      toObject: () => ({
        _id: '123',
        email: 'luca@example.com',
        username: 'lucaa',
        role: 'usuario',
        isActive: true,
      }),
    };

    vi.spyOn(mockUsersService, 'findById').mockResolvedValue(mockUser as any);

    const result = await authService.authorize('valid.token');
    expect(result.username).toBe('lucaa');
    expect(result.email).toBe('luca@example.com');
  });

  it('debe rechazar authorize si el token no es provisto o es inválido', async () => {
    await expect(authService.authorize(undefined)).rejects.toThrow(UnauthorizedException);

    vi.spyOn(mockJwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid token'));
    await expect(authService.authorize('invalid.token')).rejects.toThrow(UnauthorizedException);
  });

  it('debe refrescar un token válido y retornar uno nuevo', async () => {
    const mockUser = {
      _id: '123',
      email: 'luca@example.com',
      username: 'lucaa',
      role: 'usuario',
      isActive: true,
      toObject: () => ({
        _id: '123',
        email: 'luca@example.com',
        username: 'lucaa',
        role: 'usuario',
        isActive: true,
      }),
    };

    vi.spyOn(mockUsersService, 'findById').mockResolvedValue(mockUser as any);
    vi.spyOn(mockJwtService, 'signAsync').mockResolvedValue('new.mocked.jwt.token');

    const result = await authService.refreshToken('old.valid.token');
    expect(result.token).toBe('new.mocked.jwt.token');
  });

  it('debe permitir refrescar enviando userId si el token fue emitido previamente', async () => {
    const mockUser = {
      _id: '123',
      email: 'luca@example.com',
      username: 'lucaa',
      role: 'usuario',
      isActive: true,
      toObject: () => ({
        _id: '123',
        email: 'luca@example.com',
        username: 'lucaa',
        role: 'usuario',
        isActive: true,
      }),
    };

    vi.spyOn(mockUsersService, 'findById').mockResolvedValue(mockUser as any);
    vi.spyOn(mockJwtService, 'signAsync').mockResolvedValue('fallback.jwt.token');

    const result = await authService.refreshToken(undefined, '123');
    expect(result.token).toBe('fallback.jwt.token');
  });
});
