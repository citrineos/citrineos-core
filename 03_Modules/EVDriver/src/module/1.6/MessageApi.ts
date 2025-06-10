// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { FastifyInstance } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IEVDriverModuleApi } from '../interface';
import { EVDriverModule } from '../module';
import {
  AbstractModuleApi,
  AsMessageEndpoint,
  CallAction,
  DEFAULT_TENANT_ID,
  IMessageConfirmation,
  OCPP1_6,
  OCPP1_6_CallAction,
  OCPPVersion,
} from '@citrineos/base';

export class EVDriverOcpp16Api
  extends AbstractModuleApi<EVDriverModule>
  implements IEVDriverModuleApi
{
  /**
   * Constructs a new instance of the class.
   *
   * @param {EVDriverModule} evDriverModule - The EVDriver module.
   * @param {FastifyInstance} server - The Fastify server instance.
   * @param {Logger<ILogObj>} [logger] - The logger for logging.
   */
  constructor(evDriverModule: EVDriverModule, server: FastifyInstance, logger?: Logger<ILogObj>) {
    super(evDriverModule, server, OCPPVersion.OCPP1_6, logger);
  }

  @AsMessageEndpoint(
    OCPP1_6_CallAction.RemoteStartTransaction,
    OCPP1_6.RemoteStartTransactionRequestSchema,
  )
  async remoteStartTransaction(
    identifier: string[],
    request: OCPP1_6.RemoteStartTransactionRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP1_6_CallAction.RemoteStartTransaction,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    OCPP1_6_CallAction.RemoteStopTransaction,
    OCPP1_6.RemoteStopTransactionRequestSchema,
  )
  async remoteStopTransaction(
    identifier: string[],
    request: OCPP1_6.RemoteStopTransactionRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP1_6_CallAction.RemoteStopTransaction,
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
    const endpointPrefix = this._module.config.modules.evdriver.endpointPrefix;
    return super._toMessagePath(input, endpointPrefix);
  }
}
