import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface EmptyStateConfig {
  icon: string;
  title: string;
  message: string;
  actionText?: string;
  showAction?: boolean;
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="empty-state-container">
      <mat-icon class="empty-icon">{{ config.icon }}</mat-icon>
      <h3 class="empty-title">{{ config.title }}</h3>
      <p class="empty-message">{{ config.message }}</p>
      <button 
        *ngIf="config.showAction && config.actionText" 
        mat-raised-button 
        color="primary" 
        (click)="onAction()">
        <mat-icon *ngIf="actionIcon">{{ actionIcon }}</mat-icon>
        {{ config.actionText }}
      </button>
    </div>
  `,
  styles: [`
    .empty-state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      min-height: 300px;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 24px;
    }

    .empty-title {
      margin: 0 0 16px 0;
      font-size: 1.5rem;
      font-weight: 500;
      color: #666;
    }

    .empty-message {
      margin: 0 0 32px 0;
      font-size: 1rem;
      color: #999;
      max-width: 400px;
      line-height: 1.5;
    }

    button {
      min-width: 160px;
    }

    button mat-icon {
      margin-right: 8px;
    }
  `]
})
export class EmptyStateComponent {
  @Input() config!: EmptyStateConfig;
  @Input() actionIcon?: string;
  @Output() action = new EventEmitter<void>();

  onAction(): void {
    this.action.emit();
  }
}