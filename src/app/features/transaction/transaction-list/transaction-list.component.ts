import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';

import { 
  Transaction, 
  TransactionFilter, 
  TransactionSearchCriteria,
  TransactionStatus,
  TransactionType,
  FraudRiskLevel,
  TransactionPaginationConfig,
  TransactionSortConfig,
  PaginatedTransactionResponse
} from '../../../core/models/transaction.models';
import { TransactionService } from '../../../core/services/transaction.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
    'transactionDate',
    'merchantName',
    'description',
    'amount',
    'transactionType',
    'status',
    'fraudIndicator',
    'actions'
  ];

  dataSource = new MatTableDataSource<Transaction>();
  filterForm: FormGroup;
  
  // Enums for template
  TransactionStatus = TransactionStatus;
  TransactionType = TransactionType;
  FraudRiskLevel = FraudRiskLevel;

  // Observable data
  transactions$: Observable<Transaction[]>;
  pagination$: Observable<any>;
  loading$: Observable<boolean>;

  // Pagination and sorting
  currentPage = 0;
  pageSize = 10;
  totalItems = 0;
  currentSort: TransactionSortConfig = {
    field: 'transactionDate',
    direction: 'desc'
  };

  // Filter options
  transactionTypes = Object.values(TransactionType);
  transactionStatuses = Object.values(TransactionStatus);
  fraudRiskLevels = Object.values(FraudRiskLevel);

  // Component state
  private destroy$ = new Subject<void>();
  isFilterExpanded = false;
  selectedCardId: string | null = null;

  constructor(
    private transactionService: TransactionService,
    private loadingService: LoadingService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {
    this.transactions$ = this.transactionService.transactions$;
    this.pagination$ = this.transactionService.pagination$;
    this.loading$ = this.loadingService.loading$;

    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.setupFilterSubscription();
    this.loadTransactions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    // Subscribe to transactions data
    this.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(transactions => {
        this.dataSource.data = transactions;
      });

    // Subscribe to pagination data
    this.pagination$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pagination => {
        if (pagination) {
          this.totalItems = pagination.totalItems;
          this.currentPage = pagination.page - 1; // Material paginator is 0-based
        }
      });
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      searchQuery: [''],
      dateFrom: [null],
      dateTo: [null],
      amountMin: [null],
      amountMax: [null],
      transactionType: [''],
      status: [''],
      fraudOnly: [false],
      merchantName: [''],
      merchantCategory: [''],
      currency: ['']
    });
  }

  private setupFilterSubscription(): void {
    // Watch for filter changes and apply them with debounce
    this.filterForm.valueChanges
      .pipe(
        startWith(this.filterForm.value),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 0; // Reset to first page when filtering
        this.loadTransactions();
      });
  }

  private loadTransactions(): void {
    this.loadingService.setLoading(true);

    const filter = this.buildTransactionFilter();
    const pagination: TransactionPaginationConfig = {
      page: this.currentPage + 1, // API expects 1-based page numbers
      pageSize: this.pageSize
    };

    const searchCriteria: TransactionSearchCriteria = {
      query: this.filterForm.get('searchQuery')?.value || '',
      filters: filter,
      sorting: this.currentSort,
      pagination: pagination
    };

    // If we have a selected card, get transactions for that card
    if (this.selectedCardId) {
      this.transactionService.getTransactions(this.selectedCardId, filter, pagination)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: PaginatedTransactionResponse) => {
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.loadingService.setLoading(false);
            this.notificationService.showError('Error loading transactions');
            console.error('Error loading transactions:', error);
          }
        });
    } else {
      // Get all transactions (admin view)
      this.transactionService.getAllTransactions(searchCriteria)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: PaginatedTransactionResponse) => {
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.loadingService.setLoading(false);
            this.notificationService.showError('Error loading transactions');
            console.error('Error loading transactions:', error);
          }
        });
    }
  }

  private buildTransactionFilter(): TransactionFilter {
    const formValue = this.filterForm.value;
    const filter: TransactionFilter = {};

    if (formValue.dateFrom) {
      filter.dateFrom = formValue.dateFrom;
    }
    if (formValue.dateTo) {
      filter.dateTo = formValue.dateTo;
    }
    if (formValue.amountMin !== null && formValue.amountMin !== '') {
      filter.amountMin = Number(formValue.amountMin);
    }
    if (formValue.amountMax !== null && formValue.amountMax !== '') {
      filter.amountMax = Number(formValue.amountMax);
    }
    if (formValue.transactionType) {
      filter.transactionType = formValue.transactionType;
    }
    if (formValue.status) {
      filter.status = formValue.status;
    }
    if (formValue.fraudOnly) {
      filter.fraudOnly = formValue.fraudOnly;
    }
    if (formValue.merchantName) {
      filter.merchantName = formValue.merchantName;
    }
    if (formValue.merchantCategory) {
      filter.merchantCategory = formValue.merchantCategory;
    }
    if (formValue.currency) {
      filter.currency = formValue.currency;
    }

    return filter;
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTransactions();
  }

  onSortChange(sort: Sort): void {
    if (sort.active && sort.direction) {
      this.currentSort = {
        field: sort.active as any,
        direction: sort.direction as 'asc' | 'desc'
      };
      this.loadTransactions();
    }
  }

  toggleFilterExpansion(): void {
    this.isFilterExpanded = !this.isFilterExpanded;
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 0;
    this.loadTransactions();
  }

  refreshTransactions(): void {
    this.loadTransactions();
  }

  setCardFilter(cardId: string): void {
    this.selectedCardId = cardId;
    this.currentPage = 0;
    this.loadTransactions();
  }

  clearCardFilter(): void {
    this.selectedCardId = null;
    this.currentPage = 0;
    this.loadTransactions();
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  exportTransactions(): void {
    // TODO: Implement export functionality
    this.notificationService.showInfo('Export functionality will be implemented');
  }

  viewTransactionDetails(transaction: Transaction): void {
    this.transactionService.setSelectedTransaction(transaction);
    // Navigation will be handled by router-outlet
  }
}