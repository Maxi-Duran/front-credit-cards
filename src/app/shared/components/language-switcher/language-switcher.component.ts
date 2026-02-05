import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { I18nService, SupportedLanguage } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    TranslatePipe
  ],
  template: `
    <button 
      mat-icon-button 
      [matMenuTriggerFor]="languageMenu"
      [matTooltip]="'common.language' | translate"
      aria-label="Change language">
      <mat-icon>language</mat-icon>
    </button>

    <mat-menu #languageMenu="matMenu">
      <button 
        mat-menu-item 
        (click)="setLanguage('es')"
        [class.active]="currentLanguage() === 'es'"
        aria-label="Switch to Spanish">
        <mat-icon>{{ currentLanguage() === 'es' ? 'check' : '' }}</mat-icon>
        <span>Español</span>
      </button>
      <button 
        mat-menu-item 
        (click)="setLanguage('en')"
        [class.active]="currentLanguage() === 'en'"
        aria-label="Switch to English">
        <mat-icon>{{ currentLanguage() === 'en' ? 'check' : '' }}</mat-icon>
        <span>English</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    .active {
      background-color: rgba(0, 0, 0, 0.04);
      font-weight: 500;
    }

    mat-icon {
      margin-right: 8px;
    }
  `]
})
export class LanguageSwitcherComponent {
  private i18nService = inject(I18nService);
  
  currentLanguage = this.i18nService.currentLanguage;

  setLanguage(language: SupportedLanguage): void {
    this.i18nService.setLanguage(language);
  }

  toggleLanguage(): void {
    this.i18nService.toggleLanguage();
  }
}
