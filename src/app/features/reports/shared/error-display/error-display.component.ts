import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';

export interface ErrorDisplayConfig {
  title: string;
  message: string;
  code?: string;
  details?: string;
  timestamp?: Date;
  showRetry?: boolean;
  retryText?: string;
  showDetails?: boolean;
}

@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatExpansionModule
  ],
  template: `
    <mat-card class="error-card">
      <mat-card-content>
        <div class="error-content">
          <div class="error-header">
            <mat-icon class="error-icon">{{ getErrorIcon() }}</mat-icon>
            <div class="error-info">
              <h3 class="error-title">{{ config.title }}</h3>
              <p class="error-message">{{ config.message }}</p>
              <div class="error-meta" *ngIf="config.code || config.timestamp">
                <span *ngIf="config.code" class="error-code">Código: {{ config.code }}</span>
                <span *ngIf="config.timestamp" class="error-timestamp">
                  {{ config.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}
                </span>
              </div>
            </div>
          </div>

          <div class="error-actions" *ngIf="config.showRetry">
            <button mat-raised-button color="primary" (click)="onRetry()">
              <mat-icon>refresh</mat-icon>
              {{ config.retryText || 'Reintentar' }}
            </button>
          </div>
        </div>

        <!-- Error Details Expansion Panel -->
        <mat-expansion-panel *ngIf="config.showDetails && config.details" class="details-panel">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>info</mat-icon>
              Detalles Técnicos
            </mat-panel-title>
          </mat-expansion-panel-header>
          <div class="error-details">
            <pre>{{ config.details }}</pre>
          </div>
        </mat-expansion-panel>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .error-card {
      margin: 16px 0;
      border-left: 4px solid #f44336;
    }

    .error-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .error-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .error-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #f44336;
      flex-shrink: 0;
    }

    .error-info {
      flex: 1;
    }

    .error-title {
      margin: 0 0 8px 0;
      font-size: 1.25rem;
      font-weight: 500;
      color: #f44336;
    }

    .error-message {
      margin: 0 0 12px 0;
      font-size: 1rem;
      color: #666;
      line-height: 1.5;
    }

    .error-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.875rem;
      color: #999;
    }

    .error-code {
      font-family: monospace;
      background-color: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      display: inline-block;
    }

    .error-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-start;
    }

    .details-panel {
      margin-top: 16px;
    }

    .details-panel mat-panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .error-details {
      padding: 16px 0;
    }

    .error-details pre {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      font-size: 0.875rem;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    /* Responsive Design */
    @media (max-width: 600px) {
      .error-header {
        flex-direction: column;
        text-align: center;
      }

      .error-icon {
        align-self: center;
      }

      .error-actions {
        justify-content: center;
      }
    }
  `]
})
export class ErrorDisplayComponent {
  @Input() config!: ErrorDisplayConfig;
  @Output() retry = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }

  getErrorIcon(): string {
    // You could make this configurable based on error type
    return 'error_outline';
  }
}