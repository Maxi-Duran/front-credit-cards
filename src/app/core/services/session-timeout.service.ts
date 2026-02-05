import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, fromEvent, merge, timer } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { AuthenticationService } from './authentication.service';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SessionTimeoutService {
  private destroy$ = new Subject<void>();
  private warningTimer: any;
  private logoutTimer: any;
  private isWarningShown = false;
  
  // Session timeout settings
  private readonly SESSION_TIMEOUT = environment.security.sessionTimeout; // 30 minutes
  private readonly WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
  private readonly ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  constructor(
    private authService: AuthenticationService,
    private notificationService: NotificationService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  /**
   * Start session timeout monitoring
   */
  startMonitoring(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.resetTimers();
    this.setupActivityListeners();
  }

  /**
   * Stop session timeout monitoring
   */
  stopMonitoring(): void {
    this.clearTimers();
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$ = new Subject<void>();
  }

  /**
   * Reset session timeout timers
   */
  resetSession(): void {
    if (this.authService.isAuthenticated()) {
      this.resetTimers();
      this.isWarningShown = false;
    }
  }

  /**
   * Setup activity listeners to detect user activity
   */
  private setupActivityListeners(): void {
    this.ngZone.runOutsideAngular(() => {
      const activityStreams = this.ACTIVITY_EVENTS.map(event => 
        fromEvent(document, event)
      );

      merge(...activityStreams)
        .pipe(
          debounceTime(1000), // Debounce to avoid too frequent resets
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.ngZone.run(() => {
            this.resetSession();
          });
        });
    });
  }

  /**
   * Reset timeout timers
   */
  private resetTimers(): void {
    this.clearTimers();

    // Set warning timer
    this.warningTimer = setTimeout(() => {
      this.showSessionWarning();
    }, this.SESSION_TIMEOUT - this.WARNING_TIME);

    // Set logout timer
    this.logoutTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.SESSION_TIMEOUT);
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }

    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
  }

  /**
   * Show session timeout warning
   */
  private showSessionWarning(): void {
    if (this.isWarningShown || !this.authService.isAuthenticated()) {
      return;
    }

    this.isWarningShown = true;
    const warningMinutes = Math.floor(this.WARNING_TIME / 60000);
    
    const user = this.authService.getCurrentUserValue();
    const language = user?.language || 'es';
    
    const message = language === 'es' 
      ? `Su sesión expirará en ${warningMinutes} minutos. Haga clic en cualquier lugar para continuar.`
      : `Your session will expire in ${warningMinutes} minutes. Click anywhere to continue.`;

    this.notificationService.showWarning(message, {
      duration: this.WARNING_TIME,
      action: language === 'es' ? 'Continuar' : 'Continue'
    });
  }

  /**
   * Handle session timeout
   */
  private handleSessionTimeout(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    const user = this.authService.getCurrentUserValue();
    const language = user?.language || 'es';
    
    const message = language === 'es' 
      ? 'Su sesión ha expirado por inactividad. Por favor, inicie sesión nuevamente.'
      : 'Your session has expired due to inactivity. Please sign in again.';

    this.notificationService.showError(message);
    
    // Logout user
    this.authService.logout().subscribe({
      complete: () => {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}