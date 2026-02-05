import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';

import { 
  Card, 
  CreateCardRequest, 
  UpdateCardRequest, 
  CardType, 
  CardStatus 
} from '../../../core/models/card.models';
import { Account } from '../../../core/models/account.models';
import { CardService } from '../../../core/services/card.service';
import { AccountService } from '../../../core/services/account.service';
import { ValidationService } from '../../../core/services/validation.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-card-form',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule
  ],
  template: `
    <div class="card-form-container">
      <!-- Header -->
      <div class="header">
        <div class="header-info">
          <h1>{{ isEditMode ? 'Editar Tarjeta' : 'Nueva Tarjeta' }}</h1>
          <p *ngIf="selectedAccount" class="account-info">
            Cuenta: {{ selectedAccount.accountNumber }} - {{ selectedAccount.customerId }}
          </p>
        </div>
        <div class="header-actions">
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Cancelar
          </button>
        </div>
      </div>

      <!-- Loading Spinner -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>{{ isEditMode ? 'Cargando datos de la tarjeta...' : 'Preparando formulario...' }}</p>
      </div>

      <!-- Form -->
      <div *ngIf="!isLoading">
        <form [formGroup]="cardForm" (ngSubmit)="onSubmit()" novalidate>
          <div class="form-grid">
            <!-- Basic Information Card -->
            <mat-card class="form-section">
              <mat-card-header>
                <mat-card-title>Información Básica</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <!-- Account Selection (only for new cards) -->
                <mat-form-field *ngIf="!isEditMode && !selectedAccount" appearance="outline" class="full-width">
                  <mat-label>Cuenta *</mat-label>
                  <mat-select formControlName="accountId" required>
                    <mat-option *ngFor="let account of availableAccounts" [value]="account.id">
                      {{ account.accountNumber }} - {{ account.customerId }}
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="cardForm.get('accountId')?.hasError('required')">
                    La cuenta es requerida
                  </mat-error>
                </mat-form-field>

                <!-- Card Type -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Tipo de Tarjeta *</mat-label>
                  <mat-select formControlName="cardType" required>
                    <mat-option value="credit">Crédito</mat-option>
                    <mat-option value="debit">Débito</mat-option>
                    <mat-option value="prepaid">Prepago</mat-option>
                  </mat-select>
                  <mat-error *ngIf="cardForm.get('cardType')?.hasError('required')">
                    El tipo de tarjeta es requerido
                  </mat-error>
                </mat-form-field>

                <!-- Cardholder Name -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nombre del Titular *</mat-label>
                  <input matInput formControlName="cardholderName" required maxlength="50">
                  <mat-hint>Nombre como aparecerá en la tarjeta</mat-hint>
                  <mat-error *ngIf="cardForm.get('cardholderName')?.hasError('required')">
                    El nombre del titular es requerido
                  </mat-error>
                  <mat-error *ngIf="cardForm.get('cardholderName')?.hasError('minlength')">
                    El nombre debe tener al menos 2 caracteres
                  </mat-error>
                  <mat-error *ngIf="cardForm.get('cardholderName')?.hasError('maxlength')">
                    El nombre no puede exceder 50 caracteres
                  </mat-error>
                  <mat-error *ngIf="cardForm.get('cardholderName')?.hasError('pattern')">
                    El nombre solo puede contener letras y espacios
                  </mat-error>
                </mat-form-field>

                <!-- Card Status (only for edit mode) -->
                <mat-form-field *ngIf="isEditMode" appearance="outline" class="full-width">
                  <mat-label>Estado</mat-label>
                  <mat-select formControlName="status">
                    <mat-option value="active">Activa</mat-option>
                    <mat-option value="blocked">Bloqueada</mat-option>
                    <mat-option value="pending">Pendiente</mat-option>
                    <mat-option value="expired">Expirada</mat-option>
                  </mat-select>
                </mat-form-field>
              </mat-card-content>
            </mat-card>

            <!-- Credit Information Card -->
            <mat-card class="form-section">
              <mat-card-header>
                <mat-card-title>Información de Crédito</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <!-- Credit Limit -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Límite de Crédito *</mat-label>
                  <input matInput 
                         type="number" 
                         formControlName="creditLimit" 
                         required 
                         min="100" 
                         max="100000"
                         step="100">
                  <span matPrefix>$&nbsp;</span>
                  <mat-hint>Límite mínimo: $100, máximo: $100,000</mat-hint>
                  <mat-error *ngIf="cardForm.get('creditLimit')?.hasError('required')">
                    El límite de crédito es requerido
                  </mat-error>
                  <mat-error *ngIf="cardForm.get('creditLimit')?.hasError('min')">
                    El límite mínimo es $100
                  </mat-error>
                  <mat-error *ngIf="cardForm.get('creditLimit')?.hasError('max')">
                    El límite máximo es $100,000
                  </mat-error>
                  <mat-error *ngIf="cardForm.get('creditLimit')?.hasError('pattern')">
                    Ingrese un monto válido
                  </mat-error>
                </mat-form-field>

                <!-- Credit Limit Preview -->
                <div *ngIf="cardForm.get('creditLimit')?.value" class="credit-preview">
                  <div class="preview-item">
                    <span class="preview-label">Límite Solicitado:</span>
                    <span class="preview-value">{{ cardForm.get('creditLimit')?.value | currency:'USD':'symbol':'1.2-2' }}</span>
                  </div>
                  <div class="preview-item" *ngIf="isEditMode && existingCard">
                    <span class="preview-label">Límite Actual:</span>
                    <span class="preview-value">{{ existingCard.creditLimit | currency:'USD':'symbol':'1.2-2' }}</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Current Card Info (edit mode only) -->
            <mat-card *ngIf="isEditMode && existingCard" class="form-section">
              <mat-card-header>
                <mat-card-title>Información Actual</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="current-info">
                  <div class="info-row">
                    <span class="label">Número de Tarjeta:</span>
                    <span class="value">{{ maskCardNumber(existingCard.cardNumber) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Estado Actual:</span>
                    <mat-chip [class]="'status-' + existingCard.status">
                      {{ getStatusLabel(existingCard.status) }}
                    </mat-chip>
                  </div>
                  <div class="info-row">
                    <span class="label">Crédito Disponible:</span>
                    <span class="value">{{ existingCard.availableCredit | currency:'USD':'symbol':'1.2-2' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Fecha de Expiración:</span>
                    <span class="value">{{ existingCard.expirationDate | date:'MM/yy' }}</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button mat-button type="button" (click)="goBack()">
              Cancelar
            </button>
            <button mat-raised-button 
                    color="primary" 
                    type="submit" 
                    [disabled]="cardForm.invalid || isSubmitting">
              <mat-icon *ngIf="isSubmitting">hourglass_empty</mat-icon>
              <mat-icon *ngIf="!isSubmitting">{{ isEditMode ? 'save' : 'add' }}</mat-icon>
              {{ isSubmitting ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Crear Tarjeta') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .card-form-container {
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-info h1 {
      margin: 0 0 8px 0;
      color: #1976d2;
    }

    .account-info {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
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

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }

    .form-section {
      height: fit-content;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .credit-preview {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-top: 16px;
    }

    .preview-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .preview-item:last-child {
      margin-bottom: 0;
    }

    .preview-label {
      font-weight: 500;
      color: #666;
    }

    .preview-value {
      font-weight: 500;
      color: #1976d2;
    }

    .current-info {
      background-color: #f9f9f9;
      padding: 16px;
      border-radius: 8px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      font-family: monospace;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      padding: 24px 0;
      border-top: 1px solid #e0e0e0;
    }

    .status-active {
      background-color: #4caf50;
      color: white;
    }

    .status-blocked {
      background-color: #f44336;
      color: white;
    }

    .status-expired {
      background-color: #9e9e9e;
      color: white;
    }

    .status-pending {
      background-color: #ff9800;
      color: white;
    }

    @media (max-width: 768px) {
      .card-form-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .header-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class CardFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cardService = inject(CardService);
  private accountService = inject(AccountService);
  private validationService = inject(ValidationService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);

  cardForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;
  existingCard: Card | null = null;
  selectedAccount: Account | null = null;
  availableAccounts: Account[] = [];

  constructor() {
    this.cardForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadAvailableAccounts();
    this.checkRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      accountId: ['', [Validators.required]],
      cardType: ['', [Validators.required]],
      cardholderName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
      ]],
      creditLimit: ['', [
        Validators.required,
        Validators.min(100),
        Validators.max(100000),
        Validators.pattern(/^\d+(\.\d{1,2})?$/)
      ]],
      status: ['active']
    });
  }

  private checkRouteParams(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id'] && params['id'] !== 'new') {
          this.isEditMode = true;
          this.loadCard(params['id']);
        } else {
          this.checkQueryParams();
        }
      });
  }

  private checkQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['accountId']) {
          this.loadAccountAndSetForm(params['accountId']);
        }
      });
  }

  private loadAvailableAccounts(): void {
    this.accountService.getAccounts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (accounts) => {
          this.availableAccounts = accounts;
        },
        error: (error) => {
          console.error('Error loading accounts:', error);
          this.notificationService.showError('Error al cargar las cuentas');
        }
      });
  }

  private loadAccountAndSetForm(accountId: string): void {
    this.accountService.getAccount(accountId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          this.selectedAccount = account;
          this.cardForm.patchValue({ accountId: account.id });
        },
        error: (error) => {
          console.error('Error loading account:', error);
          this.notificationService.showError('Error al cargar la cuenta');
        }
      });
  }

  private loadCard(cardId: string): void {
    this.isLoading = true;
    
    this.cardService.getCard(cardId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (card) => {
          this.existingCard = card;
          this.populateForm(card);
          this.loadAccountAndSetForm(card.accountId);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading card:', error);
          this.isLoading = false;
          this.notificationService.showError('Error al cargar los datos de la tarjeta');
        }
      });
  }

  private populateForm(card: Card): void {
    this.cardForm.patchValue({
      accountId: card.accountId,
      cardType: card.cardType,
      cardholderName: card.cardholderName,
      creditLimit: card.creditLimit,
      status: card.status
    });

    // Disable account selection in edit mode
    this.cardForm.get('accountId')?.disable();
  }

  onSubmit(): void {
    if (this.cardForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.cardForm.value;

    if (this.isEditMode && this.existingCard) {
      this.updateCard(formValue);
    } else {
      this.createCard(formValue);
    }
  }

  private createCard(formValue: any): void {
    const createRequest: CreateCardRequest = {
      accountId: formValue.accountId,
      cardType: formValue.cardType as CardType,
      cardholderName: formValue.cardholderName,
      creditLimit: parseFloat(formValue.creditLimit)
    };

    this.cardService.createCard(createRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (card) => {
          this.isSubmitting = false;
          this.notificationService.showSuccess('Tarjeta creada exitosamente');
          this.router.navigate(['/cards', card.id]);
        },
        error: (error) => {
          console.error('Error creating card:', error);
          this.isSubmitting = false;
          this.notificationService.showError('Error al crear la tarjeta');
        }
      });
  }

  private updateCard(formValue: any): void {
    if (!this.existingCard) return;

    const updateRequest: UpdateCardRequest = {
      id: this.existingCard.id,
      cardType: formValue.cardType as CardType,
      cardholderName: formValue.cardholderName,
      creditLimit: parseFloat(formValue.creditLimit),
      status: formValue.status as CardStatus
    };

    this.cardService.updateCard(updateRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (card) => {
          this.isSubmitting = false;
          this.notificationService.showSuccess('Tarjeta actualizada exitosamente');
          this.router.navigate(['/cards', card.id]);
        },
        error: (error) => {
          console.error('Error updating card:', error);
          this.isSubmitting = false;
          this.notificationService.showError('Error al actualizar la tarjeta');
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.cardForm.controls).forEach(key => {
      const control = this.cardForm.get(key);
      control?.markAsTouched();
    });
  }

  goBack(): void {
    if (this.existingCard) {
      this.router.navigate(['/cards', this.existingCard.id]);
    } else if (this.selectedAccount) {
      this.router.navigate(['/cards'], { queryParams: { accountId: this.selectedAccount.id } });
    } else {
      this.router.navigate(['/cards']);
    }
  }

  maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 4) return cardNumber;
    const lastFour = cardNumber.slice(-4);
    const masked = '*'.repeat(cardNumber.length - 4);
    return masked + lastFour;
  }

  getStatusLabel(status: CardStatus): string {
    const labels = {
      [CardStatus.ACTIVE]: 'Activa',
      [CardStatus.BLOCKED]: 'Bloqueada',
      [CardStatus.EXPIRED]: 'Expirada',
      [CardStatus.PENDING]: 'Pendiente'
    };
    return labels[status] || status;
  }
}