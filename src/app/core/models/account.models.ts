// Account-related data models and interfaces

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CLOSED = 'closed',
  SUSPENDED = 'suspended'
}

export interface Account {
  id: number | string;
  account_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  created_at: string;
  updated_at: string;
  
  // Computed/mapped properties for compatibility
  customerId?: string;
  accountNumber?: string;
  accountType?: string;
  balance?: number;
  status?: AccountStatus;
  openDate?: Date;
  lastActivity?: Date;
  creditLimit?: number;
  availableCredit?: number;
  interestRate?: number;
  minimumPayment?: number;
  paymentDueDate?: Date;
}

export interface CreateAccountRequest {
  customerId: string;
  accountType: string;
  creditLimit?: number;
  interestRate?: number;
}

export interface UpdateAccountRequest {
  id: string;
  accountType?: string;
  creditLimit?: number;
  interestRate?: number;
  status?: AccountStatus;
}

export interface SearchCriteria {
  query?: string;
  filters: Record<string, any>;
  sorting: SortConfig;
  pagination: PaginationConfig;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
}

export interface AccountFilter {
  status?: AccountStatus;
  accountType?: string;
  customerId?: string;
  balanceMin?: number;
  balanceMax?: number;
  openDateFrom?: Date;
  openDateTo?: Date;
}