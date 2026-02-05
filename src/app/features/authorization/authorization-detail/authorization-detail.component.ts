import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, switchMap } from 'rxjs';

import { 
  Authorization, 
  AuthorizationStatus,
  AuthorizationAuditEntry 
} from '../../../core/models/authorization.models';
import { AuthorizationService } from '../../../core/services/authorization.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthorizationDenialDialogComponent } from '../authorization-denial-dialog/authorization-denial-dialog.component';

@Component({
  selector: 'app-authorization-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatExpansionModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="authorization-detail-container">
      <!-- Loading Spinner -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Cargando detalles de autorización...</p>
      </div>

      <!-- Authorization Details -->
      <div *ngIf="!isLoading && authorization" class="detail-content">
        <!-- Header -->
        <div class="detail-header">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>Autorización {{ authorization.id }}</h1>
          <div class="header-actions">
            <button 
              mat-raised-button 
              color="primary"
              (click)="approveAuthorization()"
              [disabled]="authorization.status !== 'pending'">
              <mat-icon>check_circle</mat-icon>
              Aprobar
            </button>
            <button 
              mat-raised-button 
              color="warn"
              (click)="denyAuthorization()"
              [disabled]="authorization.status !== 'pending'">
              <mat-icon>cancel</mat-icon>
              Denegar
            </button>
          </div>
        </div>

        <!-- Status and Risk Card -->
        <mat-card class="status-card">
          <mat-card-content>
            <div class="status-row">
              <div class="status-item">
                <label>Estado:</label>
                <mat-chip [class]="'status-' + authorization.status">
                  {{ getStatusLabel(authorization.status) }}
                </mat-chip>
              </div>
              <div class="status-item">
                <label>Puntuación de Riesgo:</label>
                <mat-chip [class]="getRiskClass(authorization.riskScore)">
                  {{ authorization.riskScore }}%
                </mat-chip>
              </div>
              <div class="status-item" *ngIf="authorization.fraudIndicators && authorization.fraudIndicators.length > 0">
                <label>Indicadores de Fraude:</label>
                <mat-icon 
                  class="fraud-icon"
                  [matBadge]="authorization.fraudIndicators.length"
                  matBadgeColor="warn"
                  [matTooltip]="authorization.fraudIndicators.join(', ')">
                  warning
                </mat-icon>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Transaction Information -->
        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>receipt</mat-icon>
              Información de Transacción
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <label>ID de Transacción:</label>
                <span>{{ authorization.transactionId }}</span>
              </div>
              <div class="info-item">
                <label>ID de Tarjeta:</label>
                <span>{{ authorization.cardId }}</span>
              </div>
              <div class="info-item" *ngIf="authorization.cardNumber">
                <label>Número de Tarjeta:</label>
                <span>{{ authorization.cardNumber }}</span>
              </div>
              <div class="info-item" *ngIf="authorization.accountId">
                <label>ID de Cuenta:</label>
                <span>{{ authorization.accountId }}</span>
              </div>
              <div class="info-item">
                <label>Comercio:</label>
                <span class="merchant-name">{{ authorization.merchantName }}</span>
              </div>
              <div class="info-item">
                <label>Monto:</label>
                <span class="amount" [class.high-amount]="authorization.amount > 1000">
                  {{ authorization.amount | currency:'USD':'symbol':'1.2-2' }}
                </span>
              </div>
              <div class="info-item" *ngIf="authorization.transactionType">
                <label>Tipo de Transacción:</label>
                <span>{{ authorization.transactionType }}</span>
              </div>
              <div class="info-item" *ngIf="authorization.description">
                <label>Descripción:</label>
                <span>{{ authorization.description }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Dates Information -->
        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>schedule</mat-icon>
              Fechas
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <label>Fecha de Solicitud:</label>
                <span>{{ authorization.requestDate | date:'medium' }}</span>
              </div>
              <div class="info-item" *ngIf="authorization.expirationDate">
                <label>Fecha de Expiración:</label>
                <span>{{ authorization.expirationDate | date:'medium' }}</span>
              </div>
              <div class="info-item" *ngIf="authorization.processedDate">
                <label>Fecha de Procesamiento:</label>
                <span>{{ authorization.processedDate | date:'medium' }}</span>
              </div>
              <div class="info-item" *ngIf="authorization.processedBy">
                <label>Procesado Por:</label>
                <span>{{ authorization.processedBy }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Fraud Indicators -->
        <mat-card class="info-card" *ngIf="authorization.fraudIndicators && authorization.fraudIndicators.length > 0">
          <mat-card-header>
            <mat-card-title>
              <mat-icon class="fraud-icon">warning</mat-icon>
              Indicadores de Fraude
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-chip-set>
              <mat-chip *ngFor="let indicator of authorization.fraudIndicators" class="fraud-chip">
                {{ indicator }}
              </mat-chip>
            </mat-chip-set>
          </mat-card-content>
        </mat-card>

        <!-- Denial Reason -->
        <mat-card class="info-card" *ngIf="authorization.denialReason">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>info</mat-icon>
              Razón de Denegación
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="denial-reason">{{ authorization.denialReason }}</p>
          </mat-card-content>
        </mat-card>

        <!-- Audit Trail -->
        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>history</mat-icon>
              Historial de Auditoría
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="loadingAudit" class="audit-loading">
              <mat-spinner diameter="30"></mat-spinner>
              <p>Cargando historial...</p>
            </div>

            <div *ngIf="!loadingAudit && auditTrail.length === 0" class="no-audit">
              <p>No hay entradas de auditoría disponibles.</p>
            </div>

            <mat-accordion *ngIf="!loadingAudit && auditTrail.length > 0">
              <mat-expansion-panel *ngFor="let entry of auditTrail">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon class="audit-icon">{{ getAuditIcon(entry.action) }}</mat-icon>
                    {{ getAuditActionLabel(entry.action) }}
                  </mat-panel-title>
                  <mat-panel-description>
                    {{ entry.performedAt | date:'short' }} - {{ entry.performedBy }}
                  </mat-panel-description>
                </mat-expansion-panel-header>
                <div class="audit-details">
                  <div class="audit-item" *ngIf="entry.previousStatus">
                    <label>Estado Anterior:</label>
                    <span>{{ getStatusLabel(entry.previousStatus) }}</span>
                  </div>
                  <div class="audit-item">
                    <label>Nuevo Estado:</label>
                    <span>{{ getStatusLabel(entry.newStatus) }}</span>
                  </div>
                  <div class="audit-item" *ngIf="entry.reason">
                    <label>Razón:</label>
                    <span>{{ entry.reason }}</span>
                  </div>
                  <div class="audit-item" *ngIf="entry.notes">
                    <label>Notas:</label>
                    <span>{{ entry.notes }}</span>
                  </div>
                </div>
              </mat-expansion-panel>
            </mat-accordion>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Error State -->
      <div *ngIf="!isLoading && !authorization" class="error-state">
        <mat-icon class="error-icon">error_outline</mat-icon>
        <h3>No se pudo cargar la autorización</h3>
        <p>La autorización solicitada no existe o no está disponible.</p>
        <button mat-raised-button color="primary" (click)="goBack()">
          Volver a la lista
        </button>
      </div>
    </div>
  `,
  styles: [`
    .authorization-detail-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .detail-header h1 {
      flex: 1;
      margin: 0;
      color: #1976d2;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .status-card {
      margin-bottom: 24px;
    }

    .status-row {
      display: flex;
      gap: 32px;
      align-items: center;
      flex-wrap: wrap;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-item label {
      font-weight: 500;
      color: #666;
    }

    .info-card {
      margin-bottom: 24px;
    }

    .info-card mat-card-header {
      margin-bottom: 16px;
    }

    .info-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item label {
      font-size: 12px;
      font-weight: 500;
      color: #666;
      text-transform: uppercase;
    }

    .info-item span {
      font-size: 16px;
      color: #333;
    }

    .merchant-name {
      font-weight: 500;
    }

    .amount {
      font-size: 20px;
      font-weight: 500;
      color: #1976d2;
    }

    .high-amount {
      color: #f44336;
    }

    .fraud-icon {
      color: #f44336;
    }

    .fraud-chip {
      background-color: #ffebee;
      color: #f44336;
    }

    .denial-reason {
      margin: 0;
      padding: 16px;
      background-color: #f5f5f5;
      border-left: 4px solid #f44336;
      border-radius: 4px;
    }

    .audit-loading {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
    }

    .no-audit {
      padding: 16px;
      text-align: center;
      color: #666;
    }

    .audit-icon {
      margin-right: 8px;
    }

    .audit-details {
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .audit-item {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }

    .audit-item:last-child {
      margin-bottom: 0;
    }

    .audit-item label {
      font-weight: 500;
      color: #666;
      min-width: 120px;
    }

    .status-pending {
      background-color: #ff9800;
      color: white;
    }

    .status-approved {
      background-color: #4caf50;
      color: white;
    }

    .status-denied {
      background-color: #f44336;
      color: white;
    }

    .status-expired {
      background-color: #9e9e9e;
      color: white;
    }

    .risk-low {
      background-color: #4caf50;
      color: white;
    }

    .risk-medium {
      background-color: #ff9800;
      color: white;
    }

    .risk-high {
      background-color: #f44336;
      color: white;
    }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
      margin-bottom: 16px;
    }

    .error-state h3 {
      margin: 0 0 8px 0;
      color: #666;
    }

    .error-state p {
      margin: 0 0 24px 0;
      color: #999;
    }

    @media (max-width: 768px) {
      .authorization-detail-container {
        padding: 16px;
      }

      .detail-header {
        flex-wrap: wrap;
      }

      .header-actions {
        width: 100%;
        justify-content: stretch;
      }

      .header-actions button {
        flex: 1;
      }

      .status-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AuthorizationDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authorizationService = inject(AuthorizationService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  authorization: Authorization | null = null;
  auditTrail: AuthorizationAuditEntry[] = [];
  isLoading = false;
  loadingAudit = false;

  ngOnInit(): void {
    this.loadAuthorization();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAuthorization(): void {
    this.isLoading = true;
    
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          const authId = params['id'];
          return this.authorizationService.getAuthorization(authId);
        })
      )
      .subscribe({
        next: (authorization) => {
          this.authorization = authorization;
          this.isLoading = false;
          this.loadAuditTrail();
        },
        error: (error) => {
          console.error('Error loading authorization:', error);
          this.isLoading = false;
          this.notificationService.showError('Error al cargar la autorización');
        }
      });
  }

  private loadAuditTrail(): void {
    if (!this.authorization) return;

    this.loadingAudit = true;
    
    this.authorizationService.getAuthorizationAuditTrail(this.authorization.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (auditTrail) => {
          this.auditTrail = auditTrail;
          this.loadingAudit = false;
        },
        error: (error) => {
          console.error('Error loading audit trail:', error);
          this.loadingAudit = false;
        }
      });
  }

  approveAuthorization(): void {
    if (!this.authorization || this.authorization.status !== AuthorizationStatus.PENDING) {
      return;
    }

    this.authorizationService.approveAuthorization(this.authorization.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedAuth) => {
          this.authorization = updatedAuth;
          this.notificationService.showSuccess('Autorización aprobada exitosamente');
          this.loadAuditTrail();
        },
        error: (error) => {
          console.error('Error approving authorization:', error);
          this.notificationService.showError('Error al aprobar la autorización');
        }
      });
  }

  denyAuthorization(): void {
    if (!this.authorization || this.authorization.status !== AuthorizationStatus.PENDING) {
      return;
    }

    // Open denial dialog
    const dialogRef = this.dialog.open(AuthorizationDenialDialogComponent, {
      width: '600px',
      data: {
        authorizationId: this.authorization.id,
        merchantName: this.authorization.merchantName,
        amount: this.authorization.amount
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.authorization) {
        const reason = result.notes ? `${result.reason}: ${result.notes}` : result.reason;
        
        this.authorizationService.denyAuthorization(this.authorization.id, reason)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedAuth) => {
              this.authorization = updatedAuth;
              this.notificationService.showSuccess('Autorización denegada exitosamente');
              this.loadAuditTrail();
            },
            error: (error) => {
              console.error('Error denying authorization:', error);
              this.notificationService.showError('Error al denegar la autorización');
            }
          });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/authorizations']);
  }

  getStatusLabel(status: AuthorizationStatus): string {
    const labels = {
      [AuthorizationStatus.PENDING]: 'Pendiente',
      [AuthorizationStatus.APPROVED]: 'Aprobada',
      [AuthorizationStatus.DENIED]: 'Denegada',
      [AuthorizationStatus.EXPIRED]: 'Expirada'
    };
    return labels[status] || status;
  }

  getRiskClass(riskScore: number): string {
    if (riskScore < 40) return 'risk-low';
    if (riskScore < 70) return 'risk-medium';
    return 'risk-high';
  }

  getAuditActionLabel(action: string): string {
    const labels: Record<string, string> = {
      'created': 'Creada',
      'approved': 'Aprobada',
      'denied': 'Denegada',
      'expired': 'Expirada',
      'reviewed': 'Revisada',
      'escalated': 'Escalada'
    };
    return labels[action] || action;
  }

  getAuditIcon(action: string): string {
    const icons: Record<string, string> = {
      'created': 'add_circle',
      'approved': 'check_circle',
      'denied': 'cancel',
      'expired': 'schedule',
      'reviewed': 'visibility',
      'escalated': 'arrow_upward'
    };
    return icons[action] || 'info';
  }
}
