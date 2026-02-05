import { Routes } from '@angular/router';
import { AdminGuard } from '../../core/guards/admin.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full'
  },
  {
    path: 'users',
    loadComponent: () => import('./user-management/user-management.component').then(c => c.UserManagementComponent),
    canActivate: [AdminGuard]
  },
  {
    path: 'transaction-types',
    loadComponent: () => import('./transaction-types/transaction-types.component').then(c => c.TransactionTypesComponent),
    canActivate: [AdminGuard]
  }
];

export default adminRoutes;