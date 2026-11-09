import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { PostsService } from '../../core/services/posts.service';
import { Post } from '../../core/models/post.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly postsService = inject(PostsService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly user = this.authService.currentUser;
  readonly userPosts = signal<Post[]>([]);
  readonly isLoadingPosts = signal<boolean>(false);

  // Modal de confirmación de eliminación
  readonly postToDelete = signal<Post | null>(null);
  readonly isDeleting = signal<boolean>(false);

  // Modal de edición de perfil
  readonly isEditModalOpen = signal<boolean>(false);
  readonly isSavingProfile = signal<boolean>(false);
  readonly editErrorMessage = signal<string | null>(null);
  readonly editImagePreview = signal<string | null>(null);
  selectedAvatarFile: File | null = null;

  readonly editForm = this.fb.group({
    firstName: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/),
      ],
    ],
    lastName: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/),
      ],
    ],
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[a-zA-Z0-9_.-]+$/),
      ],
    ],
    birthdate: ['', [Validators.required]],
    bio: [''],
  });

  readonly fullName = computed(() => {
    const u = this.user();
    if (!u) return '';
    return `${u.firstName} ${u.lastName}`.trim();
  });

  readonly userInitial = computed(() => {
    const u = this.user();
    if (u?.firstName) {
      return u.firstName.charAt(0).toUpperCase();
    }
    return 'T';
  });

  readonly formattedPostCount = computed(() => {
    const count = this.userPosts().length;
    return count < 10 ? `0${count}` : `${count}`;
  });

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
        .format(date)
        .toUpperCase();
    } catch {
      return dateStr;
    }
  }

  openEditModal(): void {
    const u = this.user();
    if (!u) return;

    let birthFormatted = '';
    if (u.birthdate) {
      birthFormatted = u.birthdate.split('T')[0];
    }

    this.editForm.reset({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      username: u.username || '',
      birthdate: birthFormatted,
      bio: u.bio || '',
    });

    this.editErrorMessage.set(null);
    this.editImagePreview.set(
      u.avatarUrl ? this.authService.getAvatarUrl(u.avatarUrl) : null,
    );
    this.selectedAvatarFile = null;
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    if (this.isSavingProfile()) return;
    this.isEditModalOpen.set(false);
    this.editErrorMessage.set(null);
    this.selectedAvatarFile = null;
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp|gif)$/i)) {
        this.editErrorMessage.set(
          'Solo se permiten archivos de imagen (JPG, PNG, WebP o GIF).',
        );
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.editErrorMessage.set('La imagen de perfil no debe superar los 5 MB.');
        return;
      }
      this.selectedAvatarFile = file;
      this.editErrorMessage.set(null);
      const reader = new FileReader();
      reader.onload = () => this.editImagePreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  saveProfile(): void {
    if (this.editForm.invalid) {
      this.editErrorMessage.set(
        'Por favor, revisa los datos ingresados en el formulario.',
      );
      this.editForm.markAllAsTouched();
      return;
    }

    const u = this.user();
    if (!u) return;

    this.isSavingProfile.set(true);
    this.editErrorMessage.set(null);

    const formValues = this.editForm.value;
    const formData = new FormData();

    if (formValues.firstName) {
      formData.append('firstName', formValues.firstName.trim());
    }
    if (formValues.lastName) {
      formData.append('lastName', formValues.lastName.trim());
    }
    if (formValues.username) {
      formData.append('username', formValues.username.toLowerCase().trim());
    }
    if (formValues.birthdate) {
      formData.append('birthdate', formValues.birthdate);
    }
    if (formValues.bio !== undefined && formValues.bio !== null) {
      formData.append('bio', formValues.bio.trim());
    }
    if (this.selectedAvatarFile) {
      formData.append('avatar', this.selectedAvatarFile);
    }

    this.authService.updateProfile(u._id, formData).subscribe({
      next: () => {
        this.isSavingProfile.set(false);
        this.isEditModalOpen.set(false);
        this.selectedAvatarFile = null;
      },
      error: (err) => {
        this.isSavingProfile.set(false);
        const backendMessage =
          err?.error?.message ||
          (Array.isArray(err?.error?.message)
            ? err.error.message.join(', ')
            : null);
        this.editErrorMessage.set(
          backendMessage ||
            'Ocurrió un error al actualizar los datos del perfil.',
        );
      },
    });
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
    if (!this.user()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadUserRecentPosts();
  }

  loadUserRecentPosts(): void {
    const u = this.user();
    if (!u) return;

    this.isLoadingPosts.set(true);

    this.postsService.getUserPosts(u._id).subscribe({
      next: (posts) => {
        this.userPosts.set(posts);
        this.isLoadingPosts.set(false);
      },
      error: () => {
        this.postsService
          .getPosts({
            authorId: u._id,
            limit: 3,
            sort: 'date',
          })
          .subscribe({
            next: (res) => {
              this.userPosts.set(res.posts);
              this.isLoadingPosts.set(false);
            },
            error: () => {
              this.isLoadingPosts.set(false);
            },
          });
      },
    });
  }

  handleLike(post: Post): void {
    const u = this.user();
    if (!u) return;

    const likes = post.likes || [];
    const isLiked = likes.some(
      (id) => (typeof id === 'string' ? id : (id as any)._id) === u._id,
    );

    if (isLiked) {
      this.postsService.unlikePost(post._id, u._id).subscribe({
        next: () => {
          this.userPosts.update((list) =>
            list.map((p) =>
              p._id === post._id
                ? {
                    ...p,
                    likes: p.likes.filter(
                      (id) => (typeof id === 'string' ? id : (id as any)._id) !== u._id,
                    ),
                  }
                : p,
            ),
          );
        },
      });
    } else {
      this.postsService.likePost(post._id, u._id).subscribe({
        next: () => {
          this.userPosts.update((list) =>
            list.map((p) =>
              p._id === post._id ? { ...p, likes: [...p.likes, u._id] } : p,
            ),
          );
        },
      });
    }
  }

  openDeleteModal(post: Post): void {
    this.postToDelete.set(post);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) return;
    this.postToDelete.set(null);
  }

  confirmDelete(): void {
    const post = this.postToDelete();
    const u = this.user();
    if (!post || !u) return;

    this.isDeleting.set(true);

    this.postsService.deletePost(post._id, u._id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.postToDelete.set(null);
        this.userPosts.update((list) => list.filter((p) => p._id !== post._id));
      },
      error: () => {
        this.isDeleting.set(false);
        this.postToDelete.set(null);
      },
    });
  }
}
