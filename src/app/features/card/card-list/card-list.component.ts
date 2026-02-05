import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { Card, CardStatus, CardType, CardFilter } from '../../../core/models/card.models';
import { Account } from '../../../core/models/account.models';
import { CardService } from '../../../core/services/card.service';
import { AccountService } from '../../../core/services/account.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-card-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatDialogModule,
    MatDividerModule
  ],
  template: `
    <div class="card-list-container">
      <!-- Header -->
      <div class="header">
        <div class="header-info">
          <h1>Gestión de Tarjetas</h1>
          <p *ngIf="selectedAccount" class="account-info">
            Cuenta: {{ selectedAccount.accountNumber }} - {{ selectedAccount.customerId }}
          </p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="createCard()" [disabled]="!selectedAccount">
            <mat-icon>add</mat-icon>
            Nueva Tarjeta
          </button>
          <button mat-button (click)="goBackToAccounts()" *ngIf="selectedAccount">
            <mat-icon>arrow_back</mat-icon>
            Volver a Cuentas
          </button>
        </div>
      </div>

      <!-- Account Selection (if no account selected) -->
      <mat-card *ngIf="!selectedAccount" class="account-selection-card">
        <mat-card-content>
          <h3>Seleccionar Cuenta</h3>
          <p>Seleccione una cuenta para ver sus tarjetas asociadas.</p>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Cuenta</mat-label>
            <mat-select (selectionChange)="onAccountSelected($event.value)">
              <mat-option *ngFor="let account of availableAccounts" [value]="account">
                {{ account.accountNumber }} - {{ account.customerId }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <!-- Search and Filter Card -->
      <mat-card *ngIf="selectedAccount" class="filter-card">
        <mat-card-content>
          <form [formGroup]="filterForm" class="filter-form">
            <div class="filter-row">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Buscar tarjetas</mat-label>
                <input matInput formControlName="query" placeholder="Número de tarjeta, titular...">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="active">Activa</mat-option>
                  <mat-option value="blocked">Bloqueada</mat-option>
                  <mat-option value="expired">Expirada</mat-option>
                  <mat-option value="pending">Pendiente</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tipo de Tarjeta</mat-label>
                <mat-select formControlName="cardType">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="credit">Crédito</mat-option>
                  <mat-option value="debit">Débito</mat-option>
                  <mat-option value="prepaid">Prepago</mat-option>
                </mat-select>
              </mat-form-field>

              <button mat-button type="button" (click)="clearFilters()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Results Card -->
      <mat-card *ngIf="selectedAccount" class="results-card">
        <mat-card-content>
          <!-- Loading Spinner -->
          <div *ngIf="isLoading" class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Cargando tarjetas...</p>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading && cards.length === 0" class="empty-state">
            <mat-icon class="empty-icon">credit_card</mat-icon>
            <h3>No se encontraron tarjetas</h3>
            <p>No hay tarjetas asociadas a esta cuenta o que coincidan con los criterios de búsqueda.</p>
            <button mat-raised-button color="primary" (click)="createCard()">
              <mat-icon>add</mat-icon>
              Crear Primera Tarjeta
            </button>
          </div>

          <!-- Cards Table -->
          <div *ngIf="!isLoading && cards.length > 0" class="table-container">
            <table mat-table [dataSource]="cards" matSort (matSortChange)="onSortChange($event)">
              <!-- Card Number Column -->
              <ng-container matColumnDef="cardNumber">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Número de Tarjeta</th>
                <td mat-cell *matCellDef="let card">{{ maskCardNumber(card.cardNumber) }}</td>
              </ng-container>

              <!-- Cardholder Name Column -->
              <ng-container matColumnDef="cardholderName">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Titular</th>
                <td mat-cell *matCellDef="let card">{{ card.cardholderName }}</td>
              </ng-container>

              <!-- Card Type Column -->
              <ng-container matColumnDef="cardType">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Tipo</th>
                <td mat-cell *matCellDef="let card">{{ getCardTypeLabel(card.cardType) }}</td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Estado</th>
                <td mat-cell *matCellDef="let card">
                  <mat-chip [class]="'status-' + card.status">
                    {{ getStatusLabel(card.status) }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Credit Limit Column -->
              <ng-container matColumnDef="creditLimit">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Límite de Crédito</th>
                <td mat-cell *matCellDef="let card">
                  {{ card.creditLimit | currency:'USD':'symbol':'1.2-2' }}
                </td>
              </ng-container>

              <!-- Available Credit Column -->
              <ng-container matColumnDef="availableCredit">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Crédito Disponible</th>
                <td mat-cell *matCellDef="let card" [class.low-credit]="card.availableCredit < (card.creditLimit * 0.1)">
                  {{ card.availableCredit | currency:'USD':'symbol':'1.2-2' }}
                </td>
              </ng-container>

              <!-- Expiration Date Column -->
              <ng-container matColumnDef="expirationDate">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Fecha de Expiración</th>
                <td mat-cell *matCellDef="let card" [class.expiring-soon]="isExpiringSoon(card.expirationDate)">
                  {{ card.expirationDate | date:'MM/yy' }}
                </td>
              </ng-container>

              <!-- Last Used Column -->
              <ng-container matColumnDef="lastUsed">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Último Uso</th>
                <td mat-cell *matCellDef="let card">{{ card.lastUsed | date:'short' }}</td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let card">
                  <button mat-icon-button [matMenuTriggerFor]="cardMenu" [matMenuTriggerData]="{card: card}">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                  (click)="viewCard(row)" 
                  class="clickable-row"></tr>
            </table>

            <!-- Card Actions Menu -->
            <mat-menu #cardMenu="matMenu">
              <ng-template matMenuContent let-card="card">
                <button mat-menu-item (click)="viewCard(card)">
                  <mat-icon>visibility</mat-icon>
                  <span>Ver Detalles</span>
                </button>
                <button mat-menu-item (click)="editCard(card)">
                  <mat-icon>edit</mat-icon>
                  <span>Editar</span>
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="activateCard(card)" *ngIf="card.status === 'pending' || card.status === 'blocked'">
                  <mat-icon>check_circle</mat-icon>
                  <span>Activar</span>
                </button>
                <button mat-menu-item (click)="blockCard(card)" *ngIf="card.status === 'active'">
                  <mat-icon>block</mat-icon>
                  <span>Bloquear</span>
                </button>
                <button mat-menu-item (click)="unblockCard(card)" *ngIf="card.status === 'blocked'">
                  <mat-icon>lock_open</mat-icon>
                  <span>Desbloquear</span>
                </button>
                <button mat-menu-item (click)="replaceCard(card)" *ngIf="card.status !== 'expired'">
                  <mat-icon>refresh</mat-icon>
                  <span>Reemplazar</span>
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="viewTransactions(card)">
                  <mat-icon>receipt</mat-icon>
                  <span>Ver Transacciones</span>
                </button>
              </ng-template>
            </mat-menu>

            <!-- Paginator -->
            <mat-paginator 
              [length]="totalItems"
              [pageSize]="pageSize"
              [pageSizeOptions]="[5, 10, 25, 50]"
              [pageIndex]="currentPage"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .card-list-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
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

    .account-info {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .account-selection-card {
      margin-bottom: 24px;
    }

    .account-selection-card h3 {
      margin: 0 0 8px 0;
      color: #1976d2;
    }

    .filter-card {
      margin-bottom: 24px;
    }

    .filter-form {
      width: 100%;
    }

    .filter-row {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 300px;
    }

    .full-width {
      width: 100%;
    }

    .results-card {
      min-height: 400px;
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

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #666;
    }

    .empty-state p {
      margin: 0 0 24px 0;
      color: #999;
    }

    .table-container {
      width: 100%;
      overflow-x: auto;
    }

    .mat-mdc-table {
      width: 100%;
    }

    .clickable-row {
      cursor: pointer;
    }

    .clickable-row:hover {
      background-color: #f5f5f5;
    }

    .low-credit {
      color: #f44336;
      font-weight: 500;
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
      .card-list-container {
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

      .filter-row {
        flex-direction: column;
        align-items: stretch;
      }

      .search-field {
        min-width: unset;
      }
    }
  `]
})
export class CardListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cardService = inject(CardService);
  private accountService = inject(AccountService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);

  cards: Card[] = [];
  availableAccounts: Account[] = [];
  selectedAccount: Account | null = null;
  displayedColumns: string[] = ['cardNumber', 'cardholderName', 'cardType', 'status', 'creditLimit', 'availableCredit', 'expirationDate', 'lastUsed', 'actions'];
  
  // Pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;

  // Loading state
  isLoading = false;

  // Filter form
  filterForm: FormGroup = this.fb.group({
    query: [''],
    status: [''],
    cardType: ['']
  });

  ngOnInit(): void {
    this.setupFilterSubscription();
    this.loadAvailableAccounts();
    this.checkRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilterSubscription(): void {
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 0;
        this.loadCards();
      });
  }

  private checkRouteParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['accountId']) {
          this.loadAccountAndCards(params['accountId']);
        }
      });
  }

  private loadAvailableAccounts(): void {
    this.accountService.getAccounts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (accounts) => {
          this.availableAccounts = accounts;
        },
        error: (error) => {
          console.error('Error loading accounts:', error);
          this.notificationService.showError('Error al cargar las cuentas');
        }
      });
  }

  private loadAccountAndCards(accountId: string): void {
    this.accountService.getAccount(accountId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          this.selectedAccount = account;
          this.loadCards();
        },
        error: (error) => {
          console.error('Error loading account:', error);
          this.notificationService.showError('Error al cargar la cuenta');
        }
      });
  }

  private loadCards(): void {
    if (!this.selectedAccount) return;

    this.isLoading = true;
    
    const formValue = this.filterForm.value;
    const filter: CardFilter = {
      accountId: this.selectedAccount.id
    };
    
    if (formValue.status) filter.status = formValue.status;
    if (formValue.cardType) filter.cardType = formValue.cardType;

    this.cardService.filterCards(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cards) => {
          // Apply text search if query is provided
          if (formValue.query) {
            const query = formValue.query.toLowerCase();
            this.cards = cards.filter(card => 
              card.cardNumber.toLowerCase().includes(query) ||
              card.cardholderName.toLowerCase().includes(query)
            );
          } else {
            this.cards = cards;
          }
          
          this.isLoading = false;
          this.totalItems = this.cards.length;
        },
        error: (error) => {
          console.error('Error loading cards:', error);
          this.isLoading = false;
          this.notificationService.showError('Error al cargar las tarjetas');
        }
      });
  }

  onAccountSelected(account: Account): void {
    this.selectedAccount = account;
    this.accountService.setSelectedAccount(account);
    this.router.navigate([], { 
      relativeTo: this.route, 
      queryParams: { accountId: account.id },
      queryParamsHandling: 'merge'
    });
    this.loadCards();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCards();
  }

  onSortChange(sort: Sort): void {
    // Update sorting and reload data
    this.loadCards();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 0;
  }

  viewCard(card: Card): void {
    this.cardService.setSelectedCard(card);
    this.router.navigate(['/cards', card.id]);
  }

  editCard(card: Card): void {
    this.cardService.setSelectedCard(card);
    this.router.navigate(['/cards', card.id, 'edit']);
  }

  createCard(): void {
    if (this.selectedAccount) {
      this.router.navigate(['/cards/new'], { 
        queryParams: { accountId: this.selectedAccount.id } 
      });
    }
  }

  activateCard(card: Card): void {
    this.cardService.activateCard(card.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.notificationService.showSuccess('Tarjeta activada exitosamente');
            this.loadCards();
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

  blockCard(card: Card): void {
    this.cardService.blockCard(card.id, 'Bloqueada por el usuario')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.notificationService.showSuccess('Tarjeta bloqueada exitosamente');
            this.loadCards();
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

  unblockCard(card: Card): void {
    this.cardService.unblockCard(card.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.notificationService.showSuccess('Tarjeta desbloqueada exitosamente');
            this.loadCards();
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

  replaceCard(card: Card): void {
    this.cardService.replaceCard(card.id, 'Reemplazo solicitado por el usuario')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.notificationService.showSuccess('Tarjeta reemplazada exitosamente');
            this.loadCards();
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

  viewTransactions(card: Card): void {
    this.router.navigate(['/transactions'], { queryParams: { cardId: card.id } });
  }

  goBackToAccounts(): void {
    this.router.navigate(['/accounts']);
  }

  maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 4) return cardNumber;
    const lastFour = cardNumber.slice(-4);
    const masked = '*'.repeat(cardNumber.length - 4);
    return masked + lastFour;
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
}