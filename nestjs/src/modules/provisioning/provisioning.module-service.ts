import { Inject, Injectable } from '@nestjs/common';
import { AmqpService } from '@amqp/amqp.service';
import {
  CONFIG_LIMITS,
  type ConfigLimits,
  CONFIGURATION_MODULE_CONFIG,
} from '@modules/config/config.tokens';
import type { ConfigurationModuleConfig } from '@modules/config/config.schema';
import { AbstractOcppModule } from '@ocpp/abstract-ocpp-module';
import { CacheService } from '@cache/cache.service';
import { EventGroup } from '@ocpp/event-group';
import { OcppHandlerRef } from '@ocpp/ocpp-request-handler';
import { CsmsResponseHandlerRef } from '@ocpp/csms-response-handler';
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

/**
 * Provisioning module-service. Subclasses AbstractOcppModule to
 * register this module’s request handlers and CSMS-initiated response
 * handlers with the AMQP routing layer. Maps OCPP (action, version) pairs
 * onto handler instances at boot.
 */
@Injectable()
export class ProvisioningModuleService extends AbstractOcppModule {
  protected readonly eventGroup = EventGroup.Configuration;

  constructor(
    amqp: AmqpService,
    @Inject(CONFIGURATION_MODULE_CONFIG) cfg: ConfigurationModuleConfig,
    @Inject(CONFIG_LIMITS) limits: ConfigLimits,
    cache: CacheService,
    private readonly bootNotification: BootNotificationHandler,
    private readonly bootNotification16: BootNotification16Handler,
    private readonly heartbeat: HeartbeatHandler,
    private readonly firmwareStatusNotification: FirmwareStatusNotificationHandler,
    private readonly firmwareStatusNotification16: FirmwareStatusNotification16Handler,
    private readonly notifyDisplayMessages: NotifyDisplayMessagesHandler,
    private readonly dataTransfer: DataTransferHandler,
    private readonly dataTransfer16: DataTransfer16Handler,
    private readonly setNetworkProfileResponse: SetNetworkProfileResponseHandler,
    private readonly changeConfiguration16Response: ChangeConfiguration16ResponseHandler,
    private readonly setDisplayMessageResponse: SetDisplayMessageResponseHandler,
    private readonly clearDisplayMessageResponse: ClearDisplayMessageResponseHandler,
  ) {
    super(amqp, cfg, limits, cache);
  }

  protected getHandlers(): OcppHandlerRef[] {
    return [
      this.bootNotification,
      this.bootNotification16,
      this.heartbeat,
      this.firmwareStatusNotification,
      this.firmwareStatusNotification16,
      this.notifyDisplayMessages,
      this.dataTransfer,
      this.dataTransfer16,
    ];
  }

  protected override getResponseHandlers(): CsmsResponseHandlerRef[] {
    return [
      this.setNetworkProfileResponse,
      this.changeConfiguration16Response,
      this.setDisplayMessageResponse,
      this.clearDisplayMessageResponse,
    ];
  }
}
