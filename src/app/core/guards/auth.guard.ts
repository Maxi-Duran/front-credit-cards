import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  CanActivateChild, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router 
} from '@angular/router';
import { Observable, map, take } from 'rxjs';

import { AuthenticationService } from '../services/authentication.service';
import { UserRole, Permission } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuthentication(route, state);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuthentication(childRoute, state);
  }

  /**
   * Check if user is authenticated and authorized
   */
  private checkAuthentication(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      take(1),
      map(user => {
        // Check if user is authenticated
        if (!user || !this.authService.isAuthenticated()) {
          this.redirectToLogin(state.url);
          return false;
        }

        // Check role-based access
        const requiredRole = route.data?.['requiredRole'] as UserRole;
        if (requiredRole && !this.authService.hasRole(requiredRole)) {
          this.handleUnauthorizedAccess();
          return false;
        }

        // Check permission-based access
        const requiredPermissions = route.data?.['requiredPermissions'] as Permission[];
        if (requiredPermissions && requiredPermissions.length > 0) {
          const hasPermission = this.authService.hasAnyPermission(requiredPermissions);
          if (!hasPermission) {
            this.handleUnauthorizedAccess();
            return false;
          }
        }

        // Check if route requires specific permissions
        const requireAllPermissions = route.data?.['requireAllPermissions'] as Permission[];
        if (requireAllPermissions && requireAllPermissions.length > 0) {
          const hasAllPermissions = requireAllPermissions.every(permission => 
            this.authService.hasPermission(permission)
          );
          if (!hasAllPermissions) {
            this.handleUnauthorizedAccess();
            return false;
          }
        }

        return true;
      })
    );
  }

  /**
   * Redirect to login page
   */
  private redirectToLogin(returnUrl: string): void {
    this.router.navigate(['/auth/login'], { 
      queryParams: { returnUrl } 
    });
  }

  /**
   * Handle unauthorized access
   */
  private handleUnauthorizedAccess(): void {
    const user = this.authService.getCurrentUserValue();
    
    if (user?.role === UserRole.ADMIN) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/main']);
    }
  }
}