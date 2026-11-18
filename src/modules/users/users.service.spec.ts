import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  function MockUserModel(data: any) {
    Object.assign(this, data);
    this.save = vi.fn().mockResolvedValue({ _id: 'new_id', ...data });
  }

  const mockUserModel: any = MockUserModel;

  mockUserModel.find = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([
          { _id: '1', username: 'lucaa', isActive: true },
        ]),
      }),
    }),
  });

  mockUserModel.findOne = vi.fn().mockReturnValue({
    exec: vi.fn().mockResolvedValue(null),
  });

  mockUserModel.findById = vi.fn().mockReturnValue({
    exec: vi.fn().mockResolvedValue({ _id: '1', username: 'lucaa' }),
  });

  mockUserModel.findByIdAndUpdate = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: '1', username: 'lucaa', isActive: false }),
    }),
  });

  const service = new UsersService(mockUserModel);

  it('debe listar todos los usuarios', async () => {
    const users = await service.findAll();
    expect(users).toHaveLength(1);
    expect(users[0].username).toBe('lucaa');
  });

  it('debe crear un usuario como administrador', async () => {
    const newUser = await service.createAdminUser({
      firstName: 'Admin',
      lastName: 'Trama',
      email: 'admin@trama.com',
      username: 'admintrama',
      password: 'Password123',
      birthdate: '1995-05-15',
      role: 'administrador',
    });

    expect(newUser.username).toBe('admintrama');
    expect(newUser.role).toBe('administrador');
  });

  it('debe cambiar el estado activo/deshabilitado de un usuario', async () => {
    const updated = await service.setUserActiveStatus('507f1f77bcf86cd799439011', false);
    expect(updated.isActive).toBe(false);
  });

  it('debe rechazar un identificador inválido al cambiar estado', async () => {
    await expect(service.setUserActiveStatus('invalid-id', false)).rejects.toThrow(
      BadRequestException,
    );
  });
});
