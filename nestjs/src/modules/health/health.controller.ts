import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { DrizzleHealthIndicator } from '@health/drizzle.health';
import { AmqpHealthIndicator } from '@health/amqp.health';
import { WebSocketHealthIndicator } from '@health/websocket.health';

/**
 * /health endpoint composing every Terminus health indicator. Each entry
 * contributes one named subsystem to the composite check.
 */
@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: DrizzleHealthIndicator,
    private readonly amqp: AmqpHealthIndicator,
    private readonly ws: WebSocketHealthIndicator,
  ) {}

  @Get('health')
  @HealthCheck()
  @ApiOperation({ summary: 'Verifies database, RabbitMQ, and WebSocket server connectivity' })
  check() {
    return this.health.check([
      () => this.db.isHealthy('database'),
      () => this.amqp.isHealthy('amqp'),
      () => this.ws.isHealthy('websocket'),
    ]);
  }
}
