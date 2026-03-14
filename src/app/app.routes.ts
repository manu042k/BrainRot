import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing';
import { OrganismBgComponent } from './organism/organism-bg.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { 
    path: 'organism', 
    component: OrganismBgComponent,
    data: {
      name: 'Organism Background',
      description: 'A dynamic, mathematical p5.js jellyfish simulation that serves as a stunning interactive backdrop.',
      status: 'Ready',
      icon: '🌊'
    }
  },
  { path: '**', redirectTo: '' }
];
