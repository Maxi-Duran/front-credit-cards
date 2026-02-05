import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { AuthenticationService } from '../../core/services/authentication.service';
import { Permission } from '../../core/models/auth.models';

/**
 * Structural directive to show/hide elements based on user permissions
 * 
 * Usage:
 * <div *appHasPermission="'MANAGE_USERS'">Admin only content</div>
 * <div *appHasPermission="['VIEW_ACCOUNTS', 'UPDATE_ACCOUNTS']">Content for specific permissions</div>
 * <div *appHasPermission="['VIEW_ACCOUNTS', 'UPDATE_ACCOUNTS']; requireAll: true">Requires all permissions</div>
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private hasView = false;
  private permissions: Permission | Permission[] = [];
  private requireAll = false;

  @Input() set appHasPermission(permissions: Permission | Permission[]) {
    this.permissions = permissions;
    this.updateView();
  }

  @Input() set appHasPermissionRequireAll(requireAll: boolean) {
    this.requireAll = requireAll;
    this.updateView();
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
        this.updateView();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Update view based on user permissions
   */
  private updateView(): void {
    const permissionsArray = Array.isArray(this.permissions) ? this.permissions : [this.permissions];
    const user = this.authService.getCurrentUserValue();
    
    let hasPermission = false;

    if (user && user.permissions) {
      if (this.requireAll) {
        // User must have all specified permissions
        hasPermission = permissionsArray.every(permission =>
          user.permissions.includes(permission)
        );
      } else {
        // User must have at least one of the specified permissions
        hasPermission = permissionsArray.some(permission =>
          user.permissions.includes(permission)
        );
      }
    }

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
