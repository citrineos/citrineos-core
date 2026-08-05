// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type BootstrapConfig,
  type ICache,
  type IMessageConfirmation,
  type IOcppSender,
  type IEndpointDefinition,
  AbstractEndpoint,
  UpdateChargingStationPasswordSchema,
} from '@citrineos/base';
import {
  type SystemConfig,
  type UpdateChargingStationPasswordRequest,
  EventGroup,
  HttpMethod,
  OCPP2_0_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type { UpdateChargingStationPasswordQueryString } from '@dal/interfaces/index.js';
import { UpdateChargingStationPasswordQuerySchema } from '@dal/interfaces/index.js';
import type { IDeviceModelRepository } from '@dal/interfaces/repositories.js';
import { Component, Variable, VariableAttribute } from '@dal/layers/sequelize/index.js';
import { generatePassword, isValidPassword } from '@util/index.js';
import type { FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

interface SetStationPasswordEndpointDependencies extends AbstractEndpointDependencies {
  config: BootstrapConfig & SystemConfig;
  cache: ICache;
  ocppSender: IOcppSender;
  deviceModelRepository: IDeviceModelRepository;
}

type SetStationPasswordEndpointRoute = {
  Body: UpdateChargingStationPasswordRequest;
  Querystring: UpdateChargingStationPasswordQueryString;
};

export class SetStationPasswordEndpoint extends AbstractEndpoint<SetStationPasswordEndpointRoute> {
  static readonly route: IEndpointDefinition = {
    method: HttpMethod.Post,
    path: '/setStationPassword',
    querySchema: UpdateChargingStationPasswordQuerySchema,
    bodySchema: UpdateChargingStationPasswordSchema,
  };

  private readonly _config: BootstrapConfig & SystemConfig;
  private readonly _cache: ICache;
  private readonly _ocppSender: IOcppSender;
  private readonly _deviceModelRepository: IDeviceModelRepository;

  constructor({
    logger,
    config,
    cache,
    ocppSender,
    deviceModelRepository,
  }: SetStationPasswordEndpointDependencies) {
    super(logger);
    this._config = config;
    this._cache = cache;
    this._ocppSender = ocppSender;
    this._deviceModelRepository = deviceModelRepository;
  }

  async handle(
    request: FastifyRequest<SetStationPasswordEndpointRoute>,
  ): Promise<IMessageConfirmation> {
    const ocppConnectionName = request.body.ocppConnectionName;
    const tenantId = request.query.tenantId;

    this._logger.debug(`Updating password for ${ocppConnectionName} station in tenant ${tenantId}`);

    if (request.body.alreadySetOnCharger && !request.body.password) {
      return {
        success: false,
        payload: 'Password is required when alreadySetOnCharger is true',
      };
    }
    if (request.body.password && !isValidPassword(request.body.password)) {
      return { success: false, payload: 'Invalid password' };
    }
    const password = request.body.password || generatePassword();

    if (!request.body.alreadySetOnCharger) {
      try {
        await this.updatePasswordOnStation(
          password,
          ocppConnectionName,
          tenantId,
          request.query.callbackUrl,
        );
      } catch (error) {
        this._logger.warn(`Failed updating password on ${ocppConnectionName} station`, error);
        return {
          success: false,
          payload: `Failed updating password on ${ocppConnectionName} station`,
        };
      }
    }
    const variableAttributes = await this.updatePasswordForStation(
      password,
      tenantId,
      ocppConnectionName,
    );
    this._logger.debug(`Successfully updated password for ${ocppConnectionName} station`);
    return {
      success: true,
      payload: `Updated ${variableAttributes.length} attributes`,
    };
  }

  private async updatePasswordOnStation(
    password: string,
    ocppConnectionName: string,
    tenantId: number,
    callbackUrl?: string,
  ): Promise<void> {
    const correlationId = uuidv4();
    const cacheCallbackPromise: Promise<string | null> = this._cache.onChange(
      correlationId,
      this._config.maxCachingSeconds,
      ocppConnectionName,
    );

    const messageConfirmation = await this._ocppSender.sendCall({
      ocppConnectionName,
      tenantId,
      protocol: OCPPVersion.OCPP2_0_1,
      action: OCPP_CallAction.SetVariables,
      eventGroup: EventGroup.Api,
      payload: {
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
    });
    if (!messageConfirmation.success) {
      throw new Error(
        `Failed sending request to ${ocppConnectionName} station for updating password`,
      );
    }

    const responseJsonString = await cacheCallbackPromise;
    if (!responseJsonString) {
      throw new Error(
        `${ocppConnectionName} station did not respond in time for updating password`,
      );
    }

    const setVariablesResponse: OCPP2_0_1.SetVariablesResponse = JSON.parse(responseJsonString);
    const passwordUpdated = setVariablesResponse.setVariableResult.every(
      (result) => result.attributeStatus === OCPP2_0_1.SetVariableStatusEnumType.Accepted,
    );
    if (!passwordUpdated) {
      throw new Error(`Failure updating password on ${ocppConnectionName} station`);
    }
  }

  private async updatePasswordForStation(
    password: string,
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<VariableAttribute[]> {
    const timestamp = new Date().toISOString();
    const variableAttributes =
      await this._deviceModelRepository.createOrUpdateDeviceModelByStationId(
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
        ocppConnectionName,
        timestamp,
      );
    for (let variableAttribute of variableAttributes) {
      variableAttribute = await variableAttribute.reload({
        include: [Variable, Component],
      });
      await this._deviceModelRepository.updateResultByStationId(
        tenantId,
        {
          attributeType: variableAttribute.type,
          attributeStatus: OCPP2_0_1.SetVariableStatusEnumType.Accepted,
          attributeStatusInfo: { reasonCode: 'SetOnCharger' },
          component: variableAttribute.component,
          variable: variableAttribute.variable,
        },
        ocppConnectionName,
        timestamp,
      );
    }
    return variableAttributes;
  }
}
