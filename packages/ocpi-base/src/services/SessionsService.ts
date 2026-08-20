// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Service } from 'typedi';
import type { PaginatedSessionResponse } from '../model/Session.js';
import {
  buildOcpiPaginatedResponse,
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
} from '../model/PaginatedResponse.js';
import { OcpiResponseStatusCode } from '../model/OcpiResponse.js';
import type {
  GetTransactionsQueryResult,
  GetTransactionsQueryVariables,
  Timestamptz_Comparison_Exp,
  Transactions_Bool_Exp,
} from '../graphql/index.js';
import { GET_TRANSACTIONS_QUERY, OcpiGraphqlClient } from '../graphql/index.js';
import { SessionMapper } from '../mapper/index.js';
import type { TransactionDto } from '@citrineos/types';

@Service()
export class SessionsService {
  constructor(
    private readonly ocpiGraphqlClient: OcpiGraphqlClient,
    private readonly sessionMapper: SessionMapper,
  ) {}

  public async getSessions(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    dateFrom?: Date,
    dateTo?: Date,
    offset: number = DEFAULT_OFFSET,
    limit: number = DEFAULT_LIMIT,
    endedOnly?: boolean,
  ): Promise<PaginatedSessionResponse> {
    const where: Transactions_Bool_Exp = {
      Tenant: {
        countryCode: { _eq: toCountryCode },
        partyId: { _eq: toPartyId },
      },
      Authorization: {
        TenantPartner: {
          countryCode: { _eq: fromCountryCode },
          partyId: { _eq: fromPartyId },
        },
      },
    };
    const dateFilters: Timestamptz_Comparison_Exp = {};
    // OCPI defines date_from as inclusive and date_to as exclusive. _lte made the upper bound
    // inclusive, so a record landing exactly on the boundary was returned both by the poll that
    // ended there and by the poll that started there - the same record delivered twice.
    if (dateFrom) dateFilters._gte = dateFrom.toISOString();
    if (dateTo) dateFilters._lt = dateTo.toISOString();
    if (Object.keys(dateFilters).length > 0) {
      where.updatedAt = dateFilters;
    }

    if (endedOnly) {
      // Delivered energy is not a completion signal: a session still running has some, and one
      // that ended without delivering any has ended all the same. isActive is the actual flag,
      // and it is what CdrMapper uses.
      where.isActive = { _eq: false };
    }
    const queryOptions = {
      offset,
      limit,
      where,
    };
    const result = await this.ocpiGraphqlClient.request<
      GetTransactionsQueryResult,
      GetTransactionsQueryVariables
    >(GET_TRANSACTIONS_QUERY, queryOptions);

    const mappedSessions = await this.sessionMapper.mapTransactionsToSessions(
      result.Transactions as TransactionDto[],
    );

    const response = buildOcpiPaginatedResponse(
      OcpiResponseStatusCode.GenericSuccessCode,
      result.Transactions_aggregate?.aggregate?.count ?? 0,
      limit,
      offset,
      mappedSessions,
    );

    return response as PaginatedSessionResponse;
  }
}
