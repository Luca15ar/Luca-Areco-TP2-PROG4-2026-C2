import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

export const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password');
  const repeatPassword = control.get('repeatPassword');
  if (!password || !repeatPassword) return null;
  return password.value === repeatPassword.value ? null : { passwordMismatch: true };
};

export const NAME_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly showPassword = signal<boolean>(false);
  readonly imagePreview = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  selectedFile: File | null = null;

  readonly registerForm = this.fb.group(
    {
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(NAME_PATTERN),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(NAME_PATTERN),
        ],
      ],
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
          Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/),
        ],
      ],
      repeatPassword: ['', Validators.required],
      birthdate: ['', Validators.required],
      bio: [''],
    },
    { validators: passwordMatchValidator },
  );

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp|gif)$/i)) {
        this.errorMessage.set('Solo se permiten archivos de imagen (JPG, PNG, WebP o GIF).');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => this.imagePreview.set(reader.result as string);
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSubmit(): void {
    const formValues = this.registerForm.value;
    const allEmpty =
      !formValues.firstName?.trim() &&
      !formValues.lastName?.trim() &&
      !formValues.email?.trim() &&
      !formValues.username?.trim() &&
      !formValues.password &&
      !formValues.repeatPassword &&
      !formValues.birthdate;

    if (allEmpty) {
      this.errorMessage.set('Por favor, completa todos los campos para continuar.');
      this.registerForm.markAllAsTouched();
      return;
    }

    if (this.registerForm.invalid) {
      this.errorMessage.set('Por favor, revisa los datos ingresados en el formulario.');
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formData = new FormData();

    formData.append('firstName', formValues.firstName?.trim() || '');
    formData.append('lastName', formValues.lastName?.trim() || '');
    formData.append('email', formValues.email?.trim() || '');
    formData.append('username', formValues.username?.trim() || '');
    formData.append('password', formValues.password || '');
    formData.append('birthdate', formValues.birthdate || '');
    if (formValues.bio) {
      formData.append('bio', formValues.bio.trim());
    }

    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile, this.selectedFile.name);
    }

    this.authService.register(formData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/posts']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const serverMessage = err.error?.message;
        if (typeof serverMessage === 'string') {
          this.errorMessage.set(serverMessage);
        } else if (Array.isArray(serverMessage)) {
          this.errorMessage.set(serverMessage.join(', '));
        } else if (typeof err.error === 'string' && err.error.trim().length > 0) {
          this.errorMessage.set(err.error);
        } else {
          this.errorMessage.set('Ocurrió un error al crear la cuenta. Por favor, intenta de nuevo.');
        }
      },
    });
  }
}
