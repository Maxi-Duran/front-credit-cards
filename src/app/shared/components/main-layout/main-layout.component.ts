import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, takeUntil, filter } from 'rxjs';

import { AuthenticationService } from '../../../core/services/authentication.service';
import { NavigationService, MenuItem } from '../../../core/services/navigation.service';
import { User } from '../../../core/models/auth.models';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatListModule,
    MatDividerModule,
    BreadcrumbComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Responsive signals
  protected readonly isMobile = signal(false);
  protected readonly isTablet = signal(false);
  protected readonly sidenavOpen = signal(false);
  
  // User and language signals
  protected readonly currentUser = signal<User | null>(null);
  protected readonly currentLanguage = computed(() => this.currentUser()?.language || 'es');
  
  // Navigation signals
  protected readonly menuItems = signal<MenuItem[]>([]);
  
  // Navigation state
  protected readonly sidenavMode = computed(() => this.isMobile() ? 'over' : 'side');
  protected readonly sidenavOpened = computed(() => !this.isMobile() && this.sidenavOpen());

  constructor(
    private authService: AuthenticationService,
    private navigationService: NavigationService,
    private breakpointObserver: BreakpointObserver,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupResponsiveLayout();
    this.setupUserSubscription();
    this.setupNavigationSubscription();
    this.setupRouterSubscription();
    
    // Initialize sidenav as open for desktop
    if (!this.isMobile()) {
      this.sidenavOpen.set(true);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup responsive layout monitoring
   */
  private setupResponsiveLayout(): void {
    // Monitor mobile breakpoint
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile.set(result.matches);
        
        // Auto-close sidenav on mobile
        if (result.matches) {
          this.sidenavOpen.set(false);
        } else {
          this.sidenavOpen.set(true);
        }
      });

    // Monitor tablet breakpoint
    this.breakpointObserver
      .observe([Breakpoints.Tablet])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isTablet.set(result.matches);
      });
  }

  /**
   * Setup user subscription
   */
  private setupUserSubscription(): void {
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser.set(user);
      });
  }

  /**
   * Setup navigation subscription
   */
  private setupNavigationSubscription(): void {
    this.navigationService.getMenuItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe(menuItems => {
        this.menuItems.set(menuItems);
      });
  }

  /**
   * Setup router subscription to close mobile sidenav on navigation
   */
  private setupRouterSubscription(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.isMobile()) {
          this.sidenavOpen.set(false);
        }
      });
  }

  /**
   * Toggle sidenav
   */
  protected toggleSidenav(): void {
    this.sidenavOpen.update(open => !open);
  }

  /**
   * Switch language
   */
  protected switchLanguage(language: 'es' | 'en'): void {
    const user = this.currentUser();
    if (user && user.language !== language) {
      // Update user language preference
      const updatedUser = { ...user, language };
      this.currentUser.set(updatedUser);
      
      // Update navigation service to refresh menu labels
      this.navigationService.updateNavigationState();
      
      // TODO: Call API to persist language preference
      console.log('Language switched to:', language);
    }
  }

  /**
   * Get user display name
   */
  protected getUserDisplayName(): string {
    const user = this.currentUser();
    return user?.name || 'Usuario';
  }

  /**
   * Get user role display
   */
  protected getUserRoleDisplay(): string {
    const user = this.currentUser();
    const language = this.currentLanguage();
    
    if (!user) return '';
    
    const roleLabels = {
      es: {
        regular: 'Usuario',
        admin: 'Administrador'
      },
      en: {
        regular: 'User',
        admin: 'Administrator'
      }
    };
    
    return roleLabels[language][user.role] || user.role;
  }

  /**
   * Logout user
   */
  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        console.log('User logged out successfully');
      },
      error: (error) => {
        console.error('Logout error:', error);
      }
    });
  }

  /**
   * Navigate to menu item
   */
  protected navigateToMenuItem(menuItem: MenuItem): void {
    this.navigationService.navigateToModule(menuItem.route);
  }

  /**
   * Check if menu item is active
   */
  protected isMenuItemActive(menuItem: MenuItem): boolean {
    const currentRoute = this.router.url;
    return currentRoute === menuItem.route || currentRoute.startsWith(menuItem.route + '/');
  }

  /**
   * Get admin menu items
   */
  protected getAdminMenuItems(): MenuItem[] {
    return this.menuItems().filter(item => 
      item.id.startsWith('admin-') || item.requiredRole === 'admin'
    );
  }

  /**
   * Get regular menu items
   */
  protected getRegularMenuItems(): MenuItem[] {
    return this.menuItems().filter(item => 
      !item.id.startsWith('admin-') && item.requiredRole !== 'admin'
    );
  }

  /**
   * Check if user has admin role
   */
  protected isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }
  /**
   * Get language label
   */
  protected getLanguageLabel(lang: 'es' | 'en'): string {
    return lang === 'es' ? 'Español' : 'English';
  }
}