// Card-related data models and interfaces

export enum CardStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  EXPIRED = 'expired',
  PENDING = 'pending'
}

export enum CardType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  PREPAID = 'prepaid'
}

export interface Card {
  id: string;
  accountId: string;
  cardNumber: string;
  cardType: CardType;
  status: CardStatus;
  expirationDate: Date;
  creditLimit: number;
  availableCredit: number;
  lastUsed: Date;
  issuedDate: Date;
  cardholderName: string;
  cvv?: string; // Only for display purposes, never store
  pin?: string; // Only for validation, never store
}

export interface CreateCardRequest {
  accountId: string;
  cardType: CardType;
  creditLimit: number;
  cardholderName: string;
}

export interface UpdateCardRequest {
  id: string;
  cardType?: CardType;
  creditLimit?: number;
  status?: CardStatus;
  cardholderName?: string;
}

export interface CardFilter {
  accountId?: string;
  status?: CardStatus;
  cardType?: CardType;
  expirationDateFrom?: Date;
  expirationDateTo?: Date;
  lastUsedFrom?: Date;
  lastUsedTo?: Date;
}

export interface CardOperation {
  cardId: string;
  operation: 'activate' | 'block' | 'unblock' | 'replace';
  reason?: string;
}

export interface CardOperationResult {
  success: boolean;
  message: string;
  newStatus?: CardStatus;
  newCardId?: string; // For replacement operations
}