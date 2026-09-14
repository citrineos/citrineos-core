// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  GetTransactionByIdQueryResult,
  GetTransactionByIdQueryVariables,
  IDtoEvent,
} from '../../index.js';
import {
  AbstractDtoModule,
  AsDtoEventHandler,
  DtoEventObjectType,
  DtoEventType,
  GET_TRANSACTION_BY_ID_QUERY,
  OcpiModule,
} from '../../index.js';
import type { CdrBroadcaster, IOcpiGraphqlClient, SessionBroadcaster } from '../../index.js';
import type { DtoEventReceiverFactory } from '../../index.js';
import type { OcpiConfiguredDependencies } from '../../dependencies.js';
import { SessionsModuleApi } from './module/sessions-module-api.js';
import type { MeterValueDto, TransactionDto } from '@citrineos/types';

export { SessionsModuleApi } from './module/sessions-module-api.js';
export type { ISessionsModuleApi } from './module/i-sessions-module-api.js';

export interface SessionsModuleDependencies extends OcpiConfiguredDependencies {
  dtoEventReceiverFactory: DtoEventReceiverFactory;
  ocpiGraphqlClient: IOcpiGraphqlClient;
  sessionBroadcaster: SessionBroadcaster;
  cdrBroadcaster: CdrBroadcaster;
}

export class SessionsModule extends AbstractDtoModule implements OcpiModule {
  readonly ocpiGraphqlClient: IOcpiGraphqlClient;
  readonly sessionBroadcaster: SessionBroadcaster;
  readonly cdrBroadcaster: CdrBroadcaster;

  constructor({
    config,
    logger,
    dtoEventReceiverFactory,
    ocpiGraphqlClient,
    sessionBroadcaster,
    cdrBroadcaster,
  }: SessionsModuleDependencies) {
    super(config, dtoEventReceiverFactory(), logger);
    this.ocpiGraphqlClient = ocpiGraphqlClient;
    this.sessionBroadcaster = sessionBroadcaster;
    this.cdrBroadcaster = cdrBroadcaster;
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

      if (transactionDto.id === undefined || transactionDto.id === null) {
        this._logger.error(
          `Transaction id missing in ${event._context.eventType} notification for ${event._context.objectType} ${transactionDto.transactionId}, cannot broadcast.`,
        );
        return;
      }

      const fullTransactionDtoResponse = await this.ocpiGraphqlClient.request<
        GetTransactionByIdQueryResult,
        GetTransactionByIdQueryVariables
      >(GET_TRANSACTION_BY_ID_QUERY, {
        id: transactionDto.id,
      });

      if (!fullTransactionDtoResponse.Transactions_by_pk) {
        this._logger.error(
          `Full Transaction DTO not found for id ${transactionDto.id}, cannot broadcast.`,
        );
        return;
      }

      const fullTransactionDto = fullTransactionDtoResponse.Transactions_by_pk as TransactionDto;
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
