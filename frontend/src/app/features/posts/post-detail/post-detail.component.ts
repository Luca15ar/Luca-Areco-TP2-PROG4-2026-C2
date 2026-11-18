import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostsService } from '../../../core/services/posts.service';
import { AuthService } from '../../../core/services/auth.service';
import { Post, PostComment } from '../../../core/models/post.model';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.css',
})
export class PostDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly postsService = inject(PostsService);
  private readonly authService = inject(AuthService);

  readonly post = signal<Post | null>(null);
  readonly comments = signal<PostComment[]>([]);
  readonly totalComments = signal<number>(0);
  readonly commentsLimit = signal<number>(5);
  readonly commentsOffset = signal<number>(0);
  readonly hasMoreComments = signal<boolean>(false);

  readonly isLoadingPost = signal<boolean>(true);
  readonly isLoadingComments = signal<boolean>(false);
  readonly isAddingComment = signal<boolean>(false);
  readonly isSavingComment = signal<boolean>(false);
  readonly isUnliking = signal<boolean>(false);

  readonly postErrorMessage = signal<string | null>(null);
  readonly commentErrorMessage = signal<string | null>(null);
  readonly editErrorMessage = signal<string | null>(null);

  readonly newCommentText = signal<string>('');
  readonly editingCommentId = signal<string | null>(null);
  readonly editingCommentText = signal<string>('');

  readonly currentUser = this.authService.currentUser;
  readonly currentUserId = computed(() => this.currentUser()?._id || null);

  readonly isLiked = computed(() => {
    const userId = this.currentUserId();
    const currentPost = this.post();
    if (!userId || !currentPost) return false;
    const likes = currentPost.likes || [];
    return likes.some((id) => (typeof id === 'string' ? id : (id as any)._id) === userId);
  });

  readonly authorFullName = computed(() => {
    const author = this.post()?.author;
    if (!author) return 'Autor anónimo';
    return `${author.firstName} ${author.lastName}`.trim();
  });

  readonly authorInitial = computed(() => {
    const author = this.post()?.author;
    if (author?.firstName) {
      return author.firstName.charAt(0).toUpperCase();
    }
    return 'T';
  });

  readonly currentUserInitial = computed(() => {
    const user = this.currentUser();
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    return 'T';
  });

  readonly formattedDate = computed(() => {
    const rawDate = this.post()?.createdAt;
    if (!rawDate) return '';
    try {
      const date = new Date(rawDate);
      return new Intl.DateTimeFormat('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    } catch {
      return rawDate;
    }
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadPost(id);
      } else {
        this.router.navigate(['/posts']);
      }
    });
  }

  loadPost(id: string): void {
    this.isLoadingPost.set(true);
    this.postErrorMessage.set(null);

    this.postsService.getPostById(id).subscribe({
      next: (postData) => {
        this.post.set(postData);
        this.isLoadingPost.set(false);
        this.commentsOffset.set(0);
        this.loadComments(id, true);
      },
      error: () => {
        this.isLoadingPost.set(false);
        this.postErrorMessage.set('No se pudo encontrar la historia solicitada.');
      },
    });
  }

  loadComments(postId: string, reset = false): void {
    this.isLoadingComments.set(true);
    this.commentErrorMessage.set(null);

    const offset = reset ? 0 : this.commentsOffset();
    const limit = this.commentsLimit();

    this.postsService.getComments(postId, { limit, offset }).subscribe({
      next: (res) => {
        this.isLoadingComments.set(false);
        if (reset) {
          this.comments.set(res.comments);
        } else {
          this.comments.update((prev) => [...prev, ...res.comments]);
        }
        this.totalComments.set(res.total);
        this.hasMoreComments.set(res.hasMore);
        this.commentsOffset.set(offset + res.comments.length);
      },
      error: () => {
        this.isLoadingComments.set(false);
        this.commentErrorMessage.set('No se pudieron cargar los comentarios.');
      },
    });
  }

  loadMoreComments(): void {
    const currentPost = this.post();
    if (!currentPost || this.isLoadingComments()) return;
    this.loadComments(currentPost._id, false);
  }

  handleLike(): void {
    const currentPost = this.post();
    const userId = this.currentUserId();
    if (!currentPost || !userId) return;

    if (this.isLiked()) {
      this.isUnliking.set(true);
      setTimeout(() => this.isUnliking.set(false), 500);
      this.postsService.unlikePost(currentPost._id, userId).subscribe({
        next: () => {
          this.post.update((p) => {
            if (!p) return null;
            return {
              ...p,
              likes: p.likes.filter(
                (likeId) =>
                  likeId !== userId &&
                  (typeof likeId === 'object' && (likeId as any)._id !== userId),
              ),
            };
          });
        },
      });
    } else {
      this.postsService.likePost(currentPost._id, userId).subscribe({
        next: () => {
          this.post.update((p) => {
            if (!p) return null;
            return {
              ...p,
              likes: [...p.likes, userId],
            };
          });
        },
      });
    }
  }

  submitComment(): void {
    const text = this.newCommentText().trim();
    const currentPost = this.post();
    const userId = this.currentUserId();

    if (!text || text.length < 2) {
      this.commentErrorMessage.set('El comentario debe contener al menos 2 caracteres.');
      return;
    }

    if (!currentPost || !userId) {
      this.commentErrorMessage.set('Debes iniciar sesión para comentar.');
      return;
    }

    this.isAddingComment.set(true);
    this.commentErrorMessage.set(null);

    this.postsService.addComment(currentPost._id, text, userId).subscribe({
      next: (newComment) => {
        this.isAddingComment.set(false);
        this.newCommentText.set('');
        // Prepend new comment to current list
        this.comments.update((prev) => [newComment, ...prev]);
        this.totalComments.update((t) => t + 1);
        this.commentsOffset.update((o) => o + 1);
      },
      error: (err) => {
        this.isAddingComment.set(false);
        const msg = err.error?.message || 'No se pudo publicar el comentario.';
        this.commentErrorMessage.set(msg);
      },
    });
  }

  startEditComment(comment: PostComment): void {
    if (!comment._id) return;
    this.editingCommentId.set(comment._id);
    this.editingCommentText.set(comment.message);
    this.editErrorMessage.set(null);
  }

  cancelEditComment(): void {
    this.editingCommentId.set(null);
    this.editingCommentText.set('');
    this.editErrorMessage.set(null);
  }

  saveEditComment(commentId: string): void {
    const currentPost = this.post();
    const userId = this.currentUserId();
    const text = this.editingCommentText().trim();

    if (!text || text.length < 2) {
      this.editErrorMessage.set('El comentario debe contener al menos 2 caracteres.');
      return;
    }

    if (!currentPost || !userId) return;

    this.isSavingComment.set(true);
    this.editErrorMessage.set(null);

    this.postsService.updateComment(currentPost._id, commentId, text, userId).subscribe({
      next: (updated) => {
        this.isSavingComment.set(false);
        this.editingCommentId.set(null);
        this.editingCommentText.set('');

        this.comments.update((list) =>
          list.map((c) =>
            c._id === commentId
              ? {
                  ...c,
                  message: updated.message,
                  isEdited: true,
                }
              : c,
          ),
        );
      },
      error: (err) => {
        this.isSavingComment.set(false);
        const msg = err.error?.message || 'No se pudo actualizar el comentario.';
        this.editErrorMessage.set(msg);
      },
    });
  }

  isCommentAuthor(comment: PostComment): boolean {
    const userId = this.currentUserId();
    if (!userId || !comment.author) return false;
    const authorId =
      typeof comment.author === 'string'
        ? comment.author
        : comment.author._id;
    return authorId === userId;
  }

  formatCommentDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSec < 60) return 'Hace un momento';
      if (diffMin < 60) return `Hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
      if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays} días`;

      return new Intl.DateTimeFormat('es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateStr;
    }
  }
}
