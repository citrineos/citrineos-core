// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  GetTransactionByTransactionIdQueryResult,
  GetTransactionByTransactionIdQueryVariables,
  IDtoEvent,
  OcpiConfig,
} from '../../index.js';
import {
  AbstractDtoModule,
  AsDtoEventHandler,
  CdrBroadcaster,
  DtoEventObjectType,
  DtoEventType,
  GET_TRANSACTION_BY_TRANSACTION_ID_QUERY,
  OcpiConfigToken,
  OcpiGraphqlClient,
  OcpiModule,
  RabbitMqDtoReceiver,
  SessionBroadcaster,
} from '../../index.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { Inject, Service } from 'typedi';
import { SessionsModuleApi } from './module/SessionsModuleApi.js';
import type { MeterValueDto, TransactionDto } from '@citrineos/base';

export { SessionsModuleApi } from './module/SessionsModuleApi.js';
export type { ISessionsModuleApi } from './module/ISessionsModuleApi.js';

@Service()
export class SessionsModule extends AbstractDtoModule implements OcpiModule {
  constructor(
    @Inject(OcpiConfigToken) config: OcpiConfig,
    logger: Logger<ILogObj>,
    readonly ocpiGraphqlClient: OcpiGraphqlClient,
    readonly sessionBroadcaster: SessionBroadcaster,
    readonly cdrBroadcaster: CdrBroadcaster,
  ) {
    super(config, new RabbitMqDtoReceiver(config, logger), logger);
  }

  getController(): any {
    return SessionsModuleApi;
  }

  async init(): Promise<void> {
    this._logger.info('Initializing Sessions Module...');
    await this._receiver.init();
    this._logger.info('Sessions Module initialized successfully.');
  }

  async shutdown(): Promise<void> {
    this._logger.info('Shutting down Sessions Module...');
    await super.shutdown();
  }

  @AsDtoEventHandler(DtoEventType.INSERT, DtoEventObjectType.Transaction, 'TransactionNotification')
  async handleTransactionInsert(event: IDtoEvent<TransactionDto>): Promise<void> {
    this._logger.debug(`Handling Transaction Insert: ${JSON.stringify(event)}`);
    const transactionDto = event._payload;
    const tenant = transactionDto.tenant;
    if (!tenant) {
      this._logger.error(
        `Tenant data missing in ${event._context.eventType} notification for ${event._context.objectType} ${transactionDto.id}, cannot broadcast.`,
      );
      return;
    }
    await this.sessionBroadcaster.broadcastPutSession(tenant, transactionDto);
  }

  @AsDtoEventHandler(DtoEventType.UPDATE, DtoEventObjectType.Transaction, 'TransactionNotification')
  async handleTransactionUpdate(event: IDtoEvent<Partial<TransactionDto>>): Promise<void> {
    this._logger.debug(`Handling Transaction Update: ${JSON.stringify(event)}`);
    const transactionDto = event._payload;
    const tenant = transactionDto.tenant;
    if (!tenant) {
      this._logger.error(
        `Tenant data missing in ${event._context.eventType} notification for ${event._context.objectType} ${transactionDto.id}, cannot broadcast.`,
      );
      return;
    }
    await this.sessionBroadcaster.broadcastPatchSession(tenant, transactionDto);
    if (transactionDto.isActive === false) {
      this._logger.debug(`Transaction is no longer active: ${event._eventId}`);

      const fullTransactionDtoResponse = await this.ocpiGraphqlClient.request<
        GetTransactionByTransactionIdQueryResult,
        GetTransactionByTransactionIdQueryVariables
      >(GET_TRANSACTION_BY_TRANSACTION_ID_QUERY, {
        transactionId: transactionDto.transactionId!,
      });

      if (!fullTransactionDtoResponse.Transactions[0]) {
        this._logger.error(
          `Full Transaction DTO not found for ID ${transactionDto.transactionId}, cannot broadcast.`,
        );
        return;
      }

      const fullTransactionDto = fullTransactionDtoResponse.Transactions[0] as TransactionDto;
      await this.cdrBroadcaster.broadcastPostCdr(fullTransactionDto);
    }
  }

  @AsDtoEventHandler(DtoEventType.INSERT, DtoEventObjectType.MeterValue, 'MeterValueNotification')
  async handleMeterValueInsert(event: IDtoEvent<MeterValueDto>): Promise<void> {
    this._logger.debug(`Handling Meter Value Insert: ${JSON.stringify(event)}`);
    const meterValueDto = event._payload;
    const tenant = meterValueDto.tenant;
    if (!tenant) {
      this._logger.error(
        `Tenant data missing in ${event._context.eventType} notification for ${event._context.objectType} ${meterValueDto.id}, cannot broadcast.`,
      );
      return;
    }
    if (meterValueDto.transactionDatabaseId) {
      this._logger.debug(
        `Meter Value belongs to Transaction: ${meterValueDto.transactionDatabaseId}`,
      );
      if (!meterValueDto.tariffId) {
        this._logger.error(
          `Tariff ID missing in Meter Value notification for Transaction ${meterValueDto.transactionDatabaseId}, cannot broadcast.`,
        );
        return;
      }

      await this.sessionBroadcaster.broadcastPatchSessionChargingPeriod(tenant, meterValueDto);
    }
  }
}
