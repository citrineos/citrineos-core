// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  type IMessageConfirmation,
  AbstractEndpoint,
} from '@citrineos/base';
import type { VariableAttributeDto } from '@citrineos/types';
import { HttpMethod } from '@citrineos/types';
import type { VariableAttributeQuerystring } from '@citrineos/dal';
import { VariableAttributeQuerySchema } from '@citrineos/dal';
import type { IVariableAttributeRepository } from '@citrineos/dal';
import type { FastifyRequest } from 'fastify';

interface StationVariableEndpointDependencies extends AbstractEndpointDependencies {
  variableAttributeRepository: IVariableAttributeRepository;
}

type StationVariableRoute = { Querystring: VariableAttributeQuerystring };

const STATION_VARIABLES_PATH = '/stationVariables';

export class GetStationVariablesEndpoint extends AbstractEndpoint<StationVariableRoute> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Get,
    path: STATION_VARIABLES_PATH,
    querySchema: VariableAttributeQuerySchema,
  };

  private readonly _variableAttributeRepository: IVariableAttributeRepository;

  constructor({ logger, variableAttributeRepository }: StationVariableEndpointDependencies) {
    super(logger);
    this._variableAttributeRepository = variableAttributeRepository;
  }

  async handle(request: FastifyRequest<StationVariableRoute>): Promise<VariableAttributeDto[]> {
    return this._variableAttributeRepository.readAllByQuerystring(
      request.query.tenantId,
      request.query,
    );
  }
}

export class DeleteStationVariablesEndpoint extends AbstractEndpoint<StationVariableRoute> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Delete,
    path: STATION_VARIABLES_PATH,
    querySchema: VariableAttributeQuerySchema,
  };

  private readonly _variableAttributeRepository: IVariableAttributeRepository;

  constructor({ logger, variableAttributeRepository }: StationVariableEndpointDependencies) {
    super(logger);
    this._variableAttributeRepository = variableAttributeRepository;
  }

  async handle(request: FastifyRequest<StationVariableRoute>): Promise<IMessageConfirmation> {
    const deleted = await this._variableAttributeRepository.deleteAllByQuerystring(
      request.query.tenantId,
      request.query,
    );
    return {
      success: true,
      payload: `${deleted.length} rows successfully deleted`,
    };
  }
}
