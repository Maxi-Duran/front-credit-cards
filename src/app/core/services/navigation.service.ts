import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, filter } from 'rxjs/operators';

import { AuthenticationService } from './authentication.service';
import { UserRole, Permission } from '../models/auth.models';

export interface MenuItem {
  id: string;
  label: string;
  labelKey: string; // For internationalization
  icon: string;
  route: string;
  children?: MenuItem[];
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
  order: number;
  dividerAfter?: boolean;
}

export interface NavigationState {
  currentRoute: string;
  menuItems: MenuItem[];
  breadcrumbs: BreadcrumbItem[];
}

export interface BreadcrumbItem {
  label: string;
  url: string;
  icon?: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private navigationStateSubject = new BehaviorSubject<NavigationState>({
    currentRoute: '',
    menuItems: [],
    breadcrumbs: []
  });

  public navigationState$ = this.navigationStateSubject.asObservable();

  // Base menu items configuration
  private readonly baseMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      labelKey: 'nav.dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      order: 1
    },
    {
      id: 'accounts',
      label: 'Accounts',
      labelKey: 'nav.accounts',
      icon: 'account_balance',
      route: '/accounts',
      requiredPermissions: [Permission.VIEW_ACCOUNTS],
      order: 2
    },
    {
      id: 'cards',
      label: 'Cards',
      labelKey: 'nav.cards',
      icon: 'credit_card',
      route: '/cards',
      requiredPermissions: [Permission.VIEW_CARDS],
      order: 3
    },
    {
      id: 'transactions',
      label: 'Transactions',
      labelKey: 'nav.transactions',
      icon: 'receipt',
      route: '/transactions',
      requiredPermissions: [Permission.VIEW_TRANSACTIONS],
      order: 4
    },
    {
      id: 'reports',
      label: 'Reports',
      labelKey: 'nav.reports',
      icon: 'assessment',
      route: '/reports',
      requiredPermissions: [Permission.VIEW_REPORTS],
      order: 5
    },
    {
      id: 'payments',
      label: 'Payments',
      labelKey: 'nav.payments',
      icon: 'payment',
      route: '/payments',
      order: 6,
      dividerAfter: true
    },
    {
      id: 'authorization',
      label: 'Authorization',
      labelKey: 'nav.authorization',
      icon: 'verified_user',
      route: '/authorization',
      order: 7
    },
    // Admin section
    {
      id: 'admin-users',
      label: 'User Management',
      labelKey: 'nav.admin.users',
      icon: 'people',
      route: '/admin/users',
      requiredRole: UserRole.ADMIN,
      requiredPermissions: [Permission.MANAGE_USERS],
      order: 100
    },
    {
      id: 'admin-transaction-types',
      label: 'Transaction Types',
      labelKey: 'nav.admin.transactionTypes',
      icon: 'category',
      route: '/admin/transaction-types',
      requiredRole: UserRole.ADMIN,
      requiredPermissions: [Permission.MANAGE_TRANSACTION_TYPES],
      order: 101
    }
  ];

  // Route labels for internationalization
  private readonly routeLabels = {
    es: {
      'nav.dashboard': 'Panel Principal',
      'nav.accounts': 'Cuentas',
      'nav.cards': 'Tarjetas',
      'nav.transactions': 'Transacciones',
      'nav.reports': 'Reportes',
      'nav.payments': 'Pagos',
      'nav.authorization': 'Autorizaciones',
      'nav.admin.users': 'Gestión de Usuarios',
      'nav.admin.transactionTypes': 'Tipos de Transacción'
    },
    en: {
      'nav.dashboard': 'Dashboard',
      'nav.accounts': 'Accounts',
      'nav.cards': 'Cards',
      'nav.transactions': 'Transactions',
      'nav.reports': 'Reports',
      'nav.payments': 'Payments',
      'nav.authorization': 'Authorization',
      'nav.admin.users': 'User Management',
      'nav.admin.transactionTypes': 'Transaction Types'
    }
  };

  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {
    this.initializeNavigation();
  }

  /**
   * Initialize navigation service
   */
  private initializeNavigation(): void {
    // Listen to authentication and route changes
    combineLatest([
      this.authService.getCurrentUser(),
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd),
        map(event => (event as NavigationEnd).url)
      )
    ]).subscribe(([user, currentRoute]) => {
      const menuItems = this.getMenuItemsForUser(user);
      const breadcrumbs = this.generateBreadcrumbs(currentRoute);
      
      this.navigationStateSubject.next({
        currentRoute,
        menuItems,
        breadcrumbs
      });
    });

    // Initial route setup
    const currentRoute = this.router.url;
    const user = this.authService.getCurrentUserValue();
    const menuItems = this.getMenuItemsForUser(user);
    const breadcrumbs = this.generateBreadcrumbs(currentRoute);

    this.navigationStateSubject.next({
      currentRoute,
      menuItems,
      breadcrumbs
    });
  }

  /**
   * Get menu items for specific user role and permissions
   */
  getMenuItemsForUser(user: any): MenuItem[] {
    if (!user) {
      return [];
    }

    return this.baseMenuItems
      .filter(item => this.hasAccessToMenuItem(item, user))
      .map(item => ({
        ...item,
        label: this.getLocalizedLabel(item.labelKey, user.language || 'es')
      }))
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Check if user has access to menu item
   */
  private hasAccessToMenuItem(item: MenuItem, user: any): boolean {
    // Check role requirement
    if (item.requiredRole && user.role !== item.requiredRole) {
      return false;
    }

    // Check permission requirements
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      const hasPermission = item.requiredPermissions.some(permission =>
        user.permissions?.includes(permission)
      );
      if (!hasPermission) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get localized label for menu item
   */
  private getLocalizedLabel(labelKey: string, language: 'es' | 'en'): string {
    const labels = this.routeLabels[language];
    return labels[labelKey as keyof typeof labels] || labelKey;
  }

  /**
   * Navigate to specific module
   */
  navigateToModule(moduleRoute: string): void {
    this.router.navigate([moduleRoute]);
  }

  /**
   * Get current route
   */
  getCurrentRoute(): Observable<string> {
    return this.navigationState$.pipe(
      map(state => state.currentRoute)
    );
  }

  /**
   * Get current menu items
   */
  getMenuItems(): Observable<MenuItem[]> {
    return this.navigationState$.pipe(
      map(state => state.menuItems)
    );
  }

  /**
   * Get breadcrumbs
   */
  getBreadcrumbs(): Observable<BreadcrumbItem[]> {
    return this.navigationState$.pipe(
      map(state => state.breadcrumbs)
    );
  }

  /**
   * Generate breadcrumbs from current route
   */
  private generateBreadcrumbs(url: string): BreadcrumbItem[] {
    const segments = url.split('/').filter(segment => segment);
    const breadcrumbs: BreadcrumbItem[] = [];
    const user = this.authService.getCurrentUserValue();
    const language = user?.language || 'es';

    // Always add dashboard as first breadcrumb
    breadcrumbs.push({
      label: this.getLocalizedLabel('nav.dashboard', language),
      url: '/dashboard',
      icon: 'dashboard',
      active: segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')
    });

    // Build breadcrumbs from URL segments
    let currentUrl = '';
    segments.forEach((segment, index) => {
      currentUrl += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Skip dashboard if it's already added
      if (segment === 'dashboard') {
        return;
      }

      // Find menu item for this segment
      const menuItem = this.findMenuItemByRoute(currentUrl);
      const label = menuItem 
        ? this.getLocalizedLabel(menuItem.labelKey, language)
        : this.capitalizeFirst(segment);

      breadcrumbs.push({
        label,
        url: currentUrl,
        icon: menuItem?.icon,
        active: isLast
      });
    });

    return breadcrumbs;
  }

  /**
   * Find menu item by route
   */
  private findMenuItemByRoute(route: string): MenuItem | undefined {
    return this.baseMenuItems.find(item => item.route === route);
  }

  /**
   * Capitalize first letter of string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
  }

  /**
   * Check if current route matches given route
   */
  isCurrentRoute(route: string): Observable<boolean> {
    return this.getCurrentRoute().pipe(
      map(currentRoute => currentRoute === route || currentRoute.startsWith(route + '/'))
    );
  }

  /**
   * Get navigation state
   */
  getNavigationState(): Observable<NavigationState> {
    return this.navigationState$;
  }

  /**
   * Update navigation state (for external updates)
   */
  updateNavigationState(): void {
    const currentRoute = this.router.url;
    const user = this.authService.getCurrentUserValue();
    const menuItems = this.getMenuItemsForUser(user);
    const breadcrumbs = this.generateBreadcrumbs(currentRoute);

    this.navigationStateSubject.next({
      currentRoute,
      menuItems,
      breadcrumbs
    });
  }
}