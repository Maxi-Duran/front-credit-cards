import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { 
  Account, 
  CreateAccountRequest, 
  UpdateAccountRequest, 
  SearchCriteria, 
  AccountFilter 
} from '../models/account.models';
import { ApiService, ApiResponse } from './api.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private accountsSubject = new BehaviorSubject<Account[]>([]);
  private selectedAccountSubject = new BehaviorSubject<Account | null>(null);

  public accounts$ = this.accountsSubject.asObservable();
  public selectedAccount$ = this.selectedAccountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  /**
   * Get all accounts
   */
  getAccounts(): Observable<Account[]> {
    return this.apiService.get<Account[]>(environment.endpoints.accounts.list)
      .pipe(
        map(response => response.data),
        tap(accounts => this.accountsSubject.next(accounts)),
        catchError(error => {
          console.error('Error fetching accounts:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get account by ID
   */
  getAccount(id: string): Observable<Account> {
    const endpoint = this.apiService.buildEndpoint(environment.endpoints.accounts.detail, { id });
    return this.apiService.get<Account>(endpoint)
      .pipe(
        map(response => response.data),
        tap(account => this.selectedAccountSubject.next(account)),
        catchError(error => {
          console.error(`Error fetching account ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Create new account
   */
  createAccount(accountData: CreateAccountRequest): Observable<Account> {
    return this.apiService.post<Account>(environment.endpoints.accounts.list, accountData)
      .pipe(
        map(response => response.data),
        tap(newAccount => {
          const currentAccounts = this.accountsSubject.value;
          this.accountsSubject.next([...currentAccounts, newAccount]);
        }),
        catchError(error => {
          console.error('Error creating account:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update existing account
   */
  updateAccount(account: UpdateAccountRequest): Observable<Account> {
    const endpoint = this.apiService.buildEndpoint(environment.endpoints.accounts.update, { id: account.id });
    return this.apiService.put<Account>(endpoint, account)
      .pipe(
        map(response => response.data),
        tap(updatedAccount => {
          // Update the accounts list
          const currentAccounts = this.accountsSubject.value;
          const updatedAccounts = currentAccounts.map(acc => 
            acc.id === updatedAccount.id ? updatedAccount : acc
          );
          this.accountsSubject.next(updatedAccounts);
          
          // Update selected account if it's the one being updated
          if (this.selectedAccountSubject.value?.id === updatedAccount.id) {
            this.selectedAccountSubject.next(updatedAccount);
          }
        }),
        catchError(error => {
          console.error(`Error updating account ${account.id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Delete account
   */
  deleteAccount(id: string): Observable<void> {
    const endpoint = this.apiService.buildEndpoint(environment.endpoints.accounts.detail, { id });
    return this.apiService.delete<void>(endpoint)
      .pipe(
        map(() => void 0),
        tap(() => {
          // Remove from accounts list
          const currentAccounts = this.accountsSubject.value;
          const filteredAccounts = currentAccounts.filter(acc => acc.id !== id);
          this.accountsSubject.next(filteredAccounts);
          
          // Clear selected account if it's the one being deleted
          if (this.selectedAccountSubject.value?.id === id) {
            this.selectedAccountSubject.next(null);
          }
        }),
        catchError(error => {
          console.error(`Error deleting account ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Search accounts with criteria
   */
  searchAccounts(criteria: SearchCriteria): Observable<Account[]> {
    let params = new HttpParams();
    
    if (criteria.query) {
      params = params.set('query', criteria.query);
    }
    
    if (criteria.sorting) {
      params = params.set('sortField', criteria.sorting.field);
      params = params.set('sortDirection', criteria.sorting.direction);
    }
    
    if (criteria.pagination) {
      params = params.set('page', criteria.pagination.page.toString());
      params = params.set('pageSize', criteria.pagination.pageSize.toString());
    }
    
    // Add filters
    Object.keys(criteria.filters).forEach(key => {
      if (criteria.filters[key] !== null && criteria.filters[key] !== undefined) {
        params = params.set(key, criteria.filters[key].toString());
      }
    });

    return this.apiService.get<Account[]>(environment.endpoints.accounts.search, params)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error searching accounts:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Filter accounts by criteria
   */
  filterAccounts(filter: AccountFilter): Observable<Account[]> {
    const searchCriteria: SearchCriteria = {
      filters: { ...filter },
      sorting: { field: 'accountNumber', direction: 'asc' },
      pagination: { page: 1, pageSize: environment.ui.pageSize }
    };
    
    return this.searchAccounts(searchCriteria);
  }

  /**
   * Get accounts by customer ID
   */
  getAccountsByCustomer(customerId: string): Observable<Account[]> {
    const params = new HttpParams().set('customerId', customerId);
    return this.apiService.get<Account[]>(environment.endpoints.accounts.list, params)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error(`Error fetching accounts for customer ${customerId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Set selected account
   */
  setSelectedAccount(account: Account | null): void {
    this.selectedAccountSubject.next(account);
  }

  /**
   * Get current selected account
   */
  getSelectedAccount(): Account | null {
    return this.selectedAccountSubject.value;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.accountsSubject.next([]);
    this.selectedAccountSubject.next(null);
  }

  /**
   * Refresh accounts data
   */
  refreshAccounts(): Observable<Account[]> {
    return this.getAccounts();
  }
}