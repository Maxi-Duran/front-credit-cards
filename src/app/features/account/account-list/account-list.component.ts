import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
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
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { Account, AccountStatus, AccountFilter, SearchCriteria } from '../../../core/models/account.models';
import { AccountService } from '../../../core/services/account.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-account-list',
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
    MatSnackBarModule
  ],
  template: `
    <div class="account-list-container">
      <!-- Header -->
      <div class="header">
        <h1>Gestión de Cuentas</h1>
        <button mat-raised-button color="primary" (click)="createAccount()">
          <mat-icon>add</mat-icon>
          Nueva Cuenta
        </button>
      </div>

      <!-- Search and Filter Card -->
      <mat-card class="filter-card">
        <mat-card-content>
          <form [formGroup]="filterForm" class="filter-form">
            <div class="filter-row">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Buscar cuentas</mat-label>
                <input matInput formControlName="query" placeholder="Número de cuenta, cliente...">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="active">Activa</mat-option>
                  <mat-option value="inactive">Inactiva</mat-option>
                  <mat-option value="closed">Cerrada</mat-option>
                  <mat-option value="suspended">Suspendida</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tipo de Cuenta</mat-label>
                <mat-select formControlName="accountType">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="checking">Corriente</mat-option>
                  <mat-option value="savings">Ahorros</mat-option>
                  <mat-option value="credit">Crédito</mat-option>
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
      <mat-card class="results-card">
        <mat-card-content>
          <!-- Loading Spinner -->
          <div *ngIf="isLoading" class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Cargando cuentas...</p>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading && accounts.length === 0" class="empty-state">
            <mat-icon class="empty-icon">account_balance</mat-icon>
            <h3>No se encontraron cuentas</h3>
            <p>No hay cuentas que coincidan con los criterios de búsqueda.</p>
            <button mat-raised-button color="primary" (click)="clearFilters()">
              Ver todas las cuentas
            </button>
          </div>

          <!-- Accounts Table -->
          <div *ngIf="!isLoading && accounts.length > 0" class="table-container">
            <table mat-table [dataSource]="accounts" matSort (matSortChange)="onSortChange($event)">
              <!-- Account Number Column -->
              <ng-container matColumnDef="accountNumber">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Número de Cuenta</th>
                <td mat-cell *matCellDef="let account">{{ account.accountNumber }}</td>
              </ng-container>

              <!-- Customer ID Column -->
              <ng-container matColumnDef="customerId">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>ID Cliente</th>
                <td mat-cell *matCellDef="let account">{{ account.customerId }}</td>
              </ng-container>

              <!-- Account Type Column -->
              <ng-container matColumnDef="accountType">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Tipo</th>
                <td mat-cell *matCellDef="let account">{{ getAccountTypeLabel(account.accountType) }}</td>
              </ng-container>

              <!-- Balance Column -->
              <ng-container matColumnDef="balance">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Saldo</th>
                <td mat-cell *matCellDef="let account" [class.negative-balance]="account.balance < 0">
                  {{ account.balance | currency:'USD':'symbol':'1.2-2' }}
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Estado</th>
                <td mat-cell *matCellDef="let account">
                  <mat-chip [class]="'status-' + account.status">
                    {{ getStatusLabel(account.status) }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Last Activity Column -->
              <ng-container matColumnDef="lastActivity">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Última Actividad</th>
                <td mat-cell *matCellDef="let account">{{ account.lastActivity | date:'short' }}</td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let account">
                  <button mat-icon-button (click)="viewAccount(account)" matTooltip="Ver detalles">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button (click)="editAccount(account)" matTooltip="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button (click)="viewCards(account)" matTooltip="Ver tarjetas">
                    <mat-icon>credit_card</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                  (click)="viewAccount(row)" 
                  class="clickable-row"></tr>
            </table>

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
    .account-list-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0;
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

    .negative-balance {
      color: #f44336;
      font-weight: 500;
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
      .account-list-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        gap: 16px;
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
export class AccountListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private accountService = inject(AccountService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);

  accounts: Account[] = [];
  displayedColumns: string[] = ['accountNumber', 'customerId', 'accountType', 'balance', 'status', 'lastActivity', 'actions'];
  
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
    accountType: ['']
  });

  ngOnInit(): void {
    this.setupFilterSubscription();
    this.loadAccounts();
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
        this.loadAccounts();
      });
  }

  private loadAccounts(): void {
    this.isLoading = true;
    
    const formValue = this.filterForm.value;
    const filter: AccountFilter = {};
    
    if (formValue.status) filter.status = formValue.status;
    if (formValue.accountType) filter.accountType = formValue.accountType;

    const criteria: SearchCriteria = {
      query: formValue.query || undefined,
      filters: filter,
      sorting: { field: 'accountNumber', direction: 'asc' },
      pagination: { page: this.currentPage + 1, pageSize: this.pageSize }
    };

    this.accountService.searchAccounts(criteria)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (accounts) => {
          this.accounts = accounts;
          this.isLoading = false;
          // Note: In a real implementation, totalItems would come from the API response
          this.totalItems = accounts.length;
        },
        error: (error) => {
          console.error('Error loading accounts:', error);
          this.isLoading = false;
          this.notificationService.showError('Error al cargar las cuentas');
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAccounts();
  }

  onSortChange(sort: Sort): void {
    // Update sorting and reload data
    this.loadAccounts();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 0;
  }

  viewAccount(account: Account): void {
    this.accountService.setSelectedAccount(account);
    this.router.navigate(['/accounts', account.id]);
  }

  editAccount(account: Account): void {
    this.accountService.setSelectedAccount(account);
    this.router.navigate(['/accounts', account.id, 'edit']);
  }

  viewCards(account: Account): void {
    this.router.navigate(['/cards'], { queryParams: { accountId: account.id } });
  }

  createAccount(): void {
    this.router.navigate(['/accounts/new']);
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