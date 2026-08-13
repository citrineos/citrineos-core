// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  type IMessageConfirmation,
  AbstractEndpoint,
} from '@citrineos/base';
import { HttpMethod } from '@citrineos/types';
import type { VariableAttributeQuerystring } from '@dal/interfaces/index.js';
import { VariableAttributeQuerySchema } from '@dal/interfaces/index.js';
import type { IDeviceModelRepository } from '@dal/interfaces/repositories.js';
import type { VariableAttribute } from '@dal/layers/sequelize/index.js';
import type { FastifyRequest } from 'fastify';

interface StationVariableEndpointDependencies extends AbstractEndpointDependencies {
  deviceModelRepository: IDeviceModelRepository;
}

type StationVariableRoute = { Querystring: VariableAttributeQuerystring };

const STATION_VARIABLES_PATH = '/stationVariables';

export class GetStationVariablesEndpoint extends AbstractEndpoint<StationVariableRoute> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Get,
    path: STATION_VARIABLES_PATH,
    querySchema: VariableAttributeQuerySchema,
  };

  private readonly _deviceModelRepository: IDeviceModelRepository;

  constructor({ logger, deviceModelRepository }: StationVariableEndpointDependencies) {
    super(logger);
    this._deviceModelRepository = deviceModelRepository;
  }

  async handle(request: FastifyRequest<StationVariableRoute>): Promise<VariableAttribute[]> {
    return this._deviceModelRepository.readAllByQuerystring(request.query.tenantId, request.query);
  }
}

export class DeleteStationVariablesEndpoint extends AbstractEndpoint<StationVariableRoute> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Delete,
    path: STATION_VARIABLES_PATH,
    querySchema: VariableAttributeQuerySchema,
  };

  private readonly _deviceModelRepository: IDeviceModelRepository;

  constructor({ logger, deviceModelRepository }: StationVariableEndpointDependencies) {
    super(logger);
    this._deviceModelRepository = deviceModelRepository;
  }

  async handle(request: FastifyRequest<StationVariableRoute>): Promise<IMessageConfirmation> {
    const deletedCount = await this._deviceModelRepository.deleteAllByQuerystring(
      request.query.tenantId,
      request.query,
    );
    return {
      success: true,
      payload: `${deletedCount} rows successfully deleted`,
    };
  }
}
