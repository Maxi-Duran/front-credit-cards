import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

// I18n Pipes
import { TranslatePipe } from './pipes/translate.pipe';
import { LocaleDatePipe } from './pipes/locale-date.pipe';
import { LocaleNumberPipe } from './pipes/locale-number.pipe';
import { LocaleCurrencyPipe } from './pipes/locale-currency.pipe';

// I18n Components
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher.component';

// Accessibility Directives
import { FocusTrapDirective } from './directives/focus-trap.directive';
import { AutoFocusDirective } from './directives/auto-focus.directive';
import { KeyboardNavDirective } from './directives/keyboard-nav.directive';
import { AriaLabelDirective } from './directives/aria-label.directive';

// Accessibility Components
import { SkipNavComponent } from './components/skip-nav/skip-nav.component';

const ANGULAR_MATERIAL_MODULES = [
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatIconModule,
  MatToolbarModule,
  MatSidenavModule,
  MatListModule,
  MatMenuModule,
  MatDialogModule,
  MatProgressSpinnerModule,
  MatCheckboxModule,
  MatRadioModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatTabsModule,
  MatExpansionModule,
  MatChipsModule,
  MatBadgeModule,
  MatTooltipModule
];

const I18N_PIPES = [
  TranslatePipe,
  LocaleDatePipe,
  LocaleNumberPipe,
  LocaleCurrencyPipe
];

const I18N_COMPONENTS = [
  LanguageSwitcherComponent
];

const A11Y_DIRECTIVES = [
  FocusTrapDirective,
  AutoFocusDirective,
  KeyboardNavDirective,
  AriaLabelDirective
];

const A11Y_COMPONENTS = [
  SkipNavComponent
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ...ANGULAR_MATERIAL_MODULES,
    ...I18N_PIPES,
    ...I18N_COMPONENTS,
    ...A11Y_DIRECTIVES,
    ...A11Y_COMPONENTS
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ...ANGULAR_MATERIAL_MODULES,
    ...I18N_PIPES,
    ...I18N_COMPONENTS,
    ...A11Y_DIRECTIVES,
    ...A11Y_COMPONENTS
  ]
})
export class SharedModule { }