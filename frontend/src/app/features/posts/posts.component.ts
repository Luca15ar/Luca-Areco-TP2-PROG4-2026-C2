import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PostsService } from '../../core/services/posts.service';
import { AuthService } from '../../core/services/auth.service';
import { Post } from '../../core/models/post.model';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [ReactiveFormsModule, PostCardComponent],
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.css'],
})
export class PostsComponent implements OnInit {
  private readonly postsService = inject(PostsService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly posts = signal<Post[]>([]);
  readonly total = signal<number>(0);
  readonly limit = signal<number>(6);
  readonly page = signal<number>(1);
  readonly currentSort = signal<'date' | 'likes'>('date');

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Modal de nueva publicación
  readonly isCreateModalOpen = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly modalErrorMessage = signal<string | null>(null);
  readonly imagePreview = signal<string | null>(null);
  selectedFile: File | null = null;

  readonly createForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    message: ['', [Validators.required, Validators.minLength(5)]],
  });

  // Modal de confirmación de eliminación
  readonly postToDelete = signal<Post | null>(null);
  readonly isDeleting = signal<boolean>(false);

  readonly currentUser = this.authService.currentUser;
  readonly currentUserId = computed(() => this.currentUser()?._id || null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'administrador');

  readonly totalPages = computed(() => {
    const t = this.total();
    const l = this.limit();
    return t > 0 ? Math.ceil(t / l) : 1;
  });

  ngOnInit(): void {
    if (!this.currentUser()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadPosts();
  }

  loadPosts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const offset = (this.page() - 1) * this.limit();

    this.postsService
      .getPosts({
        limit: this.limit(),
        offset,
        sort: this.currentSort(),
      })
      .subscribe({
        next: (res) => {
          this.posts.set(res.posts);
          this.total.set(res.total);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set(
            'Ocurrió un error al cargar las publicaciones. Por favor, intenta de nuevo.',
          );
          this.isLoading.set(false);
        },
      });
  }

  setSort(sort: 'date' | 'likes'): void {
    if (this.currentSort() === sort) return;
    this.currentSort.set(sort);
    this.page.set(1);
    this.loadPosts();
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadPosts();
      this.scrollToTop();
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadPosts();
      this.scrollToTop();
    }
  }

  private scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Creación de publicación
  openCreateModal(): void {
    this.createForm.reset();
    this.imagePreview.set(null);
    this.selectedFile = null;
    this.modalErrorMessage.set(null);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    if (this.isSubmitting()) return;
    this.isCreateModalOpen.set(false);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp|gif)$/i)) {
        this.modalErrorMessage.set(
          'Solo se permiten archivos de imagen (JPG, PNG, WebP o GIF).',
        );
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => this.imagePreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  removeSelectedImage(): void {
    this.selectedFile = null;
    this.imagePreview.set(null);
  }

  onSubmitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      this.modalErrorMessage.set(
        'Por favor, completa los campos requeridos con la longitud mínima.',
      );
      return;
    }

    const userId = this.currentUserId();
    if (!userId) {
      this.modalErrorMessage.set(
        'Debes iniciar sesión para realizar una publicación.',
      );
      return;
    }

    this.isSubmitting.set(true);
    this.modalErrorMessage.set(null);

    const formData = new FormData();
    const bodyText = this.createForm.value.message?.trim() || '';
    formData.append('title', this.createForm.value.title?.trim() || '');
    formData.append('message', bodyText);
    formData.append('content', bodyText);
    formData.append('author', userId);

    if (this.selectedFile) {
      formData.append('image', this.selectedFile, this.selectedFile.name);
    }

    this.postsService.createPost(formData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isCreateModalOpen.set(false);
        this.page.set(1);
        this.loadPosts();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message;
        if (typeof msg === 'string') {
          this.modalErrorMessage.set(msg);
        } else if (Array.isArray(msg)) {
          this.modalErrorMessage.set(msg.join(', '));
        } else {
          this.modalErrorMessage.set(
            'Ocurrió un error al crear la publicación. Intenta de nuevo.',
          );
        }
      },
    });
  }

  // Me gusta
  handleLike(post: Post): void {
    const userId = this.currentUserId();
    if (!userId) return;

    const likes = post.likes || [];
    const isLiked = likes.some(
      (id) => (typeof id === 'string' ? id : (id as any)._id) === userId,
    );

    if (isLiked) {
      this.postsService.unlikePost(post._id, userId).subscribe({
        next: () => {
          this.updatePostInList(post._id, (p) => ({
            ...p,
            likes: p.likes.filter(
              (id) =>
                (typeof id === 'string' ? id : (id as any)._id) !== userId,
            ),
          }));
        },
      });
    } else {
      this.postsService.likePost(post._id, userId).subscribe({
        next: () => {
          this.updatePostInList(post._id, (p) => ({
            ...p,
            likes: [...p.likes, userId],
          }));
        },
      });
    }
  }

  private updatePostInList(postId: string, updater: (p: Post) => Post): void {
    this.posts.update((list) =>
      list.map((post) => (post._id === postId ? updater(post) : post)),
    );
  }

  // Eliminación
  openDeleteModal(post: Post): void {
    this.postToDelete.set(post);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) return;
    this.postToDelete.set(null);
  }

  confirmDelete(): void {
    const post = this.postToDelete();
    const userId = this.currentUserId();
    if (!post || !userId) return;

    this.isDeleting.set(true);

    this.postsService.deletePost(post._id, userId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.postToDelete.set(null);
        // Remueve la publicación de la lista local
        this.posts.update((list) => list.filter((p) => p._id !== post._id));
        this.total.update((t) => Math.max(0, t - 1));
      },
      error: () => {
        this.isDeleting.set(false);
        this.postToDelete.set(null);
      },
    });
  }
}
