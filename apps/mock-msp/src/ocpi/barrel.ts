// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// The ONLY file allowed to import from @citrineos/ocpi. Everything else
// imports schemas/types from here. zod is the catalog instance (4.1.12) so
// these schemas .parse identically to Citrine's. ocpi MUST be built first.
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
} from '@citrineos/ocpi';

export type {
  CredentialsDTO,
  CredentialsResponse,
  TokenDTO,
  VersionDTO,
  VersionDetailsDTO,
  CommandResponse,
  AuthorizationInfo,
} from '@citrineos/ocpi';

// Bare inner object schemas NOT re-exported by the barrel — deep-import from dist
// (no exports gate blocks this; verified paths/names exist in ocpi/src).
export { EndpointSchema } from '@citrineos/ocpi/dist/src/types/endpoint.js';
export { VersionDetailsDTOSchema } from '@citrineos/ocpi/dist/src/types/dto/version-details-dto.js';
export { LocationDTOSchema } from '@citrineos/ocpi/dist/src/types/dto/location-dto.js';
export { EvseDTOSchema } from '@citrineos/ocpi/dist/src/types/dto/evse-dto.js';
export { ConnectorDTOSchema } from '@citrineos/ocpi/dist/src/types/dto/connector-dto.js';
export { SessionSchema } from '@citrineos/ocpi/dist/src/types/session.js';
export { CdrSchema } from '@citrineos/ocpi/dist/src/types/cdr.js';
export { TariffDTOSchema } from '@citrineos/ocpi/dist/src/types/dto/tariffs/tariff-dto.js';
export {
  AuthorizationInfoSchema,
  AuthorizationInfoResponseSchema,
} from '@citrineos/ocpi/dist/src/types/authorization-info.js';
export { LocationReferencesSchema } from '@citrineos/ocpi/dist/src/types/location-references.js';
export { CommandResultSchema } from '@citrineos/ocpi/dist/src/types/command-result.js';
export { ActiveChargingProfileSchema } from '@citrineos/ocpi/dist/src/types/active-charging-profile.js';
