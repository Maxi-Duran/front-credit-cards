// Payment-related data models and interfaces

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  DEBIT_CARD = 'debit_card',
  CREDIT_CARD = 'credit_card',
  ELECTRONIC_CHECK = 'electronic_check',
  CASH = 'cash'
}

export interface Payment {
  id: string;
  accountId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paymentDate: Date;
  processedDate?: Date;
  confirmationNumber?: string;
  description?: string;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
}

export interface PaymentRequest {
  accountId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  description?: string;
  scheduledDate?: Date;
}

export interface PaymentValidation {
  isValid: boolean;
  errors: PaymentValidationError[];
  warnings: PaymentValidationWarning[];
}

export interface PaymentValidationError {
  field: string;
  code: string;
  message: string;
}

export interface PaymentValidationWarning {
  code: string;
  message: string;
}

export interface PaymentConfirmation {
  paymentId: string;
  confirmationNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  processedDate: Date;
  newBalance: number;
}

export interface PaymentMethodInfo {
  type: PaymentMethod;
  displayName: string;
  description: string;
  isAvailable: boolean;
  processingTime: string;
  fees?: number;
  minimumAmount?: number;
  maximumAmount?: number;
}

export interface PaymentHistory {
  payments: Payment[];
  totalCount: number;
  totalAmount: number;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface PaymentFilter {
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
}

export interface PaymentRetryRequest {
  paymentId: string;
  paymentMethod?: PaymentMethod;
  amount?: number;
}

export interface PaymentBalance {
  accountId: string;
  currentBalance: number;
  availableCredit: number;
  minimumPayment: number;
  paymentDueDate: Date;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
}