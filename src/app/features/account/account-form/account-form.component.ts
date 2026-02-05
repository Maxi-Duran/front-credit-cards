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
import { Subject, takeUntil } from 'rxjs';

import { Account, AccountStatus, CreateAccountRequest, UpdateAccountRequest } from '../../../core/models/account.models';
import { AccountService } from '../../../core/services/account.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ValidationService } from '../../../core/services/validation.service';

@Component({
  selector: 'app-account-form',
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
    MatNativeDateModule
  ],
  template: `
    <div class="account-form-container">
      <!-- Header -->
      <div class="header">
        <h1>{{ isEditMode ? 'Editar Cuenta' : 'Nueva Cuenta' }}</h1>
        <button mat-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Volver
        </button>
      </div>

      <!-- Loading Spinner -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>{{ isEditMode ? 'Cargando datos de la cuenta...' : 'Preparando formulario...' }}</p>
      </div>

      <!-- Form -->
      <mat-card *ngIf="!isLoading" class="form-card">
        <mat-card-header>
          <mat-card-title>
            {{ isEditMode ? 'Información de la Cuenta' : 'Datos de la Nueva Cuenta' }}
          </mat-card-title>
          <mat-card-subtitle>
            {{ isEditMode ? 'Modifica los campos necesarios' : 'Completa todos los campos requeridos' }}
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="accountForm" (ngSubmit)="onSubmit()" class="account-form">
            <!-- Basic Information Section -->
            <div class="form-section">
              <h3>Información Básica</h3>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>ID Cliente *</mat-label>
                  <input matInput formControlName="customerId" placeholder="Ingrese el ID del cliente">
                  <mat-error *ngIf="accountForm.get('customerId')?.hasError('required')">
                    El ID del cliente es requerido
                  </mat-error>
                  <mat-error *ngIf="accountForm.get('customerId')?.hasError('customerIdFormat')">
                    {{ accountForm.get('customerId')?.errors?.['customerIdFormat']?.message }}
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Número de Cuenta</mat-label>
                  <input matInput formControlName="accountNumber" placeholder="Se generará automáticamente" readonly>
                  <mat-hint>El número de cuenta se genera automáticamente</mat-hint>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Tipo de Cuenta *</mat-label>
                  <mat-select formControlName="accountType">
                    <mat-option value="checking">Cuenta Corriente</mat-option>
                    <mat-option value="savings">Cuenta de Ahorros</mat-option>
                    <mat-option value="credit">Cuenta de Crédito</mat-option>
                  </mat-select>
                  <mat-error *ngIf="accountForm.get('accountType')?.hasError('required')">
                    El tipo de cuenta es requerido
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row" *ngIf="isEditMode">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Estado</mat-label>
                  <mat-select formControlName="status">
                    <mat-option value="active">Activa</mat-option>
                    <mat-option value="inactive">Inactiva</mat-option>
                    <mat-option value="suspended">Suspendida</mat-option>
                    <mat-option value="closed">Cerrada</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <!-- Financial Information Section -->
            <div class="form-section">
              <h3>Información Financiera</h3>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Límite de Crédito</mat-label>
                  <input matInput type="number" formControlName="creditLimit" 
                         placeholder="0.00" min="0" step="0.01">
                  <span matTextPrefix>$</span>
                  <mat-error *ngIf="accountForm.get('creditLimit')?.hasError('currencyMin')">
                    {{ accountForm.get('creditLimit')?.errors?.['currencyMin']?.message }}
                  </mat-error>
                  <mat-error *ngIf="accountForm.get('creditLimit')?.hasError('currencyMax')">
                    {{ accountForm.get('creditLimit')?.errors?.['currencyMax']?.message }}
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Tasa de Interés (%)</mat-label>
                  <input matInput type="number" formControlName="interestRate" 
                         placeholder="0.00" min="0" max="100" step="0.01">
                  <span matTextSuffix>%</span>
                  <mat-error *ngIf="accountForm.get('interestRate')?.hasError('percentageRange')">
                    {{ accountForm.get('interestRate')?.errors?.['percentageRange']?.message }}
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row" *ngIf="isEditMode">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Saldo Actual</mat-label>
                  <input matInput type="number" formControlName="balance" readonly>
                  <span matTextPrefix>$</span>
                  <mat-hint>El saldo se actualiza automáticamente</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Crédito Disponible</mat-label>
                  <input matInput type="number" formControlName="availableCredit" readonly>
                  <span matTextPrefix>$</span>
                  <mat-hint>Se calcula automáticamente</mat-hint>
                </mat-form-field>
              </div>
            </div>

            <!-- Validation Summary -->
            <div *ngIf="showValidationSummary" class="validation-summary">
              <mat-icon>error_outline</mat-icon>
              <div>
                <h4>Por favor corrige los siguientes errores:</h4>
                <ul>
                  <li *ngFor="let error of validationErrors">{{ error }}</li>
                </ul>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
              <button mat-button type="button" (click)="goBack()" [disabled]="isSubmitting">
                Cancelar
              </button>
              <button mat-raised-button color="primary" type="submit" 
                      [disabled]="accountForm.invalid || isSubmitting">
                <mat-spinner *ngIf="isSubmitting" diameter="20"></mat-spinner>
                <span *ngIf="!isSubmitting">
                  {{ isEditMode ? 'Actualizar Cuenta' : 'Crear Cuenta' }}
                </span>
                <span *ngIf="isSubmitting">
                  {{ isEditMode ? 'Actualizando...' : 'Creando...' }}
                </span>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .account-form-container {
      padding: 24px;
      max-width: 800px;
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

    .form-card {
      margin-bottom: 24px;
    }

    .account-form {
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

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-row:last-child {
      margin-bottom: 0;
    }

    .full-width {
      width: 100%;
    }

    .half-width {
      flex: 1;
    }

    .validation-summary {
      display: flex;
      gap: 12px;
      padding: 16px;
      background-color: #ffebee;
      border: 1px solid #f44336;
      border-radius: 4px;
      color: #c62828;
    }

    .validation-summary mat-icon {
      color: #f44336;
      margin-top: 2px;
    }

    .validation-summary h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
    }

    .validation-summary ul {
      margin: 0;
      padding-left: 16px;
    }

    .validation-summary li {
      font-size: 14px;
      margin-bottom: 4px;
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
      .account-form-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .form-row {
        flex-direction: column;
      }

      .half-width {
        width: 100%;
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
export class AccountFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private accountService = inject(AccountService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);
  private validationService = inject(ValidationService);

  accountForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;
  showValidationSummary = false;
  validationErrors: string[] = [];
  currentAccount: Account | null = null;

  constructor() {
    this.accountForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const accountId = params['id'];
        if (accountId && accountId !== 'new') {
          this.isEditMode = true;
          this.loadAccount(accountId);
        } else {
          this.isEditMode = false;
          this.setupNewAccountForm();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      customerId: ['', [
        Validators.required, 
        this.validationService.customerIdValidator()
      ]],
      accountNumber: [''],
      accountType: ['', Validators.required],
      status: ['active'],
      balance: [{ value: 0, disabled: true }],
      creditLimit: [0, [
        this.validationService.currencyValidator(0, 1000000)
      ]],
      availableCredit: [{ value: 0, disabled: true }],
      interestRate: [0, [
        this.validationService.percentageValidator(0, 100)
      ]]
    });
  }

  private setupNewAccountForm(): void {
    this.accountForm.patchValue({
      status: 'active',
      balance: 0,
      availableCredit: 0
    });
  }

  private loadAccount(id: string): void {
    this.isLoading = true;
    
    this.accountService.getAccount(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          this.currentAccount = account;
          this.populateForm(account);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading account:', error);
          this.isLoading = false;
          this.notificationService.showError('Error al cargar los datos de la cuenta');
          this.goBack();
        }
      });
  }

  private populateForm(account: Account): void {
    this.accountForm.patchValue({
      customerId: account.customerId,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      status: account.status,
      balance: account.balance,
      creditLimit: account.creditLimit || 0,
      availableCredit: account.availableCredit || 0,
      interestRate: account.interestRate || 0
    });
  }

  onSubmit(): void {
    if (this.accountForm.valid) {
      this.showValidationSummary = false;
      this.isSubmitting = true;

      if (this.isEditMode) {
        this.updateAccount();
      } else {
        this.createAccount();
      }
    } else {
      this.showValidationErrors();
    }
  }

  private createAccount(): void {
    const formValue = this.accountForm.value;
    const createRequest: CreateAccountRequest = {
      customerId: formValue.customerId,
      accountType: formValue.accountType,
      creditLimit: formValue.creditLimit || undefined,
      interestRate: formValue.interestRate || undefined
    };

    this.accountService.createAccount(createRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          this.isSubmitting = false;
          this.notificationService.showSuccess('Cuenta creada exitosamente');
          this.router.navigate(['/accounts', account.id]);
        },
        error: (error) => {
          console.error('Error creating account:', error);
          this.isSubmitting = false;
          this.notificationService.showError('Error al crear la cuenta');
        }
      });
  }

  private updateAccount(): void {
    if (!this.currentAccount) return;

    const formValue = this.accountForm.value;
    const updateRequest: UpdateAccountRequest = {
      id: this.currentAccount.id.toString(),
      accountType: formValue.accountType,
      status: formValue.status,
      creditLimit: formValue.creditLimit || undefined,
      interestRate: formValue.interestRate || undefined
    };

    this.accountService.updateAccount(updateRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          this.isSubmitting = false;
          this.notificationService.showSuccess('Cuenta actualizada exitosamente');
          this.router.navigate(['/accounts', account.id]);
        },
        error: (error) => {
          console.error('Error updating account:', error);
          this.isSubmitting = false;
          this.notificationService.showError('Error al actualizar la cuenta');
        }
      });
  }

  private showValidationErrors(): void {
    this.validationErrors = [];
    const controls = this.accountForm.controls;

    Object.keys(controls).forEach(key => {
      const control = controls[key];
      if (control.invalid && control.errors) {
        const fieldName = this.getFieldDisplayName(key);
        const errorMessage = this.validationService.getErrorMessage(control.errors, fieldName, 'es');
        this.validationErrors.push(errorMessage);
      }
    });

    this.showValidationSummary = this.validationErrors.length > 0;
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: Record<string, string> = {
      'customerId': 'ID Cliente',
      'accountType': 'Tipo de Cuenta',
      'creditLimit': 'Límite de Crédito',
      'interestRate': 'Tasa de Interés'
    };
    return displayNames[fieldName] || fieldName;
  }

  goBack(): void {
    if (this.isEditMode && this.currentAccount) {
      this.router.navigate(['/accounts', this.currentAccount.id]);
    } else {
      this.router.navigate(['/accounts']);
    }
  }
}