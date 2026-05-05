import { Module } from '@nestjs/common';
import { AmqpModule } from '@amqp/amqp.module';
import { TransactionsModule } from '@modules/transactions/transactions.module';
import { SmartChargingModuleService } from '@modules/smartcharging/smartcharging.module-service';
import { SmartChargingOcppController } from '@modules/smartcharging/smartcharging-ocpp.controller';
import { NotifyEVChargingNeedsHandler } from '@modules/smartcharging/handlers/notify-ev-charging-needs.handler';
import { ReportChargingProfilesHandler } from '@modules/smartcharging/handlers/report-charging-profiles.handler';
import { NotifyChargingLimitHandler } from '@modules/smartcharging/handlers/notify-charging-limit.handler';
import { NotifyEVChargingScheduleHandler } from '@modules/smartcharging/handlers/notify-ev-charging-schedule.handler';
import { ClearedChargingLimitHandler } from '@modules/smartcharging/handlers/cleared-charging-limit.handler';
import { ChargingNeedsRepository } from '@repositories/charging-needs.repository';
import { SetChargingProfileResponseHandler } from '@modules/smartcharging/response-handlers/set-charging-profile.response-handler';
import { ClearChargingProfileResponseHandler } from '@modules/smartcharging/response-handlers/clear-charging-profile.response-handler';
import { GetCompositeScheduleResponseHandler } from '@modules/smartcharging/response-handlers/get-composite-schedule.response-handler';

// ChargingProfileRepository now lives in the @Global RepositoriesModule;
// no module-level provider needed.

@Module({
  imports: [AmqpModule, TransactionsModule],
  providers: [
    SmartChargingModuleService,
    NotifyEVChargingNeedsHandler,
    ReportChargingProfilesHandler,
    NotifyChargingLimitHandler,
    NotifyEVChargingScheduleHandler,
    ClearedChargingLimitHandler,
    ChargingNeedsRepository,
    SetChargingProfileResponseHandler,
    ClearChargingProfileResponseHandler,
    GetCompositeScheduleResponseHandler,
  ],
  controllers: [SmartChargingOcppController],
})
/**
 * NestJS DI module wiring the Smart Charging surface.
 * Declares the providers, controllers, and re-exports that other modules
 * consume to interact with this domain.
 */
export class SmartChargingModule {}
