import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {
  @Input() icon: string = 'inbox';
  @Input() title: string = 'No hay datos';
  @Input() message: string = 'No se encontraron resultados';
  @Input() actionLabel?: string;
  @Input() type: 'empty' | 'error' | 'search' = 'empty';
  
  @Output() action = new EventEmitter<void>();

  get displayIcon(): string {
    if (this.icon !== 'inbox') return this.icon;
    
    switch (this.type) {
      case 'error':
        return 'error_outline';
      case 'search':
        return 'search_off';
      default:
        return 'inbox';
    }
  }

  onAction(): void {
    this.action.emit();
  }
}
