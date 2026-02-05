import { Injectable, inject } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, retryWhen, mergeMap, finalize } from 'rxjs/operators';

import { NotificationService } from '../services/notification.service';
import { LoadingService } from '../services/loading.service';
import { GlobalErrorHandler } from '../services/error-handler.service';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private notificationService = inject(NotificationService);
  private loadingService = inject(LoadingService);
  private errorHandler = inject(GlobalErrorHandler);
  private router = inject(Router);

  // Retry configuration
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;
  private readonly BACKOFF_MULTIPLIER = 2;

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      retryWhen(errors => this.retryStrategy(errors, req)),
      catchError((error: HttpErrorResponse) => this.handleError(error, req)),
      finalize(() => {
        // Stop loading indicator when request completes
        this.loadingService.setLoading(false);
      })
    );
  }

  /**
   * Retry strategy with exponential backoff
   */
  private retryStrategy(errors: Observable<any>, req: HttpRequest<any>): Observable<any> {
    return errors.pipe(
      mergeMap((error, index) => {
        const retryAttempt = index + 1;

        // Check if we should retry this error
        if (!this.shouldRetry(req, error) || retryAttempt > this.MAX_RETRIES) {
          return throwError(() => error);
        }

        // Calculate delay with exponential backoff
        const delay = this.RETRY_DELAY_MS * Math.pow(this.BACKOFF_MULTIPLIER, index);

        console.log(`Retrying request (attempt ${retryAttempt}/${this.MAX_RETRIES}) after ${delay}ms`);

        // Retry after delay
        return timer(delay);
      })
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse, req: HttpRequest<any>): Observable<never> {
    // Stop loading indicator
    this.loadingService.setLoading(false);

    // Log error with context
    this.errorHandler.logError(error, {
      timestamp: new Date(),
      action: `${req.method} ${req.url}`,
      additionalData: {
        method: req.method,
        url: req.url,
        status: error.status
      }
    });

    // Handle specific error types
    let errorMessage = 'Ha ocurrido un error inesperado';
    let shouldShowNotification = true;

    switch (error.status) {
      case 0:
        // Network error
        errorMessage = 'Error de conexión. Verifique su conexión a internet.';
        break;
        
      case 400:
        // Bad Request
        errorMessage = error.error?.message || 'Datos de solicitud inválidos';
        break;
        
      case 401:
        // Unauthorized - redirect to login
        shouldShowNotification = false;
        this.handleUnauthorized();
        break;
        
      case 403:
        // Forbidden
        errorMessage = 'No tiene permisos para realizar esta acción';
        break;
        
      case 404:
        // Not Found
        errorMessage = 'El recurso solicitado no fue encontrado';
        break;
        
      case 409:
        // Conflict
        errorMessage = error.error?.message || 'Conflicto de datos. Los datos han sido modificados.';
        break;
        
      case 422:
        // Unprocessable Entity
        errorMessage = error.error?.message || 'Error de validación en los datos';
        this.handleValidationError(error);
        shouldShowNotification = false;
        break;
        
      case 429:
        // Too Many Requests
        errorMessage = 'Demasiadas solicitudes. Por favor, espere un momento.';
        break;
        
      case 500:
        // Internal Server Error
        errorMessage = 'Error del servidor. Por favor, intente más tarde.';
        break;
        
      case 502:
      case 503:
      case 504:
        // Server unavailable
        errorMessage = 'Servicio temporalmente no disponible. Por favor, intente más tarde.';
        break;
        
      default:
        errorMessage = error.error?.message || `Error HTTP ${error.status}`;
    }

    // Show error notification if appropriate
    if (shouldShowNotification) {
      this.showErrorNotification(errorMessage, error);
    }

    return throwError(() => error);
  }

  /**
   * Handle unauthorized errors (401)
   */
  private handleUnauthorized(): void {
    // Clear any stored authentication data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');

    // Show notification
    this.notificationService.showWarning(
      'Su sesión ha expirado. Por favor, inicie sesión nuevamente.'
    );

    // Redirect to login after a short delay
    setTimeout(() => {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
    }, 1500);
  }

  /**
   * Handle validation errors (422)
   */
  private handleValidationError(error: HttpErrorResponse): void {
    if (error.error?.errors && Array.isArray(error.error.errors)) {
      // Show first validation error
      const firstError = error.error.errors[0];
      this.notificationService.showError(
        firstError.message || 'Error de validación en los datos'
      );
    } else if (error.error?.message) {
      this.notificationService.showError(error.error.message);
    } else {
      this.notificationService.showError('Error de validación en los datos');
    }
  }

  /**
   * Show error notification with retry option if applicable
   */
  private showErrorNotification(message: string, error: HttpErrorResponse): void {
    if (this.errorHandler.shouldRetry(error)) {
      this.notificationService.error('Error', message, [
        {
          label: 'Reintentar',
          action: () => window.location.reload()
        }
      ]);
    } else {
      this.notificationService.showError(message);
    }
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(req: HttpRequest<any>, error: any): boolean {
    // Don't retry if not an HTTP error
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    // Only retry GET requests by default
    if (req.method !== 'GET') {
      // For non-GET requests, only retry on network errors or 503 (service unavailable)
      return error.status === 0 || error.status === 503;
    }

    // For GET requests, retry on:
    // - Network errors (status 0)
    // - Request timeout (408)
    // - Too many requests (429) - with backoff
    // - Server errors (5xx)
    return error.status === 0 || 
           error.status === 408 || 
           error.status === 429 ||
           (error.status >= 500 && error.status < 600);
  }
}