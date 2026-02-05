import { Routes } from '@angular/router';

export const reportsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./reports-list/reports-list.component').then(c => c.ReportsListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./report-form/report-form.component').then(c => c.ReportFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./report-detail/report-detail.component').then(c => c.ReportDetailComponent)
  }
];

export default reportsRoutes;