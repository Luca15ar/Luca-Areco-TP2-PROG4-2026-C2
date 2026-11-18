import { Routes } from '@angular/router';

export const routes: Routes = [
  // La primera pantalla al abrir la app verifica la sesión mediante loading
  { path: '', redirectTo: 'loading', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'loading',
    loadComponent: () =>
      import('./features/auth/loading/loading.component').then((m) => m.LoadingComponent),
  },
  // Componentes base accesibles pero vacíos en Sprint 1
  {
    path: 'posts',
    loadComponent: () =>
      import('./features/posts/posts.component').then((m) => m.PostsComponent),
  },
  {
    path: 'posts/:id',
    loadComponent: () =>
      import('./features/posts/post-detail/post-detail.component').then(
        (m) => m.PostDetailComponent,
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then((m) => m.ProfileComponent),
  },
  { path: '**', redirectTo: 'login' },
];
