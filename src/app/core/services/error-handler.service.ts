import { Injectable, ErrorHandler, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';

export interface UserFriendlyError {
  title: string;
  message: string;
  actions?: ErrorAction[];
  severity?: 'error' | 'warning' | 'info';
}

export interface ErrorAction {
  label: string;
  action: () => void;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp: Date;
  additionalData?: Record<string, any>;
}

export interface ErrorLog {
  id: string;
  timestamp: Date;
  errorType: string;
  message: string;
  stack?: string;
  context?: ErrorContext;
  sanitizedData?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private errorLogs: ErrorLog[] = [];
  private readonly MAX_LOGS = 100;
  
  // Sensitive data patterns to redact
  private readonly SENSITIVE_PATTERNS = [
    /password/i,
    /token/i,
    /authorization/i,
    /credit[_-]?card/i,
    /ssn/i,
    /social[_-]?security/i,
    /cvv/i,
    /pin/i
  ];

  handleError(error: any): void {
    // Create error context
    const context: ErrorContext = {
      timestamp: new Date(),
      component: this.getCurrentComponent(),
      action: 'unknown'
    };

    // Log error with privacy protection
    this.logError(error, context);
    
    if (error instanceof HttpErrorResponse) {
      this.handleHttpError(error, context);
    } else if (error?.rejection instanceof HttpErrorResponse) {
      // Handle promise rejection with HTTP error
      this.handleHttpError(error.rejection, context);
    } else {
      this.handleClientError(error, context);
    }
  }

  private handleHttpError(error: HttpErrorResponse, context: ErrorContext): void {
    let userMessage: UserFriendlyError;

    switch (error.status) {
      case 0:
        // Network error
        userMessage = {
          title: 'Error de Conexión',
          message: 'No se pudo conectar al servidor. Verifique su conexión a internet.',
          severity: 'error',
          actions: [
            {
              label: 'Reintentar',
              action: () => window.location.reload()
            }
          ]
        };
        break;

      case 401:
        userMessage = {
          title: 'Sesión Expirada',
          message: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
          severity: 'warning',
          actions: [
            {
              label: 'Iniciar Sesión',
              action: () => this.router.navigate(['/auth/login'])
            }
          ]
        };
        break;

      case 403:
        userMessage = {
          title: 'Acceso Denegado',
          message: 'No tiene permisos para realizar esta acción.',
          severity: 'error'
        };
        break;

      case 404:
        userMessage = {
          title: 'Recurso No Encontrado',
          message: 'El recurso solicitado no fue encontrado.',
          severity: 'warning'
        };
        break;

      case 409:
        userMessage = {
          title: 'Conflicto de Datos',
          message: error.error?.message || 'Los datos han sido modificados por otro usuario.',
          severity: 'warning',
          actions: [
            {
              label: 'Recargar',
              action: () => window.location.reload()
            }
          ]
        };
        break;

      case 422:
        userMessage = {
          title: 'Error de Validación',
          message: error.error?.message || 'Los datos proporcionados no son válidos.',
          severity: 'error'
        };
        break;

      case 429:
        userMessage = {
          title: 'Demasiadas Solicitudes',
          message: 'Ha excedido el límite de solicitudes. Por favor, espere un momento.',
          severity: 'warning'
        };
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        userMessage = {
          title: 'Error del Servidor',
          message: 'Ha ocurrido un error interno. Por favor, intente más tarde.',
          severity: 'error',
          actions: [
            {
              label: 'Reintentar',
              action: () => window.location.reload()
            }
          ]
        };
        break;

      default:
        userMessage = {
          title: 'Error Inesperado',
          message: error.error?.message || `Ha ocurrido un error (código ${error.status}).`,
          severity: 'error'
        };
    }

    this.displayUserMessage(userMessage);
  }

  private handleClientError(error: Error, context: ErrorContext): void {
    // Check if it's a chunk loading error (lazy loading failure)
    if (error.message?.includes('ChunkLoadError') || error.message?.includes('Loading chunk')) {
      const userMessage: UserFriendlyError = {
        title: 'Actualización Disponible',
        message: 'Hay una nueva versión disponible. La página se recargará.',
        severity: 'info',
        actions: [
          {
            label: 'Recargar Ahora',
            action: () => window.location.reload()
          }
        ]
      };
      this.displayUserMessage(userMessage);
      // Auto-reload after 3 seconds
      setTimeout(() => window.location.reload(), 3000);
      return;
    }

    const userMessage: UserFriendlyError = {
      title: 'Error de Aplicación',
      message: 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.',
      severity: 'error',
      actions: [
        {
          label: 'Recargar',
          action: () => window.location.reload()
        }
      ]
    };

    this.displayUserMessage(userMessage);
  }

  private displayUserMessage(error: UserFriendlyError): void {
    if (error.actions && error.actions.length > 0) {
      this.notificationService.error(error.title, error.message, error.actions);
    } else {
      this.notificationService.showError(error.message);
    }
  }

  logError(error: Error | HttpErrorResponse, context: ErrorContext): void {
    // Sanitize error data to remove sensitive information
    const sanitizedData = this.sanitizeData({
      url: window.location.href,
      userAgent: navigator.userAgent,
      errorMessage: error.message,
      errorName: error instanceof Error ? error.name : 'HttpError',
      status: error instanceof HttpErrorResponse ? error.status : undefined,
      context: context
    });

    const errorLog: ErrorLog = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      errorType: error instanceof HttpErrorResponse ? 'HTTP' : 'Client',
      message: error.message,
      stack: error instanceof Error ? this.sanitizeStackTrace(error.stack) : undefined,
      context: context,
      sanitizedData: sanitizedData
    };

    // Store error log (limited to MAX_LOGS)
    this.errorLogs.push(errorLog);
    if (this.errorLogs.length > this.MAX_LOGS) {
      this.errorLogs.shift();
    }

    // Log to console in development
    if (!this.isProduction()) {
      console.error('Error logged:', errorLog);
    }

    // In production, send to logging service
    if (this.isProduction()) {
      this.sendToLoggingService(errorLog);
    }
  }

  shouldRetry(error: Error | HttpErrorResponse): boolean {
    if (error instanceof HttpErrorResponse) {
      // Retry on network errors and 5xx server errors
      // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit)
      return error.status === 0 || 
             error.status === 408 || 
             error.status === 429 ||
             (error.status >= 500 && error.status < 600);
    }
    return false;
  }

  getErrorLogs(): ErrorLog[] {
    return [...this.errorLogs];
  }

  clearErrorLogs(): void {
    this.errorLogs = [];
  }

  private sanitizeData(data: any): Record<string, any> {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      // Check if key matches sensitive patterns
      if (this.isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else if (typeof value === 'string' && this.containsSensitiveData(value)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private isSensitiveKey(key: string): boolean {
    return this.SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
  }

  private containsSensitiveData(value: string): boolean {
    // Check for credit card patterns (simplified)
    const creditCardPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;
    // Check for SSN patterns
    const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/;
    
    return creditCardPattern.test(value) || ssnPattern.test(value);
  }

  private sanitizeStackTrace(stack?: string): string | undefined {
    if (!stack) return undefined;

    // Remove file paths that might contain sensitive information
    return stack.split('\n')
      .map(line => {
        // Remove absolute file paths, keep only relative paths
        return line.replace(/\(.*?([^/\\]+\.ts:\d+:\d+)\)/, '($1)');
      })
      .join('\n');
  }

  private getCurrentComponent(): string {
    // Try to extract component name from router
    const url = this.router.url;
    const segments = url.split('/').filter(s => s);
    return segments.length > 0 ? segments[segments.length - 1] : 'unknown';
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isProduction(): boolean {
    // This would check the environment configuration
    return false; // Default to development for now
  }

  private sendToLoggingService(errorLog: ErrorLog): void {
    // In production, this would send to a logging service like Sentry, LogRocket, etc.
    // For now, we just store it locally
    try {
      const logs = localStorage.getItem('error_logs');
      const existingLogs = logs ? JSON.parse(logs) : [];
      existingLogs.push(errorLog);
      
      // Keep only last 50 logs in localStorage
      if (existingLogs.length > 50) {
        existingLogs.shift();
      }
      
      localStorage.setItem('error_logs', JSON.stringify(existingLogs));
    } catch (e) {
      // Silently fail if localStorage is not available
      console.warn('Could not save error log to localStorage');
    }
  }
}