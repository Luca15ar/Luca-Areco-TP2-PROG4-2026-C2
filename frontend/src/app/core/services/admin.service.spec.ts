import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe obtener la lista de usuarios', () => {
    const mockUsers = [{ _id: '1', username: 'lucaa' }];

    service.getUsers().subscribe((users) => {
      expect(users).toHaveLength(1);
      expect(users[0].username).toBe('lucaa');
    });

    const req = httpTesting.expectOne((r) => r.url.endsWith('/api/users'));
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('debe deshabilitar un usuario mediante DELETE', () => {
    service.disableUser('123').subscribe((res) => {
      expect(res.message).toBe('Usuario deshabilitado');
    });

    const req = httpTesting.expectOne((r) => r.url.endsWith('/api/users/123'));
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Usuario deshabilitado' });
  });

  it('debe rehabilitar un usuario mediante POST', () => {
    service.reactivateUser('123').subscribe((res) => {
      expect(res.message).toBe('Usuario rehabilitado');
    });

    const req = httpTesting.expectOne((r) =>
      r.url.endsWith('/api/users/123/reactivate'),
    );
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Usuario rehabilitado' });
  });

  it('debe consultar publicaciones por usuario con filtros de fechas', () => {
    service.getPostsByUser('2026-01-01', '2026-01-31').subscribe((res) => {
      expect(res.totalPosts).toBe(5);
    });

    const req = httpTesting.expectOne((r) =>
      r.url.endsWith('/api/stats/posts-by-user'),
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('startDate')).toBe('2026-01-01');
    expect(req.request.params.get('endDate')).toBe('2026-01-31');
    req.flush({ totalPosts: 5, users: [] });
  });
});
