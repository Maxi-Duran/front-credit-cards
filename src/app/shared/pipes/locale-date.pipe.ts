import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';

@Pipe({
  name: 'localeDate',
  pure: false,
  standalone: true
})
export class LocaleDatePipe implements PipeTransform {
  private i18nService = inject(I18nService);

  transform(value: Date | string | null | undefined, format: 'short' | 'medium' | 'long' | 'full' = 'medium'): string {
    if (!value) {
      return '';
    }

    try {
      return this.i18nService.formatDate(value, format);
    } catch (error) {
      console.error('Error formatting date:', error);
      return String(value);
    }
  }
}
