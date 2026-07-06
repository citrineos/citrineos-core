// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { IDtoEvent, OcpiConfig } from '../../index.js';
import {
  AbstractDtoModule,
  AsDtoEventHandler,
  DtoEventObjectType,
  DtoEventType,
  OcpiConfigToken,
  OcpiModule,
  RabbitMqDtoReceiver,
  TariffsBroadcaster,
} from '../../index.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { Inject, Service } from 'typedi';
import { TariffsModuleApi } from './module/TariffsModuleApi.js';
import type { TariffDto } from '@citrineos/base';

export { TariffsModuleApi } from './module/TariffsModuleApi.js';
export type { ITariffsModuleApi } from './module/ITariffsModuleApi.js';

@Service()
export class TariffsModule extends AbstractDtoModule implements OcpiModule {
  constructor(
    @Inject(OcpiConfigToken) config: OcpiConfig,
    logger: Logger<ILogObj>,
    readonly tariffsBroadcaster: TariffsBroadcaster,
  ) {
    super(config, new RabbitMqDtoReceiver(config, logger), logger);
  }

  getController(): any {
    return TariffsModuleApi;
  }

  async init(): Promise<void> {
    this._logger.info('Initializing Tariffs Module...');
    await this._receiver.init();
    this._logger.info('Tariffs Module initialized successfully.');
  }

  async shutdown(): Promise<void> {
    this._logger.info('Shutting down Tariffs Module...');
    await super.shutdown();
  }

  @AsDtoEventHandler(DtoEventType.INSERT, DtoEventObjectType.Tariff, 'TariffNotification')
  async handleTariffInsert(event: IDtoEvent<TariffDto>): Promise<void> {
    this._logger.debug(`Handling Tariff Insert: ${JSON.stringify(event)}`);
    const tariffDto = event._payload;
    const tenant = tariffDto.tenant;
    if (!tenant) {
      this._logger.error(
        `Tenant data missing in ${event._context.eventType} notification for ${event._context.objectType} ${tariffDto.id}, cannot broadcast.`,
      );
      return;
    }

    await this.tariffsBroadcaster.broadcastPutTariff(tenant, tariffDto);
  }

  @AsDtoEventHandler(DtoEventType.UPDATE, DtoEventObjectType.Tariff, 'TariffNotification')
  async handleTariffUpdate(event: IDtoEvent<Partial<TariffDto>>): Promise<void> {
    this._logger.debug(`Handling Tariff Update: ${JSON.stringify(event)}`);
    const tariffDto = event._payload;
    const tenant = tariffDto.tenant;
    if (!tenant) {
      this._logger.error(
        `Tenant data missing in ${event._context.eventType} notification for ${event._context.objectType} ${tariffDto.id}, cannot broadcast.`,
      );
      return;
    }

    await this.tariffsBroadcaster.broadcastPutTariff(tenant, tariffDto);
  }

  @AsDtoEventHandler(DtoEventType.DELETE, DtoEventObjectType.Tariff, 'TariffNotification')
  async handleTariffDelete(event: IDtoEvent<TariffDto>): Promise<void> {
    this._logger.debug(`Handling Tariff Delete: ${JSON.stringify(event)}`);
    const tariffDto = event._payload;
    const tenant = tariffDto.tenant;
    if (!tenant) {
      this._logger.error(
        `Tenant data missing in ${event._context.eventType} notification for ${event._context.objectType} ${tariffDto.id}, cannot broadcast.`,
      );
      return;
    }

    await this.tariffsBroadcaster.broadcastTariffDeletion(tenant, tariffDto);
  }
}
