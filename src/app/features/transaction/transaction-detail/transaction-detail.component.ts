import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import { 
  Transaction, 
  TransactionStatus,
  TransactionType,
  FraudRiskLevel
} from '../../../core/models/transaction.models';
import { TransactionService } from '../../../core/services/transaction.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './transaction-detail.component.html',
  styleUrls: ['./transaction-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionDetailComponent implements OnInit, OnDestroy {
  transaction$: Observable<Transaction | null>;
  loading$: Observable<boolean>;
  
  // Enums for template
  TransactionStatus = TransactionStatus;
  TransactionType = TransactionType;
  FraudRiskLevel = FraudRiskLevel;

  private destroy$ = new Subject<void>();
  private transactionId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private transactionService: TransactionService,
    private loadingService: LoadingService,
    private notificationService: NotificationService
  ) {
    this.transaction$ = this.transactionService.selectedTransaction$;
    this.loading$ = this.loadingService.loading$;
  }

  ngOnInit(): void {
    this.loadTransactionDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTransactionDetails(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          this.transactionId = params['id'];
          if (!this.transactionId) {
            throw new Error('Transaction ID is required');
          }
          this.loadingService.setLoading(true);
          return this.transactionService.getTransaction(this.transactionId);
        })
      )
      .subscribe({
        next: (transaction) => {
          this.loadingService.setLoading(false);
        },
        error: (error) => {
          this.loadingService.setLoading(false);
          this.notificationService.showError('Error loading transaction details');
          console.error('Error loading transaction:', error);
          this.router.navigate(['/transactions']);
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/transactions']);
  }

  editTransaction(transaction: Transaction): void {
    if (transaction.status === TransactionStatus.PENDING) {
      this.router.navigate(['/transactions', transaction.id, 'edit']);
    } else {
      this.notificationService.showWarning('Only pending transactions can be edited');
    }
  }

  getStatusColor(status: TransactionStatus): string {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return 'primary';
      case TransactionStatus.PENDING:
        return 'accent';
      case TransactionStatus.FAILED:
        return 'warn';
      case TransactionStatus.CANCELLED:
        return '';
      default:
        return '';
    }
  }

  getTypeColor(type: TransactionType): string {
    switch (type) {
      case TransactionType.PURCHASE:
        return 'primary';
      case TransactionType.PAYMENT:
        return 'accent';
      case TransactionType.WITHDRAWAL:
        return 'warn';
      case TransactionType.REFUND:
        return 'primary';
      default:
        return '';
    }
  }

  getFraudRiskColor(riskLevel: FraudRiskLevel): string {
    switch (riskLevel) {
      case FraudRiskLevel.LOW:
        return 'primary';
      case FraudRiskLevel.MEDIUM:
        return 'accent';
      case FraudRiskLevel.HIGH:
        return 'warn';
      default:
        return '';
    }
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(new Date(date));
  }

  formatCoordinates(coordinates: { latitude: number; longitude: number }): string {
    return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
  }

  openMap(coordinates: { latitude: number; longitude: number }): void {
    const url = `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`;
    window.open(url, '_blank');
  }

  copyToClipboard(text: string, label: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.notificationService.showSuccess(`${label} copied to clipboard`);
    }).catch(() => {
      this.notificationService.showError('Failed to copy to clipboard');
    });
  }

  printTransaction(): void {
    window.print();
  }

  exportTransaction(): void {
    // TODO: Implement export functionality
    this.notificationService.showInfo('Export functionality will be implemented');
  }
}