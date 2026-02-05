import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface ErrorAction {
  label: string;
  action: () => void;
  primary?: boolean;
}

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './error-message.component.html',
  styleUrls: ['./error-message.component.scss']
})
export class ErrorMessageComponent {
  @Input() title: string = 'Error';
  @Input() message: string = '';
  @Input() type: 'error' | 'warning' | 'info' | 'success' = 'error';
  @Input() actions: ErrorAction[] = [];
  @Input() dismissible: boolean = true;
  @Input() icon?: string;
  
  @Output() dismissed = new EventEmitter<void>();

  get displayIcon(): string {
    if (this.icon) return this.icon;
    
    switch (this.type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'check_circle';
      default:
        return 'error';
    }
  }

  get iconColor(): string {
    switch (this.type) {
      case 'error':
        return 'error-icon';
      case 'warning':
        return 'warning-icon';
      case 'info':
        return 'info-icon';
      case 'success':
        return 'success-icon';
      default:
        return 'error-icon';
    }
  }

  onDismiss(): void {
    this.dismissed.emit();
  }

  onActionClick(action: ErrorAction): void {
    action.action();
  }
}
