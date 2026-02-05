import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import {
  TransactionType,
  TransactionCategory,
  FraudRiskLevel,
  CreateTransactionTypeRequest
} from '../../../../core/models/transaction-type.models';
import { TransactionTypeService } from '../../../../core/services/transaction-type.service';

export interface TransactionTypeFormDialogData {
  mode: 'create' | 'edit';
  transactionType?: TransactionType;
}

@Component({
  selector: 'app-transaction-type-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSlideToggleModule
  ],
  templateUrl: './transaction-type-form-dialog.component.html',
  styleUrls: ['./transaction-type-form-dialog.component.scss']
})
export class TransactionTypeFormDialogComponent implements OnInit {
  typeForm: FormGroup;
  availableCategories: TransactionCategory[] = [];
  availableFraudRiskLevels: FraudRiskLevel[] = [];
  isEditMode: boolean;

  TransactionCategory = TransactionCategory;
  FraudRiskLevel = FraudRiskLevel;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TransactionTypeFormDialogComponent>,
    private transactionTypeService: TransactionTypeService,
    @Inject(MAT_DIALOG_DATA) public data: TransactionTypeFormDialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.typeForm = this.createForm();
  }

  ngOnInit(): void {
    this.availableCategories = this.transactionTypeService.getAvailableCategories();
    this.availableFraudRiskLevels = this.transactionTypeService.getAvailableFraudRiskLevels();

    if (this.isEditMode && this.data.transactionType) {
      this.populateForm(this.data.transactionType);
    }
  }

  /**
   * Create form with validation
   */
  private createForm(): FormGroup {
    return this.fb.group({
      code: [
        { value: '', disabled: this.isEditMode },
        [Validators.required, Validators.minLength(2), Validators.maxLength(10), Validators.pattern(/^[A-Z0-9]+$/)]
      ],
      description: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      category: [TransactionCategory.OTHER, Validators.required],
      fraudRiskLevel: [FraudRiskLevel.LOW, Validators.required],
      requiresAuthorization: [false],
      isActive: [true]
    });
  }

  /**
   * Populate form with transaction type data
   */
  private populateForm(type: TransactionType): void {
    this.typeForm.patchValue({
      code: type.code,
      description: type.description,
      category: type.category,
      fraudRiskLevel: type.fraudRiskLevel,
      requiresAuthorization: type.requiresAuthorization,
      isActive: type.isActive
    });
  }

  /**
   * Get category display text
   */
  getCategoryDisplay(category: TransactionCategory): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  /**
   * Get fraud risk level display text
   */
  getFraudRiskDisplay(level: FraudRiskLevel): string {
    return level.charAt(0).toUpperCase() + level.slice(1);
  }

  /**
   * Submit form
   */
  onSubmit(): void {
    if (this.typeForm.valid) {
      const formValue = this.typeForm.getRawValue();

      if (this.isEditMode) {
        // For edit mode, send all fields except code (which is disabled)
        const updateData: any = {
          description: formValue.description,
          category: formValue.category,
          fraudRiskLevel: formValue.fraudRiskLevel,
          requiresAuthorization: formValue.requiresAuthorization,
          isActive: formValue.isActive
        };

        this.dialogRef.close(updateData);
      } else {
        // For create mode, send all fields
        const createData: CreateTransactionTypeRequest = {
          code: formValue.code,
          description: formValue.description,
          category: formValue.category,
          fraudRiskLevel: formValue.fraudRiskLevel,
          requiresAuthorization: formValue.requiresAuthorization,
          isActive: formValue.isActive
        };

        this.dialogRef.close(createData);
      }
    }
  }

  /**
   * Cancel and close dialog
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Get form title
   */
  getTitle(): string {
    return this.isEditMode ? 'Edit Transaction Type' : 'Add New Transaction Type';
  }
}
