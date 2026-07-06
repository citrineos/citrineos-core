// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AuthorizationDto, LocationDto, TariffDto, TransactionDto } from '@citrineos/base';
import type { TokenDTO } from '../model/DTO/TokenDTO.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { Price } from '../model/Price.js';
import type { Session } from '../model/Session.js';
import type { Tariff as OcpiTariff } from '../model/Tariff.js';
import type { LocationDTO } from '../model/DTO/LocationDTO.js';
import { LocationsService } from '../services/LocationsService.js';
import type {
  GetAuthorizationByIdQueryResult,
  GetAuthorizationByIdQueryVariables,
  GetLocationByIdQueryResult,
  GetLocationByIdQueryVariables,
  GetTariffByKeyQueryResult,
  GetTariffByKeyQueryVariables,
} from '../graphql/index.js';
import {
  GET_AUTHORIZATION_BY_ID,
  GET_LOCATION_BY_ID_QUERY,
  GET_TARIFF_BY_KEY_QUERY,
  OcpiGraphqlClient,
} from '../graphql/index.js';
import { LocationMapper } from './LocationMapper.js';
import { TokensMapper } from './TokensMapper.js';
import { TariffMapper } from './TariffMapper.js';

export abstract class BaseTransactionMapper {
  protected constructor(
    protected logger: Logger<ILogObj>,
    protected locationsService: LocationsService,
    protected ocpiGraphqlClient: OcpiGraphqlClient,
  ) {}

  public async getLocationDTOsForTransactions(
    transactions: TransactionDto[],
  ): Promise<Map<string, LocationDTO>> {
    const transactionIdToLocationMap: Map<string, LocationDTO> = new Map();
    for (const transaction of transactions) {
      if (!transaction.location && transaction.locationId) {
        const result = await this.ocpiGraphqlClient.request<
          GetLocationByIdQueryResult,
          GetLocationByIdQueryVariables
        >(GET_LOCATION_BY_ID_QUERY, { id: transaction.locationId });
        transaction.location = result.Locations[0] as LocationDto;
      }
      const location = transaction.location;
      if (!location) {
        this.logger.debug(
          `Skipping transaction ${transaction.id} location ${transaction.locationId}`,
        );
        continue;
      }

      const locationDto = LocationMapper.fromGraphql(location);

      transactionIdToLocationMap.set(transaction.transactionId!, locationDto);
    }
    return transactionIdToLocationMap;
  }

  protected async getTokensForTransactions(
    transactions: TransactionDto[],
  ): Promise<Map<string, TokenDTO>> {
    const transactionIdToTokenMap: Map<string, TokenDTO> = new Map();

    for (const transaction of transactions) {
      if (!transaction.authorization && transaction.authorizationId) {
        const result = await this.ocpiGraphqlClient.request<
          GetAuthorizationByIdQueryResult,
          GetAuthorizationByIdQueryVariables
        >(GET_AUTHORIZATION_BY_ID, { id: transaction.authorizationId });
        if (result.Authorizations_by_pk) {
          transaction.authorization = result.Authorizations_by_pk as AuthorizationDto;
        }
      }
      if (transaction.authorization) {
        const tokenDto = await TokensMapper.toDto(transaction.authorization);
        if (tokenDto) {
          transactionIdToTokenMap.set(transaction.transactionId!, tokenDto);
        } else {
          this.logger.debug(`Unmapped token for transaction ${transaction.id}`);
        }
      } else {
        this.logger.debug(`No token for transaction ${transaction.id}`);
      }
    }

    return transactionIdToTokenMap;
  }

  protected async getTariffsForTransactions(
    transactions: TransactionDto[],
  ): Promise<Map<string, TariffDto>> {
    const transactionIdToTariffMap = new Map<string, TariffDto>();
    for (const transaction of transactions) {
      if (!transaction.tariff && transaction.tariffId) {
        const result = await this.ocpiGraphqlClient.request<
          GetTariffByKeyQueryResult,
          GetTariffByKeyQueryVariables
        >(GET_TARIFF_BY_KEY_QUERY, {
          id: transaction.tariffId,
          countryCode: transaction.tenant!.countryCode!,
          partyId: transaction.tenant!.partyId!,
        });
        if (result.Tariffs[0]) {
          transaction.tariff = result.Tariffs[0] as TariffDto;
        }
      }
      const tariff = transaction.tariff;
      if (tariff) {
        transactionIdToTariffMap.set(transaction.transactionId!, tariff);
      } else {
        this.logger.debug(`No tariff for ${transaction.id}`);
      }
    }
    return transactionIdToTariffMap;
  }

  protected async getOcpiTariffsForTransactions(
    sessions: Session[],
    transactionIdToTariffMap: Map<string, TariffDto>,
  ): Promise<Map<string, OcpiTariff>> {
    const transactionIdToOcpiTariffMap = new Map<string, OcpiTariff>();
    await Promise.all(
      sessions
        .filter((session) => transactionIdToTariffMap.get(session.id))
        .map(async (session) => {
          const tariffVariables = {
            id: transactionIdToTariffMap.get(session.id)!.id!,
            // TODO: Ensure CPO Country Code, Party ID exists for the tariff in question
            countryCode: session.country_code,
            partyId: session.party_id,
          };
          const result = await this.ocpiGraphqlClient.request<
            GetTariffByKeyQueryResult,
            GetTariffByKeyQueryVariables
          >(GET_TARIFF_BY_KEY_QUERY, tariffVariables);
          const tariff = result.Tariffs[0] as TariffDto;
          if (tariff) {
            transactionIdToOcpiTariffMap.set(session.id, TariffMapper.map(tariff));
          }
        }),
    );
    return transactionIdToOcpiTariffMap;
  }

  protected calculateTotalCost(totalKwh: number, tariffCost: number): Price {
    return {
      excl_vat: Math.floor(totalKwh * tariffCost * 100) / 100,
    };
  }
}
