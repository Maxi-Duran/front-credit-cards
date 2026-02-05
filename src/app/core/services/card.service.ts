import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { 
  Card, 
  CreateCardRequest, 
  UpdateCardRequest, 
  CardFilter,
  CardOperation,
  CardOperationResult,
  CardStatus
} from '../models/card.models';
import { ApiService, ApiResponse } from './api.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private cardsSubject = new BehaviorSubject<Card[]>([]);
  private selectedCardSubject = new BehaviorSubject<Card | null>(null);

  public cards$ = this.cardsSubject.asObservable();
  public selectedCard$ = this.selectedCardSubject.asObservable();

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  /**
   * Get cards by account ID
   */
  getCards(accountId: string): Observable<Card[]> {
    const params = new HttpParams().set('accountId', accountId);
    return this.apiService.get<Card[]>(environment.endpoints.cards.list, params)
      .pipe(
        map(response => response.data),
        tap(cards => this.cardsSubject.next(cards)),
        catchError(error => {
          console.error(`Error fetching cards for account ${accountId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get all cards (admin function)
   */
  getAllCards(): Observable<Card[]> {
    return this.apiService.get<Card[]>(environment.endpoints.cards.list)
      .pipe(
        map(response => response.data),
        tap(cards => this.cardsSubject.next(cards)),
        catchError(error => {
          console.error('Error fetching all cards:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get card by ID
   */
  getCard(cardId: string): Observable<Card> {
    const endpoint = this.apiService.buildEndpoint(environment.endpoints.cards.detail, { id: cardId });
    return this.apiService.get<Card>(endpoint)
      .pipe(
        map(response => response.data),
        tap(card => this.selectedCardSubject.next(card)),
        catchError(error => {
          console.error(`Error fetching card ${cardId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Create new card
   */
  createCard(cardData: CreateCardRequest): Observable<Card> {
    return this.apiService.post<Card>(environment.endpoints.cards.list, cardData)
      .pipe(
        map(response => response.data),
        tap(newCard => {
          const currentCards = this.cardsSubject.value;
          this.cardsSubject.next([...currentCards, newCard]);
        }),
        catchError(error => {
          console.error('Error creating card:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update existing card
   */
  updateCard(card: UpdateCardRequest): Observable<Card> {
    const endpoint = this.apiService.buildEndpoint(environment.endpoints.cards.update, { id: card.id });
    return this.apiService.put<Card>(endpoint, card)
      .pipe(
        map(response => response.data),
        tap(updatedCard => {
          // Update the cards list
          const currentCards = this.cardsSubject.value;
          const updatedCards = currentCards.map(c => 
            c.id === updatedCard.id ? updatedCard : c
          );
          this.cardsSubject.next(updatedCards);
          
          // Update selected card if it's the one being updated
          if (this.selectedCardSubject.value?.id === updatedCard.id) {
            this.selectedCardSubject.next(updatedCard);
          }
        }),
        catchError(error => {
          console.error(`Error updating card ${card.id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Delete card
   */
  deleteCard(cardId: string): Observable<void> {
    const endpoint = this.apiService.buildEndpoint(environment.endpoints.cards.detail, { id: cardId });
    return this.apiService.delete<void>(endpoint)
      .pipe(
        map(() => void 0),
        tap(() => {
          // Remove from cards list
          const currentCards = this.cardsSubject.value;
          const filteredCards = currentCards.filter(c => c.id !== cardId);
          this.cardsSubject.next(filteredCards);
          
          // Clear selected card if it's the one being deleted
          if (this.selectedCardSubject.value?.id === cardId) {
            this.selectedCardSubject.next(null);
          }
        }),
        catchError(error => {
          console.error(`Error deleting card ${cardId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Block card
   */
  blockCard(cardId: string, reason?: string): Observable<CardOperationResult> {
    const operation: CardOperation = {
      cardId,
      operation: 'block',
      reason
    };
    
    const endpoint = this.apiService.buildEndpoint(environment.endpoints.cards.operations, { id: cardId });
    return this.apiService.post<CardOperationResult>(endpoint, operation)
      .pipe(
        map(response => response.data),
        tap(result => {
          if (result.success && result.newStatus) {
            this.updateCardStatus(cardId, result.newStatus);
          }
        }),
        catchError(error => {
          console.error(`Error blocking card ${cardId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Activate card
   */
  activateCard(cardId: string): Observable<CardOperationResult> {
    const operation: CardOperation = {
      cardId,
      operation: 'activate'
    };
    
    const endpoint = this.apiService.buildEndpoint(environment.endpoints.cards.operations, { id: cardId });
    return this.apiService.post<CardOperationResult>(endpoint, operation)
      .pipe(
        map(response => response.data),
        tap(result => {
          if (result.success && result.newStatus) {
            this.updateCardStatus(cardId, result.newStatus);
          }
        }),
        catchError(error => {
          console.error(`Error activating card ${cardId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Unblock card
   */
  unblockCard(cardId: string): Observable<CardOperationResult> {
    const operation: CardOperation = {
      cardId,
      operation: 'unblock'
    };
    
    const endpoint = this.apiService.buildEndpoint(environment.endpoints.cards.operations, { id: cardId });
    return this.apiService.post<CardOperationResult>(endpoint, operation)
      .pipe(
        map(response => response.data),
        tap(result => {
          if (result.success && result.newStatus) {
            this.updateCardStatus(cardId, result.newStatus);
          }
        }),
        catchError(error => {
          console.error(`Error unblocking card ${cardId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Replace card
   */
  replaceCard(cardId: string, reason: string): Observable<CardOperationResult> {
    const operation: CardOperation = {
      cardId,
      operation: 'replace',
      reason
    };
    
    const endpoint = this.apiService.buildEndpoint(environment.endpoints.cards.operations, { id: cardId });
    return this.apiService.post<CardOperationResult>(endpoint, operation)
      .pipe(
        map(response => response.data),
        tap(result => {
          if (result.success) {
            // Refresh cards list to include new card
            const currentCards = this.cardsSubject.value;
            if (currentCards.length > 0) {
              const accountId = currentCards.find(c => c.id === cardId)?.accountId;
              if (accountId) {
                this.getCards(accountId).subscribe();
              }
            }
          }
        }),
        catchError(error => {
          console.error(`Error replacing card ${cardId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Filter cards by criteria
   */
  filterCards(filter: CardFilter): Observable<Card[]> {
    let params = new HttpParams();
    
    if (filter.accountId) {
      params = params.set('accountId', filter.accountId);
    }
    if (filter.status) {
      params = params.set('status', filter.status);
    }
    if (filter.cardType) {
      params = params.set('cardType', filter.cardType);
    }
    if (filter.expirationDateFrom) {
      params = params.set('expirationDateFrom', filter.expirationDateFrom.toISOString());
    }
    if (filter.expirationDateTo) {
      params = params.set('expirationDateTo', filter.expirationDateTo.toISOString());
    }
    if (filter.lastUsedFrom) {
      params = params.set('lastUsedFrom', filter.lastUsedFrom.toISOString());
    }
    if (filter.lastUsedTo) {
      params = params.set('lastUsedTo', filter.lastUsedTo.toISOString());
    }

    return this.apiService.get<Card[]>(environment.endpoints.cards.search, params)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error filtering cards:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Set selected card
   */
  setSelectedCard(card: Card | null): void {
    this.selectedCardSubject.next(card);
  }

  /**
   * Get current selected card
   */
  getSelectedCard(): Card | null {
    return this.selectedCardSubject.value;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cardsSubject.next([]);
    this.selectedCardSubject.next(null);
  }

  /**
   * Refresh cards data for account
   */
  refreshCards(accountId: string): Observable<Card[]> {
    return this.getCards(accountId);
  }

  /**
   * Private helper to update card status in local state
   */
  private updateCardStatus(cardId: string, newStatus: CardStatus): void {
    const currentCards = this.cardsSubject.value;
    const updatedCards = currentCards.map(card => 
      card.id === cardId ? { ...card, status: newStatus } : card
    );
    this.cardsSubject.next(updatedCards);
    
    // Update selected card if it's the one being updated
    if (this.selectedCardSubject.value?.id === cardId) {
      this.selectedCardSubject.next({ ...this.selectedCardSubject.value, status: newStatus });
    }
  }
}