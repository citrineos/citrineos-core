// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  type IMessageConfirmation,
  AbstractEndpoint,
  ReportDataTypeSchema,
} from '@citrineos/base';
import { HttpMethod, type OCPP2_common_types } from '@citrineos/types';
import type { CreateOrUpdateVariableAttributeQuerystring } from '@dal/interfaces/index.js';
import { CreateOrUpdateVariableAttributeQuerySchema } from '@dal/interfaces/index.js';
import type { DeviceModelService } from '@util/deviceModel/DeviceModelService.js';
import type { FastifyRequest } from 'fastify';

interface ProvisionStationVariablesEndpointDependencies extends AbstractEndpointDependencies {
  deviceModelService: DeviceModelService;
}

type ProvisionStationVariablesRoute = {
  Body: OCPP2_common_types.ReportDataType;
  Querystring: CreateOrUpdateVariableAttributeQuerystring;
};

export class ProvisionStationVariablesEndpoint extends AbstractEndpoint<ProvisionStationVariablesRoute> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Put,
    path: '/provisionStationVariables',
    querySchema: CreateOrUpdateVariableAttributeQuerySchema,
    bodySchema: ReportDataTypeSchema,
  };

  private readonly _deviceModelService: DeviceModelService;

  constructor({ logger, deviceModelService }: ProvisionStationVariablesEndpointDependencies) {
    super(logger);
    this._deviceModelService = deviceModelService;
  }

  async handle(
    request: FastifyRequest<ProvisionStationVariablesRoute>,
  ): Promise<IMessageConfirmation> {
    const { tenantId, ocppConnectionName, setOnCharger } = request.query;

    const variableAttributes = await this._deviceModelService.provisionVariableAttributes(
      tenantId,
      ocppConnectionName,
      request.body,
      setOnCharger ?? false,
    );

    return {
      success: true,
      payload: `Updated ${variableAttributes.length} attributes`,
    };
  }
}
