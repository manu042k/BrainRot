import { Component } from '@angular/core';
import type p5Type from 'p5';
import { BaseFullscreenComponent } from '../core/base-fullscreen.component';
import { BackButtonComponent } from '../core/back-button.component';
@Component({
  selector: 'app-organism-bg',
  standalone: true,
  template: `
    <app-back-button></app-back-button>
    <div class="organism-container" #visualsContainer></div>
  `,
  styles: [`
    .organism-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #05050a;
      z-index: -1;
    }
    .organism-container canvas {
      display: block;
    }
  `],
  imports: [BackButtonComponent]
})
export class OrganismBgComponent extends BaseFullscreenComponent {
  private p5Instance!: p5Type;

  protected async initVisuals() {
    if (typeof window === 'undefined') return;
    const p5Module = await import('p5');
    const p5 = p5Module.default || p5Module;

    const sketch = (p: p5Type) => {
      
      // Helper to draw the long mathematically sweeping trace tentacles
      const drawFineTentacle = (angle: number, bWidth: number, bHeight: number, time: number, thrustAmt: number) => {
        // Attachment point on the bell rim
        const startX = p.cos(angle) * (bWidth * 0.95);
        // The base drop matches the bell skirt dipping
        const startY = p.sin(angle) * (20 + thrustAmt * 10);
        
        // Pseudo-random but deterministic factors based on angle
        const uniquePhase = angle * 5;
        const tLen = 350 + p.sin(angle * 14.5) * 150 + p.cos(angle * 3.2) * 50; 
        
        p.beginShape();
        const numPoints = 120; // HIGH detail curve
        for (let i = 0; i <= numPoints; i++) {
          const t = i / numPoints; // 0 to 1
          
          // The sway of the tentacle in the water
          // Slower frequency, larger amplitude towards the tip
          const sway = p.sin(t * p.PI * 3.5 - time * 1.5 + uniquePhase) * 80 * p.pow(t, 1.5);
          
          // A secondary higher frequency ripple
          const ripple = p.cos(t * p.PI * 12 - time * 4 + uniquePhase) * 8 * t;

          // Compression wave moving down the tentacle triggered by thrust
          const travel = p.max(0, p.sin(t * p.PI * 8 - time * 8));
          const comp = travel * 15 * thrustAmt * t;
          
          // Spread tentacles slightly outward from the center
          const spread = p.cos(angle) * 30 * t;

          p.vertex(startX + spread + sway + ripple, startY + i * (tLen / numPoints) - comp);
        }
        p.endShape();
      };

      p.setup = () => {
        const el = this.visualsContainer.nativeElement;
        p.createCanvas(el.offsetWidth, el.offsetHeight);
        p.background(0, 5, 10); // Deep ocean water
      };

      p.draw = () => {
        // Very slight fade for a smooth water illusion, rather than pure clear
        p.blendMode(p.BLEND);
        p.noStroke();
        p.fill(0, 5, 12, 120);
        p.rect(0, 0, p.width, p.height);

        // We use additive blending for the jellyfish's bioluminescence
        p.blendMode(p.SCREEN);

        const time = p.frameCount * 0.02;

        // Pulse generation: Heartbeat characteristic
        // A quick sharp thrust followed by a slow relaxation phase
        const pulsePhase = time * p.TWO_PI * 0.25; // Swimming rhythm
        const thrust = p.max(0, p.sin(pulsePhase)); // 0 to 1 positive only
        const sharpThrust = p.pow(thrust, 4); // Peak isolated for burst
        const relax = p.pow(p.max(0, -p.sin(pulsePhase)), 1.5); // 0 to 1

        // Position: Drifts slowly from left to right, wrapping around the screen. Also bobs up and down rhythmically.
        // We use modular arithmetic so it loops smoothly off the right edge and reappears on the left.
        const speed = 1.2; 
        const driftX = ((p.frameCount * speed) % (p.width + 400)) - 200; // start 200px offscreen left
        const bobY = -sharpThrust * 80 + relax * 40 + p.cos(time * 0.4) * 50;
        
        const jx = driftX;
        const jy = p.height / 2 + bobY - 50; // offset slightly high for tentacles

        // The slight tilt of the jellyfish finding its balance, angled slightly right since it's swimming that way
        const tilt = p.sin(time * 0.3) * 0.15 + 0.15; // Added +0.15 base rotation to tilt it forward

        p.translate(jx, jy);
        p.rotate(tilt);

        // Bell dimensions affected by the heartbeat pulse
        // Thrusting narrows and elongates. Relaxing widens and squashes.
        const bellWidth = 140 - sharpThrust * 25 + relax * 20;
        const bellHeight = 110 + sharpThrust * 35 - relax * 15;

        // --- 1. Draw the back fine tentacles (drawn first to be behind) ---
        p.strokeWeight(1);
        p.stroke(80, 160, 255, 80); // Deep sea blue, faint
        p.noFill();
        const numBackTentacles = 70;
        for (let t = 0; t < numBackTentacles; t++) {
          // distribute along the back arc (top visual half of the 3D rim)
          const a = p.map(t, 0, numBackTentacles - 1, p.PI + 0.2, p.TWO_PI - 0.2);
          drawFineTentacle(a, bellWidth, bellHeight, time, sharpThrust);
        }

        // --- 2. Draw the Bell (Multiple layers for volumetric glow) ---
        p.noStroke();
        const numLayers = 15;
        for (let layer = 0; layer < numLayers; layer++) {
          const ltr = layer / numLayers;
          
          // As layers go inward, they get smaller and more opaque
          const w = bellWidth * (1 - ltr * 0.35);
          const h = bellHeight * (1 - ltr * 0.15);
          
          // Color shifts from deep blue at the edge to cyan/white at the core
          const redAmt = p.map(ltr, 0, 1, 20, 220);
          const greenAmt = p.map(ltr, 0, 1, 80, 255);
          const blueAmt = p.map(ltr, 0, 1, 150, 255);
          const alpha = p.map(ltr, 0, 1, 15, 70); // Low alpha builds up
          
          p.fill(redAmt, greenAmt, blueAmt, alpha);

          p.beginShape();
          // Top dome of the bell (more points for smoothness)
          for (let a = p.PI; a <= p.TWO_PI; a += 0.02) {
            const vx = p.cos(a) * w;
            let vy = p.sin(a) * h;
            // Add a subtle mathematical indent at the very top of the central core
            if (a > p.PI + 0.5 && a < p.TWO_PI - 0.5) {
               vy += p.sin((a - p.PI) * 2 - p.HALF_PI) * (18 * ltr);
            }
            p.vertex(vx, vy);
          }

          // Bottom skirt opening
          for (let a = p.TWO_PI; a >= p.PI; a -= 0.05) {
            const vx = p.cos(a) * w;
            // The base Y drops in the center
            const drop = p.sin(a) * (20 + sharpThrust * 10);
            
            // Ruffled edge effect using high freq sine along the angle
            const ruffleAmplitude = 10 * (1 - ltr) + sharpThrust * 6;
            const ruffle = p.sin(a * 45 + time * 12) * ruffleAmplitude;
            
            p.vertex(vx, drop + ruffle);
          }
          p.endShape(p.CLOSE);
        }

        // --- 3. Draw Internal Gonads (The 4 glowing rings inside) ---
        p.noStroke();
        for (let g = 0; g < 4; g++) {
          const ga = (g / 4) * p.TWO_PI + time * 0.4; // Slowly rotate
          // Positioned inside the upper hollow of the bell
          const gx = p.cos(ga) * (bellWidth * 0.35);
          const gy = -bellHeight * 0.35 + p.sin(ga) * 8;
          
          // Pulsing glow size
          const glowSize = 35 + sharpThrust * 12 + p.sin(time * 3 + g) * 6;
          
          p.fill(200, 240, 255, 80);
          p.ellipse(gx, gy, glowSize + 15, glowSize + 15);
          
          p.fill(255, 255, 255, 180); // Bright core
          // slightly elongated
          p.ellipse(gx, gy, glowSize, glowSize * 0.85);
        }

        // --- 4. Draw Oral Arms (Thick, frilly central tentacles) ---
        p.noFill();
        p.strokeWeight(2.5);
        const numArms = 5;
        for (let arm = 0; arm < numArms; arm++) {
          const phase = (arm / numArms) * p.TWO_PI;
          // Colors shift slightly warmer for the central arms
          p.stroke(180, 220, 255, 120);
          
          p.beginShape();
          const baseArmLen = 180 + sharpThrust * 40; // lengthens intensely on thrust
          
          for (let i = 0; i <= 150; i++) {
            const t = i / 150; // 0 to 1
            
            // Flowing primary wave
            const wave = p.sin(t * p.PI * 5 - time * 3.5 + phase) * 50 * t;
            // Secondary tighter wave
            const wave2 = p.cos(t * p.PI * 15 - time * 5 + phase * 2) * 15 * t;
            // Ruffled frill on the arms (high frequency)
            const frill = p.sin(t * p.PI * 60 - time * 15) * 8 * t;
            
            const ax = p.cos(phase + time * 0.2) * 20 + wave + wave2 + frill;
            const ay = i * (baseArmLen / 150) + p.cos(t * p.PI * 3 - time * 6) * 12 * sharpThrust;
            
            p.vertex(ax, ay);
          }
          p.endShape();
        }

        // --- 5. Draw the front fine tentacles ---
        p.strokeWeight(1.5);
        p.stroke(150, 240, 255, 160); // Brighter cyan for the front
        p.noFill();
        const numFrontTentacles = 60;
        for (let t = 0; t < numFrontTentacles; t++) {
          // distribute along the front half
          const frontA = p.map(t, 0, numFrontTentacles - 1, p.PI + 0.1, p.TWO_PI - 0.1);
          drawFineTentacle(frontA, bellWidth, bellHeight, time, sharpThrust);
        }
      };

      p.windowResized = () => {
        const el = this.visualsContainer.nativeElement;
        p.resizeCanvas(el.offsetWidth, el.offsetHeight);
        p.background(0, 5, 10);
      };
    };

    this.p5Instance = new (p5 as any)(sketch, this.visualsContainer.nativeElement);
  }

  protected destroyVisuals() {
    if (this.p5Instance) {
      this.p5Instance.remove();
    }
  }
}
