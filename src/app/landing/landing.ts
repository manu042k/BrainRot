import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule for *ngFor
import { RouterModule, Router, Route } from '@angular/router';

interface UIComponent {
  name: string;
  description: string;
  status: 'Ready' | 'Planned' | 'In Progress';
  icon: string;
  route: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingComponent {
  public components: UIComponent[] = [];

  constructor(private router: Router) {
    this.components = this.router.config
      // Filter out root, wildcards, and routes without specific component data
      .filter((route: Route) => route.path && route.path !== '**' && route.data?.['name'])
      .map((route: Route) => ({
        name: route.data!['name'],
        description: route.data!['description'],
        status: route.data!['status'],
        icon: route.data!['icon'],
        route: `/${route.path}`
      }));
  }
}
