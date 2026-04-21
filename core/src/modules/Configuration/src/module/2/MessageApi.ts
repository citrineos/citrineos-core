// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  AbstractModuleApi,
  AsMessageEndpoint,
  DEFAULT_TENANT_ID,
  getOcpp2Schema,
  OCPP2_request_types,
  OCPP_CallAction,
  OCPPVersion,
  type CallAction,
  type IMessageConfirmation,
  type OCPP2_common_types,
} from '@citrineos/base';
import { SetNetworkProfile } from '@dal/index.js';
import { packageGroupCall, validateLanguageTag } from '@util/index.js';
import type { FastifyInstance } from 'fastify';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { v4 as uuidv4 } from 'uuid';
import type { IConfigurationModuleApi } from '../interface.js';
import { ConfigurationModule } from '../module.js';

enum SetNetworkProfileExtraQuerystrings {
  websocketServerConfigId = 'websocketServerConfigId',
}

const DEFAULT_VERSION = OCPPVersion.OCPP2_0_1;

/**
 * Server API for the Configuration component.
 */
export class ConfigurationOcpp2Api
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
    version: OCPPVersion = DEFAULT_VERSION,
    logger?: Logger<ILogObj>,
  ) {
    super(ConfigurationComponent, server, version, logger);
  }

  @AsMessageEndpoint(
    OCPP_CallAction.SetNetworkProfile,
    (instance: ConfigurationOcpp2Api) =>
      getOcpp2Schema(
        (instance._ocppVersion ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
        'SetNetworkProfileRequestSchema',
      ),
    {
      websocketServerConfigId: { type: 'string' },
    },
  )
  async setNetworkProfile(
    identifier: string[],
    request: OCPP2_request_types.SetNetworkProfileRequest,
    callbackUrl?: string,
    extraQueries?: Record<string, any>,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const correlationId = uuidv4();
    if (extraQueries) {
      const websocketServerConfigId =
        extraQueries[SetNetworkProfileExtraQuerystrings.websocketServerConfigId];
      await Promise.all(
        identifier.map((stationId) =>
          SetNetworkProfile.build({
            stationId,
            tenantId,
            correlationId,
            configurationSlot: request.configurationSlot,
            websocketServerConfigId,
            apn: JSON.stringify(request.connectionData.apn),
            vpn: JSON.stringify(request.connectionData.vpn),
            ...request.connectionData,
          }).save(),
        ),
      );
    }

    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      this._ocppVersion ?? DEFAULT_VERSION,
      OCPP_CallAction.SetNetworkProfile,
      request,
      callbackUrl,
      correlationId,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.ClearDisplayMessage, (instance: ConfigurationOcpp2Api) =>
    getOcpp2Schema(
      (instance._ocppVersion ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'ClearDisplayMessageRequestSchema',
    ),
  )
  clearDisplayMessage(
    identifier: string[],
    request: OCPP2_request_types.ClearDisplayMessageRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      this._ocppVersion ?? DEFAULT_VERSION,
      OCPP_CallAction.ClearDisplayMessage,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.GetDisplayMessages, (instance: ConfigurationOcpp2Api) =>
    getOcpp2Schema(
      (instance._ocppVersion ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'GetDisplayMessagesRequestSchema',
    ),
  )
  getDisplayMessages(
    identifier: string[],
    request: OCPP2_request_types.GetDisplayMessagesRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      this._ocppVersion ?? DEFAULT_VERSION,
      OCPP_CallAction.GetDisplayMessages,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.PublishFirmware, (instance: ConfigurationOcpp2Api) =>
    getOcpp2Schema(
      (instance._ocppVersion ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'PublishFirmwareRequestSchema',
    ),
  )
  publishFirmware(
    identifier: string[],
    request: OCPP2_request_types.PublishFirmwareRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      this._ocppVersion ?? DEFAULT_VERSION,
      OCPP_CallAction.PublishFirmware,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.SetDisplayMessage, (instance: ConfigurationOcpp2Api) =>
    getOcpp2Schema(
      (instance._ocppVersion ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'SetDisplayMessageRequestSchema',
    ),
  )
  async setDisplayMessage(
    identifier: string[],
    request: OCPP2_request_types.SetDisplayMessageRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const messageInfo = request.message as OCPP2_common_types.MessageInfoType;

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

    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      this._ocppVersion ?? DEFAULT_VERSION,
      OCPP_CallAction.SetDisplayMessage,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.UnpublishFirmware, (instance: ConfigurationOcpp2Api) =>
    getOcpp2Schema(
      (instance._ocppVersion ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'UnpublishFirmwareRequestSchema',
    ),
  )
  unpublishFirmware(
    identifier: string[],
    request: OCPP2_request_types.UnpublishFirmwareRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      this._ocppVersion ?? DEFAULT_VERSION,
      OCPP_CallAction.UnpublishFirmware,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.UpdateFirmware, (instance: ConfigurationOcpp2Api) =>
    getOcpp2Schema(
      (instance._ocppVersion ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'UpdateFirmwareRequestSchema',
    ),
  )
  updateFirmware(
    identifier: string[],
    request: OCPP2_request_types.UpdateFirmwareRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      this._ocppVersion ?? DEFAULT_VERSION,
      OCPP_CallAction.UpdateFirmware,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.Reset, (instance: ConfigurationOcpp2Api) =>
    getOcpp2Schema(
      (instance._ocppVersion ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'ResetRequestSchema',
    ),
  )
  reset(
    identifier: string[],
    request: OCPP2_request_types.ResetRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      this._ocppVersion ?? DEFAULT_VERSION,
      OCPP_CallAction.Reset,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.ChangeAvailability, (instance: ConfigurationOcpp2Api) =>
    getOcpp2Schema(
      (instance._ocppVersion ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'ChangeAvailabilityRequestSchema',
    ),
  )
  changeAvailability(
    identifier: string[],
    request: OCPP2_request_types.ChangeAvailabilityRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      this._ocppVersion ?? DEFAULT_VERSION,
      OCPP_CallAction.ChangeAvailability,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.TriggerMessage, (instance: ConfigurationOcpp2Api) =>
    getOcpp2Schema(
      (instance._ocppVersion ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'TriggerMessageRequestSchema',
    ),
  )
  triggerMessage(
    identifier: string[],
    request: OCPP2_request_types.TriggerMessageRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      this._ocppVersion ?? DEFAULT_VERSION,
      OCPP_CallAction.TriggerMessage,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.DataTransfer, (instance: ConfigurationOcpp2Api) =>
    getOcpp2Schema(
      (instance._ocppVersion ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'DataTransferRequestSchema',
    ),
  )
  dataTransfer(
    identifier: string[],
    request: OCPP2_request_types.DataTransferRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        this._ocppVersion ?? DEFAULT_VERSION,
        OCPP_CallAction.DataTransfer,
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
