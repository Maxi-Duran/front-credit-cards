import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

export interface LoadingStateConfig {
  message: string;
  submessage?: string;
  showProgress?: boolean;
  progress?: number;
  indeterminate?: boolean;
  icon?: string;
}

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <div class="loading-state-container">
      <!-- Spinner for indeterminate loading -->
      <mat-spinner 
        *ngIf="config.indeterminate !== false" 
        [diameter]="60"
        class="loading-spinner">
      </mat-spinner>

      <!-- Icon for specific loading states -->
      <mat-icon 
        *ngIf="config.icon && config.indeterminate === false" 
        class="loading-icon">
        {{ config.icon }}
      </mat-icon>

      <!-- Loading Messages -->
      <div class="loading-content">
        <h3 class="loading-message">{{ config.message }}</h3>
        <p *ngIf="config.submessage" class="loading-submessage">{{ config.submessage }}</p>
        
        <!-- Progress Bar for determinate loading -->
        <div *ngIf="config.showProgress && config.progress !== undefined" class="progress-container">
          <mat-progress-bar 
            mode="determinate" 
            [value]="config.progress"
            class="progress-bar">
          </mat-progress-bar>
          <span class="progress-text">{{ config.progress }}%</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loading-state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      min-height: 200px;
    }

    .loading-spinner {
      margin-bottom: 24px;
    }

    .loading-icon {
      font-size: 60px;
      width: 60px;
      height: 60px;
      color: #1976d2;
      margin-bottom: 24px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    .loading-content {
      max-width: 400px;
      width: 100%;
    }

    .loading-message {
      margin: 0 0 12px 0;
      font-size: 1.25rem;
      font-weight: 500;
      color: #333;
    }

    .loading-submessage {
      margin: 0 0 24px 0;
      font-size: 1rem;
      color: #666;
      line-height: 1.5;
    }

    .progress-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
    }

    .progress-text {
      font-size: 0.875rem;
      color: #666;
      font-weight: 500;
    }

    /* Responsive Design */
    @media (max-width: 600px) {
      .loading-state-container {
        padding: 32px 16px;
      }

      .loading-message {
        font-size: 1.125rem;
      }

      .loading-submessage {
        font-size: 0.875rem;
      }
    }
  `]
})
export class LoadingStateComponent {
  @Input() config!: LoadingStateConfig;
}