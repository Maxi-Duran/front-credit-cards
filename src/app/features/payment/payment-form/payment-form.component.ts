import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil, combineLatest } from 'rxjs';

import { 
  PaymentRequest, 
  PaymentMethodInfo, 
  PaymentBalance, 
  PaymentMethod,
  PaymentValidation,
  PaymentConfirmation
} from '../../../core/models/payment.models';
import { Account } from '../../../core/models/account.models';
import { PaymentService } from '../../../core/services/payment.service';
import { AccountService } from '../../../core/services/account.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ValidationService } from '../../../core/services/validation.service';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="payment-form-container">
      <!-- Header -->
      <div class="header">
        <h1>Pago de Factura</h1>
        <button mat-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Volver
        </button>
      </div>

      <!-- Loading Spinner -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Cargando información de pago...</p>
      </div>

      <!-- Payment Form -->
      <div *ngIf="!isLoading" class="payment-content">
        <!-- Account Balance Card -->
        <mat-card class="balance-card" *ngIf="currentBalance">
          <mat-card-header>
            <mat-card-title>Información de la Cuenta</mat-card-title>
            <mat-card-subtitle>{{ selectedAccount?.accountNumber }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="balance-info">
              <div class="balance-item">
                <span class="label">Saldo Actual:</span>
                <span class="amount current-balance">{{ currentBalance.currentBalance | currency:'USD':'symbol':'1.2-2' }}</span>
              </div>
              <div class="balance-item">
                <span class="label">Crédito Disponible:</span>
                <span class="amount available-credit">{{ currentBalance.availableCredit | currency:'USD':'symbol':'1.2-2' }}</span>
              </div>
              <div class="balance-item">
                <span class="label">Pago Mínimo:</span>
                <span class="amount minimum-payment">{{ currentBalance.minimumPayment | currency:'USD':'symbol':'1.2-2' }}</span>
              </div>
              <div class="balance-item">
                <span class="label">Fecha de Vencimiento:</span>
                <span class="date">{{ currentBalance.paymentDueDate | date:'dd/MM/yyyy' }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Payment Form Card -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Realizar Pago</mat-card-title>
            <mat-card-subtitle>Complete los datos del pago</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="paymentForm" (ngSubmit)="onSubmit()" class="payment-form">
              <!-- Payment Amount Section -->
              <div class="form-section">
                <h3>Monto del Pago</h3>
                
                <div class="amount-options">
                  <button type="button" mat-stroked-button 
                          (click)="setPaymentAmount(currentBalance?.minimumPayment || 0)"
                          [disabled]="!currentBalance">
                    Pago Mínimo
                  </button>
                  <button type="button" mat-stroked-button 
                          (click)="setPaymentAmount(currentBalance?.currentBalance || 0)"
                          [disabled]="!currentBalance">
                    Pago Total
                  </button>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Monto a Pagar *</mat-label>
                  <input matInput type="number" formControlName="amount" 
                         placeholder="0.00" min="0.01" step="0.01">
                  <span matTextPrefix>$</span>
                  <mat-error *ngIf="paymentForm.get('amount')?.hasError('required')">
                    El monto es requerido
                  </mat-error>
                  <mat-error *ngIf="paymentForm.get('amount')?.hasError('min')">
                    El monto debe ser mayor a $0.01
                  </mat-error>
                  <mat-error *ngIf="paymentForm.get('amount')?.hasError('max')">
                    El monto no puede exceder el saldo actual
                  </mat-error>
                </mat-form-field>
              </div>

              <!-- Payment Method Section -->
              <div class="form-section">
                <h3>Método de Pago</h3>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Seleccionar Método *</mat-label>
                  <mat-select formControlName="paymentMethod" (selectionChange)="onPaymentMethodChange($event.value)">
                    <mat-option *ngFor="let method of availablePaymentMethods" 
                                [value]="method.type"
                                [disabled]="!method.isAvailable">
                      <div class="payment-method-option">
                        <span class="method-name">{{ method.displayName }}</span>
                        <span class="method-description">{{ method.description }}</span>
                        <span class="processing-time" *ngIf="method.processingTime">
                          Tiempo: {{ method.processingTime }}
                        </span>
                        <span class="fees" *ngIf="method.fees">
                          Comisión: {{ method.fees | currency:'USD':'symbol':'1.2-2' }}
                        </span>
                      </div>
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="paymentForm.get('paymentMethod')?.hasError('required')">
                    Debe seleccionar un método de pago
                  </mat-error>
                </mat-form-field>

                <!-- Payment Method Details -->
                <div *ngIf="selectedPaymentMethod" class="method-details">
                  <mat-chip-listbox>
                    <mat-chip-option selected>
                      <mat-icon>info</mat-icon>
                      {{ selectedPaymentMethod.description }}
                    </mat-chip-option>
                    <mat-chip-option *ngIf="selectedPaymentMethod.processingTime">
                      <mat-icon>schedule</mat-icon>
                      {{ selectedPaymentMethod.processingTime }}
                    </mat-chip-option>
                    <mat-chip-option *ngIf="selectedPaymentMethod.fees" color="warn">
                      <mat-icon>attach_money</mat-icon>
                      Comisión: {{ selectedPaymentMethod.fees | currency:'USD':'symbol':'1.2-2' }}
                    </mat-chip-option>
                  </mat-chip-listbox>
                </div>
              </div>

              <!-- Additional Information Section -->
              <div class="form-section">
                <h3>Información Adicional</h3>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Descripción (Opcional)</mat-label>
                  <textarea matInput formControlName="description" 
                            placeholder="Ingrese una descripción para el pago"
                            rows="3" maxlength="200"></textarea>
                  <mat-hint>{{ paymentForm.get('description')?.value?.length || 0 }}/200</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Fecha de Programación (Opcional)</mat-label>
                  <input matInput [matDatepicker]="picker" formControlName="scheduledDate">
                  <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                  <mat-hint>Deje vacío para procesar inmediatamente</mat-hint>
                </mat-form-field>
              </div>

              <!-- Validation Messages -->
              <div *ngIf="validationResult && !validationResult.isValid" class="validation-messages">
                <h4><mat-icon>error_outline</mat-icon> Errores de Validación:</h4>
                <ul>
                  <li *ngFor="let error of validationResult.errors">{{ error.message }}</li>
                </ul>
              </div>

              <div *ngIf="validationResult && validationResult.warnings.length > 0" class="validation-warnings">
                <h4><mat-icon>warning</mat-icon> Advertencias:</h4>
                <ul>
                  <li *ngFor="let warning of validationResult.warnings">{{ warning.message }}</li>
                </ul>
              </div>

              <!-- Payment Summary -->
              <div *ngIf="paymentForm.valid" class="payment-summary">
                <h3>Resumen del Pago</h3>
                <div class="summary-item">
                  <span>Monto del Pago:</span>
                  <span>{{ paymentForm.get('amount')?.value | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
                <div class="summary-item" *ngIf="selectedPaymentMethod?.fees">
                  <span>Comisión:</span>
                  <span>{{ selectedPaymentMethod?.fees | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
                <mat-divider></mat-divider>
                <div class="summary-item total">
                  <span>Total a Pagar:</span>
                  <span>{{ getTotalAmount() | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
                <div class="summary-item">
                  <span>Nuevo Saldo:</span>
                  <span>{{ getNewBalance() | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="form-actions">
                <button mat-button type="button" (click)="goBack()" [disabled]="isSubmitting">
                  Cancelar
                </button>
                <button mat-button type="button" (click)="validatePayment()" 
                        [disabled]="paymentForm.invalid || isValidating">
                  <mat-spinner *ngIf="isValidating" diameter="20"></mat-spinner>
                  <span *ngIf="!isValidating">Validar Pago</span>
                  <span *ngIf="isValidating">Validando...</span>
                </button>
                <button mat-raised-button color="primary" type="submit" 
                        [disabled]="paymentForm.invalid || isSubmitting || !isPaymentValidated">
                  <mat-spinner *ngIf="isSubmitting" diameter="20"></mat-spinner>
                  <span *ngIf="!isSubmitting">Procesar Pago</span>
                  <span *ngIf="isSubmitting">Procesando...</span>
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .payment-form-container {
      padding: 24px;
      max-width: 900px;
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

    .payment-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .balance-card {
      background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
      color: white;
    }

    .balance-card .mat-mdc-card-header .mat-mdc-card-title,
    .balance-card .mat-mdc-card-header .mat-mdc-card-subtitle {
      color: white;
    }

    .balance-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .balance-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .balance-item .label {
      font-size: 14px;
      opacity: 0.9;
    }

    .balance-item .amount {
      font-size: 18px;
      font-weight: 600;
    }

    .balance-item .date {
      font-size: 16px;
      font-weight: 500;
    }

    .current-balance {
      color: #ffcdd2;
    }

    .available-credit {
      color: #c8e6c9;
    }

    .minimum-payment {
      color: #fff3e0;
    }

    .form-card {
      margin-bottom: 24px;
    }

    .payment-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-section {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 24px;
      background-color: #fafafa;
    }

    .form-section h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 18px;
      font-weight: 500;
    }

    .amount-options {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .payment-method-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .method-name {
      font-weight: 500;
    }

    .method-description {
      font-size: 12px;
      color: #666;
    }

    .processing-time,
    .fees {
      font-size: 11px;
      color: #999;
    }

    .method-details {
      margin-top: 16px;
    }

    .validation-messages,
    .validation-warnings {
      padding: 16px;
      border-radius: 4px;
      margin: 16px 0;
    }

    .validation-messages {
      background-color: #ffebee;
      border: 1px solid #f44336;
      color: #c62828;
    }

    .validation-warnings {
      background-color: #fff3e0;
      border: 1px solid #ff9800;
      color: #e65100;
    }

    .validation-messages h4,
    .validation-warnings h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .validation-messages ul,
    .validation-warnings ul {
      margin: 0;
      padding-left: 16px;
    }

    .validation-messages li,
    .validation-warnings li {
      font-size: 14px;
      margin-bottom: 4px;
    }

    .payment-summary {
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
    }

    .payment-summary h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 18px;
      font-weight: 500;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      font-size: 14px;
    }

    .summary-item.total {
      font-size: 16px;
      font-weight: 600;
      color: #1976d2;
      margin-top: 8px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .form-actions button {
      min-width: 120px;
    }

    @media (max-width: 768px) {
      .payment-form-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .balance-info {
        grid-template-columns: 1fr;
      }

      .amount-options {
        flex-direction: column;
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .form-actions button {
        width: 100%;
      }
    }
  `]
})
export class PaymentFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private accountService = inject(AccountService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);
  private validationService = inject(ValidationService);

  paymentForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  isValidating = false;
  isPaymentValidated = false;
  
  selectedAccount: Account | null = null;
  currentBalance: PaymentBalance | null = null;
  availablePaymentMethods: PaymentMethodInfo[] = [];
  selectedPaymentMethod: PaymentMethodInfo | null = null;
  validationResult: PaymentValidation | null = null;

  constructor() {
    this.paymentForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const accountId = params['accountId'];
        if (accountId) {
          this.loadPaymentData(accountId);
        } else {
          this.notificationService.showError('ID de cuenta no especificado');
          this.goBack();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      amount: ['', [
        Validators.required,
        Validators.min(0.01)
      ]],
      paymentMethod: ['', Validators.required],
      description: ['', Validators.maxLength(200)],
      scheduledDate: ['']
    });
  }

  private loadPaymentData(accountId: string): void {
    this.isLoading = true;

    combineLatest([
      this.accountService.getAccount(accountId),
      this.paymentService.getPaymentBalance(accountId),
      this.paymentService.getPaymentMethods()
    ]).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([account, balance, methods]) => {
          this.selectedAccount = account;
          this.currentBalance = balance;
          this.availablePaymentMethods = methods.filter(m => m.isAvailable);
          this.setupFormValidation();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading payment data:', error);
          this.isLoading = false;
          this.notificationService.showError('Error al cargar los datos de pago');
          this.goBack();
        }
      });
  }

  private setupFormValidation(): void {
    if (this.currentBalance) {
      // Add max validator for amount based on current balance
      const amountControl = this.paymentForm.get('amount');
      if (amountControl) {
        amountControl.setValidators([
          Validators.required,
          Validators.min(0.01),
          Validators.max(this.currentBalance.currentBalance)
        ]);
        amountControl.updateValueAndValidity();
      }
    }
  }

  setPaymentAmount(amount: number): void {
    this.paymentForm.patchValue({ amount });
    this.isPaymentValidated = false;
    this.validationResult = null;
  }

  onPaymentMethodChange(method: PaymentMethod): void {
    this.selectedPaymentMethod = this.availablePaymentMethods.find(m => m.type === method) || null;
    this.isPaymentValidated = false;
    this.validationResult = null;
  }

  validatePayment(): void {
    if (this.paymentForm.invalid || !this.selectedAccount) return;

    this.isValidating = true;
    const formValue = this.paymentForm.value;
    
    const paymentRequest: PaymentRequest = {
      accountId: this.selectedAccount.id.toString(),
      amount: formValue.amount,
      paymentMethod: formValue.paymentMethod,
      description: formValue.description || undefined,
      scheduledDate: formValue.scheduledDate || undefined
    };

    this.paymentService.validatePayment(paymentRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (validation) => {
          this.validationResult = validation;
          this.isPaymentValidated = validation.isValid;
          this.isValidating = false;
          
          if (validation.isValid) {
            this.notificationService.showSuccess('Pago validado correctamente');
          } else {
            this.notificationService.showWarning('El pago tiene errores de validación');
          }
        },
        error: (error) => {
          console.error('Error validating payment:', error);
          this.isValidating = false;
          this.notificationService.showError('Error al validar el pago');
        }
      });
  }

  onSubmit(): void {
    if (this.paymentForm.invalid || !this.selectedAccount || !this.isPaymentValidated) return;

    this.isSubmitting = true;
    const formValue = this.paymentForm.value;
    
    const paymentRequest: PaymentRequest = {
      accountId: this.selectedAccount.id.toString(),
      amount: formValue.amount,
      paymentMethod: formValue.paymentMethod,
      description: formValue.description || undefined,
      scheduledDate: formValue.scheduledDate || undefined
    };

    this.paymentService.processPayment(paymentRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (confirmation) => {
          this.isSubmitting = false;
          this.notificationService.showSuccess('Pago procesado exitosamente');
          this.router.navigate(['/payments/confirmation'], { 
            queryParams: { confirmationId: confirmation.confirmationNumber }
          });
        },
        error: (error) => {
          console.error('Error processing payment:', error);
          this.isSubmitting = false;
          this.notificationService.showError('Error al procesar el pago');
        }
      });
  }

  getTotalAmount(): number {
    const amount = this.paymentForm.get('amount')?.value || 0;
    const fees = this.selectedPaymentMethod?.fees || 0;
    return amount + fees;
  }

  getNewBalance(): number {
    const currentBalance = this.currentBalance?.currentBalance || 0;
    const paymentAmount = this.paymentForm.get('amount')?.value || 0;
    return currentBalance - paymentAmount;
  }

  goBack(): void {
    this.router.navigate(['/payments']);
  }
}