import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

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
  // Componentes protegidos que requieren sesión activa
  {
    path: 'posts',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/posts/posts.component').then((m) => m.PostsComponent),
  },
  {
    path: 'posts/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/posts/post-detail/post-detail.component').then(
        (m) => m.PostDetailComponent,
      ),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent,
      ),
    children: [
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/admin/users/admin-users.component').then(
            (m) => m.AdminUsersComponent,
          ),
      },
      {
        path: 'estadisticas',
        loadComponent: () =>
          import('./features/admin/stats/admin-stats.component').then(
            (m) => m.AdminStatsComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
