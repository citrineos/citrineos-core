// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractEndpoint,
  UpdateChargingStationPasswordSchema,
  type AbstractEndpointDependencies,
  type ICache,
  type ICommandEndpointMetadata,
  type IMessageConfirmation,
  type IOcppSender,
} from '@citrineos/base';
import {
  AttributeEnum,
  DataEnum,
  EventGroup,
  HttpMethod,
  MutabilityEnum,
  OCPPVersion,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  SetVariableStatusEnum,
  type OCPP2_common_types,
  type OCPP2_request_types,
  type OCPP2_response_types,
  type SystemConfig,
  type UpdateChargingStationPasswordRequest,
} from '@citrineos/types';
import type { UpdateChargingStationPasswordQueryString } from '@citrineos/dal';
import { UpdateChargingStationPasswordQuerySchema } from '@citrineos/dal';
import type { IChargingStationRepository } from '@citrineos/dal';
import { VariableAttribute } from '@citrineos/dal';
import type { DeviceModelService } from '@services/device-model/device-model-service.js';
import { generatePassword, isValidPassword } from '@services/index.js';
import { resolveStationProtocol } from '@util/index.js';
import type { FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

interface SetStationPasswordEndpointDependencies extends AbstractEndpointDependencies {
  config: SystemConfig;
  cache: ICache;
  ocppSender: IOcppSender;
  deviceModelService: DeviceModelService;
  locationRepository: IChargingStationRepository;
}

type SetStationPasswordEndpointRoute = {
  Body: UpdateChargingStationPasswordRequest;
  Querystring: UpdateChargingStationPasswordQueryString;
};

export class SetStationPasswordEndpoint extends AbstractEndpoint<SetStationPasswordEndpointRoute> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Post,
    path: '/setStationPassword',
    querySchema: UpdateChargingStationPasswordQuerySchema,
    bodySchema: UpdateChargingStationPasswordSchema,
  };

  private readonly _config: SystemConfig;
  private readonly _cache: ICache;
  private readonly _ocppSender: IOcppSender;
  private readonly _deviceModelService: DeviceModelService;
  private readonly _locationRepository: IChargingStationRepository;

  constructor({
    logger,
    config,
    cache,
    ocppSender,
    deviceModelService,
    locationRepository,
  }: SetStationPasswordEndpointDependencies) {
    super(logger);
    this._config = config;
    this._cache = cache;
    this._ocppSender = ocppSender;
    this._deviceModelService = deviceModelService;
    this._locationRepository = locationRepository;
  }

  async handle(
    request: FastifyRequest<SetStationPasswordEndpointRoute>,
  ): Promise<IMessageConfirmation> {
    const ocppConnectionName = request.body.ocppConnectionName;
    const tenantId = request.query.tenantId;

    this._logger.debug(`Updating password for ${ocppConnectionName} station in tenant ${tenantId}`);

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
      const resolution = await resolveStationProtocol(
        this._locationRepository.readChargingStationByStationId,
        tenantId,
        ocppConnectionName,
        OCPP_2_VER_LIST,
      );
      if (!resolution.supported) {
        return { success: false, payload: resolution.reason };
      }

      try {
        await this.updatePasswordOnStation(
          password,
          ocppConnectionName,
          tenantId,
          resolution.protocol,
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
    protocol: OCPPVersion,
    callbackUrl?: string,
  ): Promise<void> {
    const correlationId = uuidv4();
    const cacheCallbackPromise: Promise<string | null> = this._cache.onChange(
      correlationId,
      this._config.timeouts.maxCachingSeconds,
      ocppConnectionName,
    );

    const messageConfirmation = await this._ocppSender.sendCall({
      ocppConnectionName,
      tenantId,
      protocol,
      action: OCPP_CallAction.SetVariables,
      eventGroup: EventGroup.Monitoring,
      payload: {
        setVariableData: [
          {
            variable: { name: 'BasicAuthPassword' },
            attributeValue: password,
            attributeType: AttributeEnum.Actual,
            component: { name: 'SecurityCtrlr' },
          } as OCPP2_common_types.SetVariableDataType,
        ],
      } as OCPP2_request_types.SetVariablesRequest,
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

    const setVariablesResponse: OCPP2_response_types.SetVariablesResponse =
      JSON.parse(responseJsonString);
    const passwordUpdated = setVariablesResponse.setVariableResult.every(
      (result) => result.attributeStatus === SetVariableStatusEnum.Accepted,
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
    return this._deviceModelService.provisionVariableAttributes(
      tenantId,
      ocppConnectionName,
      {
        component: {
          name: 'SecurityCtrlr',
        },
        variable: {
          name: 'BasicAuthPassword',
        },
        variableAttribute: [
          {
            type: AttributeEnum.Actual,
            value: password,
            mutability: MutabilityEnum.WriteOnly,
          },
        ],
        variableCharacteristics: {
          dataType: DataEnum.passwordString,
          supportsMonitoring: false,
        },
      } as OCPP2_common_types.ReportDataType,
      true,
    );
  }
}
