import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, interval } from 'rxjs';
import { map, catchError, tap, switchMap, startWith } from 'rxjs/operators';
import { 
  Authorization, 
  AuthorizationStatus,
  AuthorizationFilter,
  AuthorizationDecisionRequest,
  AuthorizationSummary,
  CreateAuthorizationRequest,
  AuthorizationAuditEntry
} from '../models/authorization.models';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

export interface PaginatedAuthorizationResponse {
  authorizations: Authorization[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  private authorizationsSubject = new BehaviorSubject<Authorization[]>([]);
  private selectedAuthorizationSubject = new BehaviorSubject<Authorization | null>(null);
  private summarySubject = new BehaviorSubject<AuthorizationSummary | null>(null);
  private paginationSubject = new BehaviorSubject<any>(null);
  private realTimeUpdateInterval = 30000; // 30 seconds

  public authorizations$ = this.authorizationsSubject.asObservable();
  public selectedAuthorization$ = this.selectedAuthorizationSubject.asObservable();
  public summary$ = this.summarySubject.asObservable();
  public pagination$ = this.paginationSubject.asObservable();

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {
    this.startRealTimeUpdates();
  }

  /**
   * Get pending authorizations with pagination and filtering
   */
  getPendingAuthorizations(filter?: AuthorizationFilter, page: number = 1, pageSize: number = 20): Observable<PaginatedAuthorizationResponse> {
    let params = new HttpParams()
      .set('status', AuthorizationStatus.PENDING)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (filter) {
      params = this.buildFilterParams(params, filter);
    }

    return this.apiService.get<PaginatedAuthorizationResponse>(environment.endpoints.authorizations.pending, params)
      .pipe(
        map(response => response.data),
        tap(result => {
          this.authorizationsSubject.next(result.authorizations);
          this.paginationSubject.next(result.pagination);
        }),
        catchError(error => {
          console.error('Error fetching pending authorizations:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get all authorizations with pagination and filtering
   */
  getAllAuthorizations(filter?: AuthorizationFilter, page: number = 1, pageSize: number = 20): Observable<PaginatedAuthorizationResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (filter) {
      params = this.buildFilterParams(params, filter);
    }

    return this.apiService.get<PaginatedAuthorizationResponse>('/authorizations', params)
      .pipe(
        map(response => response.data),
        tap(result => {
          this.authorizationsSubject.next(result.authorizations);
          this.paginationSubject.next(result.pagination);
        }),
        catchError(error => {
          console.error('Error fetching all authorizations:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get authorization by ID
   */
  getAuthorization(authId: string): Observable<Authorization> {
    const endpoint = this.apiService.buildEndpoint(environment.endpoints.authorizations.detail, { id: authId });
    return this.apiService.get<Authorization>(endpoint)
      .pipe(
        map(response => response.data),
        tap(authorization => this.selectedAuthorizationSubject.next(authorization)),
        catchError(error => {
          console.error(`Error fetching authorization ${authId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Approve authorization
   */
  approveAuthorization(authId: string, reason?: string): Observable<Authorization> {
    const decisionRequest: AuthorizationDecisionRequest = {
      authorizationId: authId,
      decision: 'approve',
      reason,
      notes: reason
    };

    const endpoint = this.apiService.buildEndpoint(environment.endpoints.authorizations.approve, { id: authId });
    return this.apiService.post<Authorization>(endpoint, decisionRequest)
      .pipe(
        map(response => response.data),
        tap(updatedAuthorization => {
          this.updateAuthorizationInList(updatedAuthorization);
          if (this.selectedAuthorizationSubject.value?.id === authId) {
            this.selectedAuthorizationSubject.next(updatedAuthorization);
          }
        }),
        catchError(error => {
          console.error(`Error approving authorization ${authId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Deny authorization
   */
  denyAuthorization(authId: string, reason: string): Observable<Authorization> {
    const decisionRequest: AuthorizationDecisionRequest = {
      authorizationId: authId,
      decision: 'deny',
      reason,
      notes: reason
    };

    const endpoint = this.apiService.buildEndpoint(environment.endpoints.authorizations.deny, { id: authId });
    return this.apiService.post<Authorization>(endpoint, decisionRequest)
      .pipe(
        map(response => response.data),
        tap(updatedAuthorization => {
          this.updateAuthorizationInList(updatedAuthorization);
          if (this.selectedAuthorizationSubject.value?.id === authId) {
            this.selectedAuthorizationSubject.next(updatedAuthorization);
          }
        }),
        catchError(error => {
          console.error(`Error denying authorization ${authId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Create new authorization request
   */
  createAuthorization(authorizationData: CreateAuthorizationRequest): Observable<Authorization> {
    return this.apiService.post<Authorization>('/authorizations', authorizationData)
      .pipe(
        map(response => response.data),
        tap(newAuthorization => {
          const currentAuthorizations = this.authorizationsSubject.value;
          this.authorizationsSubject.next([newAuthorization, ...currentAuthorizations]);
        }),
        catchError(error => {
          console.error('Error creating authorization:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get authorization summary statistics
   */
  getAuthorizationSummary(): Observable<AuthorizationSummary> {
    return this.apiService.get<AuthorizationSummary>('/authorizations/summary')
      .pipe(
        map(response => response.data),
        tap(summary => this.summarySubject.next(summary)),
        catchError(error => {
          console.error('Error fetching authorization summary:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get authorization audit trail
   */
  getAuthorizationAuditTrail(authId: string): Observable<AuthorizationAuditEntry[]> {
    const endpoint = this.apiService.buildEndpoint('/authorizations/:id/audit', { id: authId });
    return this.apiService.get<AuthorizationAuditEntry[]>(endpoint)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error(`Error fetching audit trail for authorization ${authId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get high-risk authorizations
   */
  getHighRiskAuthorizations(riskThreshold: number = 70): Observable<Authorization[]> {
    let params = new HttpParams()
      .set('status', AuthorizationStatus.PENDING)
      .set('riskScoreMin', riskThreshold.toString());

    return this.apiService.get<Authorization[]>('/authorizations/high-risk', params)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching high-risk authorizations:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get authorizations by card ID
   */
  getAuthorizationsByCard(cardId: string, filter?: AuthorizationFilter): Observable<Authorization[]> {
    let params = new HttpParams().set('cardId', cardId);
    
    if (filter) {
      params = this.buildFilterParams(params, filter);
    }

    return this.apiService.get<Authorization[]>('/authorizations/by-card', params)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error(`Error fetching authorizations for card ${cardId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Set selected authorization
   */
  setSelectedAuthorization(authorization: Authorization | null): void {
    this.selectedAuthorizationSubject.next(authorization);
  }

  /**
   * Get current selected authorization
   */
  getSelectedAuthorization(): Authorization | null {
    return this.selectedAuthorizationSubject.value;
  }

  /**
   * Get current authorizations
   */
  getCurrentAuthorizations(): Authorization[] {
    return this.authorizationsSubject.value;
  }

  /**
   * Get current summary
   */
  getCurrentSummary(): AuthorizationSummary | null {
    return this.summarySubject.value;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.authorizationsSubject.next([]);
    this.selectedAuthorizationSubject.next(null);
    this.summarySubject.next(null);
    this.paginationSubject.next(null);
  }

  /**
   * Refresh authorizations data
   */
  refreshAuthorizations(filter?: AuthorizationFilter, page: number = 1, pageSize: number = 20): Observable<PaginatedAuthorizationResponse> {
    return this.getPendingAuthorizations(filter, page, pageSize);
  }

  /**
   * Start real-time updates for authorization status
   */
  private startRealTimeUpdates(): void {
    // Poll for updates every 30 seconds for pending authorizations
    interval(this.realTimeUpdateInterval)
      .pipe(
        startWith(0),
        switchMap(() => this.getAuthorizationSummary()),
        catchError(error => {
          console.warn('Real-time update failed:', error);
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  /**
   * Update authorization in the current list
   */
  private updateAuthorizationInList(updatedAuthorization: Authorization): void {
    const currentAuthorizations = this.authorizationsSubject.value;
    const updatedAuthorizations = currentAuthorizations.map(auth => 
      auth.id === updatedAuthorization.id ? updatedAuthorization : auth
    );
    this.authorizationsSubject.next(updatedAuthorizations);
  }

  /**
   * Private helper to build filter parameters
   */
  private buildFilterParams(params: HttpParams, filter: AuthorizationFilter): HttpParams {
    if (filter.status) {
      params = params.set('status', filter.status);
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
    if (filter.riskScoreMin !== undefined) {
      params = params.set('riskScoreMin', filter.riskScoreMin.toString());
    }
    if (filter.riskScoreMax !== undefined) {
      params = params.set('riskScoreMax', filter.riskScoreMax.toString());
    }
    if (filter.cardId) {
      params = params.set('cardId', filter.cardId);
    }
    if (filter.merchantName) {
      params = params.set('merchantName', filter.merchantName);
    }
    if (filter.fraudOnly !== undefined) {
      params = params.set('fraudOnly', filter.fraudOnly.toString());
    }
    
    return params;
  }
}