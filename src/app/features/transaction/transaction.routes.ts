import { Routes } from '@angular/router';

export const transactionRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./transaction-list/transaction-list.component').then(c => c.TransactionListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./transaction-form/transaction-form.component').then(c => c.TransactionFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./transaction-detail/transaction-detail.component').then(c => c.TransactionDetailComponent)
  }
];

export default transactionRoutes;