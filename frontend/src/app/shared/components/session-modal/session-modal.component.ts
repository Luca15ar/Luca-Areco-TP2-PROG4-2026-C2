import { Component, OnDestroy, effect, inject } from '@angular/core';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-session-modal',
  standalone: true,
  templateUrl: './session-modal.component.html',
  styleUrl: './session-modal.component.css',
})
export class SessionModalComponent implements OnDestroy {
  readonly sessionService = inject(SessionService);

  constructor() {
    effect(() => {
      const isModalActive = this.sessionService.showWarningModal();
      document.body.classList.toggle('modal-open', isModalActive);
      document.documentElement.classList.toggle('modal-open', isModalActive);
    });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
  }

  onExtend(): void {
    this.sessionService.extendSession();
  }

  onLogout(): void {
    this.sessionService.logoutAndRedirect();
  }
}
