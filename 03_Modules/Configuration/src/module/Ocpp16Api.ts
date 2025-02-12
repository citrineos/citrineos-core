// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { FastifyInstance } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IConfigurationModuleApi } from './interface';
import { ConfigurationModule } from './module';
import {
  AbstractModuleApi,
  AsMessageEndpoint,
  CallAction,
  IMessageConfirmation,
  OCPP1_6,
  OCPP1_6_CallAction, OCPP2_0_1, OCPP2_0_1_CallAction,
  OCPPVersion,
} from '@citrineos/base';

/**
 * Server API for the Configuration component.
 */
export class ConfigurationOcpp16Api
  extends AbstractModuleApi<ConfigurationModule>
  implements IConfigurationModuleApi
{
  /**
   * Constructor for the class.
   *
   * @param {ConfigurationModule} ConfigurationComponent - The Configuration component.
   * @param {FastifyInstance} server - The server instance.
   * @param {Logger<ILogObj>} [logger] - Optional logger instance.
   */
  constructor(
    ConfigurationComponent: ConfigurationModule,
    server: FastifyInstance,
    logger?: Logger<ILogObj>,
  ) {
    super(ConfigurationComponent, server, OCPPVersion.OCPP1_6,logger);
  }

  @AsMessageEndpoint(
    OCPP1_6_CallAction.TriggerMessage,
    OCPP1_6.TriggerMessageRequestSchema,
  )
  async triggerMessage(
    identifier: string,
    tenantId: string,
    request: OCPP1_6.TriggerMessageRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    const connectorId = request.connectorId;
    if (connectorId && connectorId <= 0) {
      const errorMsg: string =
        `connectorId should be either omitted or greater than 0.`;
      this._logger.error(errorMsg);
      return { success: false, payload: errorMsg };
    }

    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP1_6,
      OCPP1_6_CallAction.TriggerMessage,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
      OCPP1_6_CallAction.ChangeAvailability,
      OCPP1_6.ChangeAvailabilityRequestSchema,
  )
  changeAvailability(
      identifier: string[],
      tenantId: string,
      request: OCPP1_6.ChangeAvailabilityRequest,
      callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
        this._module.sendCall(
            id,
            tenantId,
            OCPPVersion.OCPP1_6,
            OCPP1_6_CallAction.ChangeAvailability,
            request,
            callbackUrl,
        ),
    );
    return Promise.all(results);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}.
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction): string {
    const endpointPrefix =
      this._module.config.modules.configuration.endpointPrefix;
    return super._toMessagePath(input, endpointPrefix);
  }
}
