// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { FastifyInstance } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IConfigurationModuleApi } from '../interface';
import { ConfigurationModule } from '../module';
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
import { SetNetworkProfile } from '@citrineos/data';
import { validateLanguageTag } from '@citrineos/util';
import { v4 as uuidv4 } from 'uuid';

enum SetNetworkProfileExtraQuerystrings {
  websocketServerConfigId = 'websocketServerConfigId',
}

/**
 * Server API for the Configuration component.
 */
export class ConfigurationOcpp201Api
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
    super(ConfigurationComponent, server, OCPPVersion.OCPP2_0_1, logger);
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.SetNetworkProfile,
    OCPP2_0_1.SetNetworkProfileRequestSchema,
    { websocketServerConfigId: { type: 'string' } },
  )
  async setNetworkProfile(
    identifier: string[],
    request: OCPP2_0_1.SetNetworkProfileRequest,
    callbackUrl?: string,
    extraQueries?: Record<string, any>,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const correlationId = uuidv4();
    if (extraQueries) {
      const websocketServerConfigId =
        extraQueries[SetNetworkProfileExtraQuerystrings.websocketServerConfigId];
      await SetNetworkProfile.build({
        stationId: identifier,
        tenantId,
        correlationId,
        configurationSlot: request.configurationSlot,
        websocketServerConfigId,
        apn: JSON.stringify(request.connectionData.apn),
        vpn: JSON.stringify(request.connectionData.vpn),
        ...request.connectionData,
      }).save();
    }

    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.SetNetworkProfile,
        request,
        callbackUrl,
        correlationId,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.ClearDisplayMessage,
    OCPP2_0_1.ClearDisplayMessageRequestSchema,
  )
  clearDisplayMessage(
    identifier: string[],
    request: OCPP2_0_1.ClearDisplayMessageRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.ClearDisplayMessage,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.GetDisplayMessages,
    OCPP2_0_1.GetDisplayMessagesRequestSchema,
  )
  getDisplayMessages(
    identifier: string[],
    request: OCPP2_0_1.GetDisplayMessagesRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.GetDisplayMessages,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(OCPP2_0_1_CallAction.PublishFirmware, OCPP2_0_1.PublishFirmwareRequestSchema)
  publishFirmware(
    identifier: string[],
    request: OCPP2_0_1.PublishFirmwareRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.PublishFirmware,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.SetDisplayMessage,
    OCPP2_0_1.SetDisplayMessageRequestSchema,
  )
  async setDisplayMessage(
    identifier: string[],
    request: OCPP2_0_1.SetDisplayMessageRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const messageInfo = request.message as OCPP2_0_1.MessageInfoType;

    const languageTag = messageInfo.message.language;
    if (languageTag && !validateLanguageTag(languageTag)) {
      const errorMsg =
        'Language shall be specified as RFC-5646 tags, example: en-US for US English.';
      this._logger.error(errorMsg);
      return [{ success: false, payload: errorMsg }];
    }

    // If omitted, startDateTime defaults to "now".
    if (!messageInfo.startDateTime) {
      messageInfo.startDateTime = new Date().toISOString();
    }

    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.SetDisplayMessage,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.UnpublishFirmware,
    OCPP2_0_1.UnpublishFirmwareRequestSchema,
  )
  unpublishFirmware(
    identifier: string[],
    request: OCPP2_0_1.UnpublishFirmwareRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.UnpublishFirmware,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(OCPP2_0_1_CallAction.UpdateFirmware, OCPP2_0_1.UpdateFirmwareRequestSchema)
  updateFirmware(
    identifier: string[],
    request: OCPP2_0_1.UpdateFirmwareRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.UpdateFirmware,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(OCPP2_0_1_CallAction.Reset, OCPP2_0_1.ResetRequestSchema)
  reset(
    identifier: string[],
    request: OCPP2_0_1.ResetRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.Reset,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.ChangeAvailability,
    OCPP2_0_1.ChangeAvailabilityRequestSchema,
  )
  changeAvailability(
    identifier: string[],
    request: OCPP2_0_1.ChangeAvailabilityRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.ChangeAvailability,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(OCPP2_0_1_CallAction.TriggerMessage, OCPP2_0_1.TriggerMessageRequestSchema)
  triggerMessage(
    identifier: string[],
    request: OCPP2_0_1.TriggerMessageRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.TriggerMessage,
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
    const endpointPrefix = this._module.config.modules.configuration.endpointPrefix;
    return super._toMessagePath(input, endpointPrefix);
  }
}
