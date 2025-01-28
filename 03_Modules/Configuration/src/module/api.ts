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
  BootConfig,
  BootConfigSchema,
  CallAction,
  HttpMethod,
  IMessageConfirmation,
  Namespace,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
  OCPPVersion,
  UpdateChargingStationPasswordRequest,
  UpdateChargingStationPasswordSchema,
} from '@citrineos/base';
import {
  Boot,
  ChargingStationKeyQuerySchema,
  ChargingStationKeyQuerystring,
  ChargingStationNetworkProfile,
  Component,
  NetworkProfileDeleteQuerySchema,
  NetworkProfileDeleteQuerystring,
  NetworkProfileQuerySchema,
  NetworkProfileQuerystring,
  ServerNetworkProfile,
  SetNetworkProfile,
  UpdateChargingStationPasswordQuerySchema,
  UpdateChargingStationPasswordQueryString,
  Variable,
  VariableAttribute,
} from '@citrineos/data';
import { Op } from 'sequelize';
import {
  generatePassword,
  isValidPassword,
  validateLanguageTag,
} from '@citrineos/util';
import { v4 as uuidv4 } from 'uuid';

enum SetNetworkProfileExtraQuerystrings {
  websocketServerConfigId = 'websocketServerConfigId'
}

/**websocketServerConfigId
 * Server API for the Configuration component.
 */
export class ConfigurationModuleApi
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
    super(ConfigurationComponent, server, logger);
  }


  /**
   * Message Endpoint Methods
   */

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.SetNetworkProfile,
    OCPP2_0_1.SetNetworkProfileRequestSchema,
    { websocketServerConfigId: { type: 'string' } }
  )
  async setNetworkProfile(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.SetNetworkProfileRequest,
    callbackUrl?: string,
    extraQueries?: Record<string, any>
  ): Promise<IMessageConfirmation> {
    const correlationId = uuidv4();
    if (extraQueries) {
      const websocketServerConfigId = extraQueries[SetNetworkProfileExtraQuerystrings.websocketServerConfigId];
      await SetNetworkProfile.build({
        stationId: identifier,
        correlationId,
        configurationSlot: request.configurationSlot,
        websocketServerConfigId,
        apn: JSON.stringify(request.connectionData.apn),
        vpn: JSON.stringify(request.connectionData.vpn),
        ...request.connectionData
      }).save();
    }
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.SetNetworkProfile,
      request,
      callbackUrl,
      correlationId,
    );
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.ClearDisplayMessage,
    OCPP2_0_1.ClearDisplayMessageRequestSchema,
  )
  clearDisplayMessage(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.ClearDisplayMessageRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.ClearDisplayMessage,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.GetDisplayMessages,
    OCPP2_0_1.GetDisplayMessagesRequestSchema,
  )
  getDisplayMessages(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.GetDisplayMessagesRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.GetDisplayMessages,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP2_0_1_CallAction.PublishFirmware, OCPP2_0_1.PublishFirmwareRequestSchema)
  publishFirmware(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.PublishFirmwareRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.PublishFirmware,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.SetDisplayMessage,
    OCPP2_0_1.SetDisplayMessageRequestSchema,
  )
  async setDisplayMessage(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.SetDisplayMessageRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    const messageInfo = request.message as OCPP2_0_1.MessageInfoType;

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
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.SetDisplayMessage,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.UnpublishFirmware,
    OCPP2_0_1.UnpublishFirmwareRequestSchema,
  )
  unpublishFirmware(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.UnpublishFirmwareRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.UnpublishFirmware,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP2_0_1_CallAction.UpdateFirmware, OCPP2_0_1.UpdateFirmwareRequestSchema)
  updateFirmware(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.UpdateFirmwareRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.UpdateFirmware,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP2_0_1_CallAction.Reset, OCPP2_0_1.ResetRequestSchema)
  reset(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.ResetRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.Reset,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.ChangeAvailability,
    OCPP2_0_1.ChangeAvailabilityRequestSchema,
  )
  changeAvailability(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.ChangeAvailabilityRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.ChangeAvailability,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP2_0_1_CallAction.TriggerMessage, OCPP2_0_1.TriggerMessageRequestSchema)
  triggerMessage(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.TriggerMessageRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.TriggerMessage,
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
      Body: OCPP2_0_1.BootNotificationResponse;
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
    if (request.body.setOnCharger && !request.body.password) {
      return {
        success: false,
        payload: 'Password is required when setOnCharger is true',
      };
    }
    if (request.body.password && !isValidPassword(request.body.password)) {
      return { success: false, payload: 'Invalid password' };
    }
    const password = request.body.password || generatePassword();

    if (!request.body.setOnCharger) {
      try {
        await this.updatePasswordOnStation(
          password,
          stationId,
          request.query.callbackUrl,
        );
      } catch (error) {
        this._logger.warn(
          `Failed updating password on ${stationId} station`,
          error,
        );
        return {
          success: false,
          payload: `Failed updating password on ${stationId} station`,
        };
      }
    }
    const variableAttributes = await this.updatePasswordForStation(
      password,
      stationId,
    );
    this._logger.debug(
      `Successfully updated password for ${stationId} station`,
    );
    return {
      success: true,
      payload: `Updated ${variableAttributes.length} attributes`,
    };
  }

  @AsDataEndpoint(
    Namespace.ServerNetworkProfile,
    HttpMethod.Get,
    NetworkProfileQuerySchema,
  )
  async getNetworkProfiles(
    request: FastifyRequest<{ Querystring: NetworkProfileQuerystring }>,
  ): Promise<ChargingStationNetworkProfile[]> {
    return ChargingStationNetworkProfile.findAll({ where: { stationId: request.query.stationId }, include: [SetNetworkProfile, ServerNetworkProfile] });
  }

  @AsDataEndpoint(
    Namespace.ServerNetworkProfile,
    HttpMethod.Delete,
    NetworkProfileDeleteQuerySchema,
  )
  async deleteNetworkProfiles(
    request: FastifyRequest<{ Querystring: NetworkProfileDeleteQuerystring }>,
  ): Promise<IMessageConfirmation> {
    const destroyedRows = await ChargingStationNetworkProfile.destroy({
      where: {
        stationId: request.query.stationId,
        configurationSlot: {
          [Op.in]: request.query.configurationSlot
        }
      }
    });
    return { success: true, payload: `${destroyedRows} rows successfully destroyed` };
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

  private async updatePasswordOnStation(
    password: string,
    stationId: string,
    callbackUrl?: string,
  ): Promise<void> {
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
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.SetVariables,
      {
        setVariableData: [
          {
            variable: { name: 'BasicAuthPassword' },
            attributeValue: password,
            attributeType: OCPP2_0_1.AttributeEnumType.Actual,
            component: { name: 'SecurityCtrlr' },
          } as OCPP2_0_1.SetVariableDataType,
        ],
      } as OCPP2_0_1.SetVariablesRequest,
      callbackUrl,
      correlationId,
    );
    if (!messageConfirmation.success) {
      throw new Error(
        `Failed sending request to ${stationId} station for updating password`,
      );
    }

    const responseJsonString = await cacheCallbackPromise;
    if (!responseJsonString) {
      throw new Error(
        `${stationId} station did not respond in time for updating password`,
      );
    }

    const setVariablesResponse: OCPP2_0_1.SetVariablesResponse =
      JSON.parse(responseJsonString);
    const passwordUpdated = setVariablesResponse.setVariableResult.every(
      (result) => result.attributeStatus === OCPP2_0_1.SetVariableStatusEnumType.Accepted,
    );
    if (!passwordUpdated) {
      throw new Error(`Failure updating password on ${stationId} station`);
    }
  }

  private async updatePasswordForStation(
    password: string,
    stationId: string,
  ): Promise<VariableAttribute[]> {
    const timestamp = new Date().toISOString();
    const variableAttributes =
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
              type: OCPP2_0_1.AttributeEnumType.Actual,
              value: password,
              mutability: OCPP2_0_1.MutabilityEnumType.WriteOnly,
            },
          ],
          variableCharacteristics: {
            dataType: OCPP2_0_1.DataEnumType.passwordString,
            supportsMonitoring: false,
          },
        },
        stationId,
        timestamp,
      );
    for (let variableAttribute of variableAttributes) {
      variableAttribute = await variableAttribute.reload({
        include: [Variable, Component],
      });
      await this._module.deviceModelRepository.updateResultByStationId(
        {
          attributeType: variableAttribute.type,
          attributeStatus: OCPP2_0_1.SetVariableStatusEnumType.Accepted,
          attributeStatusInfo: { reasonCode: 'SetOnCharger' },
          component: variableAttribute.component,
          variable: variableAttribute.variable,
        },
        stationId,
        timestamp,
      );
    }
    return variableAttributes;
  }
}
