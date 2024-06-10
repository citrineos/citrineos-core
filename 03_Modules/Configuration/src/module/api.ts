// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IConfigurationModuleApi } from './interface';
import { ConfigurationModule } from './module';
import {
  AbstractModuleApi,
  AsDataEndpoint,
  AsMessageEndpoint,
  AttributeEnumType,
  BootConfig,
  BootConfigSchema,
  BootNotificationResponse,
  CallAction,
  ChangeAvailabilityRequest,
  ChangeAvailabilityRequestSchema,
  ClearDisplayMessageRequest,
  ClearDisplayMessageRequestSchema,
  DataEnumType,
  GetDisplayMessagesRequest,
  GetDisplayMessagesRequestSchema,
  HttpMethod,
  IMessageConfirmation,
  MessageInfoType,
  MutabilityEnumType,
  Namespace,
  PublishFirmwareRequest,
  PublishFirmwareRequestSchema,
  ResetRequest,
  ResetRequestSchema,
  SetDisplayMessageRequest,
  SetDisplayMessageRequestSchema,
  SetNetworkProfileRequest,
  SetNetworkProfileRequestSchema,
  SetVariableDataType,
  SetVariablesRequest,
  SetVariablesResponse,
  SetVariableStatusEnumType,
  TriggerMessageRequest,
  TriggerMessageRequestSchema,
  UnpublishFirmwareRequest,
  UnpublishFirmwareRequestSchema,
  UpdateChargingStationPasswordRequest,
  UpdateChargingStationPasswordSchema,
  UpdateFirmwareRequest,
  UpdateFirmwareRequestSchema,
} from '@citrineos/base';
import {
  Boot,
  ChargingStationKeyQuerySchema,
  ChargingStationKeyQuerystring,
  Component,
  UpdateChargingStationPasswordQuerySchema,
  UpdateChargingStationPasswordQueryString,
  Variable,
  VariableAttribute,
} from '@citrineos/data';
import {generatePassword, isValidPassword, validateLanguageTag} from '@citrineos/util';
import {v4 as uuidv4} from 'uuid';

/**
 * Server API for the Configuration component.
 */
export class ConfigurationModuleApi
  extends AbstractModuleApi<ConfigurationModule>
  implements IConfigurationModuleApi {
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
    super(ConfigurationComponent, server, logger);
  }

  /**
   * Message Endpoint Methods
   */

  @AsMessageEndpoint(
    CallAction.SetNetworkProfile,
    SetNetworkProfileRequestSchema,
  )
  setNetworkProfile(
    identifier: string,
    tenantId: string,
    request: SetNetworkProfileRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.SetNetworkProfile,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    CallAction.ClearDisplayMessage,
    ClearDisplayMessageRequestSchema,
  )
  clearDisplayMessage(
    identifier: string,
    tenantId: string,
    request: ClearDisplayMessageRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.ClearDisplayMessage,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    CallAction.GetDisplayMessages,
    GetDisplayMessagesRequestSchema,
  )
  getDisplayMessages(
    identifier: string,
    tenantId: string,
    request: GetDisplayMessagesRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.GetDisplayMessages,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(CallAction.PublishFirmware, PublishFirmwareRequestSchema)
  publishFirmware(
    identifier: string,
    tenantId: string,
    request: PublishFirmwareRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.PublishFirmware,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    CallAction.SetDisplayMessage,
    SetDisplayMessageRequestSchema,
  )
  async setDisplayMessage(
    identifier: string,
    tenantId: string,
    request: SetDisplayMessageRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    const messageInfo = request.message as MessageInfoType;

    const languageTag = messageInfo.message.language;
    if (languageTag && !validateLanguageTag(languageTag)) {
      const errorMsg =
        'Language shall be specified as RFC-5646 tags, example: US English is: en-US.';
      this._logger.error(errorMsg);
      return { success: false, payload: errorMsg };
    }

    // According to OCPP 2.0.1, the CSMS MAY include a startTime and endTime when setting a message.
    // startDateTime is from what date-time should this message be shown. If omitted: directly.
    if (!messageInfo.startDateTime) {
      messageInfo.startDateTime = new Date().toISOString();
    }

    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.SetDisplayMessage,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    CallAction.UnpublishFirmware,
    UnpublishFirmwareRequestSchema,
  )
  unpublishFirmware(
    identifier: string,
    tenantId: string,
    request: UnpublishFirmwareRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.UnpublishFirmware,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(CallAction.UpdateFirmware, UpdateFirmwareRequestSchema)
  updateFirmware(
    identifier: string,
    tenantId: string,
    request: UpdateFirmwareRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.UpdateFirmware,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(CallAction.Reset, ResetRequestSchema)
  reset(
    identifier: string,
    tenantId: string,
    request: ResetRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.Reset,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    CallAction.ChangeAvailability,
    ChangeAvailabilityRequestSchema,
  )
  changeAvailability(
    identifier: string,
    tenantId: string,
    request: ChangeAvailabilityRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.ChangeAvailability,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(CallAction.TriggerMessage, TriggerMessageRequestSchema)
  triggerMessage(
    identifier: string,
    tenantId: string,
    request: TriggerMessageRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.TriggerMessage,
      request,
      callbackUrl,
    );
  }

  /**
   * Data Endpoints
   */

  @AsDataEndpoint(
    Namespace.BootConfig,
    HttpMethod.Put,
    ChargingStationKeyQuerySchema,
    BootConfigSchema,
  )
  putBootConfig(
    request: FastifyRequest<{
      Body: BootNotificationResponse;
      Querystring: ChargingStationKeyQuerystring;
    }>,
  ): Promise<BootConfig | undefined> {
    return this._module.bootRepository.createOrUpdateByKey(
      request.body,
      request.query.stationId,
    );
  }

  @AsDataEndpoint(
    Namespace.BootConfig,
    HttpMethod.Get,
    ChargingStationKeyQuerySchema,
  )
  getBootConfig(
    request: FastifyRequest<{ Querystring: ChargingStationKeyQuerystring }>,
  ): Promise<Boot | undefined> {
    return this._module.bootRepository.readByKey(request.query.stationId);
  }

  @AsDataEndpoint(
    Namespace.BootConfig,
    HttpMethod.Delete,
    ChargingStationKeyQuerySchema,
  )
  deleteBootConfig(
    request: FastifyRequest<{ Querystring: ChargingStationKeyQuerystring }>,
  ): Promise<Boot | undefined> {
    return this._module.bootRepository.deleteByKey(request.query.stationId);
  }

  @AsDataEndpoint(
      Namespace.PasswordType,
      HttpMethod.Post,
      UpdateChargingStationPasswordQuerySchema,
      UpdateChargingStationPasswordSchema,
  )
  async updatePassword(
      request: FastifyRequest<{
        Body: UpdateChargingStationPasswordRequest;
        Querystring: UpdateChargingStationPasswordQueryString;
      }>,
  ): Promise<IMessageConfirmation> {
    const stationId = request.body.stationId;
    this._logger.debug(`Updating password for ${stationId} station`);
    if (request.body.password && !isValidPassword(request.body.password)) {
      return {success: false, payload: 'Invalid password'};
    }
    const password = request.body.password || generatePassword();

    if (!request.body.setOnCharger) {
      try {
        await this.updatePasswordOnStation(password, stationId, request.query.callbackUrl);
      } catch (error) {
        this._logger.warn(`Failed updating password on ${stationId} station`, error);
        return {success: false, payload: `Failed updating password on ${stationId} station`};
      }
    }
    const variableAttributes = await this.updatePasswordForStation(password, stationId);
    this._logger.debug(`Successfully updated password for ${stationId} station`);
    return {success: true, payload: `Updated ${variableAttributes.length} attributes`};
  }

  private async updatePasswordOnStation(password: string, stationId: string, callbackUrl?: string): Promise<void> {
    const correlationId = uuidv4();
    const cacheCallbackPromise: Promise<string | null> =
        this._module.cache.onChange(
            correlationId,
            this._module.config.maxCachingSeconds,
            stationId,
        );

    const messageConfirmation = await this._module.sendCall(
        stationId,
        'T01', // TODO: adjust when multi-tenancy is implemented
        CallAction.SetVariables,
        {
          setVariableData: [
            {
              variable: {name: 'BasicAuthPassword'},
              attributeValue: password,
              attributeType: AttributeEnumType.Actual,
              component: {name: 'SecurityCtrlr'},
            } as SetVariableDataType
          ]
        } as SetVariablesRequest,
        callbackUrl,
        correlationId
    );
    if (!messageConfirmation.success) {
      throw new Error(`Failed sending request to ${stationId} station for updating password`);
    }

    const responseJsonString = await cacheCallbackPromise;
    if (!responseJsonString) {
      throw new Error(`${stationId} station did not respond in time for updating password`);
    }

    const setVariablesResponse: SetVariablesResponse = JSON.parse(responseJsonString);
    const passwordUpdated = setVariablesResponse.setVariableResult
        .every(result => result.attributeStatus === SetVariableStatusEnumType.Accepted);
    if (!passwordUpdated) {
      throw new Error(`Failure updating password on ${stationId} station`);
    }
  }

  private async updatePasswordForStation(password: string, stationId: string): Promise<VariableAttribute[]> {
    return (
        await this._module.deviceModelRepository.createOrUpdateDeviceModelByStationId(
            {
              component: {
                name: 'SecurityCtrlr',
              },
              variable: {
                name: 'BasicAuthPassword',
              },
              variableAttribute: [
                {
                  type: AttributeEnumType.Actual,
                  value: password,
                  mutability: MutabilityEnumType.WriteOnly,
                },
              ],
              variableCharacteristics: {
                dataType: DataEnumType.passwordString,
                supportsMonitoring: false
              }
            },
            stationId,
        ).then(async (variableAttributes) => {
          for (let variableAttribute of variableAttributes) {
            variableAttribute = await variableAttribute.reload({
              include: [Variable, Component],
            });
            this._module.deviceModelRepository.updateResultByStationId(
                {
                  attributeType: variableAttribute.type,
                  attributeStatus: SetVariableStatusEnumType.Accepted,
                  attributeStatusInfo: { reasonCode: 'SetOnCharger' },
                  component: variableAttribute.component,
                  variable: variableAttribute.variable,
                },
                stationId,
            );
          }
          return variableAttributes;
        })
    );
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

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: Namespace): string {
    const endpointPrefix =
      this._module.config.modules.configuration.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }
}
