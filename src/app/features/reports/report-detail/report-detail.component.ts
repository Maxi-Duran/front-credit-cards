import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, interval, switchMap, takeWhile, catchError, of } from 'rxjs';

import { 
  Report, 
  ReportStatus, 
  ReportData, 
  ReportDownloadRequest,
  ReportFormat,
  ReportChart
} from '../../../core/models/report.models';
import { ReportService } from '../../../core/services/report.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EmptyStateComponent, EmptyStateConfig } from '../shared/empty-state/empty-state.component';
import { ErrorDisplayComponent, ErrorDisplayConfig } from '../shared/error-display/error-display.component';
import { LoadingStateComponent, LoadingStateConfig } from '../shared/loading-state/loading-state.component';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatTabsModule,
    MatMenuModule,
    MatDialogModule,
    ErrorDisplayComponent,
    LoadingStateComponent
  ],
  template: `
    <div class="report-detail-container" *ngIf="report">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <button mat-icon-button (click)="goBack()" class="back-button">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="title-section">
            <h1>{{ report.title || getReportTypeText(report.type) }}</h1>
            <p class="subtitle" *ngIf="report.description">{{ report.description }}</p>
          </div>
        </div>
        
        <div class="header-actions">
          <mat-chip-set>
            <mat-chip [class]="getStatusClass(report.status)">
              <mat-icon>{{ getStatusIcon(report.status) }}</mat-icon>
              {{ getStatusText(report.status) }}
            </mat-chip>
          </mat-chip-set>
          
          <button mat-button [matMenuTriggerFor]="actionsMenu" 
                  [disabled]="!canPerformActions()">
            <mat-icon>more_vert</mat-icon>
          </button>
          
          <mat-menu #actionsMenu="matMenu">
            <button mat-menu-item (click)="downloadReport()" 
                    [disabled]="!canDownload()">
              <mat-icon>download</mat-icon>
              <span>Descargar</span>
            </button>
            <button mat-menu-item (click)="downloadReport('csv')" 
                    [disabled]="!canDownload()">
              <mat-icon>table_chart</mat-icon>
              <span>Descargar como CSV</span>
            </button>
            <button mat-menu-item (click)="downloadReport('excel')" 
                    [disabled]="!canDownload()">
              <mat-icon>description</mat-icon>
              <span>Descargar como Excel</span>
            </button>
            <button mat-menu-item (click)="refreshReport()" 
                    [disabled]="!canRefresh()">
              <mat-icon>refresh</mat-icon>
              <span>Actualizar</span>
            </button>
            <button mat-menu-item (click)="deleteReport()" 
                    [disabled]="!canDelete()">
              <mat-icon>delete</mat-icon>
              <span>Eliminar</span>
            </button>
          </mat-menu>
        </div>
      </div>

      <!-- Progress Bar for Generating Reports -->
      <mat-card *ngIf="isInProgress()" class="progress-card">
        <mat-card-content>
          <div class="progress-content">
            <div class="progress-info">
              <h3>Generando Reporte...</h3>
              <p *ngIf="report.progress">{{ report.progress.currentStep }}</p>
            </div>
            <mat-progress-bar 
              mode="determinate" 
              [value]="report.progress?.percentage || 0">
            </mat-progress-bar>
            <div class="progress-details" *ngIf="report.progress">
              <span>{{ report.progress.percentage }}% completado</span>
              <span *ngIf="report.progress.estimatedTimeRemaining">
                Tiempo estimado: {{ formatTime(report.progress.estimatedTimeRemaining) }}
              </span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Error Display -->
      <mat-card *ngIf="report.status === 'failed'" class="error-card">
        <mat-card-content>
          <div class="error-content">
            <mat-icon class="error-icon">error</mat-icon>
            <div class="error-details">
              <h3>Error al Generar Reporte</h3>
              <p *ngIf="report.error">{{ report.error.message }}</p>
              <p class="error-code" *ngIf="report.error">Código: {{ report.error.code }}</p>
            </div>
            <button mat-raised-button color="primary" (click)="retryGeneration()">
              <mat-icon>refresh</mat-icon>
              Reintentar
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Report Information -->
      <mat-card class="info-card">
        <mat-card-header>
          <mat-card-title>Información del Reporte</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="info-grid">
            <div class="info-item">
              <strong>Tipo:</strong>
              <span>{{ getReportTypeText(report.type) }}</span>
            </div>
            <div class="info-item">
              <strong>Formato:</strong>
              <span>{{ report.format.toUpperCase() }}</span>
            </div>
            <div class="info-item">
              <strong>Solicitado:</strong>
              <span>{{ report.requestedAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="info-item" *ngIf="report.completedAt">
              <strong>Completado:</strong>
              <span>{{ report.completedAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="info-item" *ngIf="report.recordCount">
              <strong>Registros:</strong>
              <span>{{ report.recordCount | number }}</span>
            </div>
            <div class="info-item" *ngIf="report.fileSize">
              <strong>Tamaño:</strong>
              <span>{{ formatFileSize(report.fileSize) }}</span>
            </div>
            <div class="info-item" *ngIf="report.expiresAt">
              <strong>Expira:</strong>
              <span>{{ report.expiresAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Report Preview (for completed reports) -->
      <div *ngIf="report.status === 'completed' && reportData" class="preview-section">
        <mat-tab-group>
          <!-- Summary Tab -->
          <mat-tab label="Resumen" *ngIf="reportData.summary">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Resumen Ejecutivo</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="summary-grid">
                    <div class="summary-item">
                      <div class="summary-value">{{ reportData.summary.totalRecords | number }}</div>
                      <div class="summary-label">Total de Registros</div>
                    </div>
                    <div class="summary-item">
                      <div class="summary-value">{{ reportData.summary.totalAmount | currency:'USD':'symbol':'1.2-2' }}</div>
                      <div class="summary-label">Monto Total</div>
                    </div>
                    <div class="summary-item">
                      <div class="summary-value">{{ reportData.summary.averageAmount | currency:'USD':'symbol':'1.2-2' }}</div>
                      <div class="summary-label">Promedio</div>
                    </div>
                    <div class="summary-item">
                      <div class="summary-value">{{ reportData.summary.dateRange.from | date:'dd/MM/yyyy' }} - {{ reportData.summary.dateRange.to | date:'dd/MM/yyyy' }}</div>
                      <div class="summary-label">Período</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Charts Tab -->
          <mat-tab label="Gráficos" *ngIf="reportData.charts && reportData.charts.length > 0">
            <div class="tab-content">
              <div class="charts-grid">
                <mat-card *ngFor="let chart of reportData.charts" class="chart-card">
                  <mat-card-header>
                    <mat-card-title>{{ chart.title }}</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="chart-placeholder">
                      <mat-icon>bar_chart</mat-icon>
                      <p>Gráfico: {{ chart.type }}</p>
                      <p class="chart-data-count">{{ chart.data.length }} elementos</p>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Data Tab -->
          <mat-tab label="Datos" *ngIf="reportData.details && reportData.details.length > 0">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Detalles de Datos</mat-card-title>
                  <mat-card-subtitle>{{ reportData.details.length }} registros</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="table-container">
                    <table mat-table [dataSource]="reportData.details" class="data-table">
                      <ng-container matColumnDef="date">
                        <th mat-header-cell *matHeaderCellDef>Fecha</th>
                        <td mat-cell *matCellDef="let element">{{ element.date | date:'dd/MM/yyyy' }}</td>
                      </ng-container>

                      <ng-container matColumnDef="description">
                        <th mat-header-cell *matHeaderCellDef>Descripción</th>
                        <td mat-cell *matCellDef="let element">{{ element.description }}</td>
                      </ng-container>

                      <ng-container matColumnDef="amount">
                        <th mat-header-cell *matHeaderCellDef>Monto</th>
                        <td mat-cell *matCellDef="let element">{{ element.amount | currency:'USD':'symbol':'1.2-2' }}</td>
                      </ng-container>

                      <ng-container matColumnDef="category">
                        <th mat-header-cell *matHeaderCellDef>Categoría</th>
                        <td mat-cell *matCellDef="let element">{{ element.category }}</td>
                      </ng-container>

                      <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef>Estado</th>
                        <td mat-cell *matCellDef="let element">
                          <mat-chip [class]="getDataStatusClass(element.status)">
                            {{ element.status }}
                          </mat-chip>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                    </table>

                    <mat-paginator 
                      [pageSizeOptions]="[10, 25, 50, 100]"
                      [pageSize]="25"
                      showFirstLastButtons>
                    </mat-paginator>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Metadata Tab -->
          <mat-tab label="Metadatos" *ngIf="reportData.metadata">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Información Técnica</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="metadata-grid">
                    <div class="metadata-item">
                      <strong>Generado por:</strong>
                      <span>{{ reportData.metadata.generatedBy }}</span>
                    </div>
                    <div class="metadata-item">
                      <strong>Versión:</strong>
                      <span>{{ reportData.metadata.version }}</span>
                    </div>
                    <div class="metadata-item">
                      <strong>Tiempo de ejecución:</strong>
                      <span>{{ formatTime(reportData.metadata.executionTime) }}</span>
                    </div>
                    <div class="metadata-item">
                      <strong>Fuente de datos:</strong>
                      <span>{{ reportData.metadata.dataSource }}</span>
                    </div>
                    <div class="metadata-item">
                      <strong>Registros totales:</strong>
                      <span>{{ reportData.metadata.totalRecords | number }}</span>
                    </div>
                    <div class="metadata-item">
                      <strong>Registros filtrados:</strong>
                      <span>{{ reportData.metadata.filteredRecords | number }}</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>

    <!-- Loading State -->
    <app-loading-state 
      *ngIf="!report && !errorConfig" 
      [config]="loadingConfig">
    </app-loading-state>

    <!-- Error State -->
    <app-error-display 
      *ngIf="errorConfig" 
      [config]="errorConfig"
      (retry)="handleErrorRetry()">
    </app-error-display>
  `,
  styles: [`
    .report-detail-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-content {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .back-button {
      margin-top: 8px;
    }

    .title-section h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 500;
    }

    .subtitle {
      margin: 8px 0 0 0;
      color: #666;
      font-size: 1rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .progress-card, .error-card, .info-card {
      margin-bottom: 24px;
    }

    .progress-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .progress-details {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: #666;
    }

    .error-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .error-icon {
      font-size: 48px;
      color: #f44336;
    }

    .error-details h3 {
      margin: 0 0 8px 0;
      color: #f44336;
    }

    .error-code {
      font-family: monospace;
      font-size: 0.875rem;
      color: #666;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }

    .preview-section {
      margin-top: 24px;
    }

    .tab-content {
      padding: 24px 0;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
    }

    .summary-item {
      text-align: center;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .summary-value {
      font-size: 2rem;
      font-weight: 600;
      color: #1976d2;
      margin-bottom: 8px;
    }

    .summary-label {
      font-size: 0.875rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .chart-card {
      min-height: 300px;
    }

    .chart-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      background-color: #f5f5f5;
      border-radius: 8px;
      color: #666;
    }

    .chart-placeholder mat-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .chart-data-count {
      font-size: 0.875rem;
      margin-top: 8px;
    }

    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
    }

    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .metadata-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
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

    .data-status-completed {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .data-status-pending {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .data-status-failed {
      background-color: #ffebee;
      color: #d32f2f;
    }
  `]
})
export class ReportDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reportService = inject(ReportService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  report: Report | null = null;
  reportData: ReportData | null = null;
  displayedColumns = ['date', 'description', 'amount', 'category', 'status'];
  errorConfig: ErrorDisplayConfig | null = null;

  // Loading state configuration
  loadingConfig: LoadingStateConfig = {
    message: 'Cargando reporte...',
    submessage: 'Por favor espere mientras se cargan los detalles del reporte.',
    indeterminate: true
  };

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const reportId = params['id'];
        if (reportId) {
          this.loadReport(reportId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadReport(reportId: string): void {
    this.loadingService.show();
    this.errorConfig = null;
    
    this.reportService.getReport(reportId)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.handleLoadError(error, reportId);
          return of(null);
        })
      )
      .subscribe({
        next: (report) => {
          if (report) {
            this.report = report;
            this.loadingService.hide();
            
            // Start polling if report is in progress
            if (this.isInProgress()) {
              this.startStatusPolling(reportId);
            }
            
            // Load report data if completed
            if (report.status === ReportStatus.COMPLETED) {
              this.loadReportData(reportId);
            }
          }
        }
      });
  }

  private handleLoadError(error: any, reportId: string): void {
    this.loadingService.hide();
    this.errorConfig = {
      title: 'Error al cargar el reporte',
      message: 'No se pudo cargar la información del reporte. Verifique que el reporte existe y que tiene permisos para acceder a él.',
      code: error.status ? `HTTP ${error.status}` : 'NETWORK_ERROR',
      details: error.message || 'Error de conexión con el servidor',
      timestamp: new Date(),
      showRetry: true,
      retryText: 'Reintentar Carga',
      showDetails: true
    };
    
    this.notificationService.showError('Error al cargar el reporte');
    console.error('Error loading report:', error);
  }

  handleErrorRetry(): void {
    const reportId = this.route.snapshot.params['id'];
    if (reportId) {
      this.errorConfig = null;
      this.loadReport(reportId);
    }
  }

  private loadReportData(reportId: string): void {
    this.reportService.getReportData(reportId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.reportData = data;
        },
        error: (error) => {
          console.error('Error loading report data:', error);
          // Don't show error notification as this is optional data
        }
      });
  }

  private startStatusPolling(reportId: string): void {
    this.reportService.pollReportStatus(reportId, 3000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (report) => {
          this.report = report;
          
          // Load data when report completes
          if (report.status === ReportStatus.COMPLETED) {
            this.loadReportData(reportId);
            this.notificationService.showSuccess('Reporte generado exitosamente');
          } else if (report.status === ReportStatus.FAILED) {
            this.notificationService.showError('Error al generar el reporte');
          }
        },
        error: (error) => {
          console.error('Error polling report status:', error);
        }
      });
  }

  downloadReport(format?: string): void {
    if (!this.report || !this.canDownload()) {
      return;
    }

    const downloadRequest: ReportDownloadRequest = {
      reportId: this.report.id,
      format: (format as ReportFormat) || this.report.format
    };

    this.reportService.downloadReport(downloadRequest)
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

  refreshReport(): void {
    if (!this.report) return;
    this.loadReport(this.report.id);
  }

  deleteReport(): void {
    if (!this.report || !this.canDelete()) {
      return;
    }

    // In a real implementation, you would show a confirmation dialog
    if (confirm('¿Está seguro de que desea eliminar este reporte?')) {
      this.reportService.deleteReport(this.report.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Reporte eliminado');
            this.router.navigate(['/reports']);
          },
          error: (error) => {
            this.notificationService.showError('Error al eliminar el reporte');
            console.error('Delete error:', error);
          }
        });
    }
  }

  retryGeneration(): void {
    if (!this.report) return;
    
    // Navigate back to form with pre-filled data
    this.router.navigate(['/reports/new'], {
      queryParams: { retry: this.report.id }
    });
  }

  goBack(): void {
    this.router.navigate(['/reports']);
  }

  isInProgress(): boolean {
    return this.report ? this.reportService.isReportInProgress(this.report) : false;
  }

  canDownload(): boolean {
    return this.report ? this.reportService.isReportReady(this.report) : false;
  }

  canRefresh(): boolean {
    return !!this.report;
  }

  canDelete(): boolean {
    return this.report ? 
      this.report.status !== ReportStatus.GENERATING : false;
  }

  canPerformActions(): boolean {
    return !!this.report;
  }

  getStatusClass(status: ReportStatus): string {
    return `status-${status}`;
  }

  getDataStatusClass(status: string): string {
    return `data-status-${status}`;
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

  getReportTypeText(type: string): string {
    return this.reportService.getReportTypeText(type as any, 'es');
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}