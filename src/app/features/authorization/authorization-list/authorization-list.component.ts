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
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { 
  Authorization, 
  AuthorizationStatus, 
  AuthorizationFilter 
} from '../../../core/models/authorization.models';
import { AuthorizationService } from '../../../core/services/authorization.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthorizationDenialDialogComponent } from '../authorization-denial-dialog/authorization-denial-dialog.component';

@Component({
  selector: 'app-authorization-list',
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
    MatSnackBarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="authorization-list-container">
      <!-- Header -->
      <div class="header">
        <h1>Gestión de Autorizaciones</h1>
        <div class="header-actions">
          <button mat-raised-button color="accent" (click)="refreshAuthorizations()" [disabled]="isLoading">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards" *ngIf="summary">
        <mat-card class="summary-card pending">
          <mat-card-content>
            <div class="summary-content">
              <mat-icon>pending</mat-icon>
              <div class="summary-text">
                <h3>{{ summary.totalPending }}</h3>
                <p>Pendientes</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card high-risk">
          <mat-card-content>
            <div class="summary-content">
              <mat-icon>warning</mat-icon>
              <div class="summary-text">
                <h3>{{ summary.highRiskCount }}</h3>
                <p>Alto Riesgo</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card approved">
          <mat-card-content>
            <div class="summary-content">
              <mat-icon>check_circle</mat-icon>
              <div class="summary-text">
                <h3>{{ summary.totalApproved }}</h3>
                <p>Aprobadas</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card denied">
          <mat-card-content>
            <div class="summary-content">
              <mat-icon>cancel</mat-icon>
              <div class="summary-text">
                <h3>{{ summary.totalDenied }}</h3>
                <p>Denegadas</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Search and Filter Card -->
      <mat-card class="filter-card">
        <mat-card-content>
          <form [formGroup]="filterForm" class="filter-form">
            <div class="filter-row">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Buscar autorizaciones</mat-label>
                <input matInput formControlName="merchantName" placeholder="Nombre del comercio...">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="pending">Pendiente</mat-option>
                  <mat-option value="approved">Aprobada</mat-option>
                  <mat-option value="denied">Denegada</mat-option>
                  <mat-option value="expired">Expirada</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Monto Mínimo</mat-label>
                <input matInput type="number" formControlName="amountMin" placeholder="0.00">
                <span matPrefix>$&nbsp;</span>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Monto Máximo</mat-label>
                <input matInput type="number" formControlName="amountMax" placeholder="0.00">
                <span matPrefix>$&nbsp;</span>
              </mat-form-field>

              <button mat-button type="button" (click)="clearFilters()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
            </div>

            <div class="filter-row">
              <mat-checkbox formControlName="fraudOnly" class="fraud-checkbox">
                Solo mostrar con indicadores de fraude
              </mat-checkbox>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Results Card -->
      <mat-card class="results-card">
        <mat-card-content>
          <!-- Loading Spinner -->
          <div *ngIf="isLoading" class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Cargando autorizaciones...</p>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading && authorizations.length === 0" class="empty-state">
            <mat-icon class="empty-icon">verified_user</mat-icon>
            <h3>No se encontraron autorizaciones</h3>
            <p>No hay autorizaciones que coincidan con los criterios de búsqueda.</p>
            <button mat-raised-button color="primary" (click)="clearFilters()">
              Ver todas las autorizaciones
            </button>
          </div>

          <!-- Authorizations Table -->
          <div *ngIf="!isLoading && authorizations.length > 0" class="table-container">
            <table mat-table [dataSource]="authorizations" matSort (matSortChange)="onSortChange($event)">
              <!-- ID Column -->
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
                <td mat-cell *matCellDef="let auth">{{ auth.id }}</td>
              </ng-container>

              <!-- Transaction ID Column -->
              <ng-container matColumnDef="transactionId">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>ID Transacción</th>
                <td mat-cell *matCellDef="let auth">{{ auth.transactionId }}</td>
              </ng-container>

              <!-- Merchant Column -->
              <ng-container matColumnDef="merchantName">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Comercio</th>
                <td mat-cell *matCellDef="let auth">{{ auth.merchantName }}</td>
              </ng-container>

              <!-- Amount Column -->
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Monto</th>
                <td mat-cell *matCellDef="let auth" [class.high-amount]="auth.amount > 1000">
                  {{ auth.amount | currency:'USD':'symbol':'1.2-2' }}
                </td>
              </ng-container>

              <!-- Risk Score Column -->
              <ng-container matColumnDef="riskScore">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Riesgo</th>
                <td mat-cell *matCellDef="let auth">
                  <mat-chip [class]="getRiskClass(auth.riskScore)">
                    {{ auth.riskScore }}%
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Fraud Indicators Column -->
              <ng-container matColumnDef="fraudIndicators">
                <th mat-header-cell *matHeaderCellDef>Fraude</th>
                <td mat-cell *matCellDef="let auth">
                  <mat-icon 
                    *ngIf="auth.fraudIndicators && auth.fraudIndicators.length > 0" 
                    class="fraud-icon"
                    [matTooltip]="auth.fraudIndicators.join(', ')"
                    [matBadge]="auth.fraudIndicators.length"
                    matBadgeColor="warn">
                    warning
                  </mat-icon>
                  <span *ngIf="!auth.fraudIndicators || auth.fraudIndicators.length === 0">-</span>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Estado</th>
                <td mat-cell *matCellDef="let auth">
                  <mat-chip [class]="'status-' + auth.status">
                    {{ getStatusLabel(auth.status) }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Request Date Column -->
              <ng-container matColumnDef="requestDate">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Fecha Solicitud</th>
                <td mat-cell *matCellDef="let auth">{{ auth.requestDate | date:'short' }}</td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let auth" (click)="$event.stopPropagation()">
                  <button mat-icon-button (click)="viewAuthorization(auth)" matTooltip="Ver detalles">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button 
                    mat-icon-button 
                    color="primary"
                    (click)="approveAuthorization(auth)" 
                    matTooltip="Aprobar"
                    [disabled]="auth.status !== 'pending'">
                    <mat-icon>check_circle</mat-icon>
                  </button>
                  <button 
                    mat-icon-button 
                    color="warn"
                    (click)="denyAuthorization(auth)" 
                    matTooltip="Denegar"
                    [disabled]="auth.status !== 'pending'">
                    <mat-icon>cancel</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                  (click)="viewAuthorization(row)" 
                  class="clickable-row"
                  [class.high-risk-row]="row.riskScore >= 70"></tr>
            </table>

            <!-- Paginator -->
            <mat-paginator 
              [length]="totalItems"
              [pageSize]="pageSize"
              [pageSizeOptions]="[10, 25, 50, 100]"
              [pageIndex]="currentPage"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .authorization-list-container {
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
      color: #1976d2;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-card {
      cursor: default;
    }

    .summary-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .summary-content mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .summary-text h3 {
      margin: 0;
      font-size: 32px;
      font-weight: 500;
    }

    .summary-text p {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    .summary-card.pending mat-icon {
      color: #ff9800;
    }

    .summary-card.high-risk mat-icon {
      color: #f44336;
    }

    .summary-card.approved mat-icon {
      color: #4caf50;
    }

    .summary-card.denied mat-icon {
      color: #9e9e9e;
    }

    .filter-card {
      margin-bottom: 24px;
    }

    .filter-form {
      width: 100%;
    }

    .filter-row {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }

    .filter-row:last-child {
      margin-bottom: 0;
    }

    .search-field {
      flex: 1;
      min-width: 250px;
    }

    .fraud-checkbox {
      margin-left: 8px;
    }

    .results-card {
      min-height: 400px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #666;
    }

    .empty-state p {
      margin: 0 0 24px 0;
      color: #999;
    }

    .table-container {
      width: 100%;
      overflow-x: auto;
    }

    .mat-mdc-table {
      width: 100%;
    }

    .clickable-row {
      cursor: pointer;
    }

    .clickable-row:hover {
      background-color: #f5f5f5;
    }

    .high-risk-row {
      background-color: #ffebee;
    }

    .high-risk-row:hover {
      background-color: #ffcdd2;
    }

    .high-amount {
      color: #f44336;
      font-weight: 500;
    }

    .risk-low {
      background-color: #4caf50;
      color: white;
    }

    .risk-medium {
      background-color: #ff9800;
      color: white;
    }

    .risk-high {
      background-color: #f44336;
      color: white;
    }

    .fraud-icon {
      color: #f44336;
      cursor: help;
    }

    .status-pending {
      background-color: #ff9800;
      color: white;
    }

    .status-approved {
      background-color: #4caf50;
      color: white;
    }

    .status-denied {
      background-color: #f44336;
      color: white;
    }

    .status-expired {
      background-color: #9e9e9e;
      color: white;
    }

    @media (max-width: 768px) {
      .authorization-list-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .summary-cards {
        grid-template-columns: 1fr;
      }

      .filter-row {
        flex-direction: column;
        align-items: stretch;
      }

      .search-field {
        min-width: unset;
      }
    }
  `]
})
export class AuthorizationListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authorizationService = inject(AuthorizationService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  authorizations: Authorization[] = [];
  summary: any = null;
  displayedColumns: string[] = [
    'id', 
    'transactionId', 
    'merchantName', 
    'amount', 
    'riskScore', 
    'fraudIndicators', 
    'status', 
    'requestDate', 
    'actions'
  ];
  
  // Pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;

  // Loading state
  isLoading = false;

  // Filter form
  filterForm: FormGroup = this.fb.group({
    merchantName: [''],
    status: [''],
    amountMin: [''],
    amountMax: [''],
    fraudOnly: [false]
  });

  ngOnInit(): void {
    this.setupFilterSubscription();
    this.loadSummary();
    this.loadAuthorizations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilterSubscription(): void {
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 0;
        this.loadAuthorizations();
      });
  }

  private loadSummary(): void {
    this.authorizationService.getAuthorizationSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.summary = summary;
        },
        error: (error) => {
          console.error('Error loading summary:', error);
        }
      });
  }

  private loadAuthorizations(): void {
    this.isLoading = true;
    
    const formValue = this.filterForm.value;
    const filter: AuthorizationFilter = {};
    
    if (formValue.status) filter.status = formValue.status;
    if (formValue.merchantName) filter.merchantName = formValue.merchantName;
    if (formValue.amountMin) filter.amountMin = parseFloat(formValue.amountMin);
    if (formValue.amountMax) filter.amountMax = parseFloat(formValue.amountMax);
    if (formValue.fraudOnly) filter.fraudOnly = true;

    this.authorizationService.getPendingAuthorizations(filter, this.currentPage + 1, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.authorizations = response.authorizations;
          this.totalItems = response.pagination.totalItems;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading authorizations:', error);
          this.isLoading = false;
          this.notificationService.showError('Error al cargar las autorizaciones');
        }
      });
  }

  refreshAuthorizations(): void {
    this.loadSummary();
    this.loadAuthorizations();
    this.notificationService.showSuccess('Autorizaciones actualizadas');
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAuthorizations();
  }

  onSortChange(sort: Sort): void {
    // Update sorting and reload data
    this.loadAuthorizations();
  }

  clearFilters(): void {
    this.filterForm.reset({ fraudOnly: false });
    this.currentPage = 0;
  }

  viewAuthorization(authorization: Authorization): void {
    this.authorizationService.setSelectedAuthorization(authorization);
    this.router.navigate(['/authorizations', authorization.id]);
  }

  approveAuthorization(authorization: Authorization): void {
    if (authorization.status !== AuthorizationStatus.PENDING) {
      return;
    }

    this.authorizationService.approveAuthorization(authorization.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Autorización aprobada exitosamente');
          this.loadAuthorizations();
          this.loadSummary();
        },
        error: (error) => {
          console.error('Error approving authorization:', error);
          this.notificationService.showError('Error al aprobar la autorización');
        }
      });
  }

  denyAuthorization(authorization: Authorization): void {
    if (authorization.status !== AuthorizationStatus.PENDING) {
      return;
    }

    // Open denial dialog
    const dialogRef = this.dialog.open(AuthorizationDenialDialogComponent, {
      width: '600px',
      data: {
        authorizationId: authorization.id,
        merchantName: authorization.merchantName,
        amount: authorization.amount
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const reason = result.notes ? `${result.reason}: ${result.notes}` : result.reason;
        
        this.authorizationService.denyAuthorization(authorization.id, reason)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notificationService.showSuccess('Autorización denegada exitosamente');
              this.loadAuthorizations();
              this.loadSummary();
            },
            error: (error) => {
              console.error('Error denying authorization:', error);
              this.notificationService.showError('Error al denegar la autorización');
            }
          });
      }
    });
  }

  getStatusLabel(status: AuthorizationStatus): string {
    const labels = {
      [AuthorizationStatus.PENDING]: 'Pendiente',
      [AuthorizationStatus.APPROVED]: 'Aprobada',
      [AuthorizationStatus.DENIED]: 'Denegada',
      [AuthorizationStatus.EXPIRED]: 'Expirada'
    };
    return labels[status] || status;
  }

  getRiskClass(riskScore: number): string {
    if (riskScore < 40) return 'risk-low';
    if (riskScore < 70) return 'risk-medium';
    return 'risk-high';
  }
}
