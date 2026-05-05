import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from '@health/health.controller';
import { AmqpHealthIndicator } from '@health/amqp.health';
import { DrizzleHealthIndicator } from '@health/drizzle.health';
import { WebSocketHealthIndicator } from '@health/websocket.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [AmqpHealthIndicator, DrizzleHealthIndicator, WebSocketHealthIndicator],
  exports: [WebSocketHealthIndicator],
})
/**
 * NestJS DI module wiring the Health surface.
 * Declares the providers, controllers, and re-exports that other modules
 * consume to interact with this domain.
 */
export class HealthModule {}
