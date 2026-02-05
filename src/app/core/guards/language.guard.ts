import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { I18nService } from '../services/i18n.service';

/**
 * Language guard ensures that the language is loaded before activating routes
 */
export const languageGuard: CanActivateFn = (route, state) => {
  const i18nService = inject(I18nService);
  
  // Check if language preference exists in query params
  const queryParams = new URLSearchParams(window.location.search);
  const langParam = queryParams.get('lang');
  
  if (langParam === 'es' || langParam === 'en') {
    i18nService.setLanguage(langParam);
  }
  
  // Language is always loaded, so always return true
  return true;
};
