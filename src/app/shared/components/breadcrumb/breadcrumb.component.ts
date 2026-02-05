import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subject, takeUntil, filter } from 'rxjs';

import { AuthenticationService } from '../../../core/services/authentication.service';

export interface BreadcrumbItem {
  label: string;
  url: string;
  icon?: string;
  active: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  protected readonly breadcrumbs = signal<BreadcrumbItem[]>([]);
  protected readonly currentLanguage = signal<'es' | 'en'>('es');

  // Route labels for different languages
  private readonly routeLabels = {
    es: {
      dashboard: 'Panel Principal',
      accounts: 'Cuentas',
      cards: 'Tarjetas',
      transactions: 'Transacciones',
      reports: 'Reportes',
      payments: 'Pagos',
      admin: 'Administración',
      users: 'Usuarios',
      'transaction-types': 'Tipos de Transacción',
      authorization: 'Autorizaciones'
    },
    en: {
      dashboard: 'Dashboard',
      accounts: 'Accounts',
      cards: 'Cards',
      transactions: 'Transactions',
      reports: 'Reports',
      payments: 'Payments',
      admin: 'Administration',
      users: 'Users',
      'transaction-types': 'Transaction Types',
      authorization: 'Authorization'
    }
  };

  // Route icons
  private readonly routeIcons: Record<string, string> = {
    dashboard: 'dashboard',
    accounts: 'account_balance',
    cards: 'credit_card',
    transactions: 'receipt',
    reports: 'assessment',
    payments: 'payment',
    admin: 'admin_panel_settings',
    users: 'people',
    'transaction-types': 'category',
    authorization: 'verified_user'
  };

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.setupLanguageSubscription();
    this.setupRouterSubscription();
    this.generateBreadcrumbs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup language subscription
   */
  private setupLanguageSubscription(): void {
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user?.language) {
          this.currentLanguage.set(user.language);
          this.generateBreadcrumbs(); // Regenerate breadcrumbs when language changes
        }
      });
  }

  /**
   * Setup router subscription
   */
  private setupRouterSubscription(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.generateBreadcrumbs();
      });
  }

  /**
   * Generate breadcrumbs from current route
   */
  private generateBreadcrumbs(): void {
    const url = this.router.url;
    const segments = url.split('/').filter(segment => segment);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Always add home/dashboard as first breadcrumb
    breadcrumbs.push({
      label: this.getRouteLabel('dashboard'),
      url: '/dashboard',
      icon: this.routeIcons['dashboard'],
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

      breadcrumbs.push({
        label: this.getRouteLabel(segment),
        url: currentUrl,
        icon: this.routeIcons[segment],
        active: isLast
      });
    });

    this.breadcrumbs.set(breadcrumbs);
  }

  /**
   * Get route label based on current language
   */
  private getRouteLabel(route: string): string {
    const language = this.currentLanguage();
    const labels = this.routeLabels[language];
    return labels[route as keyof typeof labels] || this.capitalizeFirst(route);
  }

  /**
   * Capitalize first letter of string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
  }

  /**
   * Navigate to breadcrumb item
   */
  protected navigateTo(item: BreadcrumbItem): void {
    if (!item.active) {
      this.router.navigate([item.url]);
    }
  }

  /**
   * Get home label
   */
  protected getHomeLabel(): string {
    return this.currentLanguage() === 'es' ? 'Inicio' : 'Home';
  }
}