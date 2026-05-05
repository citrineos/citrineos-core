import { Inject, Injectable } from '@nestjs/common';
import { AmqpService } from '@amqp/amqp.service';
import {
  CONFIG_LIMITS,
  type ConfigLimits,
  MONITORING_MODULE_CONFIG,
} from '@modules/config/config.tokens';
import type { MonitoringModuleConfig } from '@modules/config/config.schema';
import { AbstractOcppModule } from '@ocpp/abstract-ocpp-module';
import { CacheService } from '@cache/cache.service';
import { EventGroup } from '@ocpp/event-group';
import { OcppHandlerRef } from '@ocpp/ocpp-request-handler';
import { CsmsResponseHandlerRef } from '@ocpp/csms-response-handler';
import { NotifyEventHandler } from '@modules/monitoring/handlers/notify-event.handler';
import { SetVariablesResponseHandler } from '@modules/monitoring/response-handlers/set-variables.response-handler';
import { GetVariablesResponseHandler } from '@modules/monitoring/response-handlers/get-variables.response-handler';
import { SetVariableMonitoringResponseHandler } from '@modules/monitoring/response-handlers/set-variable-monitoring.response-handler';
import { ClearVariableMonitoringResponseHandler } from '@modules/monitoring/response-handlers/clear-variable-monitoring.response-handler';
import { SetMonitoringBaseResponseHandler } from '@modules/monitoring/response-handlers/set-monitoring-base.response-handler';

/**
 * Monitoring module-service. Subclasses AbstractOcppModule to
 * register this module’s request handlers and CSMS-initiated response
 * handlers with the AMQP routing layer. Maps OCPP (action, version) pairs
 * onto handler instances at boot.
 */
@Injectable()
export class MonitoringModuleService extends AbstractOcppModule {
  protected readonly eventGroup = EventGroup.Monitoring;

  constructor(
    amqp: AmqpService,
    @Inject(MONITORING_MODULE_CONFIG) cfg: MonitoringModuleConfig,
    @Inject(CONFIG_LIMITS) limits: ConfigLimits,
    cache: CacheService,
    private readonly notifyEvent: NotifyEventHandler,
    private readonly setVariablesResponse: SetVariablesResponseHandler,
    private readonly getVariablesResponse: GetVariablesResponseHandler,
    private readonly setVariableMonitoringResponse: SetVariableMonitoringResponseHandler,
    private readonly clearVariableMonitoringResponse: ClearVariableMonitoringResponseHandler,
    private readonly setMonitoringBaseResponse: SetMonitoringBaseResponseHandler,
  ) {
    super(amqp, cfg, limits, cache);
  }

  protected getHandlers(): OcppHandlerRef[] {
    return [this.notifyEvent];
  }

  protected override getResponseHandlers(): CsmsResponseHandlerRef[] {
    return [
      this.setVariablesResponse,
      this.getVariablesResponse,
      this.setVariableMonitoringResponse,
      this.clearVariableMonitoringResponse,
      this.setMonitoringBaseResponse,
    ];
  }
}
