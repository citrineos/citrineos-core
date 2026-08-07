// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Internal types and enums - no imports to avoid circular dependencies
export type HandlerProperties = string | object | undefined;

export class RetryMessageError extends Error {
  constructor(retryReason: string) {
    super(retryReason);
  }
}

export enum MessageState {
  Request = 1,
  Response = 2,
  Unknown = 99,
}

export enum MessageOrigin {
  ChargingStationManagementSystem = 'csms',
  ChargingStation = 'cs',
}

export enum EventGroup {
  All = 'all',
  Router = 'router',
  Modules = 'modules',
  Certificates = 'certificates',
  Configuration = 'configuration',
  EVDriver = 'evdriver',
  Monitoring = 'monitoring',
  Reporting = 'reporting',
  SmartCharging = 'smartcharging',
  Tenant = 'tenant',
  Transactions = 'transactions',
  Cdrs = 'cdrs',
  ChargingProfiles = 'chargingprofiles',
  Commands = 'commands',
  Locations = 'locations',
  Sessions = 'sessions',
  Tariffs = 'tariffs',
  Tokens = 'tokens',
  Versions = 'versions',
  Credentials = 'credentials',
}

export const eventGroupFromString = (source: string): EventGroup => {
  const eventGroup: EventGroup = source as EventGroup;
  if (!eventGroup) {
    throw new Error(`Invalid event group source ${source}"`);
  }
  return eventGroup;
};
