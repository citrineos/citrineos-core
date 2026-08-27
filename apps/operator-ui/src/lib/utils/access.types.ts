// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { HasuraHeader } from '@lib/utils/hasura.types';
import type { BaseKey, CanParams, CanReturnType, IResourceItem } from '@refinedev/core';
import React from 'react';

export type AuthenticationContextProvider = {
  getToken: () => Promise<string | undefined>;
  getUserRole: () => Promise<string | undefined>;
  getHasuraHeaders: () => Promise<Map<HasuraHeader, string>>;
  getInitialized: () => Promise<boolean>;
  getLoginPage: () => React.ComponentType;
};

export type User = {
  id: string;
  name: string;
  email?: string;
  roles: string[];
};

export enum ResourceType {
  AUTHORIZATIONS = 'Authorizations',
  BOOTS = 'Boots',
  SECURITY_EVENTS = 'SecurityEvents',
  CHARGING_STATIONS = 'ChargingStations',
  OCPP_MESSAGES = 'OCPPMessages',
  CHARGING_STATION_SEQUENCES = 'ChargingStationSequences',
  CONNECTORS = 'Connectors',
  LOCATIONS = 'Locations',
  STATUS_NOTIFICATIONS = 'StatusNotifications',
  TARIFFS = 'Tariffs',
  SUBSCRIPTIONS = 'Subscriptions',
  TRANSACTIONS = 'Transactions',
  TRANSACTION_EVENTS = 'TransactionEvents',
  METER_VALUES = 'MeterValues',
  CHARGING_PROFILES = 'ChargingProfiles',
  MESSAGE_INFOS = 'MessageInfos',
  EVSES = 'Evses',
  VARIABLE_ATTRIBUTES = 'VariableAttributes',
  VARIABLES = 'Variables',
  COMPONENTS = 'Components',
  VARIABLE_MONITORINGS = 'VariableMonitorings',
  CERTIFICATES = 'Certificates',
  INSTALLED_CERTIFICATES = 'InstalledCertificates',
  RESERVATIONS = 'Reservations',
  SERVER_NETWORK_PROFILES = 'ServerNetworkProfiles',
  PARTNERS = 'TenantPartners',
  TENANTS = 'Tenants',
}

export enum ActionType {
  LIST = 'list',
  SHOW = 'show',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  /**
   * For accessing sub-resources, accessType param must be set
   */
  ACCESS = 'access',
  /**
   * For sending commands to the charging station, commandType param must be set
   */
  COMMAND = 'command',
}

export enum ChargingStationAccessType {
  TOPOLOGY = 'topology',
  CONFIGURATION = 'configuration',
  OCPP_MESSAGES = 'ocpp-messages',
}

export enum CommandType {
  FORCE_DISCONNECT = 'forceDisconnect',
  START_TRANSACTION = 'startTransaction',
  STOP_TRANSACTION = 'stopTransaction',
  RESET = 'reset',
  OTHER_COMMANDS = 'otherCommands',
}

export enum TransactionAccessType {
  EVENTS = 'events',
}

type AccessType = ChargingStationAccessType & TransactionAccessType;

// Copied from @refinedev/core/src/contexts/accessControl/types.ts because it is not exported
type ITreeResource = IResourceItem & {
  key?: string;
  children: ITreeResource[];
};

export interface OperatorCanParams extends CanParams {
  params?: {
    resource?: IResourceItem & { children?: ITreeResource[] };
    id?: BaseKey;
    accessType?: AccessType;
    commandType?: CommandType;
  };
}

// Extended return type with meta information for list-based permissions
// If a parameter matches an exception, the permission is the opposite of the can field
export interface ListCanReturnType extends CanReturnType {
  meta?: {
    exceptions: Array<{
      param: string;
      values: string[];
    }>;
  };
}
