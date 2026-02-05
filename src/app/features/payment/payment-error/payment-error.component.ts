import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import { Payment, PaymentRetryRequest } from '../../../core/models/payment.models';

export interface PaymentError {
  code: string;
  message: string;
  details?: string;
  retryable: boolean;
  suggestedAction?: string;
}

@Component({
  selector: 'app-payment-error',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="error-card">
      <mat-card-header>
        <div class="error-icon">
          <mat-icon>error</mat-icon>
        </div>
        <mat-card-title>Error en el Pago</mat-card-title>
        <mat-card-subtitle>{{ error.message }}</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <!-- Error Details -->
        <div class="error-details">
          <div class="error-info">
            <div class="info-item">
              <span class="label">Código de Error:</span>
              <mat-chip-listbox>
                <mat-chip-option selected color="warn">{{ error.code }}</mat-chip-option>
              </mat-chip-listbox>
            </div>
            
            <div class="info-item" *ngIf="error.details">
              <span class="label">Detalles:</span>
              <p class="details-text">{{ error.details }}</p>
            </div>

            <div class="info-item" *ngIf="failedPayment">
              <span class="label">Información del Pago:</span>
              <div class="payment-info">
                <div class="payment-detail">
                  <span>Monto:</span>
                  <span>{{ failedPayment.amount | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
                <div class="payment-detail">
                  <span>Método:</span>
                  <span>{{ getPaymentMethodDisplay(failedPayment.paymentMethod) }}</span>
                </div>
                <div class="payment-detail">
                  <span>Intentos:</span>
                  <span>{{ failedPayment.retryCount }}/{{ failedPayment.maxRetries }}</span>
                </div>
              </div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Suggested Actions -->
          <div class="suggested-actions">
            <h3>¿Qué puedes hacer?</h3>
            
            <div class="action-list">
              <div class="action-item" *ngIf="error.suggestedAction">
                <mat-icon>lightbulb</mat-icon>
                <span>{{ error.suggestedAction }}</span>
              </div>
              
              <div class="action-item" *ngIf="error.retryable && canRetry">
                <mat-icon>refresh</mat-icon>
                <span>Puedes intentar procesar el pago nuevamente</span>
              </div>
              
              <div class="action-item" *ngIf="!error.retryable">
                <mat-icon>warning</mat-icon>
                <span>Este error no permite reintentos automáticos</span>
              </div>
              
              <div class="action-item">
                <mat-icon>support_agent</mat-icon>
                <span>Contacta con soporte si el problema persiste</span>
              </div>
            </div>
          </div>

          <!-- Common Error Solutions -->
          <div class="common-solutions" *ngIf="getCommonSolutions().length > 0">
            <h3>Soluciones Comunes</h3>
            <div class="solution-list">
              <div class="solution-item" *ngFor="let solution of getCommonSolutions()">
                <mat-icon>check_circle_outline</mat-icon>
                <span>{{ solution }}</span>
              </div>
            </div>
          </div>
        </div>
      </mat-card-content>

      <mat-card-actions class="error-actions">
        <button mat-button (click)="onDismiss()">
          <mat-icon>close</mat-icon>
          Cerrar
        </button>
        
        <button mat-button (click)="onContactSupport()">
          <mat-icon>support_agent</mat-icon>
          Contactar Soporte
        </button>
        
        <button mat-button (click)="onTryDifferentMethod()" *ngIf="error.retryable">
          <mat-icon>swap_horiz</mat-icon>
          Cambiar Método
        </button>
        
        <button mat-raised-button color="primary" 
                (click)="onRetry()" 
                *ngIf="error.retryable && canRetry"
                [disabled]="isRetrying">
          <mat-icon *ngIf="!isRetrying">refresh</mat-icon>
          <mat-icon *ngIf="isRetrying" class="spinning">sync</mat-icon>
          <span *ngIf="!isRetrying">Reintentar Pago</span>
          <span *ngIf="isRetrying">Reintentando...</span>
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .error-card {
      max-width: 600px;
      margin: 24px auto;
      border-top: 4px solid #f44336;
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

    .error-details {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .error-info {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-item .label {
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }

    .details-text {
      margin: 0;
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 4px;
      font-size: 14px;
      color: #666;
      border-left: 4px solid #f44336;
    }

    .payment-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background-color: #f9f9f9;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }

    .payment-detail {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
    }

    .payment-detail span:first-child {
      color: #666;
    }

    .payment-detail span:last-child {
      font-weight: 500;
      color: #333;
    }

    .suggested-actions h3,
    .common-solutions h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 16px;
      font-weight: 500;
    }

    .action-list,
    .solution-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .action-item,
    .solution-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .action-item mat-icon,
    .solution-item mat-icon {
      color: #1976d2;
      font-size: 20px;
    }

    .action-item span,
    .solution-item span {
      font-size: 14px;
      color: #333;
    }

    .error-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
      padding: 24px;
    }

    .error-actions button {
      min-width: 140px;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .error-card {
        margin: 16px;
      }

      .payment-info {
        gap: 6px;
      }

      .error-actions {
        flex-direction: column;
      }

      .error-actions button {
        width: 100%;
      }
    }
  `]
})
export class PaymentErrorComponent {
  @Input() error!: PaymentError;
  @Input() failedPayment?: Payment;
  @Input() isRetrying = false;

  @Output() retry = new EventEmitter<PaymentRetryRequest>();
  @Output() dismiss = new EventEmitter<void>();
  @Output() contactSupport = new EventEmitter<PaymentError>();
  @Output() tryDifferentMethod = new EventEmitter<Payment>();

  get canRetry(): boolean {
    if (!this.failedPayment) return false;
    return this.failedPayment.retryCount < this.failedPayment.maxRetries;
  }

  onRetry(): void {
    if (this.failedPayment && this.canRetry) {
      const retryRequest: PaymentRetryRequest = {
        paymentId: this.failedPayment.id
      };
      this.retry.emit(retryRequest);
    }
  }

  onDismiss(): void {
    this.dismiss.emit();
  }

  onContactSupport(): void {
    this.contactSupport.emit(this.error);
  }

  onTryDifferentMethod(): void {
    if (this.failedPayment) {
      this.tryDifferentMethod.emit(this.failedPayment);
    }
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

  getCommonSolutions(): string[] {
    const solutions: Record<string, string[]> = {
      'INSUFFICIENT_FUNDS': [
        'Verifica que tengas fondos suficientes en tu cuenta',
        'Considera realizar un pago parcial',
        'Contacta con tu banco para verificar límites'
      ],
      'INVALID_PAYMENT_METHOD': [
        'Verifica que los datos del método de pago sean correctos',
        'Intenta con un método de pago diferente',
        'Contacta con tu banco si el problema persiste'
      ],
      'NETWORK_ERROR': [
        'Verifica tu conexión a internet',
        'Intenta nuevamente en unos minutos',
        'Usa una conexión más estable si es posible'
      ],
      'PAYMENT_LIMIT_EXCEEDED': [
        'Verifica los límites diarios de tu método de pago',
        'Considera dividir el pago en montos menores',
        'Contacta con tu banco para aumentar límites'
      ],
      'ACCOUNT_BLOCKED': [
        'Contacta con tu banco inmediatamente',
        'Verifica si hay restricciones en tu cuenta',
        'Proporciona documentación adicional si es necesaria'
      ]
    };

    return solutions[this.error.code] || [
      'Verifica que todos los datos sean correctos',
      'Intenta con un método de pago diferente',
      'Contacta con soporte si el problema persiste'
    ];
  }
}