import { Inject, Injectable } from '@nestjs/common';
import { AmqpService } from '@amqp/amqp.service';
import {
  CONFIG_LIMITS,
  type ConfigLimits,
  SMARTCHARGING_MODULE_CONFIG,
} from '@modules/config/config.tokens';
import type { SmartChargingModuleConfig } from '@modules/config/config.schema';
import { AbstractOcppModule } from '@ocpp/abstract-ocpp-module';
import { CacheService } from '@cache/cache.service';
import { EventGroup } from '@ocpp/event-group';
import { OcppHandlerRef } from '@ocpp/ocpp-request-handler';
import { CsmsResponseHandlerRef } from '@ocpp/csms-response-handler';
import { NotifyEVChargingNeedsHandler } from '@modules/smartcharging/handlers/notify-ev-charging-needs.handler';
import { ReportChargingProfilesHandler } from '@modules/smartcharging/handlers/report-charging-profiles.handler';
import { NotifyChargingLimitHandler } from '@modules/smartcharging/handlers/notify-charging-limit.handler';
import { NotifyEVChargingScheduleHandler } from '@modules/smartcharging/handlers/notify-ev-charging-schedule.handler';
import { ClearedChargingLimitHandler } from '@modules/smartcharging/handlers/cleared-charging-limit.handler';
import { SetChargingProfileResponseHandler } from '@modules/smartcharging/response-handlers/set-charging-profile.response-handler';
import { ClearChargingProfileResponseHandler } from '@modules/smartcharging/response-handlers/clear-charging-profile.response-handler';
import { GetCompositeScheduleResponseHandler } from '@modules/smartcharging/response-handlers/get-composite-schedule.response-handler';

/**
 * Smart Charging module-service. Subclasses AbstractOcppModule to
 * register this module’s request handlers and CSMS-initiated response
 * handlers with the AMQP routing layer. Maps OCPP (action, version) pairs
 * onto handler instances at boot.
 */
@Injectable()
export class SmartChargingModuleService extends AbstractOcppModule {
  protected readonly eventGroup = EventGroup.SmartCharging;

  constructor(
    amqp: AmqpService,
    @Inject(SMARTCHARGING_MODULE_CONFIG) cfg: SmartChargingModuleConfig,
    @Inject(CONFIG_LIMITS) limits: ConfigLimits,
    cache: CacheService,
    private readonly notifyEVChargingNeeds: NotifyEVChargingNeedsHandler,
    private readonly reportChargingProfiles: ReportChargingProfilesHandler,
    private readonly notifyChargingLimit: NotifyChargingLimitHandler,
    private readonly notifyEVChargingSchedule: NotifyEVChargingScheduleHandler,
    private readonly clearedChargingLimit: ClearedChargingLimitHandler,
    private readonly setChargingProfileResponse: SetChargingProfileResponseHandler,
    private readonly clearChargingProfileResponse: ClearChargingProfileResponseHandler,
    private readonly getCompositeScheduleResponse: GetCompositeScheduleResponseHandler,
  ) {
    super(amqp, cfg, limits, cache);
  }

  protected getHandlers(): OcppHandlerRef[] {
    return [
      this.notifyEVChargingNeeds,
      this.reportChargingProfiles,
      this.notifyChargingLimit,
      this.notifyEVChargingSchedule,
      this.clearedChargingLimit,
    ];
  }

  protected override getResponseHandlers(): CsmsResponseHandlerRef[] {
    return [
      this.setChargingProfileResponse,
      this.clearChargingProfileResponse,
      this.getCompositeScheduleResponse,
    ];
  }
}
