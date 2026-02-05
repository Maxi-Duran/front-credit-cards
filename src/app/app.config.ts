import { ApplicationConfig, provideBrowserGlobalErrorListeners, ErrorHandler, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { GlobalErrorHandler } from './core/services/error-handler.service';
import { registerLocaleData } from '@angular/common'; 
import localeEs from '@angular/common/locales/es';
registerLocaleData(localeEs);
export const appConfig: ApplicationConfig = {
  
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), 
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi()),
    
    // Locale configuration - default to Spanish
    // The I18nService will handle dynamic locale changes
    {
      provide: LOCALE_ID,
      useValue: 'es-ES'
    },
    
    // Global Error Handler
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    },
    
    // HTTP Interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ]
};
