export interface MouseMoveEventData {
  x: number;
  y: number;
  time: number;
}

export interface ClickEventData {
  x: number;
  y: number;
  time: number;
}

class FrustrationDetector {
  private mouseMoves: MouseMoveEventData[] = [];
  private clicks: ClickEventData[] = [];
  private lastVector: { x: number; y: number } | null = null;
  private directionChanges: number[] = []; // Timestamps of direction changes
  private active = false;
  private onFrustrationDetected: () => void = () => {};

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupListeners();
    }
  }

  public start(callback: () => void) {
    this.onFrustrationDetected = callback;
    this.active = true;
    this.mouseMoves = [];
    this.clicks = [];
    this.directionChanges = [];
    this.lastVector = null;
  }

  public stop() {
    this.active = false;
  }

  private setupListeners() {
    window.addEventListener('pointermove', (e) => {
      if (!this.active) return;
      this.handlePointerMove(e.clientX, e.clientY);
    });

    window.addEventListener('click', (e) => {
      if (!this.active) return;
      this.handleClick(e.clientX, e.clientY);
    });
  }

  private handlePointerMove(x: number, y: number) {
    const now = performance.now();
    const currentEvent: MouseMoveEventData = { x, y, time: now };

    if (this.mouseMoves.length > 0) {
      const prev = this.mouseMoves[this.mouseMoves.length - 1];
      const dx = x - prev.x;
      const dy = y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Only track movements of significant distance to ignore micro-jitter
      if (dist > 15) {
        const currentVector = { x: dx / dist, y: dy / dist };

        if (this.lastVector) {
          // Dot product to check angle of direction change
          const dot = currentVector.x * this.lastVector.x + currentVector.y * this.lastVector.y;
          // If dot product < 0.3, it's a sharp direction change (approx > 70 deg)
          if (dot < 0.3) {
            this.directionChanges.push(now);
          }
        }
        this.lastVector = currentVector;
        this.mouseMoves.push(currentEvent);
      }
    } else {
      this.mouseMoves.push(currentEvent);
    }

    // Clean up window: keep only last 1.5 seconds (1500ms)
    const threshold = now - 1500;
    this.mouseMoves = this.mouseMoves.filter((m) => m.time >= threshold);
    this.directionChanges = this.directionChanges.filter((t) => t >= threshold);

    if (this.directionChanges.length >= 8) {
      this.triggerFrustration();
    }
  }

  private handleClick(x: number, y: number) {
    const now = performance.now();
    this.clicks.push({ x, y, time: now });

    // Clean up: keep only last 1.0 seconds (1000ms)
    const threshold = now - 1000;
    this.clicks = this.clicks.filter((c) => c.time >= threshold);

    // Check if there are 3+ clicks within 1 second in a close vicinity
    if (this.clicks.length >= 3) {
      const first = this.clicks[this.clicks.length - 3];
      const second = this.clicks[this.clicks.length - 2];
      const third = this.clicks[this.clicks.length - 1];

      const d1 = Math.sqrt(Math.pow(third.x - first.x, 2) + Math.pow(third.y - first.y, 2));
      const d2 = Math.sqrt(Math.pow(third.x - second.x, 2) + Math.pow(third.y - second.y, 2));

      // If clicked 3 times within 25px radius in 1 second, it's a rage click
      if (d1 < 25 && d2 < 25) {
        this.triggerFrustration();
      }
    }
  }

  private triggerFrustration() {
    this.mouseMoves = [];
    this.clicks = [];
    this.directionChanges = [];
    this.lastVector = null;
    this.onFrustrationDetected();
    
    // Dispatch a global event as well
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vish-frustration-detected'));
    }
  }
}

export const frustrationDetector = new FrustrationDetector();
