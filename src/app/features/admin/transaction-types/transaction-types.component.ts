import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TransactionTypeService } from '../../../core/services/transaction-type.service';
import {
  TransactionType,
  TransactionCategory,
  FraudRiskLevel,
  CreateTransactionTypeRequest,
  UpdateTransactionTypeRequest,
  TransactionTypeUsageInfo
} from '../../../core/models/transaction-type.models';
import { TransactionTypeFormDialogComponent } from './transaction-type-form-dialog/transaction-type-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-transaction-types',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatTooltipModule
  ],
  templateUrl: './transaction-types.component.html',
  styleUrls: ['./transaction-types.component.scss']
})
export class TransactionTypesComponent implements OnInit {
  transactionTypes: TransactionType[] = [];
  displayedColumns: string[] = ['code', 'description', 'category', 'fraudRiskLevel', 'requiresAuth', 'isActive', 'actions'];
  loading = false;
  searchForm: FormGroup;

  TransactionCategory = TransactionCategory;
  FraudRiskLevel = FraudRiskLevel;

  constructor(
    private transactionTypeService: TransactionTypeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      query: [''],
      category: [''],
      isActive: [''],
      fraudRiskLevel: ['']
    });
  }

  ngOnInit(): void {
    this.loadTransactionTypes();

    // Subscribe to search form changes
    this.searchForm.valueChanges.subscribe(() => {
      this.loadTransactionTypes();
    });
  }

  /**
   * Load transaction types with current search criteria
   */
  loadTransactionTypes(): void {
    this.loading = true;
    const criteria = {
      query: this.searchForm.value.query || undefined,
      category: this.searchForm.value.category || undefined,
      isActive: this.searchForm.value.isActive !== '' ? this.searchForm.value.isActive === 'true' : undefined,
      fraudRiskLevel: this.searchForm.value.fraudRiskLevel || undefined
    };

    this.transactionTypeService.getTransactionTypes(criteria).subscribe({
      next: (response) => {
        this.transactionTypes = response.transactionTypes;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading transaction types:', error);
        this.showMessage('Error loading transaction types', 'error');
        this.loading = false;
      }
    });
  }

  /**
   * Open dialog to add new transaction type
   */
  addTransactionType(): void {
    const dialogRef = this.dialog.open(TransactionTypeFormDialogComponent, {
      width: '600px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createTransactionType(result);
      }
    });
  }

  /**
   * Open dialog to edit transaction type
   */
  editTransactionType(type: TransactionType): void {
    const dialogRef = this.dialog.open(TransactionTypeFormDialogComponent, {
      width: '600px',
      data: { mode: 'edit', transactionType: type }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateTransactionType(type.id, result);
      }
    });
  }

  /**
   * Open dialog to confirm transaction type deletion
   */
  deleteTransactionType(type: TransactionType): void {
    // First check usage
    this.transactionTypeService.getTransactionTypeUsage(type.id).subscribe({
      next: (usageInfo: TransactionTypeUsageInfo) => {
        if (!usageInfo.canDelete) {
          this.showMessage(
            `Cannot delete transaction type. It is used by ${usageInfo.relatedTransactions} transactions.`,
            'error'
          );
          return;
        }

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          width: '400px',
          data: {
            title: 'Delete Transaction Type',
            message: `Are you sure you want to delete transaction type "${type.description}"? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
          }
        });

        dialogRef.afterClosed().subscribe(confirmed => {
          if (confirmed) {
            this.performDeleteTransactionType(type.id);
          }
        });
      },
      error: (error: Error) => {
        console.error('Error checking transaction type usage:', error);
        this.showMessage('Error checking transaction type usage', 'error');
      }
    });
  }

  /**
   * Toggle transaction type active status
   */
  toggleActive(type: TransactionType, event: MatSlideToggleChange): void {
    const isActive = event.checked;
    
    const updateRequest: UpdateTransactionTypeRequest = {
      id: type.id,
      isActive: isActive
    };

    this.transactionTypeService.updateTransactionType(updateRequest).subscribe({
      next: () => {
        this.showMessage(
          `Transaction type ${isActive ? 'activated' : 'deactivated'} successfully`,
          'success'
        );
        this.loadTransactionTypes();
      },
      error: (error: Error) => {
        console.error('Error updating transaction type:', error);
        this.showMessage(error.message || 'Error updating transaction type', 'error');
      }
    });
  }

  /**
   * Create new transaction type
   */
  private createTransactionType(request: CreateTransactionTypeRequest): void {
    this.loading = true;
    this.transactionTypeService.createTransactionType(request).subscribe({
      next: () => {
        this.showMessage('Transaction type created successfully', 'success');
        this.loadTransactionTypes();
      },
      error: (error: Error) => {
        console.error('Error creating transaction type:', error);
        this.showMessage(error.message || 'Error creating transaction type', 'error');
        this.loading = false;
      }
    });
  }

  /**
   * Update existing transaction type
   */
  private updateTransactionType(id: string, request: Partial<UpdateTransactionTypeRequest>): void {
    this.loading = true;
    const updateRequest: UpdateTransactionTypeRequest = { id, ...request };

    this.transactionTypeService.updateTransactionType(updateRequest).subscribe({
      next: () => {
        this.showMessage('Transaction type updated successfully', 'success');
        this.loadTransactionTypes();
      },
      error: (error: Error) => {
        console.error('Error updating transaction type:', error);
        this.showMessage(error.message || 'Error updating transaction type', 'error');
        this.loading = false;
      }
    });
  }

  /**
   * Delete transaction type
   */
  private performDeleteTransactionType(id: string): void {
    this.loading = true;
    this.transactionTypeService.deleteTransactionType({ id }).subscribe({
      next: () => {
        this.showMessage('Transaction type deleted successfully', 'success');
        this.loadTransactionTypes();
      },
      error: (error: Error) => {
        console.error('Error deleting transaction type:', error);
        this.showMessage(error.message || 'Error deleting transaction type', 'error');
        this.loading = false;
      }
    });
  }

  /**
   * Get category display text
   */
  getCategoryDisplay(category: TransactionCategory): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  /**
   * Get fraud risk level class
   */
  getFraudRiskClass(level: FraudRiskLevel): string {
    switch (level) {
      case FraudRiskLevel.LOW:
        return 'risk-low';
      case FraudRiskLevel.MEDIUM:
        return 'risk-medium';
      case FraudRiskLevel.HIGH:
        return 'risk-high';
      default:
        return '';
    }
  }

  /**
   * Get fraud risk level display text
   */
  getFraudRiskDisplay(level: FraudRiskLevel): string {
    return level.charAt(0).toUpperCase() + level.slice(1);
  }

  /**
   * Show snackbar message
   */
  private showMessage(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error'
    });
  }

  /**
   * Clear search filters
   */
  clearFilters(): void {
    this.searchForm.reset();
  }
}
