// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  TariffQueryString,
  TenantQueryString,
  TransactionEventQuerystring,
} from '@citrineos/data';
import {
  Tariff,
  TariffQuerySchema,
  TariffSchema,
  TenantQuerySchema,
  Transaction,
  TransactionEventQuerySchema,
} from '@citrineos/data';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { ITransactionsModuleApi } from './interface.js';
import { TransactionsModule } from './module.js';
import {
  AbstractModuleApi,
  AsDataEndpoint,
  HttpMethod,
  Namespace,
  OCPP1_6_Namespace,
  OCPP2_0_1_Namespace,
} from '@citrineos/base';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { UpsertTariffRequest } from './model/tariffs.js';
import { plainToInstance } from 'class-transformer';

/**
 * Server API for the transaction module.
 */
export class TransactionsDataApi
  extends AbstractModuleApi<TransactionsModule>
  implements ITransactionsModuleApi
{
  /**
   * Constructor for the class.
   *
   * @param {TransactionsModule} transactionModule - The transaction module.
   * @param {FastifyInstance} server - The server instance.
   * @param {Logger<ILogObj>} [logger] - Optional logger.
   */
  constructor(
    transactionModule: TransactionsModule,
    server: FastifyInstance,
    logger?: Logger<ILogObj>,
  ) {
    super(transactionModule, server, null, logger);
  }

  @AsDataEndpoint(Namespace.TransactionType, HttpMethod.Get, TransactionEventQuerySchema)
  getTransactionByStationIdAndTransactionId(
    request: FastifyRequest<{ Querystring: TransactionEventQuerystring }>,
  ): Promise<Transaction | undefined> {
    return this._module.transactionEventRepository.readTransactionByStationIdAndTransactionId(
      request.query.tenantId,
      request.query.stationId,
      request.query.transactionId,
    );
  }

  @AsDataEndpoint(OCPP2_0_1_Namespace.Tariff, HttpMethod.Put, TenantQuerySchema, TariffSchema)
  async upsertTariff(
    request: FastifyRequest<{
      Body: any;
      Querystring: TenantQueryString;
    }>,
  ): Promise<Tariff> {
    const tariff = this.buildTariff(plainToInstance(UpsertTariffRequest, request.body));
    return await this._module.tariffRepository.upsertTariff(request.query.tenantId, tariff);
  }

  @AsDataEndpoint(OCPP2_0_1_Namespace.Tariff, HttpMethod.Get, TariffQuerySchema)
  getTariffs(request: FastifyRequest<{ Querystring: TariffQueryString }>): Promise<Tariff[]> {
    return this._module.tariffRepository.readAllByQuerystring(
      request.query.tenantId,
      request.query,
    );
  }

  @AsDataEndpoint(OCPP2_0_1_Namespace.Tariff, HttpMethod.Delete, TariffQuerySchema)
  deleteTariffs(request: FastifyRequest<{ Querystring: TariffQueryString }>): Promise<string> {
    return this._module.tariffRepository
      .deleteAllByQuerystring(request.query.tenantId, request.query)
      .then(
        (deletedCount: { toString: () => string }) =>
          deletedCount.toString() + ' rows successfully deleted from ' + OCPP2_0_1_Namespace.Tariff,
      );
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace}
   * and the module's endpoint prefix configuration.
   *
   * @param {Namespace} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: OCPP2_0_1_Namespace | OCPP1_6_Namespace | Namespace): string {
    const endpointPrefix = this._module.config.modules.transactions.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }

  // TODO: move to service layer
  private buildTariff(request: UpsertTariffRequest): Tariff {
    return Tariff.newInstance({
      id: request.id,
      currency: request.currency,
      pricePerKwh: request.pricePerKwh,
      pricePerMin: request.pricePerMin,
      pricePerSession: request.pricePerSession,
      taxRate: request.taxRate,
      authorizationAmount: request.authorizationAmount,
      paymentFee: request.paymentFee,
    });
  }
}
