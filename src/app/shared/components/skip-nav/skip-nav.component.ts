import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skip-nav',
  standalone: true,
  imports: [CommonModule],
  template: `
    <a 
      href="#main-content" 
      class="skip-nav"
      tabindex="0"
      role="navigation"
      aria-label="Skip to main content">
      Skip to main content
    </a>
  `,
  styles: [`
    .skip-nav {
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px 16px;
      text-decoration: none;
      z-index: 10000;
      border-radius: 0 0 4px 0;
      font-weight: 500;
      transition: top 0.2s ease;
    }

    .skip-nav:focus {
      top: 0;
      outline: 2px solid #fff;
      outline-offset: 2px;
    }

    .skip-nav:hover {
      background: #333;
    }
  `]
})
export class SkipNavComponent {}
