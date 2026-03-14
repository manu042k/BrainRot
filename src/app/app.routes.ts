import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing';
import { JellyfishComponent } from './jellyfish/jellyfish.component';
import { NeuronComponent } from './neuron/neuron.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { 
    path: 'organism', 
    component: JellyfishComponent,
    data: {
      name: 'Organism Background',
      description: 'A dynamic, mathematical p5.js jellyfish simulation that serves as a stunning interactive backdrop.',
      status: 'Ready',
      icon: '🌊'
    }
  },
  { 
    path: 'neuron', 
    component: NeuronComponent,
    data: {
      name: 'Neural Network Cell',
      description: 'A mathematical single neuron visualization using generative recursive L-systems and action potentials.',
      status: 'Ready',
      icon: '🧠'
    }
  },
  { path: '**', redirectTo: '' }
];
