// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  Tariff,
  TariffQuerySchema,
  TariffQueryString,
  TariffSchema,
  TransactionEventQuerySchema,
  TransactionEventQuerystring,
} from '@citrineos/data';
import { ILogObj, Logger } from 'tslog';
import { ITransactionsModuleApi } from './interface';
import { TransactionsModule } from './module';
import {
  AbstractModuleApi,
  AsDataEndpoint,
  AsMessageEndpoint,
  CallAction,
  HttpMethod,
  IMessageConfirmation,
  OCPP2_0_1_Namespace,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
  OCPPVersion,
  OCPP1_6_Namespace,
  Namespace,
} from '@citrineos/base';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { UpsertTariffRequest } from './model/tariffs';
import { plainToInstance } from 'class-transformer';

/**
 * Server API for the transaction module.
 */
export class TransactionsModuleApi
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
    super(transactionModule, server, logger);
  }

  /**
   * Message Endpoint Methods
   */
  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.CostUpdated,
    OCPP2_0_1.CostUpdatedRequestSchema,
  )
  async costUpdated(
    identifier: string[],
    tenantId: string,
    request: OCPP2_0_1.CostUpdatedRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const results = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.CostUpdated,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.GetTransactionStatus,
    OCPP2_0_1.GetTransactionStatusRequestSchema,
  )
  getTransactionStatus(
    identifier: string[],
    tenantId: string,
    request: OCPP2_0_1.GetTransactionStatusRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const results = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.GetTransactionStatus,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  /**
   * Data Endpoint Methods
   */

  @AsDataEndpoint(
    OCPP2_0_1_Namespace.TransactionType,
    HttpMethod.Get,
    TransactionEventQuerySchema,
  )
  getTransactionByStationIdAndTransactionId(
    request: FastifyRequest<{ Querystring: TransactionEventQuerystring }>,
  ): Promise<OCPP2_0_1.TransactionType | undefined> {
    return this._module.transactionEventRepository.readTransactionByStationIdAndTransactionId(
      request.query.stationId,
      request.query.transactionId,
    );
  }


  @AsDataEndpoint(
    OCPP2_0_1_Namespace.Tariff,
    HttpMethod.Put,
    undefined,
    TariffSchema,
  )
  async upsertTariff(
    request: FastifyRequest<{
      Body: any;
    }>,
  ): Promise<Tariff> {
    const tariff = this.buildTariff(
      plainToInstance(UpsertTariffRequest, request.body),
    );
    return await this._module.tariffRepository.upsertTariff(tariff);
  }

  @AsDataEndpoint(OCPP2_0_1_Namespace.Tariff, HttpMethod.Get, TariffQuerySchema)
  getTariffs(
    request: FastifyRequest<{ Querystring: TariffQueryString }>,
  ): Promise<Tariff[]> {
    return this._module.tariffRepository.readAllByQuerystring(request.query);
  }

  @AsDataEndpoint(
    OCPP2_0_1_Namespace.Tariff,
    HttpMethod.Delete,
    TariffQuerySchema,
  )
  deleteTariffs(
    request: FastifyRequest<{ Querystring: TariffQueryString }>,
  ): Promise<string> {
    return this._module.tariffRepository
      .deleteAllByQuerystring(request.query)
      .then(
        (deletedCount: { toString: () => string }) =>
          deletedCount.toString() +
          ' rows successfully deleted from ' +
          OCPP2_0_1_Namespace.Tariff,
      );
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link CallAction}
   * and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}.
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction): string {
    const endpointPrefix =
      this._module.config.modules.transactions.endpointPrefix;
    return super._toMessagePath(input, endpointPrefix);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace}
   * and the module's endpoint prefix configuration.
   *
   * @param {Namespace} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(
    input: OCPP2_0_1_Namespace | OCPP1_6_Namespace | Namespace,
  ): string {
    const endpointPrefix =
      this._module.config.modules.transactions.endpointPrefix;
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
