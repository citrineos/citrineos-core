import { Module } from '@nestjs/common';
import { AmqpModule } from '@amqp/amqp.module';
import { MonitoringModuleService } from '@modules/monitoring/monitoring.module-service';
import { MonitoringOcppController } from '@modules/monitoring/monitoring-ocpp.controller';
import { NotifyEventHandler } from '@modules/monitoring/handlers/notify-event.handler';
import { EventDataRepository } from '@repositories/event-data.repository';
import { SetVariablesResponseHandler } from '@modules/monitoring/response-handlers/set-variables.response-handler';
import { GetVariablesResponseHandler } from '@modules/monitoring/response-handlers/get-variables.response-handler';
import { SetVariableMonitoringResponseHandler } from '@modules/monitoring/response-handlers/set-variable-monitoring.response-handler';
import { ClearVariableMonitoringResponseHandler } from '@modules/monitoring/response-handlers/clear-variable-monitoring.response-handler';
import { SetMonitoringBaseResponseHandler } from '@modules/monitoring/response-handlers/set-monitoring-base.response-handler';

@Module({
  imports: [AmqpModule],
  providers: [
    MonitoringModuleService,
    NotifyEventHandler,
    EventDataRepository,
    SetVariablesResponseHandler,
    GetVariablesResponseHandler,
    SetVariableMonitoringResponseHandler,
    ClearVariableMonitoringResponseHandler,
    SetMonitoringBaseResponseHandler,
  ],
  controllers: [MonitoringOcppController],
})
/**
 * NestJS DI module wiring the Monitoring surface.
 * Declares the providers, controllers, and re-exports that other modules
 * consume to interact with this domain.
 */
export class MonitoringModule {}
