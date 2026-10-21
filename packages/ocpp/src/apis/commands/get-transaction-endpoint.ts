// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  AbstractEndpoint,
} from '@citrineos/base';
import { HttpMethod, type TransactionDto } from '@citrineos/types';
import type { TransactionEventQuerystring } from '@citrineos/dal';
import { TransactionEventQuerySchema } from '@citrineos/dal';
import type { ITransactionRepository } from '@citrineos/dal';
import type { FastifyRequest } from 'fastify';

interface GetTransactionEndpointDependencies extends AbstractEndpointDependencies {
  transactionRepository: ITransactionRepository;
}

type GetTransactionRoute = { Querystring: TransactionEventQuerystring };

export class GetTransactionEndpoint extends AbstractEndpoint<GetTransactionRoute> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Get,
    path: '/transaction',
    querySchema: TransactionEventQuerySchema,
  };

  private readonly _transactionRepository: ITransactionRepository;

  constructor({ logger, transactionRepository }: GetTransactionEndpointDependencies) {
    super(logger);
    this._transactionRepository = transactionRepository;
  }

  async handle(request: FastifyRequest<GetTransactionRoute>): Promise<TransactionDto | undefined> {
    return this._transactionRepository.readTransactionByStationIdAndTransactionId(
      request.query.tenantId,
      request.query.ocppConnectionName,
      request.query.transactionId,
    );
  }
}
