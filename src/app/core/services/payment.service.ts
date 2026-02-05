import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { 
  Payment,
  PaymentRequest,
  PaymentValidation,
  PaymentConfirmation,
  PaymentMethodInfo,
  PaymentHistory,
  PaymentFilter,
  PaymentRetryRequest,
  PaymentBalance,
  PaymentStatus
} from '../models/payment.models';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private paymentsSubject = new BehaviorSubject<Payment[]>([]);
  private paymentMethodsSubject = new BehaviorSubject<PaymentMethodInfo[]>([]);
  private currentBalanceSubject = new BehaviorSubject<PaymentBalance | null>(null);

  public payments$ = this.paymentsSubject.asObservable();
  public paymentMethods$ = this.paymentMethodsSubject.asObservable();
  public currentBalance$ = this.currentBalanceSubject.asObservable();

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  /**
   * Get payment balance for an account
   */
  getPaymentBalance(accountId: string): Observable<PaymentBalance> {
    const params = new HttpParams().set('accountId', accountId);
    return this.apiService.get<PaymentBalance>(`${environment.endpoints.payments.process}/balance`, params)
      .pipe(
        map(response => response.data),
        tap(balance => this.currentBalanceSubject.next(balance)),
        catchError(error => {
          console.error(`Error fetching payment balance for account ${accountId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get available payment methods
   */
  getPaymentMethods(): Observable<PaymentMethodInfo[]> {
    return this.apiService.get<PaymentMethodInfo[]>(environment.endpoints.payments.methods)
      .pipe(
        map(response => response.data),
        tap(methods => this.paymentMethodsSubject.next(methods)),
        catchError(error => {
          console.error('Error fetching payment methods:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Validate payment request
   */
  validatePayment(paymentRequest: PaymentRequest): Observable<PaymentValidation> {
    return this.apiService.post<PaymentValidation>(`${environment.endpoints.payments.process}/validate`, paymentRequest)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error validating payment:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Process payment
   */
  processPayment(paymentRequest: PaymentRequest): Observable<PaymentConfirmation> {
    return this.apiService.post<PaymentConfirmation>(environment.endpoints.payments.process, paymentRequest)
      .pipe(
        map(response => response.data),
        tap(confirmation => {
          // Update balance after successful payment
          this.refreshPaymentBalance(paymentRequest.accountId);
          // Refresh payment history
          this.refreshPaymentHistory(paymentRequest.accountId);
        }),
        catchError(error => {
          console.error('Error processing payment:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get payment history for an account
   */
  getPaymentHistory(accountId: string, filter?: PaymentFilter): Observable<PaymentHistory> {
    let params = new HttpParams().set('accountId', accountId);
    
    if (filter) {
      if (filter.status) {
        params = params.set('status', filter.status);
      }
      if (filter.paymentMethod) {
        params = params.set('paymentMethod', filter.paymentMethod);
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
    }

    return this.apiService.get<PaymentHistory>(environment.endpoints.payments.history, params)
      .pipe(
        map(response => response.data),
        tap(history => this.paymentsSubject.next(history.payments)),
        catchError(error => {
          console.error(`Error fetching payment history for account ${accountId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get payment by ID
   */
  getPayment(paymentId: string): Observable<Payment> {
    const endpoint = this.apiService.buildEndpoint(`${environment.endpoints.payments.process}/:id`, { id: paymentId });
    return this.apiService.get<Payment>(endpoint)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error(`Error fetching payment ${paymentId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Retry failed payment
   */
  retryPayment(retryRequest: PaymentRetryRequest): Observable<PaymentConfirmation> {
    const endpoint = this.apiService.buildEndpoint(`${environment.endpoints.payments.process}/:id/retry`, { id: retryRequest.paymentId });
    return this.apiService.post<PaymentConfirmation>(endpoint, retryRequest)
      .pipe(
        map(response => response.data),
        tap(confirmation => {
          // Update payment in the list
          const currentPayments = this.paymentsSubject.value;
          const updatedPayments = currentPayments.map(payment => 
            payment.id === retryRequest.paymentId 
              ? { ...payment, status: PaymentStatus.PROCESSING, retryCount: payment.retryCount + 1 }
              : payment
          );
          this.paymentsSubject.next(updatedPayments);
        }),
        catchError(error => {
          console.error(`Error retrying payment ${retryRequest.paymentId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Cancel pending payment
   */
  cancelPayment(paymentId: string): Observable<void> {
    const endpoint = this.apiService.buildEndpoint(`${environment.endpoints.payments.process}/:id/cancel`, { id: paymentId });
    return this.apiService.post<void>(endpoint, {})
      .pipe(
        map(() => void 0),
        tap(() => {
          // Update payment status in the list
          const currentPayments = this.paymentsSubject.value;
          const updatedPayments = currentPayments.map(payment => 
            payment.id === paymentId 
              ? { ...payment, status: PaymentStatus.CANCELLED }
              : payment
          );
          this.paymentsSubject.next(updatedPayments);
        }),
        catchError(error => {
          console.error(`Error cancelling payment ${paymentId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get payment status
   */
  getPaymentStatus(paymentId: string): Observable<PaymentStatus> {
    const endpoint = this.apiService.buildEndpoint(`${environment.endpoints.payments.process}/:id/status`, { id: paymentId });
    return this.apiService.get<{ status: PaymentStatus }>(endpoint)
      .pipe(
        map(response => response.data.status),
        catchError(error => {
          console.error(`Error fetching payment status for ${paymentId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Refresh payment balance
   */
  private refreshPaymentBalance(accountId: string): void {
    this.getPaymentBalance(accountId).subscribe({
      next: () => {}, // Balance is updated via tap operator
      error: (error) => console.error('Error refreshing payment balance:', error)
    });
  }

  /**
   * Refresh payment history
   */
  private refreshPaymentHistory(accountId: string): void {
    this.getPaymentHistory(accountId).subscribe({
      next: () => {}, // History is updated via tap operator
      error: (error) => console.error('Error refreshing payment history:', error)
    });
  }

  /**
   * Clear cached data
   */
  clearCache(): void {
    this.paymentsSubject.next([]);
    this.paymentMethodsSubject.next([]);
    this.currentBalanceSubject.next(null);
  }

  /**
   * Get current payment methods
   */
  getCurrentPaymentMethods(): PaymentMethodInfo[] {
    return this.paymentMethodsSubject.value;
  }

  /**
   * Get current balance
   */
  getCurrentBalance(): PaymentBalance | null {
    return this.currentBalanceSubject.value;
  }

  /**
   * Get current payments
   */
  getCurrentPayments(): Payment[] {
    return this.paymentsSubject.value;
  }
}