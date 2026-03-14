import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OrganismBgComponent } from './organism-bg.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, OrganismBgComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('brain-rot');
}
