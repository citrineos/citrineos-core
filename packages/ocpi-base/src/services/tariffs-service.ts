// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TariffDTO } from '../model/dto/tariffs/tariff-dto.js';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '../model/paginated-response.js';
import { OcpiHeaders } from '../model/ocpi-headers.js';
import { PaginatedParams } from '../controllers/param/paginated-params.js';
import type {
  GetTariffByKeyQueryResult,
  GetTariffByKeyQueryVariables,
  GetTariffsQueryResult,
  GetTariffsQueryVariables,
  Tariffs_Bool_Exp,
  Timestamptz_Comparison_Exp,
} from '../graphql/index.js';
import { GET_TARIFF_BY_KEY_QUERY, GET_TARIFFS_QUERY } from '../graphql/index.js';
import type { IOcpiGraphqlClient } from '../graphql/index.js';
import type { OcpiGraphqlDependencies } from '../dependencies.js';
import { TariffMapper } from '../mapper/index.js';
import type { TariffDto } from '@citrineos/types';

export class TariffsService {
  private readonly ocpiGraphqlClient: IOcpiGraphqlClient;

  constructor({ ocpiGraphqlClient }: OcpiGraphqlDependencies) {
    this.ocpiGraphqlClient = ocpiGraphqlClient;
  }

  async getTariffByKey(key: {
    id: number;
    countryCode: string;
    partyId: string;
  }): Promise<TariffDTO | undefined> {
    const result = await this.ocpiGraphqlClient.request<
      GetTariffByKeyQueryResult,
      GetTariffByKeyQueryVariables
    >(GET_TARIFF_BY_KEY_QUERY, key);
    const tariff = result.Tariffs?.[0];
    if (tariff) {
      return TariffMapper.map(tariff as TariffDto);
    }
    return undefined;
  }

  async getTariffs(
    ocpiHeaders: OcpiHeaders,
    paginationParams?: PaginatedParams,
  ): Promise<{ data: TariffDTO[]; count: number }> {
    const limit = paginationParams?.limit ?? DEFAULT_LIMIT;
    const offset = paginationParams?.offset ?? DEFAULT_OFFSET;
    const where: Tariffs_Bool_Exp = {
      Tenant: {
        countryCode: { _eq: ocpiHeaders.toCountryCode },
        partyId: { _eq: ocpiHeaders.toPartyId },
      },
    };
    const dateFilters: Timestamptz_Comparison_Exp = {};
    if (paginationParams?.dateFrom) dateFilters._gte = paginationParams.dateFrom.toISOString();
    if (paginationParams?.dateTo) dateFilters._lt = paginationParams.dateTo.toISOString();
    if (Object.keys(dateFilters).length > 0) {
      where.updatedAt = dateFilters;
    }
    const variables = {
      limit,
      offset,
      where,
    };
    const result = await this.ocpiGraphqlClient.request<
      GetTariffsQueryResult,
      GetTariffsQueryVariables
    >(GET_TARIFFS_QUERY, variables);
    const mappedTariffs: TariffDTO[] = [];
    for (const tariff of result.Tariffs) {
      mappedTariffs.push(TariffMapper.map(tariff as TariffDto));
    }
    return {
      data: mappedTariffs,
      count: result.Tariffs_aggregate?.aggregate?.count ?? 0,
    };
  }

  // async createOrUpdateTariff(
  //   tariffRequest: PutTariffRequest,
  // ): Promise<TariffDTO> {
  //   const variables = { tariff: tariffRequest };
  //   const result =
  //     await this.ocpiGraphqlClient.request<CreateOrUpdateTariffMutation>(
  //       CREATE_OR_UPDATE_TARIFF_MUTATION,
  //       variables,
  //     );
  //   return result.insert_Tariffs_one as unknown as TariffDTO;
  // }

  // async deleteTariff(tariffId: number): Promise<void> {
  //   await this.ocpiGraphqlClient.request<any>(DELETE_TARIFF_MUTATION, {
  //     tariffId,
  //   });
  // }
}
