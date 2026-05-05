import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

/**
 * Terminus health indicator surfaced through the /health endpoint.
 * Returns "up"/"down" plus structured details so operator probes can
 * distinguish between subsystems.
 */
@Injectable()
export class WebSocketHealthIndicator extends HealthIndicator {
  private readonly listeningPorts = new Set<number>();

  setListening(port: number): void {
    this.listeningPorts.add(port);
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const listening = this.listeningPorts.size > 0;
    return this.getStatus(key, listening, {
      ...(listening
        ? { ports: [...this.listeningPorts] }
        : { message: 'WebSocket server not started' }),
    });
  }
}
