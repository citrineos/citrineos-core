// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  type IMessageConfirmation,
  AbstractEndpoint,
} from '@citrineos/base';
import { HttpMethod, type TariffDto } from '@citrineos/types';
import type { TariffQueryString, TenantQueryString } from '@dal/interfaces/index.js';
import { TariffQuerySchema, TariffSchema, TenantQuerySchema } from '@dal/interfaces/index.js';
import type { ITariffRepository } from '@dal/interfaces/repositories.js';
import type { TariffData } from '@dal/layers/sequelize/model/Tariff/Tariffs.js';
import type { FastifyRequest } from 'fastify';

interface TariffEndpointDependencies extends AbstractEndpointDependencies {
  tariffRepository: ITariffRepository;
}

type TariffQueryRoute = { Querystring: TariffQueryString };

type TariffUpsertRoute = { Body: TariffData; Querystring: TenantQueryString };

const TARIFF_PATH = '/tariff';

export class UpsertTariffEndpoint extends AbstractEndpoint<TariffUpsertRoute> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Put,
    path: TARIFF_PATH,
    querySchema: TenantQuerySchema,
    bodySchema: TariffSchema,
  };

  private readonly _tariffRepository: ITariffRepository;

  constructor({ logger, tariffRepository }: TariffEndpointDependencies) {
    super(logger);
    this._tariffRepository = tariffRepository;
  }

  async handle(request: FastifyRequest<TariffUpsertRoute>): Promise<TariffDto> {
    return this._tariffRepository.upsertTariff(request.query.tenantId, request.body);
  }
}

export class GetTariffsEndpoint extends AbstractEndpoint<TariffQueryRoute> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Get,
    path: TARIFF_PATH,
    querySchema: TariffQuerySchema,
  };

  private readonly _tariffRepository: ITariffRepository;

  constructor({ logger, tariffRepository }: TariffEndpointDependencies) {
    super(logger);
    this._tariffRepository = tariffRepository;
  }

  async handle(request: FastifyRequest<TariffQueryRoute>): Promise<TariffDto[]> {
    return this._tariffRepository.readAllByQuerystring(request.query.tenantId, request.query);
  }
}

export class DeleteTariffsEndpoint extends AbstractEndpoint<TariffQueryRoute> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Delete,
    path: TARIFF_PATH,
    querySchema: TariffQuerySchema,
  };

  private readonly _tariffRepository: ITariffRepository;

  constructor({ logger, tariffRepository }: TariffEndpointDependencies) {
    super(logger);
    this._tariffRepository = tariffRepository;
  }

  async handle(request: FastifyRequest<TariffQueryRoute>): Promise<IMessageConfirmation> {
    const deletedCount = await this._tariffRepository.deleteAllByQuerystring(
      request.query.tenantId,
      request.query,
    );
    return {
      success: true,
      payload: `${deletedCount} rows successfully deleted`,
    };
  }
}
