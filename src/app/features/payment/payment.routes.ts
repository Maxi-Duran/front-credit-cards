import { Routes } from '@angular/router';

export const paymentRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./payment-list/payment-list.component').then(c => c.PaymentListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./payment-form/payment-form.component').then(c => c.PaymentFormComponent)
  },
  {
    path: 'confirmation',
    loadComponent: () => import('./payment-confirmation/payment-confirmation.component').then(c => c.PaymentConfirmationComponent)
  }
];

export default paymentRoutes;