export type CircuitBreakerState = 'OPEN' | 'FAILING' | 'CLOSED';

export interface CircuitBreakerOptions {
  maxReconnectDelayMs?: number; // default: 30000
  onStateChange?: (state: CircuitBreakerState, reason?: string) => void;
}

export class CircuitBreaker {
  private _state: CircuitBreakerState = 'OPEN';
  private onStateChangeCbs: Array<(state: CircuitBreakerState, reason?: string) => void> = [];
  private lastReason?: string;

  constructor(options?: CircuitBreakerOptions) {
    if (options?.onStateChange) this.onStateChangeCbs.push(options.onStateChange);
  }

  get state() {
    return this._state;
  }

  triggerFailure(reason?: string) {
    if (this._state === 'CLOSED') return;
    this.lastReason = reason;
    if (this._state === 'OPEN') {
      this._state = 'FAILING';
      this.emitStateChange('FAILING', reason);
    }
  }

  triggerSuccess() {
    if (this._state !== 'OPEN') {
      this._state = 'OPEN';
      this.emitStateChange('OPEN');
    }
  }

  onStateChange(cb: (state: CircuitBreakerState, reason?: string) => void) {
    this.onStateChangeCbs.push(cb);
  }

  reset() {
    this._state = 'OPEN';
    this.emitStateChange('OPEN');
  }

  private emitStateChange(state: CircuitBreakerState, reason?: string) {
    console.log(`[CircuitBreaker] State changed to ${state}${reason ? `: ${reason}` : ''}`);
    for (const cb of this.onStateChangeCbs) cb(state, reason);
  }
}
