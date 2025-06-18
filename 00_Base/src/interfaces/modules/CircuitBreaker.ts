export type CircuitBreakerState = 'OPEN' | 'FAILING' | 'CLOSED';

export interface CircuitBreakerOptions {
  maxReconnectDelayMs?: number; // default: 30000
  onStateChange?: (state: CircuitBreakerState, reason?: string) => void;
}
