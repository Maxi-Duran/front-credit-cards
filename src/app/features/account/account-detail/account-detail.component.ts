import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil } from 'rxjs';

import { Account, AccountStatus } from '../../../core/models/account.models';
import { AccountService } from '../../../core/services/account.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatDividerModule
  ],
  template: `
    <div class="account-detail-container">
      <!-- Loading Spinner -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Cargando detalles de la cuenta...</p>
      </div>

      <!-- Account Not Found -->
      <div *ngIf="!isLoading && !account" class="not-found">
        <mat-icon class="not-found-icon">error_outline</mat-icon>
        <h2>Cuenta no encontrada</h2>
        <p>La cuenta solicitada no existe o no tienes permisos para verla.</p>
        <button mat-raised-button color="primary" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Volver a la lista
        </button>
      </div>

      <!-- Account Details -->
      <div *ngIf="!isLoading && account" class="account-content">
        <!-- Header -->
        <div class="header">
          <div class="header-info">
            <h1>Cuenta {{ account.accountNumber }}</h1>
            <mat-chip [class]="'status-' + account.status">
              {{ getStatusLabel(account.status) }}
            </mat-chip>
          </div>
          <div class="header-actions">
            <button mat-button (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              Volver
            </button>
            <button mat-raised-button color="primary" (click)="editAccount()">
              <mat-icon>edit</mat-icon>
              Editar
            </button>
          </div>
        </div>

        <!-- Account Information Tabs -->
        <mat-tab-group class="account-tabs">
          <!-- General Information Tab -->
          <mat-tab label="Información General">
            <div class="tab-content">
              <div class="info-grid">
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>Información Básica</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="info-row">
                      <span class="label">Número de Cuenta:</span>
                      <span class="value">{{ account.accountNumber }}</span>
                    </div>
                    <mat-divider></mat-divider>
                    <div class="info-row">
                      <span class="label">ID Cliente:</span>
                      <span class="value">{{ account.customerId }}</span>
                    </div>
                    <mat-divider></mat-divider>
                    <div class="info-row">
                      <span class="label">Tipo de Cuenta:</span>
                      <span class="value">{{ getAccountTypeLabel(account.accountType) }}</span>
                    </div>
                    <mat-divider></mat-divider>
                    <div class="info-row">
                      <span class="label">Estado:</span>
                      <mat-chip [class]="'status-' + account.status">
                        {{ getStatusLabel(account.status) }}
                      </mat-chip>
                    </div>
                  </mat-card-content>
                </mat-card>

                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>Información Financiera</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="info-row">
                      <span class="label">Saldo Actual:</span>
                      <span class="value balance" [class.negative]="account.balance < 0">
                        {{ account.balance | currency:'USD':'symbol':'1.2-2' }}
                      </span>
                    </div>
                    <mat-divider></mat-divider>
                    <div class="info-row" *ngIf="account.creditLimit">
                      <span class="label">Límite de Crédito:</span>
                      <span class="value">{{ account.creditLimit | currency:'USD':'symbol':'1.2-2' }}</span>
                    </div>
                    <mat-divider *ngIf="account.creditLimit"></mat-divider>
                    <div class="info-row" *ngIf="account.availableCredit">
                      <span class="label">Crédito Disponible:</span>
                      <span class="value">{{ account.availableCredit | currency:'USD':'symbol':'1.2-2' }}</span>
                    </div>
                    <mat-divider *ngIf="account.availableCredit"></mat-divider>
                    <div class="info-row" *ngIf="account.interestRate">
                      <span class="label">Tasa de Interés:</span>
                      <span class="value">{{ account.interestRate }}%</span>
                    </div>
                  </mat-card-content>
                </mat-card>

                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>Fechas Importantes</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="info-row">
                      <span class="label">Fecha de Apertura:</span>
                      <span class="value">{{ account.openDate | date:'mediumDate' }}</span>
                    </div>
                    <mat-divider></mat-divider>
                    <div class="info-row">
                      <span class="label">Última Actividad:</span>
                      <span class="value">{{ account.lastActivity | date:'medium' }}</span>
                    </div>
                    <mat-divider *ngIf="account.paymentDueDate"></mat-divider>
                    <div class="info-row" *ngIf="account.paymentDueDate">
                      <span class="label">Fecha de Vencimiento:</span>
                      <span class="value">{{ account.paymentDueDate | date:'mediumDate' }}</span>
                    </div>
                  </mat-card-content>
                </mat-card>

                <mat-card class="info-card" *ngIf="account.minimumPayment">
                  <mat-card-header>
                    <mat-card-title>Información de Pago</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="info-row">
                      <span class="label">Pago Mínimo:</span>
                      <span class="value">{{ account.minimumPayment | currency:'USD':'symbol':'1.2-2' }}</span>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Actions Tab -->
          <mat-tab label="Acciones">
            <div class="tab-content">
              <div class="actions-grid">
                <mat-card class="action-card" (click)="viewCards()">
                  <mat-card-content>
                    <mat-icon class="action-icon">credit_card</mat-icon>
                    <h3>Ver Tarjetas</h3>
                    <p>Gestionar las tarjetas asociadas a esta cuenta</p>
                  </mat-card-content>
                </mat-card>

                <mat-card class="action-card" (click)="viewTransactions()">
                  <mat-card-content>
                    <mat-icon class="action-icon">receipt_long</mat-icon>
                    <h3>Ver Transacciones</h3>
                    <p>Consultar el historial de transacciones</p>
                  </mat-card-content>
                </mat-card>

                <mat-card class="action-card" (click)="processPayment()">
                  <mat-card-content>
                    <mat-icon class="action-icon">payment</mat-icon>
                    <h3>Procesar Pago</h3>
                    <p>Realizar un pago a la cuenta</p>
                  </mat-card-content>
                </mat-card>

                <mat-card class="action-card" (click)="generateReport()">
                  <mat-card-content>
                    <mat-icon class="action-icon">assessment</mat-icon>
                    <h3>Generar Reporte</h3>
                    <p>Crear reportes de actividad de la cuenta</p>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .account-detail-container {
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

    .not-found {
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
      color: #f44336;
      margin-bottom: 16px;
    }

    .not-found h2 {
      margin: 0 0 8px 0;
      color: #666;
    }

    .not-found p {
      margin: 0 0 24px 0;
      color: #999;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-info h1 {
      margin: 0;
      color: #1976d2;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .account-tabs {
      margin-top: 24px;
    }

    .tab-content {
      padding: 24px 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .info-card {
      height: fit-content;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
    }

    .info-row .label {
      font-weight: 500;
      color: #666;
    }

    .info-row .value {
      font-weight: 400;
      text-align: right;
    }

    .balance.negative {
      color: #f44336;
      font-weight: 500;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
    }

    .action-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.12);
    }

    .action-card mat-card-content {
      text-align: center;
      padding: 24px;
    }

    .action-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1976d2;
      margin-bottom: 16px;
    }

    .action-card h3 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .action-card p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .status-active {
      background-color: #4caf50;
      color: white;
    }

    .status-inactive {
      background-color: #ff9800;
      color: white;
    }

    .status-closed {
      background-color: #f44336;
      color: white;
    }

    .status-suspended {
      background-color: #9c27b0;
      color: white;
    }

    @media (max-width: 768px) {
      .account-detail-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .header-info {
        justify-content: center;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }

      .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .info-row .value {
        text-align: left;
      }
    }
  `]
})
export class AccountDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private accountService = inject(AccountService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);

  account: Account | null = null;
  isLoading = false;

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const accountId = params['id'];
        if (accountId) {
          this.loadAccount(accountId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAccount(id: string): void {
    this.isLoading = true;
    
    this.accountService.getAccount(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          this.account = account;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading account:', error);
          this.isLoading = false;
          this.notificationService.showError('Error al cargar los detalles de la cuenta');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/accounts']);
  }

  editAccount(): void {
    if (this.account) {
      this.router.navigate(['/accounts', this.account.id, 'edit']);
    }
  }

  viewCards(): void {
    if (this.account) {
      this.router.navigate(['/cards'], { queryParams: { accountId: this.account.id } });
    }
  }

  viewTransactions(): void {
    if (this.account) {
      this.router.navigate(['/transactions'], { queryParams: { accountId: this.account.id } });
    }
  }

  processPayment(): void {
    if (this.account) {
      this.router.navigate(['/payments'], { queryParams: { accountId: this.account.id } });
    }
  }

  generateReport(): void {
    if (this.account) {
      this.router.navigate(['/reports'], { queryParams: { accountId: this.account.id } });
    }
  }

  getStatusLabel(status: AccountStatus): string {
    const labels = {
      [AccountStatus.ACTIVE]: 'Activa',
      [AccountStatus.INACTIVE]: 'Inactiva',
      [AccountStatus.CLOSED]: 'Cerrada',
      [AccountStatus.SUSPENDED]: 'Suspendida'
    };
    return labels[status] || status;
  }

  getAccountTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'checking': 'Corriente',
      'savings': 'Ahorros',
      'credit': 'Crédito'
    };
    return labels[type] || type;
  }
}