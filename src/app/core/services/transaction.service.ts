import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { 
  Transaction, 
  CreateTransactionRequest, 
  UpdateTransactionRequest, 
  TransactionFilter,
  TransactionSearchCriteria,
  PaginatedTransactionResponse,
  TransactionTypeConfig,
  TransactionSummary,
  TransactionValidationResult,
  TransactionAnalytics,
  TransactionExportRequest,
  TransactionExportResult,
  TransactionPaginationConfig,
  TransactionSortConfig
} from '../models/transaction.models';
import { ApiService, ApiResponse } from './api.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  private selectedTransactionSubject = new BehaviorSubject<Transaction | null>(null);
  private transactionTypesSubject = new BehaviorSubject<TransactionTypeConfig[]>([]);
  private paginationSubject = new BehaviorSubject<any>(null);

  public transactions$ = this.transactionsSubject.asObservable();
  public selectedTransaction$ = this.selectedTransactionSubject.asObservable();
  public transactionTypes$ = this.transactionTypesSubject.asObservable();
  public pagination$ = this.paginationSubject.asObservable();

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  /**
   * Get transactions by card ID with pagination and filtering
   */
  getTransactions(cardId: string, filter?: TransactionFilter, pagination?: TransactionPaginationConfig): Observable<PaginatedTransactionResponse> {
    let params = new HttpParams().set('cardId', cardId);
    
    // Add pagination parameters
    if (pagination) {
      params = params.set('page', pagination.page.toString());
      params = params.set('pageSize', pagination.pageSize.toString());
    }
    
    // Add filter parameters
    if (filter) {
      params = this.buildFilterParams(params, filter);
    }

    const endpoint = this.apiService.buildEndpoint(environment.endpoints.transactions.byCard, { cardId });
    return this.apiService.get<PaginatedTransactionResponse>(endpoint, params)
      .pipe(
        map(response => response.data),
        tap(result => {
          this.transactionsSubject.next(result.transactions);
          this.paginationSubject.next(result.pagination);
        }),
        catchError(error => {
          console.error(`Error fetching transactions for card ${cardId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get all transactions (admin function) with pagination and filtering
   */
  getAllTransactions(searchCriteria?: TransactionSearchCriteria): Observable<PaginatedTransactionResponse> {
    let params = new HttpParams();
    
    if (searchCriteria) {
      // Add search query
      if (searchCriteria.query) {
        params = params.set('query', searchCriteria.query);
      }
      
      // Add pagination
      if (searchCriteria.pagination) {
        params = params.set('page', searchCriteria.pagination.page.toString());
        params = params.set('pageSize', searchCriteria.pagination.pageSize.toString());
      }
      
      // Add sorting
      if (searchCriteria.sorting) {
        params = params.set('sortBy', searchCriteria.sorting.field);
        params = params.set('sortDirection', searchCriteria.sorting.direction);
      }
      
      // Add filters
      if (searchCriteria.filters) {
        params = this.buildFilterParams(params, searchCriteria.filters);
      }
    }

    return this.apiService.get<PaginatedTransactionResponse>(environment.endpoints.transactions.list, params)
      .pipe(
        map(response => response.data),
        tap(result => {
          this.transactionsSubject.next(result.transactions);
          this.paginationSubject.next(result.pagination);
        }),
        catchError(error => {
          console.error('Error fetching all transactions:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get transaction by ID
   */
  getTransaction(transactionId: string): Observable<Transaction> {
    const endpoint = this.apiService.buildEndpoint(environment.endpoints.transactions.detail, { id: transactionId });
    return this.apiService.get<Transaction>(endpoint)
      .pipe(
        map(response => response.data),
        tap(transaction => this.selectedTransactionSubject.next(transaction)),
        catchError(error => {
          console.error(`Error fetching transaction ${transactionId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Create new transaction
   */
  createTransaction(transactionData: CreateTransactionRequest): Observable<Transaction> {
    return this.apiService.post<Transaction>(environment.endpoints.transactions.create, transactionData)
      .pipe(
        map(response => response.data),
        tap(newTransaction => {
          const currentTransactions = this.transactionsSubject.value;
          this.transactionsSubject.next([newTransaction, ...currentTransactions]);
        }),
        catchError(error => {
          console.error('Error creating transaction:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update existing transaction
   */
  updateTransaction(transaction: UpdateTransactionRequest): Observable<Transaction> {
    const endpoint = this.apiService.buildEndpoint(environment.endpoints.transactions.detail, { id: transaction.id });
    return this.apiService.put<Transaction>(endpoint, transaction)
      .pipe(
        map(response => response.data),
        tap(updatedTransaction => {
          // Update the transactions list
          const currentTransactions = this.transactionsSubject.value;
          const updatedTransactions = currentTransactions.map(t => 
            t.id === updatedTransaction.id ? updatedTransaction : t
          );
          this.transactionsSubject.next(updatedTransactions);
          
          // Update selected transaction if it's the one being updated
          if (this.selectedTransactionSubject.value?.id === updatedTransaction.id) {
            this.selectedTransactionSubject.next(updatedTransaction);
          }
        }),
        catchError(error => {
          console.error(`Error updating transaction ${transaction.id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get transaction types configuration
   */
  getTransactionTypes(): Observable<TransactionTypeConfig[]> {
    return this.apiService.get<TransactionTypeConfig[]>(environment.endpoints.transactions.types)
      .pipe(
        map(response => response.data),
        tap(types => this.transactionTypesSubject.next(types)),
        catchError(error => {
          console.error('Error fetching transaction types:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Search transactions with advanced criteria
   */
  searchTransactions(criteria: TransactionSearchCriteria): Observable<PaginatedTransactionResponse> {
    let params = new HttpParams();
    
    if (criteria.query) {
      params = params.set('query', criteria.query);
    }
    
    if (criteria.pagination) {
      params = params.set('page', criteria.pagination.page.toString());
      params = params.set('pageSize', criteria.pagination.pageSize.toString());
    }
    
    if (criteria.sorting) {
      params = params.set('sortBy', criteria.sorting.field);
      params = params.set('sortDirection', criteria.sorting.direction);
    }
    
    if (criteria.filters) {
      params = this.buildFilterParams(params, criteria.filters);
    }

    return this.apiService.get<PaginatedTransactionResponse>(`${environment.endpoints.transactions.list}/search`, params)
      .pipe(
        map(response => response.data),
        tap(result => {
          this.transactionsSubject.next(result.transactions);
          this.paginationSubject.next(result.pagination);
        }),
        catchError(error => {
          console.error('Error searching transactions:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get transaction summary for a card or account
   */
  getTransactionSummary(cardId?: string, accountId?: string, filter?: TransactionFilter): Observable<TransactionSummary> {
    let params = new HttpParams();
    
    if (cardId) {
      params = params.set('cardId', cardId);
    }
    if (accountId) {
      params = params.set('accountId', accountId);
    }
    if (filter) {
      params = this.buildFilterParams(params, filter);
    }

    return this.apiService.get<TransactionSummary>(`${environment.endpoints.transactions.list}/summary`, params)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching transaction summary:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Validate transaction data before creation
   */
  validateTransaction(transactionData: CreateTransactionRequest): Observable<TransactionValidationResult> {
    return this.apiService.post<TransactionValidationResult>(`${environment.endpoints.transactions.create}/validate`, transactionData)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error validating transaction:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get transaction analytics
   */
  getTransactionAnalytics(cardId?: string, accountId?: string, filter?: TransactionFilter): Observable<TransactionAnalytics> {
    let params = new HttpParams();
    
    if (cardId) {
      params = params.set('cardId', cardId);
    }
    if (accountId) {
      params = params.set('accountId', accountId);
    }
    if (filter) {
      params = this.buildFilterParams(params, filter);
    }

    return this.apiService.get<TransactionAnalytics>(`${environment.endpoints.transactions.list}/analytics`, params)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching transaction analytics:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Export transactions
   */
  exportTransactions(exportRequest: TransactionExportRequest): Observable<TransactionExportResult> {
    return this.apiService.post<TransactionExportResult>(`${environment.endpoints.transactions.list}/export`, exportRequest)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error exporting transactions:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Set selected transaction
   */
  setSelectedTransaction(transaction: Transaction | null): void {
    this.selectedTransactionSubject.next(transaction);
  }

  /**
   * Get current selected transaction
   */
  getSelectedTransaction(): Transaction | null {
    return this.selectedTransactionSubject.value;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.transactionsSubject.next([]);
    this.selectedTransactionSubject.next(null);
    this.paginationSubject.next(null);
  }

  /**
   * Refresh transactions data for card
   */
  refreshTransactions(cardId: string, filter?: TransactionFilter, pagination?: TransactionPaginationConfig): Observable<PaginatedTransactionResponse> {
    return this.getTransactions(cardId, filter, pagination);
  }

  /**
   * Get current transactions
   */
  getCurrentTransactions(): Transaction[] {
    return this.transactionsSubject.value;
  }

  /**
   * Get current pagination info
   */
  getCurrentPagination(): any {
    return this.paginationSubject.value;
  }

  /**
   * Get current transaction types
   */
  getCurrentTransactionTypes(): TransactionTypeConfig[] {
    return this.transactionTypesSubject.value;
  }

  /**
   * Private helper to build filter parameters
   */
  private buildFilterParams(params: HttpParams, filter: TransactionFilter): HttpParams {
    if (filter.cardId) {
      params = params.set('cardId', filter.cardId);
    }
    if (filter.accountId) {
      params = params.set('accountId', filter.accountId);
    }
    if (filter.dateFrom) {
      params = params.set('dateFrom', filter.dateFrom.toISOString());
    }
    if (filter.dateTo) {
      params = params.set('dateTo', filter.dateTo.toISOString());
    }
    if (filter.amountMin !== undefined) {
      params = params.set('amountMin', filter.amountMin.toString());
    }
    if (filter.amountMax !== undefined) {
      params = params.set('amountMax', filter.amountMax.toString());
    }
    if (filter.transactionType) {
      params = params.set('transactionType', filter.transactionType);
    }
    if (filter.status) {
      params = params.set('status', filter.status);
    }
    if (filter.fraudOnly !== undefined) {
      params = params.set('fraudOnly', filter.fraudOnly.toString());
    }
    if (filter.merchantName) {
      params = params.set('merchantName', filter.merchantName);
    }
    if (filter.merchantCategory) {
      params = params.set('merchantCategory', filter.merchantCategory);
    }
    if (filter.currency) {
      params = params.set('currency', filter.currency);
    }
    if (filter.location) {
      params = params.set('location', filter.location);
    }
    
    return params;
  }
}