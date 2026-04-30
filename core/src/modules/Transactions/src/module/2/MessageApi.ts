// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type CallAction,
  type IMessageConfirmation,
  OCPP2_1,
  type OCPP2_request_types,
} from '@citrineos/base';
import {
  AbstractModuleApi,
  AsMessageEndpoint,
  DEFAULT_TENANT_ID,
  getOcpp2Schema,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import { packageGroupCall, validateTariffConditionsTimeFields } from '@util/index.js';
import type { FastifyInstance } from 'fastify';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { ITransactionsModuleApi } from '../interface.js';
import { TransactionsModule } from '../module.js';

const DEFAULT_VERSION = OCPPVersion.OCPP2_0_1;

/**
 * Server API for the transaction module.
 */
export class TransactionsOcpp2Api
  extends AbstractModuleApi<TransactionsModule>
  implements ITransactionsModuleApi
{
  /**
   * Constructor for the class.
   *
   * @param {TransactionsModule} transactionModule - The transaction module.
   * @param {FastifyInstance} server - The server instance.
   * @param {OCPPVersion} version - The OCPP version
   * @param {Logger<ILogObj>} [logger] - Optional logger.
   */
  constructor(
    transactionModule: TransactionsModule,
    server: FastifyInstance,
    version: OCPPVersion = DEFAULT_VERSION,
    logger?: Logger<ILogObj>,
  ) {
    super(transactionModule, server, version, logger);
  }

  @AsMessageEndpoint(OCPP_CallAction.CostUpdated, (instance: TransactionsOcpp2Api) =>
    getOcpp2Schema(
      (instance._ocppVersion ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'CostUpdatedRequestSchema',
    ),
  )
  async costUpdated(
    identifier: string[],
    request: OCPP2_request_types.CostUpdatedRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      this._ocppVersion ?? DEFAULT_VERSION,
      OCPP_CallAction.CostUpdated,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.GetTransactionStatus, (instance: TransactionsOcpp2Api) =>
    getOcpp2Schema(
      (instance._ocppVersion ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'GetTransactionStatusRequestSchema',
    ),
  )
  getTransactionStatus(
    identifier: string[],
    request: OCPP2_request_types.GetTransactionStatusRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      this._ocppVersion ?? DEFAULT_VERSION,
      OCPP_CallAction.GetTransactionStatus,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.SetDefaultTariff, (instance: TransactionsOcpp2Api) =>
    getOcpp2Schema(
      (instance._ocppVersion ?? OCPPVersion.OCPP2_1) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'SetDefaultTariffRequestSchema',
    ),
  )
  async setDefaultTariff(
    identifier: string[],
    request: OCPP2_1.SetDefaultTariffRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const validation = validateTariffConditionsTimeFields(request.tariff);
    if (!validation.isValid) {
      return [{ success: false, payload: validation.errorMessage }];
    }
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      this._ocppVersion ?? OCPPVersion.OCPP2_1,
      OCPP_CallAction.SetDefaultTariff,
      request,
      callbackUrl,
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
    const endpointPrefix = this._module.config.modules.transactions.endpointPrefix;
    return super._toMessagePath(input, endpointPrefix);
  }
}
