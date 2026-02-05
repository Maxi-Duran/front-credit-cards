import { Routes } from '@angular/router';

export const accountRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./account-list/account-list.component').then(c => c.AccountListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./account-form/account-form.component').then(c => c.AccountFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./account-detail/account-detail.component').then(c => c.AccountDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./account-form/account-form.component').then(c => c.AccountFormComponent)
  }
];

export default accountRoutes;