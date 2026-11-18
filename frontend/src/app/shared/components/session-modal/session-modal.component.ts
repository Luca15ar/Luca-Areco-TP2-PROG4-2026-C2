import { Component, inject } from '@angular/core';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-session-modal',
  standalone: true,
  templateUrl: './session-modal.component.html',
  styleUrl: './session-modal.component.css',
})
export class SessionModalComponent {
  readonly sessionService = inject(SessionService);

  onExtend(): void {
    this.sessionService.extendSession();
  }

  onLogout(): void {
    this.sessionService.logoutAndRedirect();
  }
}
