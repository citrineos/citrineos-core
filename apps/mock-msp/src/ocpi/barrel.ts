// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// The ONLY file allowed to import from @citrineos/ocpi-base. Everything else
// imports schemas/types from here. zod is the catalog instance (4.1.12) so
// these schemas .parse identically to Citrine's. ocpi-base MUST be built first.
// ============================================================================
export {
  OcpiResponseSchema,
  OcpiEmptyResponseSchema,
  OcpiEmptyResponseSchemaName,
  buildOcpiResponse,
  buildOcpiEmptyResponse,
  OcpiResponseStatusCode,
  CredentialsDTOSchema,
  CredentialsResponseSchema,
  buildCredentialsResponse,
  VersionListResponseDTOSchema,
  TokenDTOSchema,
  TokenType,
  AuthorizationInfoAllowed,
  CommandResponseSchema,
  CommandType,
  CommandResultType,
  SetChargingProfileSchema,
  StartSessionSchema,
  StopSessionSchema,
  ReserveNowSchema,
  CancelReservationSchema,
  UnlockConnectorSchema,
  ModuleId,
  InterfaceRole,
  VersionNumber,
  Role,
} from '@citrineos/ocpi-base';

export type {
  CredentialsDTO,
  CredentialsResponse,
  TokenDTO,
  VersionDTO,
  VersionDetailsDTO,
  CommandResponse,
  AuthorizationInfo,
} from '@citrineos/ocpi-base';

// Bare inner object schemas NOT re-exported by the barrel — deep-import from dist
// (no exports gate blocks this; verified paths/names exist in ocpi-base/src).
export { EndpointSchema } from '@citrineos/ocpi-base/dist/model/endpoint.js';
export { VersionDetailsDTOSchema } from '@citrineos/ocpi-base/dist/model/dto/version-details-dto.js';
export { LocationDTOSchema } from '@citrineos/ocpi-base/dist/model/dto/location-dto.js';
export { EvseDTOSchema } from '@citrineos/ocpi-base/dist/model/dto/evse-dto.js';
export { ConnectorDTOSchema } from '@citrineos/ocpi-base/dist/model/dto/connector-dto.js';
export { SessionSchema } from '@citrineos/ocpi-base/dist/model/session.js';
export { CdrSchema } from '@citrineos/ocpi-base/dist/model/cdr.js';
export { TariffDTOSchema } from '@citrineos/ocpi-base/dist/model/dto/tariffs/tariff-dto.js';
export {
  AuthorizationInfoSchema,
  AuthorizationInfoResponseSchema,
} from '@citrineos/ocpi-base/dist/model/authorization-info.js';
export { LocationReferencesSchema } from '@citrineos/ocpi-base/dist/model/location-references.js';
export { CommandResultSchema } from '@citrineos/ocpi-base/dist/model/command-result.js';
export { ActiveChargingProfileSchema } from '@citrineos/ocpi-base/dist/model/active-charging-profile.js';
