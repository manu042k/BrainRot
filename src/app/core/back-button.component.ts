import { Component, ViewEncapsulation } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [RouterModule],
  template: `
    <a routerLink="/" class="back-btn">
      <span class="back-icon">←</span> Back to Gallery
    </a>
  `,
  styles: [`
    .back-btn {
      position: fixed;
      top: 2rem;
      left: 2rem;
      z-index: 100;
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 100px;
      color: white;
      text-decoration: none;
      font-family: 'Outfit', sans-serif;
      font-weight: 400;
      transition: all 0.3s ease;
      cursor: pointer;
    }
    .back-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateX(-4px);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    .back-icon {
      font-size: 1.2rem;
    }
  `],
  encapsulation: ViewEncapsulation.None
})
export class BackButtonComponent {}
