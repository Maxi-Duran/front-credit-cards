// Transaction-related data models and interfaces

export enum TransactionStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TransactionType {
  PURCHASE = 'purchase',
  WITHDRAWAL = 'withdrawal',
  PAYMENT = 'payment',
  REFUND = 'refund',
  TRANSFER = 'transfer',
  FEE = 'fee',
  INTEREST = 'interest'
}

export enum FraudRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface Transaction {
  id: string;
  cardId: string;
  accountId: string;
  amount: number;
  transactionType: TransactionType;
  description: string;
  merchantName: string;
  merchantCategory: string;
  transactionDate: Date;
  postingDate: Date;
  status: TransactionStatus;
  fraudIndicator: boolean;
  fraudRiskLevel: FraudRiskLevel;
  authorizationCode: string;
  referenceNumber: string;
  location: TransactionLocation;
  currency: string;
  exchangeRate?: number;
  originalAmount?: number;
  originalCurrency?: string;
  processingFee?: number;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionLocation {
  country: string;
  city: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface CreateTransactionRequest {
  cardId: string;
  amount: number;
  transactionType: TransactionType;
  description: string;
  merchantName: string;
  merchantCategory: string;
  location: TransactionLocation;
  currency?: string;
  originalAmount?: number;
  originalCurrency?: string;
}

export interface UpdateTransactionRequest {
  id: string;
  description?: string;
  merchantName?: string;
  merchantCategory?: string;
  status?: TransactionStatus;
}

export interface TransactionFilter {
  cardId?: string;
  accountId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  transactionType?: TransactionType;
  status?: TransactionStatus;
  fraudOnly?: boolean;
  merchantName?: string;
  merchantCategory?: string;
  currency?: string;
  location?: string;
}

export interface TransactionSearchCriteria {
  query?: string;
  filters: TransactionFilter;
  sorting: TransactionSortConfig;
  pagination: TransactionPaginationConfig;
}

export interface TransactionSortConfig {
  field: 'transactionDate' | 'amount' | 'merchantName' | 'status' | 'postingDate';
  direction: 'asc' | 'desc';
}

export interface TransactionPaginationConfig {
  page: number;
  pageSize: number;
}

export interface TransactionPaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedTransactionResponse {
  transactions: Transaction[];
  pagination: TransactionPaginationInfo;
}

export interface TransactionTypeConfig {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  requiresAuthorization: boolean;
  fraudRiskLevel: FraudRiskLevel;
  maxAmount?: number;
  dailyLimit?: number;
  monthlyLimit?: number;
  allowedCurrencies: string[];
  restrictedCountries?: string[];
  processingFee?: number;
  processingFeeType?: 'fixed' | 'percentage';
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  transactionsByType: Record<TransactionType, number>;
  transactionsByStatus: Record<TransactionStatus, number>;
  fraudTransactions: number;
  fraudAmount: number;
  dateRange: {
    from: Date;
    to: Date;
  };
}

export interface TransactionValidationResult {
  isValid: boolean;
  errors: TransactionValidationError[];
  warnings: TransactionValidationWarning[];
}

export interface TransactionValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface TransactionValidationWarning {
  code: string;
  message: string;
  recommendation?: string;
}

export interface TransactionAnalytics {
  spendingByCategory: Record<string, number>;
  spendingByMonth: Record<string, number>;
  topMerchants: Array<{
    merchantName: string;
    totalAmount: number;
    transactionCount: number;
  }>;
  fraudAnalytics: {
    fraudRate: number;
    fraudAmount: number;
    commonFraudPatterns: string[];
  };
  locationAnalytics: {
    topCountries: Record<string, number>;
    topCities: Record<string, number>;
  };
}

export interface TransactionExportRequest {
  format: 'csv' | 'pdf' | 'excel';
  filters: TransactionFilter;
  includeDetails: boolean;
  dateRange: {
    from: Date;
    to: Date;
  };
}

export interface TransactionExportResult {
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  expiresAt: Date;
}