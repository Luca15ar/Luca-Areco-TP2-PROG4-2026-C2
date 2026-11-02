import { Component } from '@angular/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  template: `
    <section class="placeholder-container">
      <h1 class="placeholder-title">Mi perfil</h1>
      <p class="placeholder-subtitle">Esta sección se completará en el siguiente sprint.</p>
    </section>
  `,
  styles: [
    `
      .placeholder-container {
        max-width: 720px;
        margin: 4rem auto;
        padding: 3rem 1.5rem;
        text-align: center;
        background: var(--bg-surface);
        border: 1px solid var(--border-surface);
        border-radius: var(--radius-lg);
      }
      .placeholder-title {
        font-family: var(--font-serif);
        font-size: 2.2rem;
        color: #ffffff;
        margin-bottom: 0.75rem;
      }
      .placeholder-subtitle {
        color: var(--text-muted);
        font-size: 0.95rem;
      }
    `,
  ],
})
export class ProfileComponent {}
