// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export interface AuthorizationRestrictions {
  /**
   * If present, connector types this authorization profile is permitted to charge at.
   * SHALL use options in {@link ConnectorEnumType} if applicable, plus "cGBT, cChaoJi,
   * OppCharge" as mentioned in information model, or a custom option if nothing else
   * fits.
   */
  allowedConnectorTypes?: string[];

  /**
   * If present, this list will be used to prevent charging at evses which match one of
   * its strings. EvseId is as defined in Part 2 - Appendices of OCPP 2.0.1, which
   * references the ISO 15118/IEC 63119-2 format. Strings in this list are treated as
   * prefixes for matching purposes to allow hierarchical id semantics to exclude entire
   * stations with one entry, i.e. "US\*A23\*E00235" will match "US\*A23\*E00235\*1" and
   * "US\*A23\*E00235\*2", which could represent Evse 1 and 2 at the same station.
   */
  disallowedEvseIdPrefixes?: string[];
}
