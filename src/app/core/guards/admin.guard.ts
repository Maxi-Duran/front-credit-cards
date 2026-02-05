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
import { UserRole } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate, CanActivateChild {

  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAdminAccess(state);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAdminAccess(state);
  }

  /**
   * Check if user has admin access
   */
  private checkAdminAccess(state: RouterStateSnapshot): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      take(1),
      map(user => {
        // Check if user is authenticated
        if (!user || !this.authService.isAuthenticated()) {
          this.router.navigate(['/auth/login'], { 
            queryParams: { returnUrl: state.url } 
          });
          return false;
        }

        // Check if user has admin role
        if (!this.authService.hasRole(UserRole.ADMIN)) {
          // Redirect regular users to main menu
          this.router.navigate(['/main']);
          return false;
        }

        return true;
      })
    );
  }
}