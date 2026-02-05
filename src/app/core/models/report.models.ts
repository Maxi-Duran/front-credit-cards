// Report-related data models and interfaces

export enum ReportType {
  TRANSACTION_SUMMARY = 'transaction_summary',
  ACCOUNT_STATEMENT = 'account_statement',
  CARD_ACTIVITY = 'card_activity',
  FRAUD_ANALYSIS = 'fraud_analysis',
  SPENDING_ANALYSIS = 'spending_analysis',
  MERCHANT_ANALYSIS = 'merchant_analysis',
  MONTHLY_STATEMENT = 'monthly_statement',
  ANNUAL_SUMMARY = 'annual_summary'
}

export enum ReportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json'
}

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export enum ReportPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

export interface ReportConfiguration {
  type: ReportType;
  format: ReportFormat;
  period: ReportPeriod;
  dateRange: DateRange;
  filters: ReportFilters;
  options: ReportOptions;
  title?: string;
  description?: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface ReportFilters {
  accountIds?: string[];
  cardIds?: string[];
  transactionTypes?: string[];
  merchantCategories?: string[];
  amountRange?: {
    min?: number;
    max?: number;
  };
  fraudOnly?: boolean;
  status?: string[];
  locations?: string[];
  currencies?: string[];
}

export interface ReportOptions {
  includeCharts: boolean;
  includeSummary: boolean;
  includeDetails: boolean;
  groupBy?: 'date' | 'category' | 'merchant' | 'card' | 'account';
  sortBy?: 'date' | 'amount' | 'merchant' | 'category';
  sortDirection?: 'asc' | 'desc';
  maxRecords?: number;
  language?: 'es' | 'en';
  timezone?: string;
}

export interface ReportRequest {
  configuration: ReportConfiguration;
  userId: string;
  requestedAt: Date;
  priority?: 'low' | 'normal' | 'high';
  notifyOnCompletion?: boolean;
  email?: string;
}

export interface Report {
  id: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  title: string;
  description?: string;
  configuration: ReportConfiguration;
  userId: string;
  requestedAt: Date;
  generatedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  recordCount?: number;
  error?: ReportError;
  progress?: ReportProgress;
}

export interface ReportError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
}

export interface ReportProgress {
  percentage: number;
  currentStep: string;
  totalSteps: number;
  estimatedTimeRemaining?: number;
}

export interface ReportSummary {
  totalReports: number;
  pendingReports: number;
  completedReports: number;
  failedReports: number;
  reportsByType: Record<ReportType, number>;
  reportsByFormat: Record<ReportFormat, number>;
  averageGenerationTime: number;
  totalDataSize: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  defaultConfiguration: ReportConfiguration;
  isSystem: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportData {
  summary: ReportDataSummary;
  details: ReportDataDetail[];
  charts?: ReportChart[];
  metadata: ReportMetadata;
}

export interface ReportDataSummary {
  totalRecords: number;
  totalAmount: number;
  averageAmount: number;
  dateRange: DateRange;
  currency: string;
  generatedAt: Date;
}

export interface ReportDataDetail {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  merchant?: string;
  card?: string;
  account?: string;
  status: string;
  fraudIndicator?: boolean;
  location?: string;
  currency: string;
  [key: string]: any; // Allow additional dynamic fields
}

export interface ReportChart {
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  data: ChartData[];
  options?: ChartOptions;
}

export interface ChartData {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface ChartOptions {
  showLegend: boolean;
  showValues: boolean;
  currency?: string;
  dateFormat?: string;
  colors?: string[];
}

export interface ReportMetadata {
  generatedBy: string;
  generatedAt: Date;
  version: string;
  parameters: ReportConfiguration;
  executionTime: number;
  dataSource: string;
  totalRecords: number;
  filteredRecords: number;
}

export interface ReportSearchCriteria {
  query?: string;
  types?: ReportType[];
  statuses?: ReportStatus[];
  dateRange?: DateRange;
  userId?: string;
  pagination: ReportPaginationConfig;
  sorting: ReportSortConfig;
}

export interface ReportSortConfig {
  field: 'requestedAt' | 'completedAt' | 'type' | 'status' | 'title';
  direction: 'asc' | 'desc';
}

export interface ReportPaginationConfig {
  page: number;
  pageSize: number;
}

export interface ReportPaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedReportResponse {
  reports: Report[];
  pagination: ReportPaginationInfo;
}

export interface ReportValidationResult {
  isValid: boolean;
  errors: ReportValidationError[];
  warnings: ReportValidationWarning[];
}

export interface ReportValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ReportValidationWarning {
  code: string;
  message: string;
  recommendation?: string;
}

export interface ReportExportOptions {
  format: ReportFormat;
  includeCharts: boolean;
  compression?: boolean;
  password?: string;
  watermark?: string;
}

export interface ReportSchedule {
  id: string;
  name: string;
  description?: string;
  configuration: ReportConfiguration;
  schedule: ScheduleConfig;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  recipients: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfWeek?: number; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
  time: string; // HH:mm format
  timezone: string;
}

// Utility types for form handling
export interface CreateReportRequest {
  configuration: ReportConfiguration;
  priority?: 'low' | 'normal' | 'high';
  notifyOnCompletion?: boolean;
  email?: string;
}

export interface UpdateReportRequest {
  id: string;
  title?: string;
  description?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface ReportDownloadRequest {
  reportId: string;
  format?: ReportFormat;
  options?: ReportExportOptions;
}

export interface ReportDownloadResponse {
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  expiresAt: Date;
  contentType: string;
}