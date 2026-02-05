import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy, effect } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';

@Pipe({
  name: 'translate',
  pure: false,
  standalone: true
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private i18nService = inject(I18nService);
  private cdr = inject(ChangeDetectorRef);
  private lastKey: string = '';
  private lastValue: string = '';
  private destroyed = false;

  constructor() {
    // Use effect to watch for language changes
    effect(() => {
      // Access the signal to create a dependency
      this.i18nService.currentLanguage();
      
      // Mark for check when language changes
      if (!this.destroyed) {
        this.cdr.markForCheck();
      }
    });
  }

  transform(key: string, params?: Record<string, string | number>): string {
    if (!key) {
      return '';
    }

    // Cache check for performance
    const cacheKey = `${key}:${JSON.stringify(params || {})}`;
    if (this.lastKey === cacheKey) {
      return this.lastValue;
    }

    this.lastKey = cacheKey;
    this.lastValue = this.i18nService.translate(key, params);
    return this.lastValue;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }
}
