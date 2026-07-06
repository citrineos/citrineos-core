// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export interface GetTariffsParams {
  limit: number;
  offset: number;
  dateFrom?: Date;
  dateTo?: Date;
  cpoCountryCode?: string;
  cpoPartyId?: string;
}

export function buildGetTariffsParams(
  limit: number,
  offset: number,
  dateFrom?: Date,
  dateTo?: Date,
  cpoCountryCode?: string,
  cpoPartyId?: string,
): GetTariffsParams {
  return {
    limit,
    offset,
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(cpoCountryCode && { cpoCountryCode }),
    ...(cpoPartyId && { cpoPartyId }),
  };
}
