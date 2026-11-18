import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

export interface PostsByUserStat {
  totalPosts: number;
  users: { userId: string; username: string; name: string; count: number }[];
}

export interface CommentsTimelineStat {
  totalComments: number;
  timeline: { date: string; count: number }[];
}

export interface CommentsByPostStat {
  totalComments: number;
  posts: { postId: string; title: string; count: number }[];
}

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
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = getBaseApiUrl();

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/api/users`);
  }

  createUser(formData: FormData): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/api/users`, formData);
  }

  disableUser(id: string): Observable<{ message: string; user: any }> {
    return this.http.delete<{ message: string; user: any }>(
      `${this.API_URL}/api/users/${id}`,
    );
  }

  reactivateUser(id: string): Observable<{ message: string; user: any }> {
    return this.http.post<{ message: string; user: any }>(
      `${this.API_URL}/api/users/${id}/reactivate`,
      {},
    );
  }

  getPostsByUser(startDate?: string, endDate?: string): Observable<PostsByUserStat> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<PostsByUserStat>(
      `${this.API_URL}/api/stats/posts-by-user`,
      { params },
    );
  }

  getCommentsTimeline(startDate?: string, endDate?: string): Observable<CommentsTimelineStat> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<CommentsTimelineStat>(
      `${this.API_URL}/api/stats/comments-timeline`,
      { params },
    );
  }

  getCommentsByPost(startDate?: string, endDate?: string): Observable<CommentsByPostStat> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<CommentsByPostStat>(
      `${this.API_URL}/api/stats/comments-by-post`,
      { params },
    );
  }
}
