import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

export interface DenialDialogData {
  authorizationId: string;
  merchantName: string;
  amount: number;
}

export interface DenialDialogResult {
  reason: string;
  notes?: string;
}

@Component({
  selector: 'app-authorization-denial-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="dialog-icon">cancel</mat-icon>
      Denegar Autorización
    </h2>
    
    <mat-dialog-content>
      <div class="dialog-info">
        <p><strong>Comercio:</strong> {{ data.merchantName }}</p>
        <p><strong>Monto:</strong> {{ data.amount | currency:'USD':'symbol':'1.2-2' }}</p>
      </div>

      <form [formGroup]="denialForm" class="denial-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Razón de Denegación</mat-label>
          <mat-select formControlName="reason" required>
            <mat-option value="fraud_suspected">Sospecha de Fraude</mat-option>
            <mat-option value="insufficient_funds">Fondos Insuficientes</mat-option>
            <mat-option value="invalid_merchant">Comercio Inválido</mat-option>
            <mat-option value="unusual_activity">Actividad Inusual</mat-option>
            <mat-option value="card_blocked">Tarjeta Bloqueada</mat-option>
            <mat-option value="exceeded_limit">Límite Excedido</mat-option>
            <mat-option value="other">Otra Razón</mat-option>
          </mat-select>
          <mat-error *ngIf="denialForm.get('reason')?.hasError('required')">
            La razón es requerida
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notas Adicionales (Opcional)</mat-label>
          <textarea 
            matInput 
            formControlName="notes" 
            rows="4"
            placeholder="Agregue cualquier información adicional relevante..."></textarea>
        </mat-form-field>
      </form>

      <div class="warning-message">
        <mat-icon>warning</mat-icon>
        <p>Esta acción no se puede deshacer. La autorización será denegada permanentemente.</p>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button 
        mat-raised-button 
        color="warn" 
        (click)="onConfirm()"
        [disabled]="!denialForm.valid">
        <mat-icon>cancel</mat-icon>
        Denegar Autorización
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-icon {
      vertical-align: middle;
      margin-right: 8px;
      color: #f44336;
    }

    .dialog-info {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 24px;
    }

    .dialog-info p {
      margin: 8px 0;
    }

    .denial-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .warning-message {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background-color: #fff3e0;
      border-left: 4px solid #ff9800;
      border-radius: 4px;
      margin-top: 16px;
    }

    .warning-message mat-icon {
      color: #ff9800;
      flex-shrink: 0;
    }

    .warning-message p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    mat-dialog-content {
      min-width: 500px;
      max-width: 600px;
    }

    @media (max-width: 768px) {
      mat-dialog-content {
        min-width: unset;
        max-width: unset;
      }
    }
  `]
})
export class AuthorizationDenialDialogComponent {
  denialForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AuthorizationDenialDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DenialDialogData
  ) {
    this.denialForm = this.fb.group({
      reason: ['', Validators.required],
      notes: ['']
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.denialForm.valid) {
      const result: DenialDialogResult = {
        reason: this.getReasonLabel(this.denialForm.value.reason),
        notes: this.denialForm.value.notes || undefined
      };
      this.dialogRef.close(result);
    }
  }

  private getReasonLabel(reasonCode: string): string {
    const labels: Record<string, string> = {
      'fraud_suspected': 'Sospecha de Fraude',
      'insufficient_funds': 'Fondos Insuficientes',
      'invalid_merchant': 'Comercio Inválido',
      'unusual_activity': 'Actividad Inusual',
      'card_blocked': 'Tarjeta Bloqueada',
      'exceeded_limit': 'Límite Excedido',
      'other': 'Otra Razón'
    };
    return labels[reasonCode] || reasonCode;
  }
}
