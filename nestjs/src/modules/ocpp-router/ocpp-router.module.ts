import { Module } from '@nestjs/common';
import { AppConfigModule } from '@modules/config/app-config.module';
import { OcppRouterService } from '@router/ocpp-router.service';
import { BasicAuthService } from '@router/basic-auth.service';
import { HealthModule } from '@health/health.module';
import { OcppMessageModule } from '@modules/ocpp-message/ocpp-message.module';

@Module({
  imports: [AppConfigModule, HealthModule, OcppMessageModule],
  providers: [OcppRouterService, BasicAuthService],
})
/**
 * NestJS DI module wiring the Ocpp Router surface.
 * Declares the providers, controllers, and re-exports that other modules
 * consume to interact with this domain.
 */
export class OcppRouterModule {}
