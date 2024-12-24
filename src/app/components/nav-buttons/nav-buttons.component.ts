import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-nav-buttons',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="nav-buttons" *ngIf="!isHome">
      <button class="nav-btn" (click)="goBack()">
        <i class="fas fa-chevron-left"></i>
      </button>
    </div>
  `,
  styles: [`
    :host {
      --button-bg: transparent;
      --button-color: var(--text-color);
      --button-border: var(--border-color);
    }

    .nav-buttons {
      position: fixed;
      top: 20px;
      left: 20px;
      display: flex;
      gap: 10px;
      z-index: 1000;
    }

    .nav-btn {
      width: 35px;
      height: 35px;
      border-radius: 50%;
      border: 1px solid var(--button-border);
      background: var(--button-bg);
      color: var(--button-color);
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(128,128,128,0.1);
      }

      &:active {
        transform: scale(0.95);
      }
    }

    @media (max-width: 768px) {
      .nav-buttons {
        top: 15px;
        left: 15px;
      }
    }
  `]
})
export class NavButtonsComponent {
  get isHome(): boolean {
    return this.router.url === '/' || this.router.url === '';
  }

  constructor(
    private location: Location,
    private router: Router
  ) {}

  goBack(): void {
    this.location.back();
  }
} 