import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SessionModalComponent } from './shared/components/session-modal/session-modal.component';
import { SessionService } from './core/services/session.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SessionModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  readonly sessionService = inject(SessionService);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects || e.url),
    ),
    { initialValue: this.router.url },
  );

  readonly showNavbar = computed(() => {
    const url = this.currentUrl() || '';
    const isAuthOrLoadingRoute =
      url.startsWith('/login') ||
      url.startsWith('/register') ||
      url.startsWith('/loading') ||
      url === '/';
    return !isAuthOrLoadingRoute;
  });
}
