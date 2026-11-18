import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'userRoleBadge',
  standalone: true,
})
export class UserRoleBadgePipe implements PipeTransform {
  transform(role: string | null | undefined): string {
    if (!role) return 'Lector';

    const clean = role.toLowerCase().trim();
    if (clean === 'administrador') {
      return 'Administrador';
    }

    return 'Lector';
  }
}
