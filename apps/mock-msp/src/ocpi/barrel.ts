// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// FILE: apps/mock-msp/src/ocpi/barrel.ts
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
export { EndpointSchema } from '@citrineos/ocpi-base/dist/model/Endpoint.js';
export { VersionDetailsDTOSchema } from '@citrineos/ocpi-base/dist/model/DTO/VersionDetailsDTO.js';
export { LocationDTOSchema } from '@citrineos/ocpi-base/dist/model/DTO/LocationDTO.js';
export { EvseDTOSchema } from '@citrineos/ocpi-base/dist/model/DTO/EvseDTO.js';
export { ConnectorDTOSchema } from '@citrineos/ocpi-base/dist/model/DTO/ConnectorDTO.js';
export { SessionSchema } from '@citrineos/ocpi-base/dist/model/Session.js';
export { CdrSchema } from '@citrineos/ocpi-base/dist/model/Cdr.js';
export { TariffDTOSchema } from '@citrineos/ocpi-base/dist/model/DTO/tariffs/TariffDTO.js';
export {
  AuthorizationInfoSchema,
  AuthorizationInfoResponseSchema,
} from '@citrineos/ocpi-base/dist/model/AuthorizationInfo.js';
export { LocationReferencesSchema } from '@citrineos/ocpi-base/dist/model/LocationReferences.js';
export { CommandResultSchema } from '@citrineos/ocpi-base/dist/model/CommandResult.js';
export { ActiveChargingProfileSchema } from '@citrineos/ocpi-base/dist/model/ActiveChargingProfile.js';
