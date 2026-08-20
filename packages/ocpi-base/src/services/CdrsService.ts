// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Service } from 'typedi';
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
import { CdrMapper } from '../mapper/index.js';
import type { TransactionDto } from '@citrineos/types';
import type { PaginatedCdrResponse } from '../model/Cdr.js';

@Service()
export class CdrsService {
  constructor(
    private readonly ocpiGraphqlClient: OcpiGraphqlClient,
    private readonly cdrMapper: CdrMapper,
  ) {}

  public async getCdrs(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    dateFrom?: Date,
    dateTo?: Date,
    offset: number = DEFAULT_OFFSET,
    limit: number = DEFAULT_LIMIT,
  ): Promise<PaginatedCdrResponse> {
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
      // A CDR only exists for a finished session. CdrMapper already drops active transactions
      // after the fact, but the query and its aggregate count did not, so X-Total-Count counted
      // sessions that never become CDRs and every page came back short of its limit.
      isActive: { _eq: false },
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
    const variables = {
      offset,
      limit,
      where,
    };
    const result = await this.ocpiGraphqlClient.request<
      GetTransactionsQueryResult,
      GetTransactionsQueryVariables
    >(GET_TRANSACTIONS_QUERY, variables);
    const mappedCdr = await this.cdrMapper.mapTransactionsToCdrs(
      result.Transactions as TransactionDto[],
    );

    const response = buildOcpiPaginatedResponse(
      OcpiResponseStatusCode.GenericSuccessCode,
      result.Transactions_aggregate?.aggregate?.count ?? 0,
      limit,
      offset,
      mappedCdr,
    );

    return response as PaginatedCdrResponse;
  }
}
