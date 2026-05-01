// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractModuleApi,
  AsDataEndpoint,
  HttpMethod,
  Namespace,
  OCPP1_6_Namespace,
  OCPP2_Namespace,
} from '@citrineos/base';
import type { TransactionEventQuerystring } from '@dal/interfaces/queries/TransactionEvent.js';
import { TransactionEventQuerySchema } from '@dal/interfaces/queries/TransactionEvent.js';
import { Tariff } from '@dal/layers/sequelize/model/Tariff/index.js';
import { Transaction } from '@dal/layers/sequelize/model/TransactionEvent/index.js';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { ITransactionsModuleApi } from './interface.js';
import { UpsertTariffRequest } from './model/tariffs.js';
import { TransactionsModule } from './module.js';

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

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace}
   * and the module's endpoint prefix configuration.
   *
   * @param {Namespace} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: OCPP2_Namespace | OCPP1_6_Namespace | Namespace): string {
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
      tariffId: request.tariffId,
      validFrom: request.validFrom,
      description: request.description,
      energy: request.energy,
      chargingTime: request.chargingTime,
      idleTime: request.idleTime,
      fixedFee: request.fixedFee,
      reservationTime: request.reservationTime,
      reservationFixed: request.reservationFixed,
      minCost: request.minCost,
      maxCost: request.maxCost,
    });
  }
}
