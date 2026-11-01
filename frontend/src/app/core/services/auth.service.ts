import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000';
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
    if (avatarPath.startsWith('http')) {
      return avatarPath;
    }
    return `${this.API_URL}${avatarPath}`;
  }

  private getStoredUser(): User | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(this.USER_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as User;
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}
