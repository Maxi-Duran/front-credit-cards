import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, catchError, of } from 'rxjs';

import { 
  Report, 
  ReportStatus, 
  ReportType, 
  ReportSearchCriteria,
  PaginatedReportResponse,
  ReportSortConfig,
  ReportPaginationConfig
} from '../../../core/models/report.models';
import { ReportService } from '../../../core/services/report.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EmptyStateComponent, EmptyStateConfig } from '../shared/empty-state/empty-state.component';
import { ErrorDisplayComponent, ErrorDisplayConfig } from '../shared/error-display/error-display.component';
import { LoadingStateComponent, LoadingStateConfig } from '../shared/loading-state/loading-state.component';

@Component({
  selector: 'app-reports-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    EmptyStateComponent,
    ErrorDisplayComponent,
    LoadingStateComponent
  ],
  template: `
    <div class="reports-list-container">
      <!-- Header -->
      <div class="header">
        <h1>Gestión de Reportes</h1>
        <button mat-raised-button color="primary" (click)="createReport()">
          <mat-icon>add</mat-icon>
          Nuevo Reporte
        </button>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <form [formGroup]="filtersForm" class="filters-form">
            <div class="filters-row">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Buscar reportes</mat-label>
                <input matInput formControlName="search" placeholder="Título, descripción...">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tipo</mat-label>
                <mat-select formControlName="types" multiple>
                  <mat-option *ngFor="let type of reportTypes" [value]="type.value">
                    {{ type.label }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="statuses" multiple>
                  <mat-option *ngFor="let status of reportStatuses" [value]="status.value">
                    {{ status.label }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="filters-row">
              <mat-form-field appearance="outline">
                <mat-label>Fecha desde</mat-label>
                <input matInput [matDatepicker]="fromPicker" formControlName="dateFrom">
                <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
                <mat-datepicker #fromPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha hasta</mat-label>
                <input matInput [matDatepicker]="toPicker" formControlName="dateTo">
                <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
                <mat-datepicker #toPicker></mat-datepicker>
              </mat-form-field>

              <div class="filter-actions">
                <button mat-button (click)="clearFilters()">
                  <mat-icon>clear</mat-icon>
                  Limpiar
                </button>
                <button mat-raised-button color="primary" (click)="applyFilters()">
                  <mat-icon>filter_list</mat-icon>
                  Filtrar
                </button>
              </div>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Reports Table -->
      <mat-card class="table-card">
        <mat-card-content>
          <div class="table-header">
            <h2>Reportes ({{ totalReports }})</h2>
            <button mat-icon-button (click)="refreshReports()" [disabled]="isLoading">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>

          <div class="table-container">
            <table mat-table [dataSource]="reports" matSort (matSortChange)="onSortChange($event)">
              <!-- Title Column -->
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="title">Título</th>
                <td mat-cell *matCellDef="let report">
                  <div class="title-cell">
                    <div class="report-title">{{ report.title || getReportTypeText(report.type) }}</div>
                    <div class="report-description" *ngIf="report.description">{{ report.description }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Type Column -->
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="type">Tipo</th>
                <td mat-cell *matCellDef="let report">
                  <mat-chip class="type-chip">{{ getReportTypeText(report.type) }}</mat-chip>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="status">Estado</th>
                <td mat-cell *matCellDef="let report">
                  <mat-chip [class]="getStatusClass(report.status)">
                    <mat-icon>{{ getStatusIcon(report.status) }}</mat-icon>
                    {{ getStatusText(report.status) }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Format Column -->
              <ng-container matColumnDef="format">
                <th mat-header-cell *matHeaderCellDef>Formato</th>
                <td mat-cell *matCellDef="let report">{{ report.format.toUpperCase() }}</td>
              </ng-container>

              <!-- Requested Date Column -->
              <ng-container matColumnDef="requestedAt">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="requestedAt">Solicitado</th>
                <td mat-cell *matCellDef="let report">{{ report.requestedAt | date:'dd/MM/yyyy HH:mm' }}</td>
              </ng-container>

              <!-- Completed Date Column -->
              <ng-container matColumnDef="completedAt">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="completedAt">Completado</th>
                <td mat-cell *matCellDef="let report">
                  {{ report.completedAt ? (report.completedAt | date:'dd/MM/yyyy HH:mm') : '-' }}
                </td>
              </ng-container>

              <!-- File Size Column -->
              <ng-container matColumnDef="fileSize">
                <th mat-header-cell *matHeaderCellDef>Tamaño</th>
                <td mat-cell *matCellDef="let report">
                  {{ report.fileSize ? formatFileSize(report.fileSize) : '-' }}
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let report">
                  <button mat-icon-button [matMenuTriggerFor]="actionsMenu" 
                          [matMenuTriggerData]="{report: report}">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                  (click)="viewReport(row)" class="clickable-row"></tr>
            </table>

            <!-- Actions Menu -->
            <mat-menu #actionsMenu="matMenu">
              <ng-template matMenuContent let-report="report">
                <button mat-menu-item (click)="viewReport(report)">
                  <mat-icon>visibility</mat-icon>
                  <span>Ver Detalles</span>
                </button>
                <button mat-menu-item (click)="downloadReport(report)" 
                        [disabled]="!canDownload(report)">
                  <mat-icon>download</mat-icon>
                  <span>Descargar</span>
                </button>
                <button mat-menu-item (click)="duplicateReport(report)">
                  <mat-icon>content_copy</mat-icon>
                  <span>Duplicar</span>
                </button>
                <button mat-menu-item (click)="deleteReport(report)" 
                        [disabled]="!canDelete(report)">
                  <mat-icon>delete</mat-icon>
                  <span>Eliminar</span>
                </button>
              </ng-template>
            </mat-menu>

            <!-- Empty State -->
            <app-empty-state 
              *ngIf="reports.length === 0 && !isLoading && !errorConfig" 
              [config]="emptyStateConfig"
              [actionIcon]="'add'"
              (action)="createReport()">
            </app-empty-state>

            <!-- Loading State -->
            <app-loading-state 
              *ngIf="isLoading" 
              [config]="loadingConfig">
            </app-loading-state>
          </div>

          <!-- Pagination -->
          <mat-paginator 
            [length]="totalReports"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 25, 50, 100]"
            [pageIndex]="currentPage - 1"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>

      <!-- Error Display -->
      <app-error-display 
        *ngIf="errorConfig" 
        [config]="errorConfig"
        (retry)="handleErrorRetry()">
      </app-error-display>
    </div>
  `,
  styles: [`
    .reports-list-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 500;
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 2;
      min-width: 300px;
    }

    .filters-row mat-form-field {
      flex: 1;
      min-width: 200px;
    }

    .filter-actions {
      display: flex;
      gap: 8px;
    }

    .table-card {
      margin-bottom: 24px;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .table-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
    }

    .table-container {
      overflow-x: auto;
    }

    .clickable-row {
      cursor: pointer;
    }

    .clickable-row:hover {
      background-color: #f5f5f5;
    }

    .title-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .report-title {
      font-weight: 500;
    }

    .report-description {
      font-size: 0.875rem;
      color: #666;
    }

    .type-chip {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    /* Status Classes */
    .status-pending {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .status-generating {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .status-completed {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .status-failed {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .status-expired {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .filters-row {
        flex-direction: column;
      }

      .search-field,
      .filters-row mat-form-field {
        width: 100%;
        min-width: unset;
      }

      .filter-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }
  `]
})
export class ReportsListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private reportService = inject(ReportService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);

  filtersForm!: FormGroup;
  reports: Report[] = [];
  totalReports = 0;
  currentPage = 1;
  pageSize = 25;
  isLoading = false;
  errorConfig: ErrorDisplayConfig | null = null;

  displayedColumns = ['title', 'type', 'status', 'format', 'requestedAt', 'completedAt', 'fileSize', 'actions'];

  // Empty state configuration
  emptyStateConfig: EmptyStateConfig = {
    icon: 'description',
    title: 'No se encontraron reportes',
    message: 'No hay reportes que coincidan con los criterios de búsqueda. Cree su primer reporte para comenzar.',
    actionText: 'Crear Primer Reporte',
    showAction: true
  };

  // Loading state configuration
  loadingConfig: LoadingStateConfig = {
    message: 'Cargando reportes...',
    submessage: 'Por favor espere mientras se cargan los datos.',
    indeterminate: true
  };

  reportTypes = [
    { value: ReportType.TRANSACTION_SUMMARY, label: 'Resumen de Transacciones' },
    { value: ReportType.ACCOUNT_STATEMENT, label: 'Estado de Cuenta' },
    { value: ReportType.CARD_ACTIVITY, label: 'Actividad de Tarjeta' },
    { value: ReportType.FRAUD_ANALYSIS, label: 'Análisis de Fraude' },
    { value: ReportType.SPENDING_ANALYSIS, label: 'Análisis de Gastos' },
    { value: ReportType.MERCHANT_ANALYSIS, label: 'Análisis de Comercios' },
    { value: ReportType.MONTHLY_STATEMENT, label: 'Estado Mensual' },
    { value: ReportType.ANNUAL_SUMMARY, label: 'Resumen Anual' }
  ];

  reportStatuses = [
    { value: ReportStatus.PENDING, label: 'Pendiente' },
    { value: ReportStatus.GENERATING, label: 'Generando' },
    { value: ReportStatus.COMPLETED, label: 'Completado' },
    { value: ReportStatus.FAILED, label: 'Fallido' },
    { value: ReportStatus.EXPIRED, label: 'Expirado' }
  ];

  ngOnInit(): void {
    this.initializeFilters();
    this.loadReports();
    this.setupFilterSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeFilters(): void {
    this.filtersForm = this.fb.group({
      search: [''],
      types: [[]],
      statuses: [[]],
      dateFrom: [''],
      dateTo: ['']
    });
  }

  private setupFilterSubscriptions(): void {
    // Auto-search on input changes
    this.filtersForm.get('search')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  private loadReports(): void {
    this.isLoading = true;
    this.errorConfig = null;
    const searchCriteria = this.buildSearchCriteria();

    this.reportService.getReports(searchCriteria)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.handleLoadError(error);
          return of({ 
  reports: [], 
  pagination: { 
    totalItems: 0,
    page: 1,           // Agregado
    pageSize: 10,      // Agregado
    totalPages: 0,     // Agregado
    hasNext: false,    // Agregado
    hasPrevious: false // Agregado
  } 
} as PaginatedReportResponse);
        })
      )
      .subscribe({
        next: (response) => {
          this.reports = response.reports;
          this.totalReports = response.pagination.totalItems;
          this.isLoading = false;
          
          // Update empty state message based on filters
          this.updateEmptyStateConfig();
        }
      });
  }

  private handleLoadError(error: any): void {
    this.isLoading = false;
    this.errorConfig = {
      title: 'Error al cargar reportes',
      message: 'No se pudieron cargar los reportes. Por favor, inténtelo de nuevo.',
      code: error.status ? `HTTP ${error.status}` : 'NETWORK_ERROR',
      details: error.message || 'Error de conexión con el servidor',
      timestamp: new Date(),
      showRetry: true,
      retryText: 'Reintentar Carga',
      showDetails: true
    };
    
    this.notificationService.showError('Error al cargar los reportes');
    console.error('Error loading reports:', error);
  }

  private updateEmptyStateConfig(): void {
    const hasFilters = this.hasActiveFilters();
    
    if (hasFilters) {
      this.emptyStateConfig = {
        icon: 'search_off',
        title: 'No se encontraron resultados',
        message: 'No hay reportes que coincidan con los filtros aplicados. Intente modificar los criterios de búsqueda.',
        actionText: 'Limpiar Filtros',
        showAction: true
      };
    } else {
      this.emptyStateConfig = {
        icon: 'description',
        title: 'No hay reportes disponibles',
        message: 'Aún no se han generado reportes. Cree su primer reporte para comenzar.',
        actionText: 'Crear Primer Reporte',
        showAction: true
      };
    }
  }

  private hasActiveFilters(): boolean {
    const formValue = this.filtersForm.value;
    return !!(
      formValue.search ||
      (formValue.types && formValue.types.length > 0) ||
      (formValue.statuses && formValue.statuses.length > 0) ||
      formValue.dateFrom ||
      formValue.dateTo
    );
  }

  handleErrorRetry(): void {
    this.errorConfig = null;
    this.loadReports();
  }

  private buildSearchCriteria(): ReportSearchCriteria {
    const formValue = this.filtersForm.value;
    
    return {
      query: formValue.search || undefined,
      types: formValue.types?.length > 0 ? formValue.types : undefined,
      statuses: formValue.statuses?.length > 0 ? formValue.statuses : undefined,
      dateRange: (formValue.dateFrom || formValue.dateTo) ? {
        from: formValue.dateFrom || new Date(0),
        to: formValue.dateTo || new Date()
      } : undefined,
      pagination: {
        page: this.currentPage,
        pageSize: this.pageSize
      },
      sorting: {
        field: 'requestedAt',
        direction: 'desc'
      }
    };
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadReports();
  }

  clearFilters(): void {
    this.filtersForm.reset({
      search: '',
      types: [],
      statuses: [],
      dateFrom: '',
      dateTo: ''
    });
    this.applyFilters();
  }

  createReport(): void {
    // Handle both empty state actions
    if (this.emptyStateConfig.actionText === 'Limpiar Filtros') {
      this.clearFilters();
    } else {
      this.router.navigate(['/reports/new']);
    }
  }

  refreshReports(): void {
    this.errorConfig = null;
    this.loadReports();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadReports();
  }

  onSortChange(sort: Sort): void {
    // Implement sorting logic
    this.loadReports();
  }

  viewReport(report: Report): void {
    this.router.navigate(['/reports', report.id]);
  }

  downloadReport(report: Report): void {
    if (!this.canDownload(report)) {
      return;
    }

    this.reportService.downloadReport({ reportId: report.id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Create download link
          const link = document.createElement('a');
          link.href = response.downloadUrl;
          link.download = response.fileName;
          link.click();
          
          this.notificationService.showSuccess('Descarga iniciada');
        },
        error: (error) => {
          this.notificationService.showError('Error al descargar el reporte');
          console.error('Download error:', error);
        }
      });
  }

  duplicateReport(report: Report): void {
    // Navigate to form with pre-filled configuration
    this.router.navigate(['/reports/new'], {
      queryParams: { duplicate: report.id }
    });
  }

  deleteReport(report: Report): void {
    if (!this.canDelete(report)) {
      return;
    }

    if (confirm('¿Está seguro de que desea eliminar este reporte?')) {
      this.reportService.deleteReport(report.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Reporte eliminado');
            this.loadReports();
          },
          error: (error) => {
            this.notificationService.showError('Error al eliminar el reporte');
            console.error('Delete error:', error);
          }
        });
    }
  }

  canDownload(report: Report): boolean {
    return this.reportService.isReportReady(report);
  }

  canDelete(report: Report): boolean {
    return report.status !== ReportStatus.GENERATING;
  }

  getStatusClass(status: ReportStatus): string {
    return `status-${status}`;
  }

  getStatusIcon(status: ReportStatus): string {
    const icons = {
      [ReportStatus.PENDING]: 'schedule',
      [ReportStatus.GENERATING]: 'autorenew',
      [ReportStatus.COMPLETED]: 'check_circle',
      [ReportStatus.FAILED]: 'error',
      [ReportStatus.EXPIRED]: 'access_time'
    };
    return icons[status] || 'help';
  }

  getStatusText(status: ReportStatus): string {
    return this.reportService.getReportStatusText(status, 'es');
  }

  getReportTypeText(type: ReportType): string {
    return this.reportService.getReportTypeText(type, 'es');
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}