import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { 
  Payment, 
  PaymentRetryRequest, 
  PaymentMethod, 
  PaymentMethodInfo 
} from '../../../core/models/payment.models';

export interface PaymentRetryDialogData {
  payment: Payment;
  availablePaymentMethods: PaymentMethodInfo[];
  error?: string;
}

@Component({
  selector: 'app-payment-retry-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  template: `
    <div class="retry-dialog">
      <h2 mat-dialog-title>
        <mat-icon>refresh</mat-icon>
        Reintentar Pago
      </h2>

      <mat-dialog-content>
        <!-- Payment Information -->
        <div class="payment-summary">
          <h3>Información del Pago</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">Monto Original:</span>
              <span class="value">{{ data.payment.amount | currency:'USD':'symbol':'1.2-2' }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Método Original:</span>
              <span class="value">{{ getPaymentMethodDisplay(data.payment.paymentMethod) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Intentos Realizados:</span>
              <span class="value">{{ data.payment.retryCount }}/{{ data.payment.maxRetries }}</span>
            </div>
            <div class="summary-item" *ngIf="data.error">
              <span class="label">Último Error:</span>
              <span class="value error-text">{{ data.error }}</span>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Retry Options Form -->
        <div class="retry-options">
          <h3>Opciones de Reintento</h3>
          
          <form [formGroup]="retryForm" class="retry-form">
            <!-- Payment Method Selection -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Método de Pago</mat-label>
              <mat-select formControlName="paymentMethod">
                <mat-option [value]="data.payment.paymentMethod">
                  {{ getPaymentMethodDisplay(data.payment.paymentMethod) }} (Mismo método)
                </mat-option>
                <mat-option *ngFor="let method of availableAlternativeMethods" 
                            [value]="method.type"
                            [disabled]="!method.isAvailable">
                  <div class="method-option">
                    <span class="method-name">{{ method.displayName }}</span>
                    <span class="method-description">{{ method.description }}</span>
                    <span class="processing-time" *ngIf="method.processingTime">
                      {{ method.processingTime }}
                    </span>
                  </div>
                </mat-option>
              </mat-select>
              <mat-hint>Puedes cambiar el método de pago para el reintento</mat-hint>
            </mat-form-field>

            <!-- Amount Adjustment -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Monto a Pagar</mat-label>
              <input matInput type="number" formControlName="amount" 
                     min="0.01" step="0.01">
              <span matTextPrefix>$</span>
              <mat-hint>Puedes ajustar el monto si es necesario</mat-hint>
              <mat-error *ngIf="retryForm.get('amount')?.hasError('required')">
                El monto es requerido
              </mat-error>
              <mat-error *ngIf="retryForm.get('amount')?.hasError('min')">
                El monto debe ser mayor a $0.01
              </mat-error>
            </mat-form-field>

            <!-- Retry Strategy Information -->
            <div class="retry-strategy" *ngIf="selectedMethodInfo">
              <h4>Información del Método Seleccionado</h4>
              <div class="strategy-details">
                <div class="detail-item">
                  <mat-icon>info</mat-icon>
                  <span>{{ selectedMethodInfo.description }}</span>
                </div>
                <div class="detail-item" *ngIf="selectedMethodInfo.processingTime">
                  <mat-icon>schedule</mat-icon>
                  <span>Tiempo de procesamiento: {{ selectedMethodInfo.processingTime }}</span>
                </div>
                <div class="detail-item" *ngIf="selectedMethodInfo.fees">
                  <mat-icon>attach_money</mat-icon>
                  <span>Comisión: {{ selectedMethodInfo.fees | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
                <div class="detail-item" *ngIf="selectedMethodInfo.minimumAmount">
                  <mat-icon>trending_up</mat-icon>
                  <span>Monto mínimo: {{ selectedMethodInfo.minimumAmount | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
                <div class="detail-item" *ngIf="selectedMethodInfo.maximumAmount">
                  <mat-icon>trending_down</mat-icon>
                  <span>Monto máximo: {{ selectedMethodInfo.maximumAmount | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Warning Messages -->
        <div class="warnings" *ngIf="getWarnings().length > 0">
          <div class="warning-item" *ngFor="let warning of getWarnings()">
            <mat-icon>warning</mat-icon>
            <span>{{ warning }}</span>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()">
          <mat-icon>close</mat-icon>
          Cancelar
        </button>
        
        <button mat-button (click)="onReset()" *ngIf="hasChanges()">
          <mat-icon>restore</mat-icon>
          Restaurar Original
        </button>
        
        <button mat-raised-button color="primary" 
                (click)="onRetry()" 
                [disabled]="retryForm.invalid || isProcessing">
          <mat-spinner *ngIf="isProcessing" diameter="20"></mat-spinner>
          <mat-icon *ngIf="!isProcessing">refresh</mat-icon>
          <span *ngIf="!isProcessing">Reintentar Pago</span>
          <span *ngIf="isProcessing">Procesando...</span>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .retry-dialog {
      min-width: 500px;
      max-width: 600px;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 16px 0;
      color: #1976d2;
    }

    .payment-summary,
    .retry-options {
      margin-bottom: 24px;
    }

    .payment-summary h3,
    .retry-options h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 16px;
      font-weight: 500;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .summary-item .label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .summary-item .value {
      font-size: 14px;
      color: #333;
    }

    .error-text {
      color: #f44336;
      font-weight: 500;
    }

    .retry-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .method-option {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .method-name {
      font-weight: 500;
    }

    .method-description {
      font-size: 12px;
      color: #666;
    }

    .processing-time {
      font-size: 11px;
      color: #999;
    }

    .retry-strategy {
      margin-top: 16px;
      padding: 16px;
      background-color: #f9f9f9;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }

    .retry-strategy h4 {
      margin: 0 0 12px 0;
      color: #333;
      font-size: 14px;
      font-weight: 500;
    }

    .strategy-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }

    .detail-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #1976d2;
    }

    .warnings {
      margin-top: 16px;
      padding: 12px;
      background-color: #fff3e0;
      border: 1px solid #ff9800;
      border-radius: 4px;
    }

    .warning-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 14px;
      color: #e65100;
    }

    .warning-item:last-child {
      margin-bottom: 0;
    }

    .warning-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #ff9800;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 0;
    }

    .dialog-actions button {
      min-width: 120px;
    }

    @media (max-width: 768px) {
      .retry-dialog {
        min-width: auto;
        width: 100%;
        max-width: 400px;
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }

      .dialog-actions {
        flex-direction: column-reverse;
      }

      .dialog-actions button {
        width: 100%;
      }
    }
  `]
})
export class PaymentRetryDialogComponent implements OnInit {
  private fb = inject(FormBuilder);

  retryForm: FormGroup;
  isProcessing = false;
  selectedMethodInfo: PaymentMethodInfo | null = null;

  constructor(
    public dialogRef: MatDialogRef<PaymentRetryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentRetryDialogData
  ) {
    this.retryForm = this.createForm();
  }

  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.updateSelectedMethodInfo();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      paymentMethod: [this.data.payment.paymentMethod, Validators.required],
      amount: [this.data.payment.amount, [Validators.required, Validators.min(0.01)]]
    });
  }

  private setupFormSubscriptions(): void {
    this.retryForm.get('paymentMethod')?.valueChanges.subscribe(() => {
      this.updateSelectedMethodInfo();
    });
  }

  private updateSelectedMethodInfo(): void {
    const selectedMethod = this.retryForm.get('paymentMethod')?.value;
    this.selectedMethodInfo = this.data.availablePaymentMethods.find(
      method => method.type === selectedMethod
    ) || null;
  }

  get availableAlternativeMethods(): PaymentMethodInfo[] {
    return this.data.availablePaymentMethods.filter(
      method => method.type !== this.data.payment.paymentMethod && method.isAvailable
    );
  }

  hasChanges(): boolean {
    const formValue = this.retryForm.value;
    return formValue.paymentMethod !== this.data.payment.paymentMethod ||
           formValue.amount !== this.data.payment.amount;
  }

  getWarnings(): string[] {
    const warnings: string[] = [];
    
    if (this.data.payment.retryCount >= this.data.payment.maxRetries - 1) {
      warnings.push('Este será tu último intento de reintento disponible');
    }

    const formValue = this.retryForm.value;
    if (formValue.amount > this.data.payment.amount) {
      warnings.push('El monto es mayor al pago original');
    }

    if (this.selectedMethodInfo?.fees) {
      warnings.push(`Este método de pago tiene una comisión de ${this.selectedMethodInfo.fees}`);
    }

    if (this.selectedMethodInfo?.minimumAmount && formValue.amount < this.selectedMethodInfo.minimumAmount) {
      warnings.push(`El monto mínimo para este método es ${this.selectedMethodInfo.minimumAmount}`);
    }

    if (this.selectedMethodInfo?.maximumAmount && formValue.amount > this.selectedMethodInfo.maximumAmount) {
      warnings.push(`El monto máximo para este método es ${this.selectedMethodInfo.maximumAmount}`);
    }

    return warnings;
  }

  onReset(): void {
    this.retryForm.patchValue({
      paymentMethod: this.data.payment.paymentMethod,
      amount: this.data.payment.amount
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onRetry(): void {
    if (this.retryForm.valid) {
      const formValue = this.retryForm.value;
      const retryRequest: PaymentRetryRequest = {
        paymentId: this.data.payment.id,
        paymentMethod: formValue.paymentMethod !== this.data.payment.paymentMethod 
          ? formValue.paymentMethod 
          : undefined,
        amount: formValue.amount !== this.data.payment.amount 
          ? formValue.amount 
          : undefined
      };

      this.dialogRef.close(retryRequest);
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
}