import { Routes } from '@angular/router';

export const authorizationRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./authorization-list/authorization-list.component').then(c => c.AuthorizationListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./authorization-detail/authorization-detail.component').then(c => c.AuthorizationDetailComponent)
  }
];

export default authorizationRoutes;