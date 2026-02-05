import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject, takeUntil } from 'rxjs';

import { Card, CardStatus, CardType } from '../../../core/models/card.models';
import { Account } from '../../../core/models/account.models';
import { CardService } from '../../../core/services/card.service';
import { AccountService } from '../../../core/services/account.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-card-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatMenuModule,
    MatDialogModule,
    MatTabsModule
  ],
  template: `
    <div class="card-detail-container">
      <!-- Loading Spinner -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Cargando detalles de la tarjeta...</p>
      </div>

      <!-- Card Not Found -->
      <div *ngIf="!isLoading && !card" class="not-found-container">
        <mat-icon class="not-found-icon">credit_card_off</mat-icon>
        <h2>Tarjeta no encontrada</h2>
        <p>La tarjeta solicitada no existe o no tienes permisos para verla.</p>
        <button mat-raised-button color="primary" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Volver
        </button>
      </div>

      <!-- Card Details -->
      <div *ngIf="!isLoading && card" class="card-content">
        <!-- Header -->
        <div class="header">
          <div class="header-info">
            <h1>Detalles de Tarjeta</h1>
            <p class="card-number">{{ maskCardNumber(card.cardNumber) }}</p>
          </div>
          <div class="header-actions">
            <button mat-button (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              Volver
            </button>
            <button mat-raised-button color="primary" (click)="editCard()">
              <mat-icon>edit</mat-icon>
              Editar
            </button>
            <button mat-icon-button [matMenuTriggerFor]="actionMenu">
              <mat-icon>more_vert</mat-icon>
            </button>
          </div>
        </div>

        <!-- Card Visual Representation -->
        <mat-card class="card-visual" [class]="'card-type-' + card.cardType">
          <mat-card-content>
            <div class="card-visual-content">
              <div class="card-header">
                <span class="card-type-label">{{ getCardTypeLabel(card.cardType) }}</span>
                <mat-chip [class]="'status-' + card.status">
                  {{ getStatusLabel(card.status) }}
                </mat-chip>
              </div>
              <div class="card-number-display">
                {{ formatCardNumber(card.cardNumber) }}
              </div>
              <div class="card-info">
                <div class="cardholder-name">{{ card.cardholderName }}</div>
                <div class="expiry-date">{{ card.expirationDate | date:'MM/yy' }}</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Tabs for different sections -->
        <mat-tab-group class="detail-tabs">
          <!-- General Information Tab -->
          <mat-tab label="Información General">
            <div class="tab-content">
              <div class="info-grid">
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>Información de la Tarjeta</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="info-row">
                      <span class="label">ID de Tarjeta:</span>
                      <span class="value">{{ card.id }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Número de Tarjeta:</span>
                      <span class="value">{{ maskCardNumber(card.cardNumber) }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Titular:</span>
                      <span class="value">{{ card.cardholderName }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Tipo de Tarjeta:</span>
                      <span class="value">{{ getCardTypeLabel(card.cardType) }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Estado:</span>
                      <mat-chip [class]="'status-' + card.status">
                        {{ getStatusLabel(card.status) }}
                      </mat-chip>
                    </div>
                  </mat-card-content>
                </mat-card>

                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>Información de Cuenta</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="info-row">
                      <span class="label">ID de Cuenta:</span>
                      <span class="value">{{ card.accountId }}</span>
                    </div>
                    <div class="info-row" *ngIf="account">
                      <span class="label">Número de Cuenta:</span>
                      <span class="value">{{ account.accountNumber }}</span>
                    </div>
                    <div class="info-row" *ngIf="account">
                      <span class="label">Cliente:</span>
                      <span class="value">{{ account.customerId }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Fecha de Emisión:</span>
                      <span class="value">{{ card.issuedDate | date:'short' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Fecha de Expiración:</span>
                      <span class="value" [class.expiring-soon]="isExpiringSoon(card.expirationDate)">
                        {{ card.expirationDate | date:'MM/yy' }}
                      </span>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Credit Information Tab -->
          <mat-tab label="Información de Crédito">
            <div class="tab-content">
              <div class="credit-grid">
                <mat-card class="credit-card">
                  <mat-card-header>
                    <mat-card-title>Límites de Crédito</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="credit-info">
                      <div class="credit-item">
                        <span class="credit-label">Límite de Crédito</span>
                        <span class="credit-value total-limit">
                          {{ card.creditLimit | currency:'USD':'symbol':'1.2-2' }}
                        </span>
                      </div>
                      <div class="credit-item">
                        <span class="credit-label">Crédito Disponible</span>
                        <span class="credit-value available-credit" [class.low-credit]="card.availableCredit < (card.creditLimit * 0.1)">
                          {{ card.availableCredit | currency:'USD':'symbol':'1.2-2' }}
                        </span>
                      </div>
                      <div class="credit-item">
                        <span class="credit-label">Crédito Utilizado</span>
                        <span class="credit-value used-credit">
                          {{ (card.creditLimit - card.availableCredit) | currency:'USD':'symbol':'1.2-2' }}
                        </span>
                      </div>
                      <div class="credit-item">
                        <span class="credit-label">Porcentaje de Utilización</span>
                        <span class="credit-value utilization" [class.high-utilization]="getUtilizationPercentage() > 80">
                          {{ getUtilizationPercentage() }}%
                        </span>
                      </div>
                    </div>

                    <!-- Credit Utilization Bar -->
                    <div class="utilization-bar">
                      <div class="utilization-label">Utilización del Crédito</div>
                      <div class="utilization-progress">
                        <div class="utilization-fill" 
                             [style.width.%]="getUtilizationPercentage()"
                             [class.high-utilization]="getUtilizationPercentage() > 80">
                        </div>
                      </div>
                      <div class="utilization-text">
                        {{ getUtilizationPercentage() }}% utilizado
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Activity Tab -->
          <mat-tab label="Actividad">
            <div class="tab-content">
              <mat-card class="activity-card">
                <mat-card-header>
                  <mat-card-title>Actividad Reciente</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="activity-info">
                    <div class="activity-item">
                      <mat-icon>schedule</mat-icon>
                      <div class="activity-details">
                        <span class="activity-label">Último Uso</span>
                        <span class="activity-value">{{ card.lastUsed | date:'full' }}</span>
                      </div>
                    </div>
                    <mat-divider></mat-divider>
                    <div class="activity-actions">
                      <button mat-raised-button color="primary" (click)="viewTransactions()">
                        <mat-icon>receipt</mat-icon>
                        Ver Todas las Transacciones
                      </button>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>

        <!-- Action Menu -->
        <mat-menu #actionMenu="matMenu">
          <button mat-menu-item (click)="activateCard()" *ngIf="card.status === 'pending' || card.status === 'blocked'">
            <mat-icon>check_circle</mat-icon>
            <span>Activar Tarjeta</span>
          </button>
          <button mat-menu-item (click)="blockCard()" *ngIf="card.status === 'active'">
            <mat-icon>block</mat-icon>
            <span>Bloquear Tarjeta</span>
          </button>
          <button mat-menu-item (click)="unblockCard()" *ngIf="card.status === 'blocked'">
            <mat-icon>lock_open</mat-icon>
            <span>Desbloquear Tarjeta</span>
          </button>
          <button mat-menu-item (click)="replaceCard()" *ngIf="card.status !== 'expired'">
            <mat-icon>refresh</mat-icon>
            <span>Reemplazar Tarjeta</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="viewTransactions()">
            <mat-icon>receipt</mat-icon>
            <span>Ver Transacciones</span>
          </button>
          <button mat-menu-item (click)="viewAccount()" *ngIf="account">
            <mat-icon>account_balance</mat-icon>
            <span>Ver Cuenta</span>
          </button>
        </mat-menu>
      </div>
    </div>
  `,
  styles: [`
    .card-detail-container {
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

    .not-found-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .not-found-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-info h1 {
      margin: 0 0 8px 0;
      color: #1976d2;
    }

    .card-number {
      margin: 0;
      color: #666;
      font-size: 16px;
      font-family: monospace;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .card-visual {
      margin-bottom: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 200px;
    }

    .card-visual.card-type-credit {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .card-visual.card-type-debit {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .card-visual.card-type-prepaid {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .card-visual-content {
      padding: 24px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-type-label {
      font-size: 14px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .card-number-display {
      font-size: 24px;
      font-family: monospace;
      letter-spacing: 4px;
      margin: 24px 0;
    }

    .card-info {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .cardholder-name {
      font-size: 16px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .expiry-date {
      font-size: 14px;
      font-family: monospace;
    }

    .detail-tabs {
      margin-top: 24px;
    }

    .tab-content {
      padding: 24px 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .info-card {
      height: fit-content;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      font-family: monospace;
    }

    .credit-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }

    .credit-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .credit-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .credit-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .credit-value {
      font-size: 18px;
      font-weight: 500;
    }

    .total-limit {
      color: #1976d2;
    }

    .available-credit {
      color: #4caf50;
    }

    .available-credit.low-credit {
      color: #f44336;
    }

    .used-credit {
      color: #ff9800;
    }

    .utilization {
      color: #666;
    }

    .utilization.high-utilization {
      color: #f44336;
    }

    .utilization-bar {
      margin-top: 16px;
    }

    .utilization-label {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .utilization-progress {
      height: 8px;
      background-color: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .utilization-fill {
      height: 100%;
      background-color: #4caf50;
      transition: width 0.3s ease;
    }

    .utilization-fill.high-utilization {
      background-color: #f44336;
    }

    .utilization-text {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
      text-align: center;
    }

    .activity-info {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .activity-details {
      display: flex;
      flex-direction: column;
    }

    .activity-label {
      font-size: 14px;
      color: #666;
    }

    .activity-value {
      font-size: 16px;
      font-weight: 500;
    }

    .activity-actions {
      display: flex;
      justify-content: center;
      margin-top: 16px;
    }

    .expiring-soon {
      color: #ff9800;
      font-weight: 500;
    }

    .status-active {
      background-color: #4caf50;
      color: white;
    }

    .status-blocked {
      background-color: #f44336;
      color: white;
    }

    .status-expired {
      background-color: #9e9e9e;
      color: white;
    }

    .status-pending {
      background-color: #ff9800;
      color: white;
    }

    @media (max-width: 768px) {
      .card-detail-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .header-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .credit-info {
        grid-template-columns: 1fr;
      }

      .card-number-display {
        font-size: 18px;
        letter-spacing: 2px;
      }
    }
  `]
})
export class CardDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cardService = inject(CardService);
  private accountService = inject(AccountService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);

  card: Card | null = null;
  account: Account | null = null;
  isLoading = false;

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.loadCard(params['id']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCard(cardId: string): void {
    this.isLoading = true;
    
    this.cardService.getCard(cardId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (card) => {
          this.card = card;
          this.loadAccount(card.accountId);
        },
        error: (error) => {
          console.error('Error loading card:', error);
          this.isLoading = false;
          this.notificationService.showError('Error al cargar los detalles de la tarjeta');
        }
      });
  }

  private loadAccount(accountId: string): void {
    this.accountService.getAccount(accountId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          this.account = account;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading account:', error);
          this.isLoading = false;
          // Don't show error for account loading as card details are more important
        }
      });
  }

  goBack(): void {
    if (this.card) {
      this.router.navigate(['/cards'], { queryParams: { accountId: this.card.accountId } });
    } else {
      this.router.navigate(['/cards']);
    }
  }

  editCard(): void {
    if (this.card) {
      this.router.navigate(['/cards', this.card.id, 'edit']);
    }
  }

  activateCard(): void {
    if (!this.card) return;

    this.cardService.activateCard(this.card.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.notificationService.showSuccess('Tarjeta activada exitosamente');
            this.loadCard(this.card!.id);
          } else {
            this.notificationService.showError(result.message || 'Error al activar la tarjeta');
          }
        },
        error: (error) => {
          console.error('Error activating card:', error);
          this.notificationService.showError('Error al activar la tarjeta');
        }
      });
  }

  blockCard(): void {
    if (!this.card) return;

    this.cardService.blockCard(this.card.id, 'Bloqueada desde detalles de tarjeta')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.notificationService.showSuccess('Tarjeta bloqueada exitosamente');
            this.loadCard(this.card!.id);
          } else {
            this.notificationService.showError(result.message || 'Error al bloquear la tarjeta');
          }
        },
        error: (error) => {
          console.error('Error blocking card:', error);
          this.notificationService.showError('Error al bloquear la tarjeta');
        }
      });
  }

  unblockCard(): void {
    if (!this.card) return;

    this.cardService.unblockCard(this.card.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.notificationService.showSuccess('Tarjeta desbloqueada exitosamente');
            this.loadCard(this.card!.id);
          } else {
            this.notificationService.showError(result.message || 'Error al desbloquear la tarjeta');
          }
        },
        error: (error) => {
          console.error('Error unblocking card:', error);
          this.notificationService.showError('Error al desbloquear la tarjeta');
        }
      });
  }

  replaceCard(): void {
    if (!this.card) return;

    this.cardService.replaceCard(this.card.id, 'Reemplazo solicitado desde detalles de tarjeta')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.notificationService.showSuccess('Tarjeta reemplazada exitosamente');
            if (result.newCardId) {
              this.router.navigate(['/cards', result.newCardId]);
            } else {
              this.loadCard(this.card!.id);
            }
          } else {
            this.notificationService.showError(result.message || 'Error al reemplazar la tarjeta');
          }
        },
        error: (error) => {
          console.error('Error replacing card:', error);
          this.notificationService.showError('Error al reemplazar la tarjeta');
        }
      });
  }

  viewTransactions(): void {
    if (this.card) {
      this.router.navigate(['/transactions'], { queryParams: { cardId: this.card.id } });
    }
  }

  viewAccount(): void {
    if (this.account) {
      this.router.navigate(['/accounts', this.account.id]);
    }
  }

  maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 4) return cardNumber;
    const lastFour = cardNumber.slice(-4);
    const masked = '*'.repeat(cardNumber.length - 4);
    return masked + lastFour;
  }

  formatCardNumber(cardNumber: string): string {
    if (!cardNumber) return '';
    // Format as groups of 4 digits
    return cardNumber.replace(/(.{4})/g, '$1 ').trim();
  }

  getStatusLabel(status: CardStatus): string {
    const labels = {
      [CardStatus.ACTIVE]: 'Activa',
      [CardStatus.BLOCKED]: 'Bloqueada',
      [CardStatus.EXPIRED]: 'Expirada',
      [CardStatus.PENDING]: 'Pendiente'
    };
    return labels[status] || status;
  }

  getCardTypeLabel(type: CardType): string {
    const labels = {
      [CardType.CREDIT]: 'Crédito',
      [CardType.DEBIT]: 'Débito',
      [CardType.PREPAID]: 'Prepago'
    };
    return labels[type] || type;
  }

  isExpiringSoon(expirationDate: Date): boolean {
    const now = new Date();
    const expDate = new Date(expirationDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);
    
    return expDate <= threeMonthsFromNow && expDate > now;
  }

  getUtilizationPercentage(): number {
    if (!this.card || this.card.creditLimit === 0) return 0;
    const used = this.card.creditLimit - this.card.availableCredit;
    return Math.round((used / this.card.creditLimit) * 100);
  }
}