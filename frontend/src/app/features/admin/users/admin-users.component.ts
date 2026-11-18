import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { User, UserRole } from '../../../core/models/user.model';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { UserRoleBadgePipe } from '../../../shared/pipes/user-role-badge.pipe';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';
import { AutofocusDirective } from '../../../shared/directives/autofocus.directive';
import { ImageFallbackDirective } from '../../../shared/directives/image-fallback.directive';

const NAME_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RelativeTimePipe,
    UserRoleBadgePipe,
    ClickOutsideDirective,
    AutofocusDirective,
    ImageFallbackDirective,
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  constructor() {
    effect(() => {
      const isModalActive = this.isCreateModalOpen() || !!this.userToToggle();
      document.body.classList.toggle('modal-open', isModalActive);
      document.documentElement.classList.toggle('modal-open', isModalActive);
    });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
  }

  readonly users = signal<User[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Filtro de búsqueda
  readonly searchTerm = signal<string>('');

  // Modales
  readonly isCreateModalOpen = signal<boolean>(false);
  readonly userToToggle = signal<User | null>(null);
  readonly isTogglingStatus = signal<boolean>(false);

  // Formulario de creación
  readonly userForm: FormGroup = this.fb.group({
    firstName: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(25),
        Validators.pattern(NAME_PATTERN),
      ],
    ],
    lastName: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(25),
        Validators.pattern(NAME_PATTERN),
      ],
    ],
    email: ['', [Validators.required, Validators.email]],
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(15),
        Validators.pattern(/^[a-zA-Z0-9_.-]+$/),
      ],
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/),
      ],
    ],
    birthdate: ['', Validators.required],
    bio: [''],
    role: ['usuario' as UserRole, Validators.required],
  });

  selectedAvatarFile: File | null = null;
  readonly avatarPreview = signal<string | null>(null);

  // Estadísticas calculadas
  readonly totalUsersCount = computed(() => this.users().length);
  readonly activeUsersCount = computed(
    () => this.users().filter((u) => u.isActive).length,
  );
  readonly disabledUsersCount = computed(
    () => this.users().filter((u) => !u.isActive).length,
  );
  readonly adminUsersCount = computed(
    () => this.users().filter((u) => u.role === 'administrador').length,
  );

  // Usuarios filtrados
  readonly filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.users();

    return this.users().filter((u) => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      return (
        fullName.includes(term) ||
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    });
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminService.getUsers().subscribe({
      next: (list) => {
        this.users.set(list);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.message || 'No fue posible cargar el listado de usuarios.',
        );
        this.isLoading.set(false);
      },
    });
  }

  openCreateModal(): void {
    this.userForm.reset({ role: 'usuario' });
    this.selectedAvatarFile = null;
    this.avatarPreview.set(null);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp|gif)$/i)) {
        this.errorMessage.set('Solo se permiten archivos de imagen válidos.');
        return;
      }
      this.selectedAvatarFile = file;
      const reader = new FileReader();
      reader.onload = () => this.avatarPreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  removeAvatar(input?: HTMLInputElement): void {
    this.selectedAvatarFile = null;
    this.avatarPreview.set(null);
    if (input) input.value = '';
  }

  submitCreateUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const values = this.userForm.value;
    const formData = new FormData();
    formData.append('firstName', values.firstName.trim());
    formData.append('lastName', values.lastName.trim());
    formData.append('email', values.email.trim());
    formData.append('username', values.username.trim());
    formData.append('password', values.password);
    formData.append('birthdate', values.birthdate);
    formData.append('role', values.role);
    if (values.bio) {
      formData.append('bio', values.bio.trim());
    }
    if (this.selectedAvatarFile) {
      formData.append('avatar', this.selectedAvatarFile);
    }

    this.adminService.createUser(formData).subscribe({
      next: (newUser) => {
        this.users.update((curr) => [newUser, ...curr]);
        this.isSubmitting.set(false);
        this.closeCreateModal();
        this.successMessage.set(
          `Usuario @${newUser.username} creado correctamente.`,
        );
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err?.error?.message || 'Error al registrar el nuevo usuario.',
        );
      },
    });
  }

  confirmToggleStatus(user: User): void {
    this.userToToggle.set(user);
  }

  cancelToggleStatus(): void {
    if (this.isTogglingStatus()) return;
    this.userToToggle.set(null);
  }

  executeToggleStatus(): void {
    const user = this.userToToggle();
    if (!user || this.isTogglingStatus()) return;

    this.isTogglingStatus.set(true);
    const newStatus = !user.isActive;
    const request$ = newStatus
      ? this.adminService.reactivateUser(user._id)
      : this.adminService.disableUser(user._id);

    request$.subscribe({
      next: () => {
        this.isTogglingStatus.set(false);
        this.users.update((list) =>
          list.map((u) => (u._id === user._id ? { ...u, isActive: newStatus } : u)),
        );
        this.cancelToggleStatus();
        this.successMessage.set(
          newStatus
            ? `La cuenta de @${user.username} ha sido rehabilitada.`
            : `La cuenta de @${user.username} ha sido deshabilitada.`,
        );
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: (err) => {
        this.isTogglingStatus.set(false);
        this.errorMessage.set(
          err?.error?.message || 'No fue posible actualizar el estado del usuario.',
        );
        this.cancelToggleStatus();
      },
    });
  }
}
