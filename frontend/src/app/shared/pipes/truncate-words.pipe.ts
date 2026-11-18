import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncateWords',
  standalone: true,
})
export class TruncateWordsPipe implements PipeTransform {
  transform(
    value: string | null | undefined,
    limit: number = 30,
    suffix: string = '...',
  ): string {
    if (!value) return '';

    const clean = value.trim();
    if (!clean) return '';

    const words = clean.split(/\s+/);
    if (words.length <= limit) {
      return clean;
    }

    return words.slice(0, limit).join(' ') + suffix;
  }
}
