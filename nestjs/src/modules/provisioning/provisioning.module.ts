import { Module } from '@nestjs/common';
import { AmqpModule } from '@amqp/amqp.module';
import { OcppMessageModule } from '@modules/ocpp-message/ocpp-message.module';
import { ProvisioningModuleService } from '@modules/provisioning/provisioning.module-service';
import { ConfigurationOcppController } from '@modules/provisioning/configuration-ocpp.controller';
import { BootNotificationHandler } from '@modules/provisioning/handlers/boot-notification.handler';
import { BootNotification16Handler } from '@modules/provisioning/handlers/boot-notification-16.handler';
import { HeartbeatHandler } from '@modules/provisioning/handlers/heartbeat.handler';
import { FirmwareStatusNotificationHandler } from '@modules/provisioning/handlers/firmware-status-notification.handler';
import { FirmwareStatusNotification16Handler } from '@modules/provisioning/handlers/firmware-status-notification-16.handler';
import { NotifyDisplayMessagesHandler } from '@modules/provisioning/handlers/notify-display-messages.handler';
import { DataTransferHandler } from '@modules/provisioning/handlers/data-transfer.handler';
import { DataTransfer16Handler } from '@modules/provisioning/handlers/data-transfer-16.handler';
import { SetNetworkProfileResponseHandler } from '@modules/provisioning/response-handlers/set-network-profile.response-handler';
import { ChangeConfiguration16ResponseHandler } from '@modules/provisioning/response-handlers/change-configuration-16.response-handler';
import { SetDisplayMessageResponseHandler } from '@modules/provisioning/response-handlers/set-display-message.response-handler';
import { ClearDisplayMessageResponseHandler } from '@modules/provisioning/response-handlers/clear-display-message.response-handler';
import { BootRepository } from '@repositories/boot.repository';
import { ChargingStationRepository } from '@repositories/charging-station.repository';
import { LocationRepository } from '@repositories/location.repository';
import { EvseRepository } from '@repositories/evse.repository';
import { MessageInfoRepository } from '@repositories/message-info.repository';
import { BootService } from '@modules/provisioning/services/boot.service';
import { BootPendingService } from '@modules/provisioning/services/boot-pending.service';

@Module({
  imports: [AmqpModule, OcppMessageModule],
  providers: [
    ProvisioningModuleService,
    BootNotificationHandler,
    BootNotification16Handler,
    HeartbeatHandler,
    FirmwareStatusNotificationHandler,
    FirmwareStatusNotification16Handler,
    NotifyDisplayMessagesHandler,
    DataTransferHandler,
    DataTransfer16Handler,
    SetNetworkProfileResponseHandler,
    ChangeConfiguration16ResponseHandler,
    SetDisplayMessageResponseHandler,
    ClearDisplayMessageResponseHandler,
    BootRepository,
    ChargingStationRepository,
    LocationRepository,
    EvseRepository,
    MessageInfoRepository,
    BootService,
    BootPendingService,
  ],
  controllers: [ConfigurationOcppController],
  exports: [BootPendingService, BootRepository],
})
/**
 * NestJS DI module wiring the Provisioning surface.
 * Declares the providers, controllers, and re-exports that other modules
 * consume to interact with this domain.
 */
export class ProvisioningModule {}
