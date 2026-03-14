import { Component } from '@angular/core';
import type p5Type from 'p5';
import { BaseFullscreenComponent } from '../core/base-fullscreen.component';
import { BackButtonComponent } from '../core/back-button.component';

@Component({
  selector: 'app-neuron',
  standalone: true,
  template: `
    <app-back-button></app-back-button>
    <div class="neuron-container" #visualsContainer></div>
  `,
  styles: [`
    .neuron-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #05050a;
      z-index: -1;
    }
    .neuron-container canvas { display: block; }
  `],
  imports: [BackButtonComponent]
})
export class NeuronComponent extends BaseFullscreenComponent {
  private p5Instance!: p5Type;

  protected async initVisuals() {
    if (typeof window === 'undefined') return;
    const p5Module = await import('p5');
    const p5 = p5Module.default || p5Module;

    const sketch = (p: p5Type) => {

      interface Branch {
        offsetA: number;
        len: number;
        children: Branch[];
        isTerminal: boolean;
      }

      type Point = { x: number; y: number; t: number; angle: number };

      let dendrites: { baseA: number; children: Branch[] }[] = [];
      let axonTerminalsTree: Branch[] = [];
      let axonPoints: Point[] = [];
      let time = 0;

      // Mouse interaction
      let impulse = 0;
      let impulseTravel = 0;

      const generateTree = (depth: number, isTerminalArea: boolean): Branch[] => {
        if (depth <= 0) return [];
        let count = Math.random() > 0.5 ? 3 : 2;
        if (isTerminalArea && depth === 1) count = Math.floor(Math.random() * 3) + 2;
        const branches: Branch[] = [];
        for (let i = 0; i < count; i++) {
          const spread = isTerminalArea ? 0.7 : 1.2;
          branches.push({
            offsetA: (Math.random() - 0.5) * spread,
            len: (20 + Math.random() * 25) * (depth / 3.5),
            children: generateTree(depth - 1, isTerminalArea),
            isTerminal: depth === 1 && isTerminalArea,
          });
        }
        return branches;
      };

      p.setup = () => {
        const el = this.visualsContainer.nativeElement;
        p.createCanvas(el.offsetWidth, el.offsetHeight);
        p.background(0, 5, 10);
        for (let i = 0; i < 7; i++) {
          const angle = p.map(i, 0, 7, -p.PI * 0.3, p.PI * 1.5);
          if (angle > -0.1 && angle < 0.6) continue;
          dendrites.push({ baseA: angle, children: generateTree(4, false) });
        }
        axonTerminalsTree = generateTree(3, true);
      };

      // Returns 0-1 glow intensity for a given axon t position
      const impulseAt = (t: number): number => {
        if (impulse <= 0) return 0;
        return p.max(0, 1 - p.abs(t - impulseTravel) / 0.1) * impulse;
      };

      // Jellyfish-style cyan stroke/fill with optional glow boost
      const setGlowColor = (base: number, glow: number, alpha: number) => {
        const g = glow * 120;
        p.stroke(base + g, 160 + g * 0.5, 255, alpha + glow * 55);
        p.fill(base + g, 160 + g * 0.5, 255, alpha + glow * 55);
      };

      const drawTree = (
        x: number, y: number, baseA: number, branches: Branch[],
        depth: number, pass: number, tOffset: number, glow: number
      ) => {
        for (let i = 0; i < branches.length; i++) {
          const b = branches[i];
          const sway = p.sin(tOffset + depth + time) * (0.06 + glow * 0.12);
          const angle = baseA + b.offsetA + sway;
          const ex = x + p.cos(angle) * b.len;
          const ey = y + p.sin(angle) * b.len;
          const thick = (depth + 1) * 1.5;
          setGlowColor(pass === 0 ? 20 : 80, glow, pass === 0 ? 140 : 180);
          p.strokeWeight(pass === 0 ? thick + 4 : thick);
          p.line(x, y, ex, ey);
          if (b.isTerminal) {
            p.noStroke();
            p.fill(80 + glow * 120, 200 + glow * 55, 255, 180 + glow * 75);
            p.circle(ex, ey, pass === 0 ? 14 + glow * 6 : 10 + glow * 4);
            setGlowColor(pass === 0 ? 20 : 80, glow, pass === 0 ? 140 : 180);
          }
          if (b.children.length > 0) {
            drawTree(ex, ey, angle, b.children, depth - 1, pass, tOffset + i, glow);
          }
        }
      };

      const updateAxonPoints = () => {
        axonPoints = [];
        const steps = 80;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          let bx: number, by: number;
          if (t < 0.4) {
            const nt = t / 0.4;
            bx = p.bezierPoint(0, 110, 150, 150, nt);
            by = p.bezierPoint(0, 20, 30, 110, nt);
          } else {
            const nt = (t - 0.4) / 0.6;
            bx = p.bezierPoint(150, 150, 140, 115, nt);
            by = p.bezierPoint(110, 200, 350, 480, nt);
          }
          axonPoints.push({ x: bx, y: by, t, angle: 0 });
        }
        for (let i = 0; i < axonPoints.length; i++) {
          const prev = i > 0 ? axonPoints[i - 1] : { x: 0, y: 0 };
          const next = i < axonPoints.length - 1 ? axonPoints[i + 1] : axonPoints[i];
          axonPoints[i].angle = p.atan2(next.y - prev.y, next.x - prev.x);
          const sway = p.sin(i * 0.1 - time * 2) * (i / steps) * 12;
          axonPoints[i].x += p.cos(axonPoints[i].angle + p.HALF_PI) * sway;
          axonPoints[i].y += p.sin(axonPoints[i].angle + p.HALF_PI) * sway;
        }
      };

      // Convert screen mouse to sketch space
      const mouseInSketch = () => {
        const scaleVal = p.min(p.width / 600, p.height / 800) * 0.85;
        return {
          x: (p.mouseX - (p.width / 2 - 80 * scaleVal)) / scaleVal,
          y: (p.mouseY - (p.height / 2 - 180 * scaleVal)) / scaleVal,
        };
      };

      const isNearNeuron = () => {
        const m = mouseInSketch();
        return p.dist(m.x, m.y, 0, 0) < 150;
      };

      p.mousePressed = () => {
        if (isNearNeuron()) {
          impulse = 1;
          impulseTravel = 0;
        }
      };

      p.draw = () => {
        time = p.frameCount * 0.02;
        updateAxonPoints();

        // Advance impulse
        if (impulse > 0) {
          impulseTravel += 0.014;
          if (impulseTravel > 1.15) { impulse = 0; impulseTravel = 0; }
        }

        const hover = isNearNeuron() ? 0.3 : 0;

        // Dark ocean fade — same as jellyfish
        p.blendMode(p.BLEND);
        p.noStroke();
        p.fill(0, 5, 12, 120);
        p.rect(0, 0, p.width, p.height);

        p.blendMode(p.SCREEN);

        const scaleVal = p.min(p.width / 600, p.height / 800) * 0.85;
        p.translate(p.width / 2 - 80 * scaleVal, p.height / 2 - 180 * scaleVal);
        p.scale(scaleVal);
        p.strokeJoin(p.ROUND);
        p.strokeCap(p.ROUND);

        // --- DENDRITES + SOMA (2 passes: shadow then fill) ---
        for (let pass = 0; pass <= 1; pass++) {
          const dGlow = hover + (impulseTravel < 0.12 ? impulse * 0.9 : 0);

          for (let i = 0; i < dendrites.length; i++) {
            const d = dendrites[i];
            drawTree(p.cos(d.baseA) * 20, p.sin(d.baseA) * 20, d.baseA, d.children, 4, pass, i * 15, dGlow);
          }

          // Soma
          setGlowColor(pass === 0 ? 20 : 80, dGlow, pass === 0 ? 140 : 160);
          p.strokeWeight(pass === 0 ? 6 : 4);
          p.beginShape();
          for (let a = 0; a <= p.TWO_PI + 0.1; a += 0.1) {
            let r = 45 + p.noise(p.cos(a) * 1.5 + time, p.sin(a) * 1.5 + time) * 10 - 5;
            for (const d of dendrites) {
              let diff = p.abs(a - d.baseA);
              if (diff > p.PI) diff = p.TWO_PI - diff;
              if (diff < 0.3) r += (0.3 - diff) * 60;
            }
            let diffAx = p.abs(a - 0.2);
            if (diffAx > p.PI) diffAx = p.TWO_PI - diffAx;
            if (diffAx < 0.4) r += (0.4 - diffAx) * 100;
            p.vertex(p.cos(a) * r, p.sin(a) * r);
          }
          p.endShape(p.CLOSE);

          // Axon trunk — per-segment glow
          p.noFill();
          for (let i = 0; i < axonPoints.length - 1; i++) {
            const pt = axonPoints[i];
            const g = impulseAt(pt.t) + hover * 0.4;
            p.strokeWeight((pass === 0 ? 14 : 10) + g * 10);
            p.stroke(80 + g * 120, 160 + g * 80, 255, (pass === 0 ? 100 : 160) + g * 95);
            p.line(pt.x, pt.y, axonPoints[i + 1].x, axonPoints[i + 1].y);
          }

          // Axon terminals
          const last = axonPoints[axonPoints.length - 1];
          const tGlow = impulseTravel > 0.88 ? impulse * p.map(impulseTravel, 0.88, 1.1, 0, 1, true) : 0;
          drawTree(last.x, last.y, last.angle, axonTerminalsTree, 3, pass, 100, tGlow + hover * 0.3);
        }

        // --- NUCLEUS ---
        const nGlow = hover + (impulseTravel < 0.1 ? impulse * 0.7 : 0);
        p.fill(200 + nGlow * 55, 240, 255, 200 + nGlow * 55);
        p.stroke(150, 240, 255, 220);
        p.strokeWeight(2);
        p.circle(0, 0, 35 + nGlow * 10);
        p.fill(255, 255, 255, 240);
        p.noStroke();
        p.circle(0, 0, 12 + nGlow * 4);

        // --- MYELIN SHEATHS ---
        p.strokeJoin(p.ROUND);
        const numSheaths = 5;
        for (let s = 0; s < numSheaths; s++) {
          const startIdx = p.floor(p.map(s, 0, numSheaths, 15, 75));
          const endIdx = p.floor(p.map(s + 0.85, 0, numSheaths, 15, 75));
          if (endIdx > axonPoints.length - 1) continue;
          const segs = axonPoints.slice(startIdx, endIdx);
          if (segs.length === 0) continue;

          const midT = segs[p.floor(segs.length / 2)].t;
          const sg = impulseAt(midT) + hover * 0.35;
          p.fill(20 + sg * 60, 80 + sg * 80, 160 + sg * 95, 100 + sg * 80);
          p.stroke(80 + sg * 120, 160 + sg * 80, 255, 160 + sg * 75);
          p.strokeWeight(1.5);

          const sw = 12;
          p.beginShape();
          for (const pt of segs)
            p.vertex(pt.x + p.cos(pt.angle + p.HALF_PI) * sw, pt.y + p.sin(pt.angle + p.HALF_PI) * sw);
          const lf = segs[segs.length - 1];
          p.vertex(lf.x + p.cos(lf.angle) * 8, lf.y + p.sin(lf.angle) * 8);
          for (let i = segs.length - 1; i >= 0; i--)
            p.vertex(segs[i].x + p.cos(segs[i].angle - p.HALF_PI) * sw, segs[i].y + p.sin(segs[i].angle - p.HALF_PI) * sw);
          const ft = segs[0];
          p.vertex(ft.x - p.cos(ft.angle) * 8, ft.y - p.sin(ft.angle) * 8);
          p.endShape(p.CLOSE);

          const mid = segs[p.floor(segs.length / 2)];
          p.fill(80 + sg * 120, 160 + sg * 80, 255, 180);
          p.noStroke();
          p.ellipse(mid.x + p.cos(mid.angle - p.HALF_PI) * 7.5, mid.y + p.sin(mid.angle - p.HALF_PI) * 7.5, 3, 10);
        }

        // --- IMPULSE ARROWS ---
        p.stroke(150, 240, 255, 140);
        p.strokeWeight(1.5);
        p.noFill();
        p.beginShape();
        p.vertex(100, 100);
        (p as any).quadraticVertex(150, 120, 140, 180);
        p.endShape();
        p.push();
        p.translate(140, 180);
        p.rotate(p.atan2(180 - 120, 140 - 150));
        p.fill(150, 240, 255, 160);
        p.noStroke();
        p.triangle(0, 0, -10, -5, -10, 5);
        p.pop();

        p.noFill();
        p.stroke(150, 240, 255, 140);
        p.beginShape();
        p.vertex(130, 390);
        (p as any).quadraticVertex(110, 420, 60, 430);
        p.endShape();
        p.push();
        p.translate(60, 430);
        p.rotate(p.atan2(430 - 420, 60 - 110));
        p.fill(150, 240, 255, 160);
        p.noStroke();
        p.triangle(0, 0, -10, -5, -10, 5);
        p.pop();

        p.textFont('Inter, system-ui, sans-serif');
        p.textStyle(p.ITALIC);
        p.fill(150, 220, 255, 180);
        p.noStroke();
        p.textAlign(p.RIGHT, p.CENTER);
        p.textSize(15);
        p.text('Direction\nof Impulse', 110, 395);

        // --- LABELS ---
        p.textStyle(p.NORMAL);
        const labels = [
          { text: 'Dendrite',         x: 200, y: -180, tx: 20,  ty: -100 },
          { text: 'Nucleus',          x: 300, y: -60,  tx: 5,   ty: 0    },
          { text: 'Cell body',        x: 300, y: -20,  tx: 40,  ty: -30  },
          { text: 'Axon',             x: 300, y: 20,   tx: 80,  ty: 10   },
          { text: 'Myelin\nsheath',   x: 300, y: 160,  tx: 175, ty: 160  },
          { text: 'Node of\nRanvier', x: 300, y: 220,  tx: 162, ty: 205  },
          { text: 'Axon terminal',    x: -10, y: 460,  tx: 85,  ty: 470  },
          { text: 'Synapse',          x: -10, y: 490,  tx: 110, ty: 500  },
        ];
        for (const l of labels) {
          p.stroke(80, 160, 255, 100);
          p.strokeWeight(1);
          p.line(l.x, l.y, l.tx, l.ty);
          p.noStroke();
          p.fill(150, 220, 255, 190);
          p.textSize(14);
          if (l.x < l.tx) {
            p.textAlign(p.RIGHT, p.CENTER);
            p.text(l.text, l.x - 10, l.y);
          } else {
            p.textAlign(p.LEFT, p.CENTER);
            p.text(l.text, l.x + 10, l.y);
          }
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
    if (this.p5Instance) this.p5Instance.remove();
  }
}
