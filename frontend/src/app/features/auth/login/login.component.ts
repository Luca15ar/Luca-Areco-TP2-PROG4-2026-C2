import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AutofocusDirective } from '../../../shared/directives/autofocus.directive';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AutofocusDirective],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly showPassword = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly sessionExpired = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);

  readonly loginForm = this.fb.group({
    login: ['', Validators.required],
    password: ['', Validators.required],
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('deactivated') === 'true') {
        this.errorMessage.set(
          'Tu cuenta ha sido deshabilitada por un administrador.',
        );
      }
      if (params.get('expired') === 'true') {
        this.sessionExpired.set(true);
      }
    });
  }

  onSubmit(): void {
    this.sessionExpired.set(false);
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
          this.router.navigate(['/loading']);
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
            this.errorMessage.set(
              'No se pudo iniciar sesión. Verifica tus credenciales e intenta nuevamente.',
            );
          }
        },
      });
  }
}
