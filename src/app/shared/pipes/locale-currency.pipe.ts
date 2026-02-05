import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';

@Pipe({
  name: 'localeCurrency',
  pure: false,
  standalone: true
})
export class LocaleCurrencyPipe implements PipeTransform {
  private i18nService = inject(I18nService);

  transform(value: number | null | undefined, currency: string = 'USD'): string {
    if (value === null || value === undefined) {
      return '';
    }

    try {
      return this.i18nService.formatCurrency(value, currency);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return String(value);
    }
  }
}
