// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  CreateOrUpdateTariffQuerySchema,
  CreateOrUpdateTariffQueryString,
  Tariff,
  TariffSchema,
  TariffQueryString,
  TariffQuerySchema,
  TransactionEventQuerySchema,
  TransactionEventQuerystring, sequelize,
} from '@citrineos/data';
import { ILogObj, Logger } from 'tslog';
import { ITransactionsModuleApi } from './interface';
import { OcpiTransactionsModule } from './module';
import {
  AbstractModuleApi,
  AsDataEndpoint,
  AsMessageEndpoint,
  CallAction,
  CostUpdatedRequest,
  CostUpdatedRequestSchema,
  GetTransactionStatusRequest,
  GetTransactionStatusRequestSchema,
  HttpMethod,
  IMessageConfirmation,
  Namespace,
  TransactionType,
} from '@citrineos/base';
import { FastifyInstance, FastifyRequest } from 'fastify';
import {AsOcpiEndpoint} from "../../util/as.ocpi.endpoint";
import {CDR} from "../../model/cDR";
import {OcpiResponseUnit} from "../../model/ocpiResponseUnit";

/**
 * Server API for the transaction module.
 */
export class OcpiTransactionsModuleApi
  extends AbstractModuleApi<OcpiTransactionsModule> {
  /**
   * Constructor for the class.
   *
   * @param {TransactionModule} transactionModule - The transaction module.
   * @param {FastifyInstance} server - The server instance.
   * @param {Logger<ILogObj>} [logger] - Optional logger.
   */
  constructor(
    transactionModule: OcpiTransactionsModule,
    server: FastifyInstance,
    logger?: Logger<ILogObj>,
  ) {
    super(transactionModule, server, logger);
  }

  @AsOcpiEndpoint(
      '/ocpi/receiver/2.2/cdrs',
      HttpMethod.Post,
      null,
      CDR,
      null,
      null,
      OcpiResponseUnit,
  )
  async putDeviceModelVariables(
      request: FastifyRequest<{
        Body: CDR;
      }>,
  ): Promise<sequelize.VariableAttribute[]> {
    return new Promise(() => {}); // TODO
  }
}
