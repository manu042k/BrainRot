import { OnInit, OnDestroy, ElementRef, ViewChild, Directive } from '@angular/core';

@Directive()
export abstract class BaseFullscreenComponent implements OnInit, OnDestroy {
  @ViewChild('visualsContainer', { static: true }) visualsContainer!: ElementRef;

  ngOnInit() {
    this.initVisuals();
  }

  ngOnDestroy() {
    this.destroyVisuals();
  }

  /**
   * Abstract method to be implemented by child components to initialize their visual effects.
   */
  protected abstract initVisuals(): void;

  /**
   * Abstract method to be implemented by child components to clean up their visual effects.
   */
  protected abstract destroyVisuals(): void;
}
