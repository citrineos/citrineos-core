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
  BootConfigSchema,
  HttpMethod,
  IMessageConfirmation,
  OCPP2_0_1_Namespace,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
  OCPPVersion,
  UpdateChargingStationPasswordRequest,
  UpdateChargingStationPasswordSchema,
  Namespace,
  OCPP1_6_Namespace,
  BootConfig,
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
import { generatePassword, isValidPassword } from '@citrineos/util';
import { v4 as uuidv4 } from 'uuid';

/**
 * Server API for the Configuration component.
 */
export class ConfigurationDataApi
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
    super(ConfigurationComponent, server, null, logger);
  }

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
      request.query.tenantId,
      request.body,
      request.query.stationId,
    );
  }

  @AsDataEndpoint(Namespace.BootConfig, HttpMethod.Get, ChargingStationKeyQuerySchema)
  getBootConfig(
    request: FastifyRequest<{ Querystring: ChargingStationKeyQuerystring }>,
  ): Promise<Boot | undefined> {
    return this._module.bootRepository.readByKey(request.query.tenantId, request.query.stationId);
  }

  @AsDataEndpoint(Namespace.BootConfig, HttpMethod.Delete, ChargingStationKeyQuerySchema)
  deleteBootConfig(
    request: FastifyRequest<{ Querystring: ChargingStationKeyQuerystring }>,
  ): Promise<Boot | undefined> {
    return this._module.bootRepository.deleteByKey(request.query.tenantId, request.query.stationId);
  }

  @AsDataEndpoint(
    OCPP2_0_1_Namespace.PasswordType,
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
    const tenantId = request.query.tenantId;

    this._logger.debug(`Updating password for ${stationId} station in tenant ${tenantId}`);

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
          tenantId,
          request.query.callbackUrl,
        );
      } catch (error) {
        this._logger.warn(`Failed updating password on ${stationId} station`, error);
        return {
          success: false,
          payload: `Failed updating password on ${stationId} station`,
        };
      }
    }
    const variableAttributes = await this.updatePasswordForStation(password, tenantId, stationId);
    this._logger.debug(`Successfully updated password for ${stationId} station`);
    return {
      success: true,
      payload: `Updated ${variableAttributes.length} attributes`,
    };
  }

  @AsDataEndpoint(
    OCPP2_0_1_Namespace.ServerNetworkProfile,
    HttpMethod.Get,
    NetworkProfileQuerySchema,
  )
  async getNetworkProfiles(
    request: FastifyRequest<{ Querystring: NetworkProfileQuerystring }>,
  ): Promise<ChargingStationNetworkProfile[]> {
    return ChargingStationNetworkProfile.findAll({
      where: { stationId: request.query.stationId, tenantId: request.query.tenantId },
      include: [SetNetworkProfile, ServerNetworkProfile],
    });
  }

  @AsDataEndpoint(
    OCPP2_0_1_Namespace.ServerNetworkProfile,
    HttpMethod.Delete,
    NetworkProfileDeleteQuerySchema,
  )
  async deleteNetworkProfiles(
    request: FastifyRequest<{ Querystring: NetworkProfileDeleteQuerystring }>,
  ): Promise<IMessageConfirmation> {
    const destroyedRows = await ChargingStationNetworkProfile.destroy({
      where: {
        stationId: request.query.stationId,
        tenantId: request.query.tenantId,
        configurationSlot: {
          [Op.in]: request.query.configurationSlot,
        },
      },
    });
    return {
      success: true,
      payload: `${destroyedRows} rows successfully destroyed`,
    };
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace}
   * and the module's endpoint prefix configuration.
   *
   * @param {Namespace} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: OCPP2_0_1_Namespace | OCPP1_6_Namespace | Namespace): string {
    const endpointPrefix = this._module.config.modules.configuration.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }

  private async updatePasswordOnStation(
    password: string,
    stationId: string,
    tenantId: number,
    callbackUrl?: string,
  ): Promise<void> {
    const correlationId = uuidv4();
    const cacheCallbackPromise: Promise<string | null> = this._module.cache.onChange(
      correlationId,
      this._module.config.maxCachingSeconds,
      stationId,
    );

    const messageConfirmation = await this._module.sendCall(
      stationId,
      tenantId,
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
      throw new Error(`Failed sending request to ${stationId} station for updating password`);
    }

    const responseJsonString = await cacheCallbackPromise;
    if (!responseJsonString) {
      throw new Error(`${stationId} station did not respond in time for updating password`);
    }

    const setVariablesResponse: OCPP2_0_1.SetVariablesResponse = JSON.parse(responseJsonString);
    const passwordUpdated = setVariablesResponse.setVariableResult.every(
      (result) => result.attributeStatus === OCPP2_0_1.SetVariableStatusEnumType.Accepted,
    );
    if (!passwordUpdated) {
      throw new Error(`Failure updating password on ${stationId} station`);
    }
  }

  private async updatePasswordForStation(
    password: string,
    tenantId: number,
    stationId: string,
  ): Promise<VariableAttribute[]> {
    const timestamp = new Date().toISOString();
    const variableAttributes =
      await this._module.deviceModelRepository.createOrUpdateDeviceModelByStationId(
        tenantId,
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
        tenantId,
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
