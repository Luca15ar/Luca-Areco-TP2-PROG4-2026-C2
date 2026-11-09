import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post, PostsResponse } from '../models/post.model';

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
export class PostsService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = getBaseApiUrl();

  getPosts(params: {
    limit?: number;
    offset?: number;
    page?: number;
    sort?: 'date' | 'recent' | 'likes';
    authorId?: string;
  }): Observable<PostsResponse> {
    let httpParams = new HttpParams();
    if (params.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.offset !== undefined) {
      httpParams = httpParams.set('offset', params.offset.toString());
    }
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    if (params.authorId) {
      httpParams = httpParams.set('authorId', params.authorId);
    }
    return this.http.get<PostsResponse>(`${this.API_URL}/posts`, { params: httpParams });
  }

  getUserPosts(authorId: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.API_URL}/posts/user/${authorId}`);
  }

  getPostById(id: string): Observable<Post> {
    return this.http.get<Post>(`${this.API_URL}/posts/${id}`);
  }

  createPost(formData: FormData): Observable<Post> {
    return this.http.post<Post>(`${this.API_URL}/posts`, formData);
  }

  deletePost(id: string, userId: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(
      `${this.API_URL}/posts/${id}?userId=${encodeURIComponent(userId)}`,
    );
  }

  likePost(
    id: string,
    userId: string,
  ): Observable<{ message: string; likesCount: number; isLiked: boolean }> {
    return this.http.post<{ message: string; likesCount: number; isLiked: boolean }>(
      `${this.API_URL}/posts/${id}/like`,
      { userId },
    );
  }

  unlikePost(
    id: string,
    userId: string,
  ): Observable<{ message: string; likesCount: number; isLiked: boolean }> {
    return this.http.delete<{ message: string; likesCount: number; isLiked: boolean }>(
      `${this.API_URL}/posts/${id}/like?userId=${encodeURIComponent(userId)}`,
      { body: { userId } },
    );
  }
}
