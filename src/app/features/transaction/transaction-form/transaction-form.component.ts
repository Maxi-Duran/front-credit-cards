import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { Observable, Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import { 
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionType,
  TransactionTypeConfig,
  TransactionValidationResult
} from '../../../core/models/transaction.models';
import { Card } from '../../../core/models/card.models';
import { TransactionService } from '../../../core/services/transaction.service';
import { CardService } from '../../../core/services/card.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ValidationService } from '../../../core/services/validation.service';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatStepperModule,
    MatDividerModule
  ],
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionFormComponent implements OnInit, OnDestroy {
  transactionForm: FormGroup;
  locationForm: FormGroup;
  
  // Observable data
  loading$: Observable<boolean>;
  cards$: Observable<Card[]>;
  transactionTypes$: Observable<TransactionTypeConfig[]>;

  // Component state
  isEditMode = false;
  transactionId: string | null = null;
  selectedCard: Card | null = null;
  transactionTypes: TransactionTypeConfig[] = [];
  validationResult: TransactionValidationResult | null = null;
  
  // Enums for template
  TransactionType = TransactionType;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private transactionService: TransactionService,
    private cardService: CardService,
    private loadingService: LoadingService,
    private notificationService: NotificationService,
    private validationService: ValidationService
  ) {
    this.loading$ = this.loadingService.loading$;
    this.cards$ = this.cardService.cards$;
    this.transactionTypes$ = this.transactionService.transactionTypes$;

    this.transactionForm = this.createTransactionForm();
    this.locationForm = this.createLocationForm();
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.loadTransactionTypes();
    this.loadCards();
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    // Subscribe to transaction types
    this.transactionTypes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(types => {
        this.transactionTypes = types;
      });

    // Watch for card selection changes
    this.transactionForm.get('cardId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(cardId => {
        if (cardId) {
          this.cardService.cards$
            .pipe(takeUntil(this.destroy$))
            .subscribe(cards => {
              this.selectedCard = cards.find(card => card.id === cardId) || null;
            });
        }
      });

    // Watch for transaction type changes to update validation
    this.transactionForm.get('transactionType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        this.updateFormValidationForType(type);
      });
  }

  private createTransactionForm(): FormGroup {
    return this.fb.group({
      cardId: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      transactionType: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.maxLength(255)]],
      merchantName: ['', [Validators.required, Validators.maxLength(100)]],
      merchantCategory: ['', [Validators.required, Validators.maxLength(50)]],
      currency: ['USD', [Validators.required]],
      originalAmount: [''],
      originalCurrency: ['']
    });
  }

  private createLocationForm(): FormGroup {
    return this.fb.group({
      country: ['', [Validators.required, Validators.maxLength(50)]],
      city: ['', [Validators.required, Validators.maxLength(50)]],
      address: ['', [Validators.maxLength(200)]],
      latitude: [''],
      longitude: ['']
    });
  }

  private loadTransactionTypes(): void {
    this.transactionService.getTransactionTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => {
          console.error('Error loading transaction types:', error);
          this.notificationService.showError('Error loading transaction types');
        }
      });
  }

  private loadCards(): void {
    // Load all cards for selection
    this.cardService.getAllCards()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => {
          console.error('Error loading cards:', error);
          this.notificationService.showError('Error loading cards');
        }
      });
  }

  private checkEditMode(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.isEditMode = true;
          this.transactionId = params['id'];
          this.loadTransactionForEdit();
        }
      });
  }

  private loadTransactionForEdit(): void {
    if (!this.transactionId) return;

    this.loadingService.setLoading(true);
    this.transactionService.getTransaction(this.transactionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transaction) => {
          this.populateFormWithTransaction(transaction);
          this.loadingService.setLoading(false);
        },
        error: (error) => {
          this.loadingService.setLoading(false);
          console.error('Error loading transaction for edit:', error);
          this.notificationService.showError('Error loading transaction');
          this.router.navigate(['/transactions']);
        }
      });
  }

  private populateFormWithTransaction(transaction: Transaction): void {
    this.transactionForm.patchValue({
      cardId: transaction.cardId,
      amount: transaction.amount,
      transactionType: transaction.transactionType,
      description: transaction.description,
      merchantName: transaction.merchantName,
      merchantCategory: transaction.merchantCategory,
      currency: transaction.currency,
      originalAmount: transaction.originalAmount,
      originalCurrency: transaction.originalCurrency
    });

    if (transaction.location) {
      this.locationForm.patchValue({
        country: transaction.location.country,
        city: transaction.location.city,
        address: transaction.location.address,
        latitude: transaction.location.coordinates?.latitude,
        longitude: transaction.location.coordinates?.longitude
      });
    }
  }

  private updateFormValidationForType(transactionType: TransactionType): void {
    const amountControl = this.transactionForm.get('amount');
    const originalAmountControl = this.transactionForm.get('originalAmount');
    const originalCurrencyControl = this.transactionForm.get('originalCurrency');

    if (!amountControl) return;

    // Find transaction type config
    const typeConfig = this.transactionTypes.find(t => t.code === transactionType);
    
    if (typeConfig) {
      // Update amount validation based on type limits
      const validators = [Validators.required, Validators.min(0.01)];
      
      if (typeConfig.maxAmount) {
        validators.push(Validators.max(typeConfig.maxAmount));
      }
      
      amountControl.setValidators(validators);
      amountControl.updateValueAndValidity();

      // Handle foreign currency requirements
      if (transactionType === TransactionType.PURCHASE) {
        originalAmountControl?.setValidators([]);
        originalCurrencyControl?.setValidators([]);
      }
    }
  }

  validateTransaction(): void {
    if (this.transactionForm.invalid || this.locationForm.invalid) {
      this.markFormGroupTouched(this.transactionForm);
      this.markFormGroupTouched(this.locationForm);
      return;
    }

    const transactionData = this.buildTransactionRequest();
    
    this.transactionService.validateTransaction(transactionData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.validationResult = result;
          if (result.isValid) {
            this.notificationService.showSuccess('Transaction validation passed');
          } else {
            this.notificationService.showWarning('Transaction validation failed');
          }
        },
        error: (error) => {
          console.error('Error validating transaction:', error);
          this.notificationService.showError('Error validating transaction');
        }
      });
  }

  onSubmit(): void {
    if (this.transactionForm.invalid || this.locationForm.invalid) {
      this.markFormGroupTouched(this.transactionForm);
      this.markFormGroupTouched(this.locationForm);
      return;
    }

    this.loadingService.setLoading(true);

    if (this.isEditMode) {
      this.updateTransaction();
    } else {
      this.createTransaction();
    }
  }

  private createTransaction(): void {
    const transactionData = this.buildTransactionRequest();

    this.transactionService.createTransaction(transactionData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transaction) => {
          this.loadingService.setLoading(false);
          this.notificationService.showSuccess('Transaction created successfully');
          this.router.navigate(['/transactions', transaction.id]);
        },
        error: (error) => {
          this.loadingService.setLoading(false);
          console.error('Error creating transaction:', error);
          this.notificationService.showError('Error creating transaction');
        }
      });
  }

  private updateTransaction(): void {
    if (!this.transactionId) return;

    const updateData: UpdateTransactionRequest = {
      id: this.transactionId,
      description: this.transactionForm.get('description')?.value,
      merchantName: this.transactionForm.get('merchantName')?.value,
      merchantCategory: this.transactionForm.get('merchantCategory')?.value
    };

    this.transactionService.updateTransaction(updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transaction) => {
          this.loadingService.setLoading(false);
          this.notificationService.showSuccess('Transaction updated successfully');
          this.router.navigate(['/transactions', transaction.id]);
        },
        error: (error) => {
          this.loadingService.setLoading(false);
          console.error('Error updating transaction:', error);
          this.notificationService.showError('Error updating transaction');
        }
      });
  }

  private buildTransactionRequest(): CreateTransactionRequest {
    const formValue = this.transactionForm.value;
    const locationValue = this.locationForm.value;

    const location = {
      country: locationValue.country,
      city: locationValue.city,
      address: locationValue.address || undefined,
      coordinates: (locationValue.latitude && locationValue.longitude) ? {
        latitude: Number(locationValue.latitude),
        longitude: Number(locationValue.longitude)
      } : undefined
    };

    return {
      cardId: formValue.cardId,
      amount: Number(formValue.amount),
      transactionType: formValue.transactionType,
      description: formValue.description,
      merchantName: formValue.merchantName,
      merchantCategory: formValue.merchantCategory,
      location: location,
      currency: formValue.currency,
      originalAmount: formValue.originalAmount ? Number(formValue.originalAmount) : undefined,
      originalCurrency: formValue.originalCurrency || undefined
    };
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  cancel(): void {
    this.router.navigate(['/transactions']);
  }

  getErrorMessage(controlName: string, formGroup: FormGroup = this.transactionForm): string {
    const control = formGroup.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${controlName} is required`;
      }
      if (control.errors['min']) {
        return `${controlName} must be greater than ${control.errors['min'].min}`;
      }
      if (control.errors['max']) {
        return `${controlName} must be less than ${control.errors['max'].max}`;
      }
      if (control.errors['maxlength']) {
        return `${controlName} must be less than ${control.errors['maxlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  getTransactionTypeDescription(type: TransactionType): string {
    const typeConfig = this.transactionTypes.find(t => t.code === type);
    return typeConfig?.description || '';
  }

  getTransactionTypeMaxAmount(type: TransactionType): number | null {
    const typeConfig = this.transactionTypes.find(t => t.code === type);
    return typeConfig?.maxAmount || null;
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}