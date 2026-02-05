import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil } from 'rxjs';

import { Payment, PaymentConfirmation } from '../../../core/models/payment.models';
import { PaymentService } from '../../../core/services/payment.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-payment-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  template: `
    <div class="confirmation-container">
      <!-- Loading Spinner -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Cargando confirmación de pago...</p>
      </div>

      <!-- Success Confirmation -->
      <mat-card *ngIf="!isLoading && payment" class="confirmation-card success">
        <mat-card-header>
          <div class="success-icon">
            <mat-icon>check_circle</mat-icon>
          </div>
          <mat-card-title>¡Pago Procesado Exitosamente!</mat-card-title>
          <mat-card-subtitle>Su pago ha sido procesado correctamente</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="confirmation-details">
            <div class="detail-section">
              <h3>Detalles del Pago</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="label">Número de Confirmación:</span>
                  <span class="value confirmation-number">{{ payment.confirmationNumber }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Monto Pagado:</span>
                  <span class="value amount">{{ payment.amount | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Método de Pago:</span>
                  <span class="value">{{ getPaymentMethodDisplay(payment.paymentMethod) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Fecha de Procesamiento:</span>
                  <span class="value">{{ payment.processedDate | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="detail-item" *ngIf="payment.description">
                  <span class="label">Descripción:</span>
                  <span class="value">{{ payment.description }}</span>
                </div>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="detail-section">
              <h3>Estado de la Cuenta</h3>
              <div class="account-status">
                <div class="status-item">
                  <mat-icon>account_balance</mat-icon>
                  <div>
                    <span class="status-label">Cuenta:</span>
                    <span class="status-value">{{ payment.accountId }}</span>
                  </div>
                </div>
                <div class="status-item">
                  <mat-icon>trending_down</mat-icon>
                  <div>
                    <span class="status-label">Estado:</span>
                    <span class="status-value success-text">Pago Completado</span>
                  </div>
                </div>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="detail-section">
              <h3>Próximos Pasos</h3>
              <div class="next-steps">
                <div class="step-item">
                  <mat-icon>receipt</mat-icon>
                  <span>Guarde este número de confirmación para sus registros</span>
                </div>
                <div class="step-item">
                  <mat-icon>schedule</mat-icon>
                  <span>El pago se reflejará en su estado de cuenta en 1-2 días hábiles</span>
                </div>
                <div class="step-item">
                  <mat-icon>email</mat-icon>
                  <span>Recibirá un correo de confirmación en breve</span>
                </div>
              </div>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions class="confirmation-actions">
          <button mat-button (click)="printConfirmation()">
            <mat-icon>print</mat-icon>
            Imprimir
          </button>
          <button mat-button (click)="viewPaymentHistory()">
            <mat-icon>history</mat-icon>
            Ver Historial
          </button>
          <button mat-raised-button color="primary" (click)="makeAnotherPayment()">
            <mat-icon>payment</mat-icon>
            Realizar Otro Pago
          </button>
          <button mat-stroked-button (click)="goToHome()">
            <mat-icon>home</mat-icon>
            Ir al Inicio
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Error State -->
      <mat-card *ngIf="!isLoading && !payment" class="confirmation-card error">
        <mat-card-header>
          <div class="error-icon">
            <mat-icon>error</mat-icon>
          </div>
          <mat-card-title>Error al Cargar Confirmación</mat-card-title>
          <mat-card-subtitle>No se pudo cargar la información del pago</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <p>Lo sentimos, no pudimos cargar los detalles de su pago. 
             Por favor, verifique su historial de pagos o contacte con soporte.</p>
        </mat-card-content>

        <mat-card-actions>
          <button mat-button (click)="viewPaymentHistory()">
            <mat-icon>history</mat-icon>
            Ver Historial de Pagos
          </button>
          <button mat-raised-button color="primary" (click)="goToHome()">
            <mat-icon>home</mat-icon>
            Ir al Inicio
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .confirmation-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
      min-height: 60vh;
      display: flex;
      align-items: center;
      justify-content: center;
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

    .confirmation-card {
      width: 100%;
      max-width: 700px;
    }

    .confirmation-card.success {
      border-top: 4px solid #4caf50;
    }

    .confirmation-card.error {
      border-top: 4px solid #f44336;
    }

    .success-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #e8f5e8;
      margin-right: 16px;
    }

    .success-icon mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #4caf50;
    }

    .error-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #ffebee;
      margin-right: 16px;
    }

    .error-icon mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #f44336;
    }

    .confirmation-details {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .detail-section h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 18px;
      font-weight: 500;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .detail-item .label {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }

    .detail-item .value {
      font-size: 16px;
      color: #333;
    }

    .confirmation-number {
      font-family: 'Courier New', monospace;
      font-weight: 600;
      color: #1976d2;
      background-color: #e3f2fd;
      padding: 4px 8px;
      border-radius: 4px;
      display: inline-block;
    }

    .amount {
      font-size: 18px;
      font-weight: 600;
      color: #4caf50;
    }

    .account-status {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-item mat-icon {
      color: #1976d2;
    }

    .status-item div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .status-label {
      font-size: 14px;
      color: #666;
    }

    .status-value {
      font-size: 16px;
      color: #333;
    }

    .success-text {
      color: #4caf50;
      font-weight: 500;
    }

    .next-steps {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .step-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .step-item mat-icon {
      color: #1976d2;
      font-size: 20px;
    }

    .step-item span {
      font-size: 14px;
      color: #333;
    }

    .confirmation-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
      padding: 24px;
    }

    .confirmation-actions button {
      min-width: 140px;
    }

    @media (max-width: 768px) {
      .confirmation-container {
        padding: 16px;
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }

      .confirmation-actions {
        flex-direction: column;
      }

      .confirmation-actions button {
        width: 100%;
      }
    }

    @media print {
      .confirmation-actions {
        display: none;
      }
      
      .confirmation-container {
        padding: 0;
      }
    }
  `]
})
export class PaymentConfirmationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private notificationService = inject(NotificationService);

  isLoading = false;
  payment: Payment | null = null;

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const confirmationId = params['confirmationId'];
        const paymentId = params['paymentId'];
        
        if (confirmationId || paymentId) {
          this.loadPaymentConfirmation(paymentId);
        } else {
          this.notificationService.showError('Información de confirmación no encontrada');
          this.goToHome();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPaymentConfirmation(paymentId: string): void {
    if (!paymentId) return;

    this.isLoading = true;

    this.paymentService.getPayment(paymentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payment) => {
          this.payment = payment;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading payment confirmation:', error);
          this.isLoading = false;
          this.notificationService.showError('Error al cargar la confirmación del pago');
        }
      });
  }

  getPaymentMethodDisplay(method: string): string {
    const methodNames: Record<string, string> = {
      'bank_transfer': 'Transferencia Bancaria',
      'debit_card': 'Tarjeta de Débito',
      'credit_card': 'Tarjeta de Crédito',
      'electronic_check': 'Cheque Electrónico',
      'cash': 'Efectivo'
    };
    return methodNames[method] || method;
  }

  printConfirmation(): void {
    window.print();
  }

  viewPaymentHistory(): void {
    this.router.navigate(['/payments']);
  }

  makeAnotherPayment(): void {
    if (this.payment) {
      this.router.navigate(['/payments/new'], { 
        queryParams: { accountId: this.payment.accountId }
      });
    } else {
      this.router.navigate(['/payments/new']);
    }
  }

  goToHome(): void {
    this.router.navigate(['/dashboard']);
  }
}