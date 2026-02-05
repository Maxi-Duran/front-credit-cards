export interface TransactionType {
  id: string;
  code: string;
  description: string;
  category: TransactionCategory;
  isActive: boolean;
  requiresAuthorization: boolean;
  fraudRiskLevel: FraudRiskLevel;
  createdDate: Date;
  lastModified?: Date;
  modifiedBy?: string;
}

export enum TransactionCategory {
  PURCHASE = 'purchase',
  WITHDRAWAL = 'withdrawal',
  PAYMENT = 'payment',
  REFUND = 'refund',
  TRANSFER = 'transfer',
  FEE = 'fee',
  INTEREST = 'interest',
  OTHER = 'other'
}

export enum FraudRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface CreateTransactionTypeRequest {
  code: string;
  description: string;
  category: TransactionCategory;
  isActive?: boolean;
  requiresAuthorization?: boolean;
  fraudRiskLevel?: FraudRiskLevel;
}

export interface UpdateTransactionTypeRequest {
  id: string;
  code?: string;
  description?: string;
  category?: TransactionCategory;
  isActive?: boolean;
  requiresAuthorization?: boolean;
  fraudRiskLevel?: FraudRiskLevel;
}

export interface DeleteTransactionTypeRequest {
  id: string;
  reason?: string;
}

export interface TransactionTypeSearchCriteria {
  query?: string;
  category?: TransactionCategory;
  isActive?: boolean;
  fraudRiskLevel?: FraudRiskLevel;
  page?: number;
  pageSize?: number;
}

export interface TransactionTypeListResponse {
  transactionTypes: TransactionType[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TransactionTypeUsageInfo {
  transactionTypeId: string;
  usageCount: number;
  canDelete: boolean;
  relatedTransactions: number;
}
