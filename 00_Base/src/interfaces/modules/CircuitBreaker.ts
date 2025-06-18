export type CircuitBreakerState = 'OPEN' | 'FAILING' | 'CLOSED';

export interface CircuitBreakerOptions {
  maxReconnectDelayMs?: number; // default: 30000
  onStateChange?: (state: CircuitBreakerState, reason?: string) => void;
}

export interface ICircuitBreaker {
  readonly state: CircuitBreakerState;
  triggerFailure(reason?: string): void;
  triggerSuccess(): void;
  onStateChange(cb: (state: CircuitBreakerState, reason?: string) => void): void;
  reset(): void;
}
