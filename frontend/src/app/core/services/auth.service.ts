import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

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

  readonly currentUser = signal<User | null>(this.getStoredUser());
  readonly isLoggedIn = computed(() => !!this.currentUser());
  readonly isAdmin = computed(() => this.currentUser()?.role === 'administrador');

  register(formData: FormData): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/auth/register`, formData).pipe(
      tap((user) => {
        this.setCurrentUser(user);
      }),
    );
  }

  login(credentials: { identifier: string; password: string }): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap((user) => {
        this.setCurrentUser(user);
      }),
    );
  }

  setCurrentUser(user: User): void {
    this.currentUser.set(user);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  logout(): void {
    this.currentUser.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.USER_KEY);
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
}
