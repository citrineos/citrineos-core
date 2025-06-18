import {
  CircuitBreakerState,
  CircuitBreakerOptions,
  ICircuitBreaker,
} from '../interfaces/modules/CircuitBreaker';

export class CircuitBreaker implements ICircuitBreaker {
  private _state: CircuitBreakerState = 'OPEN';
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private timer: NodeJS.Timeout | null = null;
  private onStateChangeCbs: Array<(state: CircuitBreakerState, reason?: string) => void> = [];
  private lastReason?: string;

  constructor(options?: CircuitBreakerOptions) {
    if (options?.maxReconnectDelayMs) this.maxReconnectDelay = options.maxReconnectDelayMs;
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
      this.scheduleReconnect();
    }
  }

  triggerSuccess() {
    if (this._state !== 'OPEN') {
      this._state = 'OPEN';
      this.reconnectDelay = 1000;
      this.emitStateChange('OPEN');
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
    }
  }

  onStateChange(cb: (state: CircuitBreakerState, reason?: string) => void) {
    this.onStateChangeCbs.push(cb);
  }

  reset() {
    this._state = 'OPEN';
    this.reconnectDelay = 1000;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.emitStateChange('OPEN');
  }

  private scheduleReconnect() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (this.reconnectDelay < this.maxReconnectDelay) {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      } else {
        this._state = 'CLOSED';
        this.emitStateChange('CLOSED', this.lastReason);
        return;
      }
      // Try reconnect logic should be handled by the module, not here.
      this.emitStateChange('FAILING', this.lastReason);
      this.scheduleReconnect();
    }, this.reconnectDelay);
  }

  private emitStateChange(state: CircuitBreakerState, reason?: string) {
    for (const cb of this.onStateChangeCbs) cb(state, reason);
  }
}
