import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

export const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly registerForm: FormGroup = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern(/^[a-zA-Z0-9_.-]+$/),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/(?=.*[A-Z])(?=.*\d)/),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
      birthdate: ['', [Validators.required]],
      bio: [''],
    },
    { validators: passwordMatchValidator },
  );

  readonly showPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);
  readonly avatarFile = signal<File | null>(null);
  readonly avatarPreview = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((val) => !val);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp|gif)$/i)) {
        this.errorMessage.set('Solo se permiten archivos de imagen (JPG, PNG, WebP o GIF).');
        return;
      }
      this.avatarFile.set(file);

      const reader = new FileReader();
      reader.onload = () => {
        this.avatarPreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeAvatar(): void {
    this.avatarFile.set(null);
    this.avatarPreview.set(null);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formData = new FormData();
    const formValues = this.registerForm.value;

    formData.append('firstName', formValues.firstName.trim());
    formData.append('lastName', formValues.lastName.trim());
    formData.append('email', formValues.email.trim());
    formData.append('username', formValues.username.trim());
    formData.append('password', formValues.password);
    formData.append('birthdate', formValues.birthdate);
    if (formValues.bio) {
      formData.append('bio', formValues.bio.trim());
    }

    const file = this.avatarFile();
    if (file) {
      formData.append('avatar', file, file.name);
    }

    this.authService.register(formData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Cuenta creada con éxito. Redirigiendo a publicaciones...');
        setTimeout(() => {
          this.router.navigate(['/posts']);
        }, 1200);
      },
      error: (err) => {
        this.isLoading.set(false);
        const serverMessage = err.error?.message;
        if (typeof serverMessage === 'string') {
          this.errorMessage.set(serverMessage);
        } else if (Array.isArray(serverMessage)) {
          this.errorMessage.set(serverMessage.join(', '));
        } else {
          this.errorMessage.set('Ocurrió un error al crear la cuenta. Por favor, intenta de nuevo.');
        }
      },
    });
  }
}
