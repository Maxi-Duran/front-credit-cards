import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <div class="dashboard-container">
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
      
      <div class="dashboard-cards">
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>dashboard</mat-icon>
            <mat-card-title>Panel Principal</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Bienvenido al sistema CardDemo modernizado.</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
    }
    
    .dashboard-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }
    
    .dashboard-card {
      max-width: 400px;
    }
  `]
})
export class DashboardComponent {
  title = 'Dashboard';
  description = 'Sistema de gestión de tarjetas de crédito CardDemo';
}