import { Inject, Injectable } from '@nestjs/common';
import { AmqpService } from '@amqp/amqp.service';
import {
  CONFIG_LIMITS,
  type ConfigLimits,
  EVDRIVER_MODULE_CONFIG,
} from '@modules/config/config.tokens';
import type { EvDriverModuleConfig } from '@modules/config/config.schema';
import { AbstractOcppModule } from '@ocpp/abstract-ocpp-module';
import { CacheService } from '@cache/cache.service';
import { EventGroup } from '@ocpp/event-group';
import { OcppHandlerRef } from '@ocpp/ocpp-request-handler';
import { CsmsResponseHandlerRef } from '@ocpp/csms-response-handler';
import { AuthorizeHandler } from '@modules/evdriver/handlers/authorize.handler';
import { Authorize16Handler } from '@modules/evdriver/handlers/authorize-16.handler';
import { ReservationStatusUpdateHandler } from '@modules/evdriver/handlers/reservation-status-update.handler';
import { ReserveNowResponseHandler } from '@modules/evdriver/response-handlers/reserve-now.response-handler';
import { CancelReservationResponseHandler } from '@modules/evdriver/response-handlers/cancel-reservation.response-handler';
import { GetLocalListVersionResponseHandler } from '@modules/evdriver/response-handlers/get-local-list-version.response-handler';
import { SendLocalListResponseHandler } from '@modules/evdriver/response-handlers/send-local-list.response-handler';
import { RequestStartTransactionResponseHandler } from '@modules/evdriver/response-handlers/request-start-transaction.response-handler';
import { ClearCacheResponseHandler } from '@modules/evdriver/response-handlers/clear-cache.response-handler';

/**
 * Ev Driver module-service. Subclasses AbstractOcppModule to
 * register this module’s request handlers and CSMS-initiated response
 * handlers with the AMQP routing layer. Maps OCPP (action, version) pairs
 * onto handler instances at boot.
 */
@Injectable()
export class EvDriverModuleService extends AbstractOcppModule {
  protected readonly eventGroup = EventGroup.EVDriver;

  constructor(
    amqp: AmqpService,
    @Inject(EVDRIVER_MODULE_CONFIG) cfg: EvDriverModuleConfig,
    @Inject(CONFIG_LIMITS) limits: ConfigLimits,
    cache: CacheService,
    private readonly authorize: AuthorizeHandler,
    private readonly authorize16: Authorize16Handler,
    private readonly reservationStatusUpdate: ReservationStatusUpdateHandler,
    private readonly reserveNowResponse: ReserveNowResponseHandler,
    private readonly cancelReservationResponse: CancelReservationResponseHandler,
    private readonly getLocalListVersionResponse: GetLocalListVersionResponseHandler,
    private readonly sendLocalListResponse: SendLocalListResponseHandler,
    private readonly requestStartTransactionResponse: RequestStartTransactionResponseHandler,
    private readonly clearCacheResponse: ClearCacheResponseHandler,
  ) {
    super(amqp, cfg, limits, cache);
  }

  protected getHandlers(): OcppHandlerRef[] {
    return [this.authorize, this.authorize16, this.reservationStatusUpdate];
  }

  protected override getResponseHandlers(): CsmsResponseHandlerRef[] {
    return [
      this.reserveNowResponse,
      this.cancelReservationResponse,
      this.getLocalListVersionResponse,
      this.sendLocalListResponse,
      this.requestStartTransactionResponse,
      this.clearCacheResponse,
    ];
  }
}
