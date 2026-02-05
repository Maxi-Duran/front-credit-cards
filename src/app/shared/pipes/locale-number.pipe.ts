import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';

@Pipe({
  name: 'localeNumber',
  pure: false,
  standalone: true
})
export class LocaleNumberPipe implements PipeTransform {
  private i18nService = inject(I18nService);

  transform(value: number | null | undefined, decimals: number = 2): string {
    if (value === null || value === undefined) {
      return '';
    }

    try {
      return this.i18nService.formatNumber(value, decimals);
    } catch (error) {
      console.error('Error formatting number:', error);
      return String(value);
    }
  }
}
