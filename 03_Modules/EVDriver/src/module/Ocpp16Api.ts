// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { FastifyInstance } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IEVDriverModuleApi } from './interface';
import { EVDriverModule } from './module';
import {
  AbstractModuleApi,
  AsMessageEndpoint,
  CallAction,
  IMessageConfirmation,
  OCPP1_6,
  OCPP1_6_CallAction,
  OCPPVersion,
} from '@citrineos/base';

/**
 * Server API for the provisioning component.
 */
export class EVDriverModuleApi
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
  constructor(
    evDriverModule: EVDriverModule,
    server: FastifyInstance,
    logger?: Logger<ILogObj>,
  ) {
    super(evDriverModule, server, logger);
  }

  @AsMessageEndpoint(
    OCPP1_6_CallAction.RemoteStopTransaction,
    OCPP1_6.RemoteStopTransactionRequestSchema,
  )
  async requestRemoteStopTransaction(
    identifier: string,
    tenantId: string,
    request: OCPP1_6.RemoteStopTransactionRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP1_6,
      OCPP1_6_CallAction.RemoteStopTransaction,
      request,
      callbackUrl,
    );
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link CallAction},
   * the module's endpoint prefix configuration and the OCPP version.
   *
   * @param {CallAction} input - The input {@link CallAction}
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction): string {
    const endpointPrefix = this._module.config.modules.evdriver.endpointPrefix;
    return super._toMessagePath(input, endpointPrefix, OCPPVersion.OCPP1_6);
  }
}
