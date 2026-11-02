import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly showPassword = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);

  readonly loginForm = this.fb.group({
    login: ['', Validators.required],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    const { login, password } = this.loginForm.value;
    const allEmpty = !login?.trim() && !password?.trim();

    if (allEmpty) {
      this.errorMessage.set('Por favor, completa todos los campos para continuar.');
      this.loginForm.markAllAsTouched();
      return;
    }

    if (this.loginForm.invalid) {
      this.errorMessage.set('Por favor, revisa los datos ingresados en el formulario.');
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService
      .login({
        identifier: login?.trim() || '',
        password: password || '',
      })
      .subscribe({
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
          } else {
            this.errorMessage.set(
              'No se pudo iniciar sesión. Verifica tus credenciales e intenta nuevamente.',
            );
          }
        },
      });
  }
}
