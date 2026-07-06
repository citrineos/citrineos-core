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
   * @param {TransactionsModule} transactionsModule - The transaction module.
   * @param {FastifyInstance} server - The server instance.
   * @param {Logger<ILogObj>} [logger] - Optional logger.
   */
  constructor({
    transactionsModule,
    server,
    logger,
  }: {
    transactionsModule: TransactionsModule;
    server: FastifyInstance;
    logger?: Logger<ILogObj>;
  }) {
    super(transactionsModule, server, logger);
  }

  /**
   * This API serves both OCPP 2.0.1 and 2.1 from a single instance; each
   * message endpoint is registered once per version with the version threaded
   * into schema selection, the route path, and the handler.
   */
  protected get supportedVersions(): OCPPVersion[] {
    return [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1];
  }

  @AsMessageEndpoint(OCPP_CallAction.CostUpdated, (_instance: TransactionsOcpp2Api, version) =>
    getOcpp2Schema(
      (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'CostUpdatedRequestSchema',
    ),
  )
  async costUpdated(
    identifier: string[],
    request: OCPP2_request_types.CostUpdatedRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      version ?? DEFAULT_VERSION,
      OCPP_CallAction.CostUpdated,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    OCPP_CallAction.GetTransactionStatus,
    (_instance: TransactionsOcpp2Api, version) =>
      getOcpp2Schema(
        (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
        'GetTransactionStatusRequestSchema',
      ),
  )
  getTransactionStatus(
    identifier: string[],
    request: OCPP2_request_types.GetTransactionStatusRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      version ?? DEFAULT_VERSION,
      OCPP_CallAction.GetTransactionStatus,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.SetDefaultTariff, (_instance: TransactionsOcpp2Api, version) =>
    getOcpp2Schema(
      (version ?? OCPPVersion.OCPP2_1) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'SetDefaultTariffRequestSchema',
    ),
  )
  async setDefaultTariff(
    identifier: string[],
    request: OCPP2_1.SetDefaultTariffRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    const validation = validateTariffConditionsTimeFields(request.tariff);
    if (!validation.isValid) {
      return [{ success: false, payload: validation.errorMessage }];
    }
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      version ?? OCPPVersion.OCPP2_1,
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
  protected _toMessagePath(input: CallAction, version?: OCPPVersion | null): string {
    const endpointPrefix = this._module.config.modules.transactions.endpointPrefix;
    return super._toMessagePath(input, version, endpointPrefix);
  }
}
