import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

interface PostItem {
  _id: string;
  title: string;
  message: string;
  imageUrl?: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl?: string;
  };
  likes?: string[];
  createdAt: string;
}

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.css',
})
export class PostsComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);

  readonly posts = signal<PostItem[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly sortOrder = signal<'recent' | 'likes'>('recent');

  ngOnInit(): void {
    this.fetchPosts();
  }

  fetchPosts(): void {
    this.isLoading.set(true);
    this.http.get<PostItem[]>('http://localhost:3000/posts').subscribe({
      next: (data) => {
        this.isLoading.set(false);
        this.posts.set(data || []);
      },
      error: () => {
        this.isLoading.set(false);
        // En caso de que la base aún no tenga publicaciones, mostramos lista vacía
        this.posts.set([]);
      },
    });
  }

  setSortOrder(order: 'recent' | 'likes'): void {
    this.sortOrder.set(order);
  }
}
