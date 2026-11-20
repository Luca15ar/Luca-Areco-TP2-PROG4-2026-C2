import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Post } from '../../../core/models/post.model';
import { ImageFallbackDirective } from '../../directives/image-fallback.directive';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [RouterLink, ImageFallbackDirective],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.css'],
})
export class PostCardComponent {
  readonly post = input.required<Post>();
  readonly currentUserId = input<string | null>(null);
  readonly isAdmin = input<boolean>(false);

  readonly likeToggle = output<Post>();
  readonly deleteRequest = output<Post>();

  readonly menuOpen = signal(false);
  readonly isUnliking = signal(false);

  readonly isLiked = computed(() => {
    const userId = this.currentUserId();
    if (!userId) return false;
    const likes = this.post().likes || [];
    return likes.some((id) => (typeof id === 'string' ? id : (id as any)._id) === userId);
  });

  readonly canDelete = computed(() => {
    const userId = this.currentUserId();
    if (!userId) return false;
    const author = this.post().author;
    const authorId = typeof author === 'string' ? author : author?._id;
    return authorId === userId || this.isAdmin();
  });

  readonly authorFullName = computed(() => {
    const author = this.post().author;
    if (!author) return 'Autor anónimo';
    return `${author.firstName} ${author.lastName}`.trim();
  });

  readonly authorInitial = computed(() => {
    const author = this.post().author;
    if (author?.firstName) {
      return author.firstName.charAt(0).toUpperCase();
    }
    return 'T';
  });

  readonly formattedDate = computed(() => {
    const rawDate = this.post().createdAt;
    if (!rawDate) return '';
    try {
      const date = new Date(rawDate);
      return new Intl.DateTimeFormat('es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
        .format(date)
        .toUpperCase();
    } catch {
      return rawDate;
    }
  });

  readonly isLongStory = computed(() => {
    const raw = (this.post().content || this.post().message || '').trim();
    return raw.length > 220;
  });

  readonly truncatedExcerpt = computed(() => {
    const raw = (this.post().content || this.post().message || '').trim();
    const MAX_LENGTH = 220;
    if (raw.length <= MAX_LENGTH) {
      return raw;
    }
    const truncated = raw.substring(0, MAX_LENGTH);
    const lastSpace = truncated.lastIndexOf(' ');
    const cleanCut =
      lastSpace > 150 ? truncated.substring(0, lastSpace) : truncated;
    return `${cleanCut}...`;
  });

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  onLike(): void {
    if (this.isLiked()) {
      this.isUnliking.set(true);
      setTimeout(() => this.isUnliking.set(false), 500);
    }
    this.likeToggle.emit(this.post());
  }

  onDelete(): void {
    this.menuOpen.set(false);
    this.deleteRequest.emit(this.post());
  }
}
