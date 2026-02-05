import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { Subject, takeUntil, catchError, of } from 'rxjs';

import { 
  ReportType, 
  ReportFormat, 
  ReportPeriod, 
  ReportConfiguration,
  CreateReportRequest,
  ReportTemplate,
  ReportValidationResult
} from '../../../core/models/report.models';
import { ReportService } from '../../../core/services/report.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ErrorDisplayComponent, ErrorDisplayConfig } from '../shared/error-display/error-display.component';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    ErrorDisplayComponent
  ],
  template: `
    <div class="report-form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Generar Nuevo Reporte</mat-card-title>
          <mat-card-subtitle>Configure los parámetros del reporte</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <mat-stepper [linear]="true" #stepper>
            <!-- Step 1: Report Type and Basic Configuration -->
            <mat-step [stepControl]="basicConfigForm" label="Configuración Básica">
              <form [formGroup]="basicConfigForm">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Tipo de Reporte</mat-label>
                    <mat-select formControlName="type" required>
                      <mat-option *ngFor="let type of reportTypes" [value]="type.value">
                        {{ type.label }}
                      </mat-option>
                    </mat-select>
                    <mat-error *ngIf="basicConfigForm.get('type')?.hasError('required')">
                      El tipo de reporte es requerido
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Formato</mat-label>
                    <mat-select formControlName="format" required>
                      <mat-option *ngFor="let format of reportFormats" [value]="format.value">
                        {{ format.label }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Período</mat-label>
                    <mat-select formControlName="period" required>
                      <mat-option *ngFor="let period of reportPeriods" [value]="period.value">
                        {{ period.label }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Título del Reporte</mat-label>
                    <input matInput formControlName="title" placeholder="Ingrese un título descriptivo">
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Descripción</mat-label>
                    <textarea matInput formControlName="description" rows="3" 
                              placeholder="Descripción opcional del reporte"></textarea>
                  </mat-form-field>
                </div>

                <div class="step-actions">
                  <button mat-raised-button color="primary" matStepperNext 
                          [disabled]="!basicConfigForm.valid">
                    Siguiente
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 2: Date Range -->
            <mat-step [stepControl]="dateRangeForm" label="Rango de Fechas">
              <form [formGroup]="dateRangeForm">
                <div class="form-row" *ngIf="basicConfigForm.get('period')?.value === 'custom'">
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Fecha Desde</mat-label>
                    <input matInput [matDatepicker]="fromPicker" formControlName="dateFrom" required>
                    <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
                    <mat-datepicker #fromPicker></mat-datepicker>
                    <mat-error *ngIf="dateRangeForm.get('dateFrom')?.hasError('required')">
                      La fecha desde es requerida
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Fecha Hasta</mat-label>
                    <input matInput [matDatepicker]="toPicker" formControlName="dateTo" required>
                    <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
                    <mat-datepicker #toPicker></mat-datepicker>
                    <mat-error *ngIf="dateRangeForm.get('dateTo')?.hasError('required')">
                      La fecha hasta es requerida
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="info-message" *ngIf="basicConfigForm.get('period')?.value !== 'custom'">
                  <mat-icon>info</mat-icon>
                  <span>Las fechas se configurarán automáticamente según el período seleccionado: 
                    {{ getPeriodDescription(basicConfigForm.get('period')?.value) }}</span>
                </div>

                <div class="step-actions">
                  <button mat-button matStepperPrevious>Anterior</button>
                  <button mat-raised-button color="primary" matStepperNext 
                          [disabled]="!dateRangeForm.valid">
                    Siguiente
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 3: Filters and Options -->
            <mat-step [stepControl]="filtersForm" label="Filtros y Opciones">
              <form [formGroup]="filtersForm">
                <div class="form-section">
                  <h3>Filtros de Datos</h3>
                  
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="half-width">
                      <mat-label>Monto Mínimo</mat-label>
                      <input matInput type="number" formControlName="amountMin" 
                             placeholder="0.00" min="0" step="0.01">
                      <span matPrefix>$</span>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="half-width">
                      <mat-label>Monto Máximo</mat-label>
                      <input matInput type="number" formControlName="amountMax" 
                             placeholder="Sin límite" min="0" step="0.01">
                      <span matPrefix>$</span>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Tipos de Transacción</mat-label>
                      <mat-select formControlName="transactionTypes" multiple>
                        <mat-option *ngFor="let type of transactionTypes" [value]="type.value">
                          {{ type.label }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-checkbox formControlName="fraudOnly">
                      Solo transacciones con indicador de fraude
                    </mat-checkbox>
                  </div>
                </div>

                <div class="form-section">
                  <h3>Opciones de Presentación</h3>
                  
                  <div class="form-row">
                    <mat-checkbox formControlName="includeCharts">
                      Incluir gráficos
                    </mat-checkbox>
                  </div>

                  <div class="form-row">
                    <mat-checkbox formControlName="includeSummary">
                      Incluir resumen ejecutivo
                    </mat-checkbox>
                  </div>

                  <div class="form-row">
                    <mat-checkbox formControlName="includeDetails">
                      Incluir detalles de transacciones
                    </mat-checkbox>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="half-width">
                      <mat-label>Agrupar por</mat-label>
                      <mat-select formControlName="groupBy">
                        <mat-option value="">Sin agrupación</mat-option>
                        <mat-option value="date">Fecha</mat-option>
                        <mat-option value="category">Categoría</mat-option>
                        <mat-option value="merchant">Comercio</mat-option>
                        <mat-option value="card">Tarjeta</mat-option>
                        <mat-option value="account">Cuenta</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="half-width">
                      <mat-label>Máximo de registros</mat-label>
                      <mat-select formControlName="maxRecords">
                        <mat-option value="1000">1,000</mat-option>
                        <mat-option value="5000">5,000</mat-option>
                        <mat-option value="10000">10,000</mat-option>
                        <mat-option value="50000">50,000</mat-option>
                        <mat-option value="">Sin límite</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>

                <div class="step-actions">
                  <button mat-button matStepperPrevious>Anterior</button>
                  <button mat-raised-button color="primary" matStepperNext>
                    Siguiente
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 4: Review and Generate -->
            <mat-step label="Revisar y Generar">
              <div class="review-section">
                <h3>Resumen de Configuración</h3>
                
                <div class="config-summary">
                  <div class="summary-item">
                    <strong>Tipo:</strong> {{ getReportTypeLabel(basicConfigForm.get('type')?.value) }}
                  </div>
                  <div class="summary-item">
                    <strong>Formato:</strong> {{ getReportFormatLabel(basicConfigForm.get('format')?.value) }}
                  </div>
                  <div class="summary-item">
                    <strong>Período:</strong> {{ getPeriodDescription(basicConfigForm.get('period')?.value) }}
                  </div>
                  <div class="summary-item" *ngIf="basicConfigForm.get('title')?.value">
                    <strong>Título:</strong> {{ basicConfigForm.get('title')?.value }}
                  </div>
                  <div class="summary-item" *ngIf="filtersForm.get('amountMin')?.value || filtersForm.get('amountMax')?.value">
                    <strong>Rango de Montos:</strong> 
                    \${{ filtersForm.get('amountMin')?.value || '0' }} - 
                    \${{ filtersForm.get('amountMax')?.value || '∞' }}
                  </div>
                </div>

                <div class="validation-results" *ngIf="validationResult">
                  <div class="validation-errors" *ngIf="validationResult.errors.length > 0">
                    <h4>Errores de Validación:</h4>
                    <ul>
                      <li *ngFor="let error of validationResult.errors" class="error-item">
                        {{ error.message }}
                      </li>
                    </ul>
                  </div>

                  <div class="validation-warnings" *ngIf="validationResult.warnings.length > 0">
                    <h4>Advertencias:</h4>
                    <ul>
                      <li *ngFor="let warning of validationResult.warnings" class="warning-item">
                        {{ warning.message }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="step-actions">
                <button mat-button matStepperPrevious>Anterior</button>
                <button mat-button (click)="validateConfiguration()" 
                        [disabled]="isValidating">
                  <mat-icon *ngIf="isValidating">
                    <mat-spinner diameter="20"></mat-spinner>
                  </mat-icon>
                  Validar Configuración
                </button>
                <button mat-raised-button color="primary" (click)="generateReport()" 
                        [disabled]="!canGenerateReport() || isGenerating">
                  <mat-icon *ngIf="isGenerating">
                    <mat-spinner diameter="20"></mat-spinner>
                  </mat-icon>
                  Generar Reporte
                </button>
              </div>
            </mat-step>
          </mat-stepper>
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
    .report-form-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .half-width {
      flex: 1;
    }

    .form-section {
      margin-bottom: 32px;
    }

    .form-section h3 {
      margin-bottom: 16px;
      color: #1976d2;
    }

    .step-actions {
      display: flex;
      gap: 16px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .info-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background-color: #e3f2fd;
      border-radius: 4px;
      color: #1976d2;
    }

    .review-section {
      padding: 16px 0;
    }

    .config-summary {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 24px;
    }

    .summary-item {
      margin-bottom: 8px;
    }

    .validation-results {
      margin-top: 16px;
    }

    .validation-errors {
      background-color: #ffebee;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .validation-errors h4 {
      color: #d32f2f;
      margin-bottom: 8px;
    }

    .error-item {
      color: #d32f2f;
    }

    .validation-warnings {
      background-color: #fff3e0;
      padding: 16px;
      border-radius: 4px;
    }

    .validation-warnings h4 {
      color: #f57c00;
      margin-bottom: 8px;
    }

    .warning-item {
      color: #f57c00;
    }

    mat-spinner {
      display: inline-block;
    }
  `]
})
export class ReportFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private reportService = inject(ReportService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);

  basicConfigForm!: FormGroup;
  dateRangeForm!: FormGroup;
  filtersForm!: FormGroup;

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

  reportFormats = [
    { value: ReportFormat.PDF, label: 'PDF' },
    { value: ReportFormat.CSV, label: 'CSV' },
    { value: ReportFormat.EXCEL, label: 'Excel' },
    { value: ReportFormat.JSON, label: 'JSON' }
  ];

  reportPeriods = [
    { value: ReportPeriod.DAILY, label: 'Diario' },
    { value: ReportPeriod.WEEKLY, label: 'Semanal' },
    { value: ReportPeriod.MONTHLY, label: 'Mensual' },
    { value: ReportPeriod.QUARTERLY, label: 'Trimestral' },
    { value: ReportPeriod.YEARLY, label: 'Anual' },
    { value: ReportPeriod.CUSTOM, label: 'Personalizado' }
  ];

  transactionTypes = [
    { value: 'purchase', label: 'Compra' },
    { value: 'withdrawal', label: 'Retiro' },
    { value: 'payment', label: 'Pago' },
    { value: 'refund', label: 'Reembolso' },
    { value: 'transfer', label: 'Transferencia' },
    { value: 'fee', label: 'Comisión' },
    { value: 'interest', label: 'Interés' }
  ];

  validationResult: ReportValidationResult | null = null;
  isValidating = false;
  isGenerating = false;
  errorConfig: ErrorDisplayConfig | null = null;

  ngOnInit(): void {
    this.initializeForms();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.basicConfigForm = this.fb.group({
      type: ['', Validators.required],
      format: [ReportFormat.PDF, Validators.required],
      period: [ReportPeriod.MONTHLY, Validators.required],
      title: [''],
      description: ['']
    });

    this.dateRangeForm = this.fb.group({
      dateFrom: [''],
      dateTo: ['']
    });

    this.filtersForm = this.fb.group({
      amountMin: [''],
      amountMax: [''],
      transactionTypes: [[]],
      fraudOnly: [false],
      includeCharts: [true],
      includeSummary: [true],
      includeDetails: [true],
      groupBy: [''],
      maxRecords: [10000]
    });

    // Add conditional validators for custom date range
    this.basicConfigForm.get('period')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(period => {
        const dateFromControl = this.dateRangeForm.get('dateFrom');
        const dateToControl = this.dateRangeForm.get('dateTo');

        if (period === ReportPeriod.CUSTOM) {
          dateFromControl?.setValidators([Validators.required]);
          dateToControl?.setValidators([Validators.required]);
        } else {
          dateFromControl?.clearValidators();
          dateToControl?.clearValidators();
        }

        dateFromControl?.updateValueAndValidity();
        dateToControl?.updateValueAndValidity();
      });
  }

  validateConfiguration(): void {
    this.isValidating = true;
    this.errorConfig = null;
    const configuration = this.buildReportConfiguration();

    this.reportService.validateReportConfiguration(configuration)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.handleValidationError(error);
          return of(null);
        })
      )
      .subscribe({
        next: (result) => {
          if (result) {
            this.validationResult = result;
            this.isValidating = false;
            
            if (result.isValid) {
              this.notificationService.showSuccess('Configuración válida');
            } else {
              this.notificationService.showWarning('Se encontraron errores en la configuración');
            }
          }
        }
      });
  }

  generateReport(): void {
    if (!this.canGenerateReport()) {
      return;
    }

    this.isGenerating = true;
    this.errorConfig = null;
    const reportRequest: CreateReportRequest = {
      configuration: this.buildReportConfiguration(),
      priority: 'normal',
      notifyOnCompletion: true
    };

    this.reportService.generateReport(reportRequest)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.handleGenerationError(error);
          return of(null);
        })
      )
      .subscribe({
        next: (report) => {
          if (report) {
            this.isGenerating = false;
            this.notificationService.showSuccess('Reporte generado exitosamente');
            this.router.navigate(['/reports', report.id]);
          }
        }
      });
  }

  private handleValidationError(error: any): void {
    this.isValidating = false;
    this.errorConfig = {
      title: 'Error de Validación',
      message: 'No se pudo validar la configuración del reporte. Verifique los datos ingresados.',
      code: error.status ? `HTTP ${error.status}` : 'VALIDATION_ERROR',
      details: error.message || 'Error al comunicarse con el servidor de validación',
      timestamp: new Date(),
      showRetry: true,
      retryText: 'Reintentar Validación',
      showDetails: true
    };
    
    this.notificationService.showError('Error al validar la configuración');
    console.error('Validation error:', error);
  }

  private handleGenerationError(error: any): void {
    this.isGenerating = false;
    this.errorConfig = {
      title: 'Error al Generar Reporte',
      message: 'No se pudo generar el reporte. Verifique la configuración e inténtelo nuevamente.',
      code: error.status ? `HTTP ${error.status}` : 'GENERATION_ERROR',
      details: error.message || 'Error al comunicarse con el servidor de reportes',
      timestamp: new Date(),
      showRetry: true,
      retryText: 'Reintentar Generación',
      showDetails: true
    };
    
    this.notificationService.showError('Error al generar el reporte');
    console.error('Report generation error:', error);
  }

  handleErrorRetry(): void {
    this.errorConfig = null;
    
    // Determine what action to retry based on the current state
    if (this.validationResult === null) {
      this.validateConfiguration();
    } else {
      this.generateReport();
    }
  }

  private buildReportConfiguration(): ReportConfiguration {
    const basicConfig = this.basicConfigForm.value;
    const dateRange = this.dateRangeForm.value;
    const filters = this.filtersForm.value;

    // Calculate date range based on period
    const calculatedDateRange = this.calculateDateRange(basicConfig.period, dateRange);

    return {
      type: basicConfig.type,
      format: basicConfig.format,
      period: basicConfig.period,
      dateRange: calculatedDateRange,
      filters: {
        amountRange: {
          min: filters.amountMin || undefined,
          max: filters.amountMax || undefined
        },
        transactionTypes: filters.transactionTypes?.length > 0 ? filters.transactionTypes : undefined,
        fraudOnly: filters.fraudOnly || undefined
      },
      options: {
        includeCharts: filters.includeCharts,
        includeSummary: filters.includeSummary,
        includeDetails: filters.includeDetails,
        groupBy: filters.groupBy || undefined,
        maxRecords: filters.maxRecords || undefined,
        language: 'es'
      },
      title: basicConfig.title || undefined,
      description: basicConfig.description || undefined
    };
  }

  private calculateDateRange(period: ReportPeriod, customRange: any): { from: Date; to: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case ReportPeriod.DAILY:
        return { from: today, to: today };
      
      case ReportPeriod.WEEKLY:
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return { from: weekStart, to: weekEnd };
      
      case ReportPeriod.MONTHLY:
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { from: monthStart, to: monthEnd };
      
      case ReportPeriod.QUARTERLY:
        const quarter = Math.floor(today.getMonth() / 3);
        const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
        const quarterEnd = new Date(today.getFullYear(), quarter * 3 + 3, 0);
        return { from: quarterStart, to: quarterEnd };
      
      case ReportPeriod.YEARLY:
        const yearStart = new Date(today.getFullYear(), 0, 1);
        const yearEnd = new Date(today.getFullYear(), 11, 31);
        return { from: yearStart, to: yearEnd };
      
      case ReportPeriod.CUSTOM:
        return {
          from: customRange.dateFrom || today,
          to: customRange.dateTo || today
        };
      
      default:
        return { from: today, to: today };
    }
  }

  canGenerateReport(): boolean {
    return this.basicConfigForm.valid && 
           this.dateRangeForm.valid && 
           this.filtersForm.valid &&
           (!this.validationResult || this.validationResult.isValid);
  }

  getPeriodDescription(period: ReportPeriod): string {
    const descriptions = {
      [ReportPeriod.DAILY]: 'Día actual',
      [ReportPeriod.WEEKLY]: 'Semana actual',
      [ReportPeriod.MONTHLY]: 'Mes actual',
      [ReportPeriod.QUARTERLY]: 'Trimestre actual',
      [ReportPeriod.YEARLY]: 'Año actual',
      [ReportPeriod.CUSTOM]: 'Rango personalizado'
    };
    return descriptions[period] || period;
  }

  getReportTypeLabel(type: ReportType): string {
    const typeObj = this.reportTypes.find(t => t.value === type);
    return typeObj?.label || type;
  }

  getReportFormatLabel(format: ReportFormat): string {
    const formatObj = this.reportFormats.find(f => f.value === format);
    return formatObj?.label || format;
  }
}