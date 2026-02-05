import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { 
  Payment, 
  PaymentHistory, 
  PaymentFilter, 
  PaymentStatus, 
  PaymentMethod,
  PaymentRetryRequest,
  PaymentMethodInfo
} from '../../../core/models/payment.models';
import { Account } from '../../../core/models/account.models';
import { PaymentService } from '../../../core/services/payment.service';
import { AccountService } from '../../../core/services/account.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PaymentRetryDialogComponent, PaymentRetryDialogData } from '../payment-retry-dialog/payment-retry-dialog.component';
import { PaymentErrorComponent, PaymentError } from '../payment-error/payment-error.component';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    PaymentErrorComponent
  ],
  template: `
    <div class="payment-list-container">
      <!-- Header -->
      <div class="header">
        <h1>Historial de Pagos</h1>
        <button mat-raised-button color="primary" (click)="makeNewPayment()">
          <mat-icon>add</mat-icon>
          Nuevo Pago
        </button>
      </div>

      <!-- Error Display -->
      <app-payment-error 
        *ngIf="currentError"
        [error]="currentError"
        [failedPayment]="errorPayment || undefined"
        [isRetrying]="isRetrying"
        (retry)="onErrorRetry($event)"
        (dismiss)="onErrorDismiss()"
        (contactSupport)="onContactSupport($event)"
        (tryDifferentMethod)="onTryDifferentMethod($event)">
      </app-payment-error>

      <!-- Account Selection -->
      <mat-card class="account-selection-card">
        <mat-card-content>
          <mat-form-field appearance="outline" class="account-select">
            <mat-label>Seleccionar Cuenta</mat-label>
            <mat-select [formControl]="selectedAccountControl" (selectionChange)="onAccountChange($event.value)">
              <mat-option *ngFor="let account of accounts" [value]="account.id">
                {{ account.accountNumber }} - {{ account.accountType }}
                ({{ account.balance | currency:'USD':'symbol':'1.2-2' }})
              </mat-option>
            </mat-select>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <!-- Filters -->
      <mat-card class="filters-card" *ngIf="selectedAccountControl.value">
        <mat-card-header>
          <mat-card-title>Filtros</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="filterForm" class="filters-form">
            <div class="filter-row">
              <mat-form-field appearance="outline">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="pending">Pendiente</mat-option>
                  <mat-option value="processing">Procesando</mat-option>
                  <mat-option value="completed">Completado</mat-option>
                  <mat-option value="failed">Fallido</mat-option>
                  <mat-option value="cancelled">Cancelado</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Método de Pago</mat-label>
                <mat-select formControlName="paymentMethod">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="bank_transfer">Transferencia Bancaria</mat-option>
                  <mat-option value="debit_card">Tarjeta de Débito</mat-option>
                  <mat-option value="credit_card">Tarjeta de Crédito</mat-option>
                  <mat-option value="electronic_check">Cheque Electrónico</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha Desde</mat-label>
                <input matInput [matDatepicker]="fromPicker" formControlName="dateFrom">
                <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
                <mat-datepicker #fromPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha Hasta</mat-label>
                <input matInput [matDatepicker]="toPicker" formControlName="dateTo">
                <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
                <mat-datepicker #toPicker></mat-datepicker>
              </mat-form-field>
            </div>

            <div class="filter-actions">
              <button mat-button type="button" (click)="clearFilters()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
              <button mat-raised-button color="primary" type="button" (click)="applyFilters()">
                <mat-icon>search</mat-icon>
                Aplicar Filtros
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Loading -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Cargando historial de pagos...</p>
      </div>

      <!-- Payment History -->
      <mat-card *ngIf="!isLoading && paymentHistory" class="history-card">
        <mat-card-header>
          <mat-card-title>Pagos Realizados</mat-card-title>
          <mat-card-subtitle>
            Total: {{ paymentHistory.totalCount }} pagos - 
            Monto Total: {{ paymentHistory.totalAmount | currency:'USD':'symbol':'1.2-2' }}
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Empty State -->
          <div *ngIf="paymentHistory.payments.length === 0" class="empty-state">
            <mat-icon>payment</mat-icon>
            <h3>No hay pagos registrados</h3>
            <p>No se encontraron pagos para los criterios seleccionados.</p>
            <button mat-raised-button color="primary" (click)="makeNewPayment()">
              Realizar Primer Pago
            </button>
          </div>

          <!-- Payments Table -->
          <div *ngIf="paymentHistory.payments.length > 0" class="table-container">
            <table mat-table [dataSource]="paymentHistory.payments" class="payments-table">
              <!-- Date Column -->
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Fecha</th>
                <td mat-cell *matCellDef="let payment">
                  {{ payment.paymentDate | date:'dd/MM/yyyy' }}
                </td>
              </ng-container>

              <!-- Amount Column -->
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Monto</th>
                <td mat-cell *matCellDef="let payment">
                  {{ payment.amount | currency:'USD':'symbol':'1.2-2' }}
                </td>
              </ng-container>

              <!-- Method Column -->
              <ng-container matColumnDef="method">
                <th mat-header-cell *matHeaderCellDef>Método</th>
                <td mat-cell *matCellDef="let payment">
                  {{ getPaymentMethodDisplay(payment.paymentMethod) }}
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let payment">
                  <mat-chip-listbox>
                    <mat-chip-option [selected]="true" [color]="getStatusColor(payment.status)">
                      {{ getStatusDisplay(payment.status) }}
                    </mat-chip-option>
                  </mat-chip-listbox>
                </td>
              </ng-container>

              <!-- Confirmation Column -->
              <ng-container matColumnDef="confirmation">
                <th mat-header-cell *matHeaderCellDef>Confirmación</th>
                <td mat-cell *matCellDef="let payment">
                  <span *ngIf="payment.confirmationNumber" class="confirmation-number">
                    {{ payment.confirmationNumber }}
                  </span>
                  <span *ngIf="!payment.confirmationNumber" class="no-confirmation">
                    N/A
                  </span>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let payment">
                  <button mat-icon-button [matMenuTriggerFor]="actionMenu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #actionMenu="matMenu">
                    <button mat-menu-item (click)="viewPaymentDetails(payment)">
                      <mat-icon>visibility</mat-icon>
                      Ver Detalles
                    </button>
                    <button mat-menu-item *ngIf="payment.status === 'failed'" (click)="retryPayment(payment)">
                      <mat-icon>refresh</mat-icon>
                      Reintentar
                    </button>
                    <button mat-menu-item *ngIf="payment.status === 'pending'" (click)="cancelPayment(payment)">
                      <mat-icon>cancel</mat-icon>
                      Cancelar
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <!-- Pagination -->
            <mat-paginator 
              [length]="paymentHistory.totalCount"
              [pageSize]="paymentHistory.pagination.pageSize"
              [pageSizeOptions]="[5, 10, 25, 50]"
              (page)="onPageChange($event)">
            </mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .payment-list-container {
      padding: 24px;
      max-width: 1200px;
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

    .account-selection-card,
    .filters-card,
    .history-card {
      margin-bottom: 24px;
    }

    .account-select {
      width: 100%;
      max-width: 400px;
    }

    .filters-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .filter-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .filter-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
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

    .empty-state mat-icon {
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
      overflow-x: auto;
    }

    .payments-table {
      width: 100%;
    }

    .confirmation-number {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      background-color: #e3f2fd;
      padding: 2px 6px;
      border-radius: 3px;
      color: #1976d2;
    }

    .no-confirmation {
      color: #999;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .payment-list-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .filter-row {
        grid-template-columns: 1fr;
      }

      .filter-actions {
        flex-direction: column;
      }
    }
  `]
})
export class PaymentListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private paymentService = inject(PaymentService);
  private accountService = inject(AccountService);
  private notificationService = inject(NotificationService);

  selectedAccountControl = this.fb.control('');
  filterForm: FormGroup;
  
  isLoading = false;
  isRetrying = false;
  accounts: Account[] = [];
  paymentHistory: PaymentHistory | null = null;
  availablePaymentMethods: PaymentMethodInfo[] = [];
  
  // Error handling
  currentError: PaymentError | null = null;
  errorPayment: Payment | null = null;
  
  displayedColumns: string[] = ['date', 'amount', 'method', 'status', 'confirmation', 'actions'];

  constructor() {
    this.filterForm = this.fb.group({
      status: [''],
      paymentMethod: [''],
      dateFrom: [''],
      dateTo: ['']
    });
  }

  ngOnInit(): void {
    this.loadAccounts();
    this.loadPaymentMethods();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAccounts(): void {
    this.accountService.getAccounts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (accounts) => {
          this.accounts = accounts;
          if (accounts.length > 0) {
            const accountId = accounts[0].id.toString();
            this.selectedAccountControl.setValue(accountId);
            this.loadPaymentHistory(accountId);
          }
        },
        error: (error) => {
          console.error('Error loading accounts:', error);
          this.notificationService.showError('Error al cargar las cuentas');
        }
      });
  }

  private loadPaymentMethods(): void {
    this.paymentService.getPaymentMethods()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (methods) => {
          this.availablePaymentMethods = methods;
        },
        error: (error) => {
          console.error('Error loading payment methods:', error);
        }
      });
  }

  private setupFormSubscriptions(): void {
    this.selectedAccountControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(accountId => {
        if (accountId) {
          this.loadPaymentHistory(accountId);
        }
      });
  }

  onAccountChange(accountId: string): void {
    if (accountId) {
      this.loadPaymentHistory(accountId);
    }
  }

  private loadPaymentHistory(accountId: string, filter?: PaymentFilter): void {
    this.isLoading = true;

    this.paymentService.getPaymentHistory(accountId, filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.paymentHistory = history;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading payment history:', error);
          this.isLoading = false;
          this.notificationService.showError('Error al cargar el historial de pagos');
        }
      });
  }

  applyFilters(): void {
    const accountId = this.selectedAccountControl.value;
    if (!accountId) return;

    const formValue = this.filterForm.value;
    const filter: PaymentFilter = {
      status: formValue.status || undefined,
      paymentMethod: formValue.paymentMethod || undefined,
      dateFrom: formValue.dateFrom || undefined,
      dateTo: formValue.dateTo || undefined
    };

    this.loadPaymentHistory(accountId, filter);
  }

  clearFilters(): void {
    this.filterForm.reset();
    const accountId = this.selectedAccountControl.value;
    if (accountId) {
      this.loadPaymentHistory(accountId);
    }
  }

  makeNewPayment(): void {
    const accountId = this.selectedAccountControl.value;
    if (accountId) {
      this.router.navigate(['/payments/new'], { queryParams: { accountId } });
    } else {
      this.router.navigate(['/payments/new']);
    }
  }

  viewPaymentDetails(payment: Payment): void {
    this.router.navigate(['/payments/confirmation'], { 
      queryParams: { paymentId: payment.id }
    });
  }

  retryPayment(payment: Payment): void {
    const dialogData: PaymentRetryDialogData = {
      payment,
      availablePaymentMethods: this.availablePaymentMethods,
      error: payment.failureReason
    };

    const dialogRef = this.dialog.open(PaymentRetryDialogComponent, {
      width: '600px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((retryRequest: PaymentRetryRequest) => {
      if (retryRequest) {
        this.executeRetry(retryRequest);
      }
    });
  }

  private executeRetry(retryRequest: PaymentRetryRequest): void {
    this.isRetrying = true;
    this.currentError = null;

    this.paymentService.retryPayment(retryRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (confirmation) => {
          this.isRetrying = false;
          this.notificationService.showSuccess('Pago reintentado exitosamente');
          this.router.navigate(['/payments/confirmation'], { 
            queryParams: { confirmationId: confirmation.confirmationNumber }
          });
        },
        error: (error) => {
          this.isRetrying = false;
          this.handlePaymentError(error, retryRequest.paymentId);
        }
      });
  }

  cancelPayment(payment: Payment): void {
    if (confirm('¿Está seguro de que desea cancelar este pago?')) {
      this.paymentService.cancelPayment(payment.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Pago cancelado exitosamente');
            // Refresh the payment history
            const accountId = this.selectedAccountControl.value;
            if (accountId) {
              this.loadPaymentHistory(accountId);
            }
          },
          error: (error) => {
            console.error('Error cancelling payment:', error);
            this.notificationService.showError('Error al cancelar el pago');
          }
        });
    }
  }

  private handlePaymentError(error: any, paymentId?: string): void {
    const paymentError: PaymentError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Error desconocido al procesar el pago',
      details: error.details,
      retryable: error.retryable !== false,
      suggestedAction: error.suggestedAction
    };

    this.currentError = paymentError;
    
    if (paymentId) {
      // Find the failed payment to show in error component
      this.errorPayment = this.paymentHistory?.payments.find(p => p.id === paymentId) || null;
    }
  }

  onErrorRetry(retryRequest: PaymentRetryRequest): void {
    this.executeRetry(retryRequest);
  }

  onErrorDismiss(): void {
    this.currentError = null;
    this.errorPayment = null;
  }

  onContactSupport(error: PaymentError): void {
    // Implementation for contacting support
    this.notificationService.showInfo('Funcionalidad de soporte será implementada');
  }

  onTryDifferentMethod(payment: Payment): void {
    this.router.navigate(['/payments/new'], { 
      queryParams: { 
        accountId: payment.accountId,
        amount: payment.amount,
        retryPaymentId: payment.id
      }
    });
  }

  onPageChange(event: any): void {
    // Handle pagination
    const accountId = this.selectedAccountControl.value;
    if (accountId) {
      // This would typically involve updating the filter with pagination info
      this.loadPaymentHistory(accountId);
    }
  }

  getPaymentMethodDisplay(method: PaymentMethod): string {
    const methodNames: Record<string, string> = {
      'bank_transfer': 'Transferencia Bancaria',
      'debit_card': 'Tarjeta de Débito',
      'credit_card': 'Tarjeta de Crédito',
      'electronic_check': 'Cheque Electrónico',
      'cash': 'Efectivo'
    };
    return methodNames[method] || method;
  }

  getStatusDisplay(status: PaymentStatus): string {
    const statusNames: Record<string, string> = {
      'pending': 'Pendiente',
      'processing': 'Procesando',
      'completed': 'Completado',
      'failed': 'Fallido',
      'cancelled': 'Cancelado'
    };
    return statusNames[status] || status;
  }

  getStatusColor(status: PaymentStatus): 'primary' | 'accent' | 'warn' | undefined {
    const statusColors: Record<string, 'primary' | 'accent' | 'warn' | undefined> = {
      'pending': 'accent',
      'processing': 'primary',
      'completed': undefined,
      'failed': 'warn',
      'cancelled': 'warn'
    };
    return statusColors[status];
  }
}