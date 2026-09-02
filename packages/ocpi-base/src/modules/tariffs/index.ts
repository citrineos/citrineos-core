// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { IDtoEvent } from '../../index.js';
import {
  AbstractDtoModule,
  AsDtoEventHandler,
  DtoEventObjectType,
  DtoEventType,
  OcpiModule,
} from '../../index.js';
import type { TariffsBroadcaster } from '../../index.js';
import type { DtoEventReceiverFactory } from '../../index.js';
import type { OcpiConfiguredDependencies } from '../../dependencies.js';
import { TariffsModuleApi } from './module/tariffs-module-api.js';
import type { TariffDto } from '@citrineos/types';

export { TariffsModuleApi } from './module/tariffs-module-api.js';
export type { ITariffsModuleApi } from './module/i-tariffs-module-api.js';

export interface TariffsModuleDependencies extends OcpiConfiguredDependencies {
  dtoEventReceiverFactory: DtoEventReceiverFactory;
  tariffsBroadcaster: TariffsBroadcaster;
}

export class TariffsModule extends AbstractDtoModule implements OcpiModule {
  readonly tariffsBroadcaster: TariffsBroadcaster;

  constructor({
    config,
    logger,
    dtoEventReceiverFactory,
    tariffsBroadcaster,
  }: TariffsModuleDependencies) {
    super(config, dtoEventReceiverFactory(), logger);
    this.tariffsBroadcaster = tariffsBroadcaster;
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
