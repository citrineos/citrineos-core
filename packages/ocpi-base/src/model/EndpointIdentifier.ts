// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { InterfaceRole } from './InterfaceRole.js';
import { ModuleId } from './ModuleId.js';

export enum VersionsInterface {
  VERSIONS = 'VERSIONS',
  DETAILS = 'DETAILS',
}

export enum EndpointIdentifier {
  CREDENTIALS = `${ModuleId.Credentials}`,
  LOCATIONS_SENDER = `${ModuleId.Locations}_${InterfaceRole.SENDER}`,
  LOCATIONS_RECEIVER = `${ModuleId.Locations}_${InterfaceRole.RECEIVER}`,
  SESSIONS_SENDER = `${ModuleId.Sessions}_${InterfaceRole.SENDER}`,
  SESSIONS_RECEIVER = `${ModuleId.Sessions}_${InterfaceRole.RECEIVER}`,
  CDRS_SENDER = `${ModuleId.Cdrs}_${InterfaceRole.SENDER}`,
  CDRS_RECEIVER = `${ModuleId.Cdrs}_${InterfaceRole.RECEIVER}`,
  TARIFFS_SENDER = `${ModuleId.Tariffs}_${InterfaceRole.SENDER}`,
  TARIFFS_RECEIVER = `${ModuleId.Tariffs}_${InterfaceRole.RECEIVER}`,
  TOKENS_SENDER = `${ModuleId.Tokens}_${InterfaceRole.SENDER}`,
  TOKENS_RECEIVER = `${ModuleId.Tokens}_${InterfaceRole.RECEIVER}`,
  COMMANDS_SENDER = `${ModuleId.Commands}_${InterfaceRole.SENDER}`,
  COMMANDS_RECEIVER = `${ModuleId.Commands}_${InterfaceRole.RECEIVER}`,
  CHARGING_PROFILES_SENDER = `${ModuleId.ChargingProfiles}_${InterfaceRole.SENDER}`,
  CHARGING_PROFILES_RECEIVER = `${ModuleId.ChargingProfiles}_${InterfaceRole.RECEIVER}`,
}
