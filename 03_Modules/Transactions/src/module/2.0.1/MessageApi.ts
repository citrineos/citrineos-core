// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ILogObj, Logger } from 'tslog';
import { ITransactionsModuleApi } from '../interface';
import { TransactionsModule } from '../module';
import {
  AbstractModuleApi,
  AsMessageEndpoint,
  CallAction,
  DEFAULT_TENANT_ID,
  IMessageConfirmation,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import { FastifyInstance } from 'fastify';

/**
 * Server API for the transaction module.
 */
export class TransactionsOcpp201Api
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
    super(transactionModule, server, OCPPVersion.OCPP2_0_1, logger);
  }

  @AsMessageEndpoint(OCPP2_0_1_CallAction.CostUpdated, OCPP2_0_1.CostUpdatedRequestSchema)
  async costUpdated(
    identifier: string[],
    request: OCPP2_0_1.CostUpdatedRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
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
    request: OCPP2_0_1.GetTransactionStatusRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
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
   * Overrides superclass method to generate the URL path based on the input {@link CallAction}
   * and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}.
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction): string {
    const endpointPrefix = this._module.config.modules.transactions.endpointPrefix;
    return super._toMessagePath(input, endpointPrefix);
  }
}
