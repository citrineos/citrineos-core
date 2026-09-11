// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export { resolveStationProtocol } from './station-protocol.js';
export type { ReadChargingStation, StationProtocolResolution } from './station-protocol.js';
export { getSizeOfRequest, getBatches, stringToSet } from './parser.js';
export {
  validateLanguageTag,
  validateChargingProfileType,
  validateIdToken,
  validateOcpp21IdToken,
  validateVINIdToken,
  validateEVCCIDIdToken,
  validateISO15693IdToken,
  validateISO14443IdToken,
  validateIdentifierStringIdToken,
  validateNoAuthorizationIdToken,
  type ValidationResult,
  validateASCIIContent,
  validateHTMLContent,
  validateURIContent,
  validateUTF8Content,
  validateMessageContent,
  validateMessageContentType,
  validatePEMEncodedCSR,
  validateTariffConditionsTimeFields,
  type ChargingProfileTransactionContext,
  type ChargingProfileValidation,
} from './validator.js';
export { IdGenerator } from './id-generator.js';

export {
  assertSequelizeSchemaMatches,
  compareNullability,
  compareTypes,
  DEFAULT_SCHEMA,
  SchemaValidationError,
  validateSequelizeSchema,
  type SchemaFinding,
  type SchemaFindingKind,
  type SchemaFindingSeverity,
  type SchemaValidationOptions,
  type SchemaValidationReport,
} from './sequelize-schema-validator.js';
