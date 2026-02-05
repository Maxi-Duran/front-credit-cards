import { Routes } from '@angular/router';

export const cardRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./card-list/card-list.component').then(c => c.CardListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./card-form/card-form.component').then(c => c.CardFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./card-detail/card-detail.component').then(c => c.CardDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./card-form/card-form.component').then(c => c.CardFormComponent)
  }
];

export default cardRoutes;