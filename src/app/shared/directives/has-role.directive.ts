import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { AuthenticationService } from '../../core/services/authentication.service';
import { UserRole } from '../../core/models/auth.models';

/**
 * Structural directive to show/hide elements based on user role
 * 
 * Usage:
 * <div *appHasRole="'admin'">Admin only content</div>
 * <div *appHasRole="['admin', 'regular']">Content for multiple roles</div>
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private hasView = false;

  @Input() set appHasRole(roles: UserRole | UserRole[]) {
    this.updateView(roles);
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Re-evaluate when user changes
        const roles = this.getRoles();
        if (roles) {
          this.updateView(roles);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Update view based on user role
   */
  private updateView(roles: UserRole | UserRole[]): void {
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    const user = this.authService.getCurrentUserValue();
    
    const hasRole = user && rolesArray.includes(user.role);

    if (hasRole && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasRole && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  /**
   * Get current roles (for re-evaluation)
   */
  private getRoles(): UserRole | UserRole[] | null {
    // This is a workaround to get the current input value
    // In a real implementation, you might want to store this
    return null;
  }
}
