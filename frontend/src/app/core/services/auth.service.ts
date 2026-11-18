import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User, AuthResponse } from '../models/user.model';

declare const process: { env?: Record<string, string | undefined> } | undefined;

function getBaseApiUrl(): string {
  if (typeof process !== 'undefined' && process?.env?.['BACKEND_URL']) {
    return process.env['BACKEND_URL'].replace(/\/$/, '');
  }
  if (
    typeof window !== 'undefined' &&
    window.location?.origin &&
    !window.location.origin.includes(':4200')
  ) {
    return '';
  }
  return 'http://localhost:3000';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = getBaseApiUrl();
  private readonly USER_KEY = 'trama_current_user';
  private readonly TOKEN_KEY = 'trama_token';

  readonly currentUser = signal<User | null>(this.getStoredUser());
  readonly currentToken = signal<string | null>(this.getStoredToken());
  readonly isLoggedIn = computed(() => !!this.currentUser() && !!this.currentToken());
  readonly isAdmin = computed(() => this.currentUser()?.role === 'administrador');

  getToken(): string | null {
    if (this.currentToken()) {
      return this.currentToken();
    }
    return this.getStoredToken();
  }

  setToken(token: string): void {
    this.currentToken.set(token);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  setCurrentUser(user: User): void {
    this.currentUser.set(user);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  setSession(authRes: AuthResponse): void {
    this.setCurrentUser(authRes.user);
    this.setToken(authRes.token);
  }

  register(formData: FormData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/api/auth/register`, formData).pipe(
      tap((res) => {
        this.setSession(res);
      }),
    );
  }

  login(credentials: { identifier: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/api/auth/login`, credentials).pipe(
      tap((res) => {
        this.setSession(res);
      }),
    );
  }

  authorize(token?: string): Observable<User> {
    const activeToken = token || this.getToken();
    const headers = activeToken ? new HttpHeaders({ Authorization: `Bearer ${activeToken}` }) : undefined;
    return this.http.post<User>(`${this.API_URL}/api/auth/authorize`, { token: activeToken }, { headers }).pipe(
      tap((user) => {
        this.setCurrentUser(user);
      }),
    );
  }

  refreshToken(): Observable<{ token: string }> {
    const activeToken = this.getToken();
    const currentUserId = this.currentUser()?._id;
    const headers = activeToken ? new HttpHeaders({ Authorization: `Bearer ${activeToken}` }) : undefined;
    return this.http.post<{ token: string }>(
      `${this.API_URL}/api/auth/refresh`,
      { token: activeToken, userId: currentUserId },
      { headers },
    ).pipe(
      tap((res) => {
        if (res.token) {
          this.setToken(res.token);
        }
      }),
    );
  }

  updateProfile(userId: string, formData: FormData): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/api/users/${userId}`, formData).pipe(
      tap((user) => {
        this.setCurrentUser(user);
      }),
    );
  }

  logout(): void {
    this.currentUser.set(null);
    this.currentToken.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  getAvatarUrl(avatarPath?: string): string {
    if (!avatarPath) {
      return '';
    }
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return avatarPath;
    }
    return `${this.API_URL}${avatarPath}`;
  }

  private getStoredUser(): User | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const stored = localStorage.getItem(this.USER_KEY);
    if (!stored) {
      return null;
    }
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  }

  private getStoredToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
