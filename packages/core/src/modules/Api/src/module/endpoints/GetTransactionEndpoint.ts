// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  AbstractEndpoint,
} from '@citrineos/base';
import { HttpMethod } from '@citrineos/types';
import type { TransactionEventQuerystring } from '@dal/interfaces/index.js';
import { TransactionEventQuerySchema } from '@dal/interfaces/index.js';
import type { ITransactionEventRepository } from '@dal/interfaces/repositories.js';
import type { Transaction } from '@dal/layers/sequelize/index.js';
import type { FastifyRequest } from 'fastify';

interface GetTransactionEndpointDependencies extends AbstractEndpointDependencies {
  transactionEventRepository: ITransactionEventRepository;
}

type GetTransactionRoute = { Querystring: TransactionEventQuerystring };

export class GetTransactionEndpoint extends AbstractEndpoint<GetTransactionRoute> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Get,
    path: '/transaction',
    querySchema: TransactionEventQuerySchema,
  };

  private readonly _transactionEventRepository: ITransactionEventRepository;

  constructor({ logger, transactionEventRepository }: GetTransactionEndpointDependencies) {
    super(logger);
    this._transactionEventRepository = transactionEventRepository;
  }

  async handle(request: FastifyRequest<GetTransactionRoute>): Promise<Transaction | undefined> {
    return this._transactionEventRepository.readTransactionByStationIdAndTransactionId(
      request.query.tenantId,
      request.query.ocppConnectionName,
      request.query.transactionId,
    );
  }
}
