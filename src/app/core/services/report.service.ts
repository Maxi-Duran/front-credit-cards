import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, interval } from 'rxjs';
import { map, catchError, tap, switchMap, takeWhile } from 'rxjs/operators';
import { 
  Report,
  ReportConfiguration,
  ReportRequest,
  CreateReportRequest,
  UpdateReportRequest,
  ReportSearchCriteria,
  PaginatedReportResponse,
  ReportSummary,
  ReportTemplate,
  ReportData,
  ReportValidationResult,
  ReportDownloadRequest,
  ReportDownloadResponse,
  ReportSchedule,
  ReportStatus,
  ReportType,
  ReportFormat,
  ReportPaginationConfig,
  ReportSortConfig
} from '../models/report.models';
import { ApiService, ApiResponse } from './api.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private reportsSubject = new BehaviorSubject<Report[]>([]);
  private selectedReportSubject = new BehaviorSubject<Report | null>(null);
  private templatesSubject = new BehaviorSubject<ReportTemplate[]>([]);
  private paginationSubject = new BehaviorSubject<any>(null);
  private summarySubject = new BehaviorSubject<ReportSummary | null>(null);

  public reports$ = this.reportsSubject.asObservable();
  public selectedReport$ = this.selectedReportSubject.asObservable();
  public templates$ = this.templatesSubject.asObservable();
  public pagination$ = this.paginationSubject.asObservable();
  public summary$ = this.summarySubject.asObservable();

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  /**
   * Get all reports with pagination and filtering
   */
  getReports(searchCriteria?: ReportSearchCriteria): Observable<PaginatedReportResponse> {
    let params = new HttpParams();
    
    if (searchCriteria) {
      // Add search query
      if (searchCriteria.query) {
        params = params.set('query', searchCriteria.query);
      }
      
      // Add type filters
      if (searchCriteria.types && searchCriteria.types.length > 0) {
        params = params.set('types', searchCriteria.types.join(','));
      }
      
      // Add status filters
      if (searchCriteria.statuses && searchCriteria.statuses.length > 0) {
        params = params.set('statuses', searchCriteria.statuses.join(','));
      }
      
      // Add date range
      if (searchCriteria.dateRange) {
        params = params.set('dateFrom', searchCriteria.dateRange.from.toISOString());
        params = params.set('dateTo', searchCriteria.dateRange.to.toISOString());
      }
      
      // Add user filter
      if (searchCriteria.userId) {
        params = params.set('userId', searchCriteria.userId);
      }
      
      // Add pagination
      if (searchCriteria.pagination) {
        params = params.set('page', searchCriteria.pagination.page.toString());
        params = params.set('pageSize', searchCriteria.pagination.pageSize.toString());
      }
      
      // Add sorting
      if (searchCriteria.sorting) {
        params = params.set('sortBy', searchCriteria.sorting.field);
        params = params.set('sortDirection', searchCriteria.sorting.direction);
      }
    }

    return this.apiService.get<PaginatedReportResponse>(environment.endpoints.reports.list, params)
      .pipe(
        map(response => response.data),
        tap(result => {
          this.reportsSubject.next(result.reports);
          this.paginationSubject.next(result.pagination);
        }),
        catchError(error => {
          console.error('Error fetching reports:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get report by ID
   */
  getReport(reportId: string): Observable<Report> {
    const endpoint = this.apiService.buildEndpoint(environment.endpoints.reports.download, { id: reportId });
    return this.apiService.get<Report>(endpoint.replace('/download', ''))
      .pipe(
        map(response => response.data),
        tap(report => this.selectedReportSubject.next(report)),
        catchError(error => {
          console.error(`Error fetching report ${reportId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Generate new report
   */
  generateReport(reportRequest: CreateReportRequest): Observable<Report> {
    return this.apiService.post<Report>(environment.endpoints.reports.generate, reportRequest)
      .pipe(
        map(response => response.data),
        tap(newReport => {
          const currentReports = this.reportsSubject.value;
          this.reportsSubject.next([newReport, ...currentReports]);
        }),
        catchError(error => {
          console.error('Error generating report:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update existing report
   */
  updateReport(reportUpdate: UpdateReportRequest): Observable<Report> {
    const endpoint = this.apiService.buildEndpoint(environment.endpoints.reports.download, { id: reportUpdate.id });
    return this.apiService.put<Report>(endpoint.replace('/download', ''), reportUpdate)
      .pipe(
        map(response => response.data),
        tap(updatedReport => {
          // Update the reports list
          const currentReports = this.reportsSubject.value;
          const updatedReports = currentReports.map(r => 
            r.id === updatedReport.id ? updatedReport : r
          );
          this.reportsSubject.next(updatedReports);
          
          // Update selected report if it's the one being updated
          if (this.selectedReportSubject.value?.id === updatedReport.id) {
            this.selectedReportSubject.next(updatedReport);
          }
        }),
        catchError(error => {
          console.error(`Error updating report ${reportUpdate.id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Delete report
   */
  deleteReport(reportId: string): Observable<void> {
    const endpoint = this.apiService.buildEndpoint(environment.endpoints.reports.download, { id: reportId });
    return this.apiService.delete<void>(endpoint.replace('/download', ''))
      .pipe(
        map(response => response.data),
        tap(() => {
          // Remove from reports list
          const currentReports = this.reportsSubject.value;
          const filteredReports = currentReports.filter(r => r.id !== reportId);
          this.reportsSubject.next(filteredReports);
          
          // Clear selected report if it's the one being deleted
          if (this.selectedReportSubject.value?.id === reportId) {
            this.selectedReportSubject.next(null);
          }
        }),
        catchError(error => {
          console.error(`Error deleting report ${reportId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Download report
   */
  downloadReport(downloadRequest: ReportDownloadRequest): Observable<ReportDownloadResponse> {
    const endpoint = this.apiService.buildEndpoint(environment.endpoints.reports.download, { id: downloadRequest.reportId });
    return this.apiService.post<ReportDownloadResponse>(endpoint, downloadRequest)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error(`Error downloading report ${downloadRequest.reportId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get report data (for preview)
   */
  getReportData(reportId: string): Observable<ReportData> {
    const endpoint = this.apiService.buildEndpoint(environment.endpoints.reports.download, { id: reportId });
    return this.apiService.get<ReportData>(`${endpoint.replace('/download', '')}/data`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error(`Error fetching report data ${reportId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get report templates
   */
  getReportTemplates(): Observable<ReportTemplate[]> {
    return this.apiService.get<ReportTemplate[]>(`${environment.endpoints.reports.list}/templates`)
      .pipe(
        map(response => response.data),
        tap(templates => this.templatesSubject.next(templates)),
        catchError(error => {
          console.error('Error fetching report templates:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get report summary statistics
   */
  getReportSummary(): Observable<ReportSummary> {
    return this.apiService.get<ReportSummary>(`${environment.endpoints.reports.list}/summary`)
      .pipe(
        map(response => response.data),
        tap(summary => this.summarySubject.next(summary)),
        catchError(error => {
          console.error('Error fetching report summary:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Validate report configuration
   */
  validateReportConfiguration(configuration: ReportConfiguration): Observable<ReportValidationResult> {
    return this.apiService.post<ReportValidationResult>(`${environment.endpoints.reports.generate}/validate`, { configuration })
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error validating report configuration:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get available report types
   */
  getAvailableReportTypes(): ReportType[] {
    return Object.values(ReportType);
  }

  /**
   * Get available report formats
   */
  getAvailableReportFormats(): ReportFormat[] {
    return Object.values(ReportFormat);
  }

  /**
   * Poll report status until completion
   */
  pollReportStatus(reportId: string, intervalMs: number = 2000): Observable<Report> {
    return interval(intervalMs).pipe(
      switchMap(() => this.getReport(reportId)),
      takeWhile(report => 
        report.status === ReportStatus.PENDING || 
        report.status === ReportStatus.GENERATING, 
        true
      )
    );
  }

  /**
   * Search reports
   */
  searchReports(criteria: ReportSearchCriteria): Observable<PaginatedReportResponse> {
    return this.getReports(criteria);
  }

  /**
   * Get reports by type
   */
  getReportsByType(type: ReportType, pagination?: ReportPaginationConfig): Observable<PaginatedReportResponse> {
    const criteria: ReportSearchCriteria = {
      types: [type],
      pagination: pagination || { page: 1, pageSize: 10 },
      sorting: { field: 'requestedAt', direction: 'desc' }
    };
    return this.getReports(criteria);
  }

  /**
   * Get reports by status
   */
  getReportsByStatus(status: ReportStatus, pagination?: ReportPaginationConfig): Observable<PaginatedReportResponse> {
    const criteria: ReportSearchCriteria = {
      statuses: [status],
      pagination: pagination || { page: 1, pageSize: 10 },
      sorting: { field: 'requestedAt', direction: 'desc' }
    };
    return this.getReports(criteria);
  }

  /**
   * Get user reports
   */
  getUserReports(userId: string, pagination?: ReportPaginationConfig): Observable<PaginatedReportResponse> {
    const criteria: ReportSearchCriteria = {
      userId,
      pagination: pagination || { page: 1, pageSize: 10 },
      sorting: { field: 'requestedAt', direction: 'desc' }
    };
    return this.getReports(criteria);
  }

  /**
   * Set selected report
   */
  setSelectedReport(report: Report | null): void {
    this.selectedReportSubject.next(report);
  }

  /**
   * Get current selected report
   */
  getSelectedReport(): Report | null {
    return this.selectedReportSubject.value;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.reportsSubject.next([]);
    this.selectedReportSubject.next(null);
    this.templatesSubject.next([]);
    this.paginationSubject.next(null);
    this.summarySubject.next(null);
  }

  /**
   * Refresh reports data
   */
  refreshReports(searchCriteria?: ReportSearchCriteria): Observable<PaginatedReportResponse> {
    return this.getReports(searchCriteria);
  }

  /**
   * Get current reports
   */
  getCurrentReports(): Report[] {
    return this.reportsSubject.value;
  }

  /**
   * Get current pagination info
   */
  getCurrentPagination(): any {
    return this.paginationSubject.value;
  }

  /**
   * Get current templates
   */
  getCurrentTemplates(): ReportTemplate[] {
    return this.templatesSubject.value;
  }

  /**
   * Get current summary
   */
  getCurrentSummary(): ReportSummary | null {
    return this.summarySubject.value;
  }

  /**
   * Check if report is ready for download
   */
  isReportReady(report: Report): boolean {
    return report.status === ReportStatus.COMPLETED && !!report.downloadUrl;
  }

  /**
   * Check if report has failed
   */
  isReportFailed(report: Report): boolean {
    return report.status === ReportStatus.FAILED;
  }

  /**
   * Check if report is in progress
   */
  isReportInProgress(report: Report): boolean {
    return report.status === ReportStatus.PENDING || report.status === ReportStatus.GENERATING;
  }

  /**
   * Get report status display text
   */
  getReportStatusText(status: ReportStatus, language: 'es' | 'en' = 'es'): string {
    const statusTexts = {
      es: {
        [ReportStatus.PENDING]: 'Pendiente',
        [ReportStatus.GENERATING]: 'Generando',
        [ReportStatus.COMPLETED]: 'Completado',
        [ReportStatus.FAILED]: 'Fallido',
        [ReportStatus.EXPIRED]: 'Expirado'
      },
      en: {
        [ReportStatus.PENDING]: 'Pending',
        [ReportStatus.GENERATING]: 'Generating',
        [ReportStatus.COMPLETED]: 'Completed',
        [ReportStatus.FAILED]: 'Failed',
        [ReportStatus.EXPIRED]: 'Expired'
      }
    };
    
    return statusTexts[language][status] || status;
  }

  /**
   * Get report type display text
   */
  getReportTypeText(type: ReportType, language: 'es' | 'en' = 'es'): string {
    const typeTexts = {
      es: {
        [ReportType.TRANSACTION_SUMMARY]: 'Resumen de Transacciones',
        [ReportType.ACCOUNT_STATEMENT]: 'Estado de Cuenta',
        [ReportType.CARD_ACTIVITY]: 'Actividad de Tarjeta',
        [ReportType.FRAUD_ANALYSIS]: 'Análisis de Fraude',
        [ReportType.SPENDING_ANALYSIS]: 'Análisis de Gastos',
        [ReportType.MERCHANT_ANALYSIS]: 'Análisis de Comercios',
        [ReportType.MONTHLY_STATEMENT]: 'Estado Mensual',
        [ReportType.ANNUAL_SUMMARY]: 'Resumen Anual'
      },
      en: {
        [ReportType.TRANSACTION_SUMMARY]: 'Transaction Summary',
        [ReportType.ACCOUNT_STATEMENT]: 'Account Statement',
        [ReportType.CARD_ACTIVITY]: 'Card Activity',
        [ReportType.FRAUD_ANALYSIS]: 'Fraud Analysis',
        [ReportType.SPENDING_ANALYSIS]: 'Spending Analysis',
        [ReportType.MERCHANT_ANALYSIS]: 'Merchant Analysis',
        [ReportType.MONTHLY_STATEMENT]: 'Monthly Statement',
        [ReportType.ANNUAL_SUMMARY]: 'Annual Summary'
      }
    };
    
    return typeTexts[language][type] || type;
  }
}