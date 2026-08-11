// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type BootConfig,
  type IEndpointDefinition,
  AbstractEndpoint,
  BootConfigSchema,
  type OCPP2_response_types,
} from '@citrineos/base';
import { HttpMethod } from '@citrineos/types';
import type { ChargingStationKeyQuerystring } from '@dal/interfaces/index.js';
import { ChargingStationKeyQuerySchema } from '@dal/interfaces/index.js';
import type { IBootRepository } from '@dal/interfaces/repositories.js';
import type { Boot } from '@dal/layers/sequelize/index.js';
import type { FastifyRequest } from 'fastify';

interface BootConfigEndpointDependencies extends AbstractEndpointDependencies {
  bootRepository: IBootRepository;
}

type BootConfigReadRoute = { Querystring: ChargingStationKeyQuerystring };

type BootConfigWriteRoute = {
  Body: OCPP2_response_types.BootNotificationResponse;
  Querystring: ChargingStationKeyQuerystring;
};

const BOOT_CONFIG_PATH = '/bootConfig';

export class PutBootConfigEndpoint extends AbstractEndpoint<BootConfigWriteRoute> {
  static readonly route: IEndpointDefinition = {
    method: HttpMethod.Put,
    path: BOOT_CONFIG_PATH,
    querySchema: ChargingStationKeyQuerySchema,
    bodySchema: BootConfigSchema,
  };

  private readonly _bootRepository: IBootRepository;

  constructor({ logger, bootRepository }: BootConfigEndpointDependencies) {
    super(logger);
    this._bootRepository = bootRepository;
  }

  async handle(request: FastifyRequest<BootConfigWriteRoute>): Promise<Boot | undefined> {
    return this._bootRepository.createOrUpdateByKey(
      request.query.tenantId,
      request.body as BootConfig,
      request.query.ocppConnectionName,
    );
  }
}

export class GetBootConfigEndpoint extends AbstractEndpoint<BootConfigReadRoute> {
  static readonly route: IEndpointDefinition = {
    method: HttpMethod.Get,
    path: BOOT_CONFIG_PATH,
    querySchema: ChargingStationKeyQuerySchema,
  };

  private readonly _bootRepository: IBootRepository;

  constructor({ logger, bootRepository }: BootConfigEndpointDependencies) {
    super(logger);
    this._bootRepository = bootRepository;
  }

  async handle(request: FastifyRequest<BootConfigReadRoute>): Promise<Boot | undefined> {
    return this._bootRepository.readByKey(request.query.tenantId, request.query.ocppConnectionName);
  }
}

export class DeleteBootConfigEndpoint extends AbstractEndpoint<BootConfigReadRoute> {
  static readonly route: IEndpointDefinition = {
    method: HttpMethod.Delete,
    path: BOOT_CONFIG_PATH,
    querySchema: ChargingStationKeyQuerySchema,
  };

  private readonly _bootRepository: IBootRepository;

  constructor({ logger, bootRepository }: BootConfigEndpointDependencies) {
    super(logger);
    this._bootRepository = bootRepository;
  }

  async handle(request: FastifyRequest<BootConfigReadRoute>): Promise<Boot | undefined> {
    return this._bootRepository.deleteByKey(
      request.query.tenantId,
      request.query.ocppConnectionName,
    );
  }
}
