import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(r => r.authRoutes)
  },
  {
    path: 'login',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/main-layout/main-layout.component').then(c => c.MainLayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(c => c.DashboardComponent)
      },
      {
        path: 'accounts',
        loadChildren: () => import('./features/account/account.routes').then(r => r.accountRoutes)
      },
      {
        path: 'cards',
        loadComponent: () => import('./features/card/card-list/card-list.component').then(c => c.CardListComponent)
      },
      {
        path: 'transactions',
        loadChildren: () => import('./features/transaction/transaction.routes').then(r => r.transactionRoutes)
      },

{
  path: 'reports',
  loadChildren: () => import('./features/reports/reports.routes').then(r => r.reportsRoutes)
},
{
  path: 'payments',
  loadChildren: () => import('./features/payment/payment.routes').then(r => r.paymentRoutes)
},

      {
        path: 'authorization',
        loadComponent: () => import('./features/authorization/authorization-list/authorization-list.component').then(c => c.AuthorizationListComponent)
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then(r => r.adminRoutes),
        canActivate: [AdminGuard]
      }
    ]
  }
];