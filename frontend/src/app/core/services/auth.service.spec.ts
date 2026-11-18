import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { User, AuthResponse } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser: User = {
    _id: '123',
    firstName: 'Luca',
    lastName: 'Areco',
    email: 'luca@example.com',
    username: 'lucaa',
    birthdate: '2000-01-01',
    role: 'usuario',
    isActive: true,
  };

  const mockAuthResponse: AuthResponse = {
    user: mockUser,
    token: 'fake.jwt.token',
  };

  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {}
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    try {
      localStorage.clear();
    } catch {}
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe almacenar y recuperar la sesión y el token correctamente', () => {
    service.setSession(mockAuthResponse);
    expect(service.currentUser()?.username).toBe('lucaa');
    expect(service.getToken()).toBe('fake.jwt.token');
    expect(service.isLoggedIn()).toBe(true);
  });

  it('debe limpiar usuario y token al cerrar sesión', () => {
    service.setSession(mockAuthResponse);
    service.logout();
    expect(service.currentUser()).toBeNull();
    expect(service.getToken()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });
});
