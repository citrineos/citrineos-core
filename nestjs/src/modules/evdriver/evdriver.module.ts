import { Module } from '@nestjs/common';
import { AmqpModule } from '@amqp/amqp.module';
import { EvDriverModuleService } from '@modules/evdriver/evdriver.module-service';
import { EvDriverOcppController } from '@modules/evdriver/evdriver-ocpp.controller';
import { AuthorizeHandler } from '@modules/evdriver/handlers/authorize.handler';
import { Authorize16Handler } from '@modules/evdriver/handlers/authorize-16.handler';
import { ReservationStatusUpdateHandler } from '@modules/evdriver/handlers/reservation-status-update.handler';
import { AuthorizationRepository } from '@repositories/authorization.repository';
import { AuthorizationService } from '@modules/evdriver/services/authorization.service';
import { AUTHORIZERS } from '@modules/evdriver/authorizers/authorizer.token';
import { DatabaseAuthorizer } from '@modules/evdriver/authorizers/database.authorizer';
import { EvseRestrictionAuthorizer } from '@modules/evdriver/authorizers/evse-restriction.authorizer';
import { RealTimeAuthorizer } from '@modules/evdriver/authorizers/real-time.authorizer';
import { LocalAuthCacheService } from '@modules/evdriver/services/local-auth-cache.service';
import { LocalAuthListVersionRepository } from '@repositories/local-auth-list-version.repository';
import { ReserveNowResponseHandler } from '@modules/evdriver/response-handlers/reserve-now.response-handler';
import { CancelReservationResponseHandler } from '@modules/evdriver/response-handlers/cancel-reservation.response-handler';
import { GetLocalListVersionResponseHandler } from '@modules/evdriver/response-handlers/get-local-list-version.response-handler';
import { SendLocalListResponseHandler } from '@modules/evdriver/response-handlers/send-local-list.response-handler';
import { RequestStartTransactionResponseHandler } from '@modules/evdriver/response-handlers/request-start-transaction.response-handler';
import { ClearCacheResponseHandler } from '@modules/evdriver/response-handlers/clear-cache.response-handler';

/**
 * Authorizer chain wiring. Order matters:
 *   1. `DatabaseAuthorizer` — DB lookup + cache-expiry check (the head;
 *      every other link refines this decision).
 *   2. `EvseRestrictionAuthorizer` — per-token disallow lists by
 *      stationId prefix.
 *   3. `RealTimeAuthorizer` — POST to upstream URL for tokens with
 *      `realTimeAuthUrl` configured.
 */
const authorizerChainProvider = {
  provide: AUTHORIZERS,
  useFactory: (db: DatabaseAuthorizer, evse: EvseRestrictionAuthorizer, rt: RealTimeAuthorizer) => [
    db,
    evse,
    rt,
  ],
  inject: [DatabaseAuthorizer, EvseRestrictionAuthorizer, RealTimeAuthorizer],
};

@Module({
  imports: [AmqpModule],
  providers: [
    EvDriverModuleService,
    AuthorizeHandler,
    Authorize16Handler,
    ReservationStatusUpdateHandler,
    AuthorizationRepository,
    DatabaseAuthorizer,
    EvseRestrictionAuthorizer,
    RealTimeAuthorizer,
    authorizerChainProvider,
    AuthorizationService,
    LocalAuthCacheService,
    LocalAuthListVersionRepository,
    ReserveNowResponseHandler,
    CancelReservationResponseHandler,
    GetLocalListVersionResponseHandler,
    SendLocalListResponseHandler,
    RequestStartTransactionResponseHandler,
    ClearCacheResponseHandler,
  ],
  controllers: [EvDriverOcppController],
  exports: [AuthorizationService, AuthorizationRepository],
})
/**
 * NestJS DI module wiring the Ev Driver surface.
 * Declares the providers, controllers, and re-exports that other modules
 * consume to interact with this domain.
 */
export class EvDriverModule {}
