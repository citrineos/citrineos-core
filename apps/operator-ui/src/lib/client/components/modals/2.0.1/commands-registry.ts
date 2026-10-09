// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ModalComponentType } from '@lib/client/components/modals/modal-types';
import {
  PERMISSION_CERTIFICATE_SIGNED,
  PERMISSION_CHANGE_AVAILABILITY,
  PERMISSION_CLEAR_CACHE,
  PERMISSION_CUSTOMER_INFORMATION,
  PERMISSION_DATA_TRANSFER,
  PERMISSION_DELETE_CERTIFICATE,
  PERMISSION_DELETE_STATION_NETWORK_PROFILE,
  PERMISSION_GET_BASE_REPORT,
  PERMISSION_GET_INSTALLED_CERTIFICATE_IDS,
  PERMISSION_GET_LOG,
  PERMISSION_GET_TRANSACTION_STATUS,
  PERMISSION_GET_VARIABLES,
  PERMISSION_INSTALL_CERTIFICATE,
  PERMISSION_SET_NETWORK_PROFILE,
  PERMISSION_SET_STATION_PASSWORD,
  PERMISSION_SET_VARIABLES,
  PERMISSION_TRIGGER_MESSAGE,
  PERMISSION_UNLOCK_CONNECTOR,
  PERMISSION_UPDATE_FIRMWARE,
} from '@lib/utils/permissions';

/**
 * Command definition for OCPP 2.0.1 commands
 */
export interface CommandDefinition {
  /** Display name shown in the UI (English fallback) */
  displayName: string;
  /** i18n key resolving to the localized display name */
  displayNameKey: string;
  /** Modal component type for registration */
  modalType: ModalComponentType;
  permission: string;
}

/**
 * Registry of all OCPP 2.0.1 commands
 *
 * This registry maps command identifiers to their modal types.
 * To add a new command:
 * 1. Add the modal component to src/lib/client/components/modals/index.tsx
 * 2. Add the corresponding ModalComponentType enum value
 * 3. Add a new entry to this registry with a unique key
 */
export const OCPP2_0_1_COMMANDS_REGISTRY: Record<string, CommandDefinition> = {
  'Certificate Signed': {
    displayName: 'Certificate Signed',
    displayNameKey: 'ChargingStations.commands.certificateSigned',
    modalType: ModalComponentType.certificateSigned,
    permission: PERMISSION_CERTIFICATE_SIGNED,
  },
  'Change Availability': {
    displayName: 'Change Availability',
    displayNameKey: 'ChargingStations.commands.changeAvailability',
    modalType: ModalComponentType.changeAvailability201,
    permission: PERMISSION_CHANGE_AVAILABILITY,
  },
  'Clear Cache': {
    displayName: 'Clear Cache',
    displayNameKey: 'ChargingStations.commands.clearCache',
    modalType: ModalComponentType.clearCache,
    permission: PERMISSION_CLEAR_CACHE,
  },
  'Customer Information': {
    displayName: 'Customer Information',
    displayNameKey: 'ChargingStations.commands.customerInformation',
    modalType: ModalComponentType.customerInformation,
    permission: PERMISSION_CUSTOMER_INFORMATION,
  },
  'Data Transfer': {
    displayName: 'Data Transfer',
    displayNameKey: 'ChargingStations.commands.dataTransfer',
    modalType: ModalComponentType.dataTransfer,
    permission: PERMISSION_DATA_TRANSFER,
  },
  'Delete Certificate': {
    displayName: 'Delete Certificate',
    displayNameKey: 'ChargingStations.commands.deleteCertificate',
    modalType: ModalComponentType.deleteCertificate,
    permission: PERMISSION_DELETE_CERTIFICATE,
  },
  'Delete Station Network Profiles': {
    displayName: 'Delete Station Network Profiles',
    displayNameKey: 'ChargingStations.commands.deleteStationNetworkProfiles',
    modalType: ModalComponentType.deleteStationNetworkProfiles,
    permission: PERMISSION_DELETE_STATION_NETWORK_PROFILE,
  },
  'Get Base Report': {
    displayName: 'Get Base Report',
    displayNameKey: 'ChargingStations.commands.getBaseReport',
    modalType: ModalComponentType.getBaseReport,
    permission: PERMISSION_GET_BASE_REPORT,
  },
  'Get Installed Certificate IDs': {
    displayName: 'Get Installed Certificate IDs',
    displayNameKey: 'ChargingStations.commands.getInstalledCertificateIds',
    modalType: ModalComponentType.getInstalledCertificateIds,
    permission: PERMISSION_GET_INSTALLED_CERTIFICATE_IDS,
  },
  'Get Logs': {
    displayName: 'Get Logs',
    displayNameKey: 'ChargingStations.commands.getLogs',
    modalType: ModalComponentType.getLogs,
    permission: PERMISSION_GET_LOG,
  },
  'Get Transaction Status': {
    displayName: 'Get Transaction Status',
    displayNameKey: 'ChargingStations.commands.getTransactionStatus',
    modalType: ModalComponentType.getTransactionStatus,
    permission: PERMISSION_GET_TRANSACTION_STATUS,
  },
  'Get Variables': {
    displayName: 'Get Variables',
    displayNameKey: 'ChargingStations.commands.getVariables',
    modalType: ModalComponentType.getVariables,
    permission: PERMISSION_GET_VARIABLES,
  },
  'Install Certificate': {
    displayName: 'Install Certificate',
    displayNameKey: 'ChargingStations.commands.installCertificate',
    modalType: ModalComponentType.installCertificate,
    permission: PERMISSION_INSTALL_CERTIFICATE,
  },
  'Set Network Profile': {
    displayName: 'Set Network Profile',
    displayNameKey: 'ChargingStations.commands.setNetworkProfile',
    modalType: ModalComponentType.setNetworkProfile,
    permission: PERMISSION_SET_NETWORK_PROFILE,
  },
  'Set Variables': {
    displayName: 'Set Variables',
    displayNameKey: 'ChargingStations.commands.setVariables',
    modalType: ModalComponentType.setVariables,
    permission: PERMISSION_SET_VARIABLES,
  },
  'Trigger Message': {
    displayName: 'Trigger Message',
    displayNameKey: 'ChargingStations.commands.triggerMessage',
    modalType: ModalComponentType.triggerMessage201,
    permission: PERMISSION_TRIGGER_MESSAGE,
  },
  'Unlock Connector': {
    displayName: 'Unlock Connector',
    displayNameKey: 'ChargingStations.commands.unlockConnector',
    modalType: ModalComponentType.unlockConnector,
    permission: PERMISSION_UNLOCK_CONNECTOR,
  },
  'Update Auth Password': {
    displayName: 'Update Auth Password',
    displayNameKey: 'ChargingStations.commands.updateAuthPassword',
    modalType: ModalComponentType.updateAuthPassword,
    permission: PERMISSION_SET_STATION_PASSWORD,
  },
  'Update Firmware': {
    displayName: 'Update Firmware',
    displayNameKey: 'ChargingStations.commands.updateFirmware',
    modalType: ModalComponentType.updateFirmware201,
    permission: PERMISSION_UPDATE_FIRMWARE,
  },
};

/**
 * Get all command keys in the registry
 */
export const getOCPP201CommandKeys = (): string[] => {
  return Object.keys(OCPP2_0_1_COMMANDS_REGISTRY);
};

/**
 * Get command definition by key
 */
export const getOCPP201Command = (key: string): CommandDefinition | undefined => {
  return OCPP2_0_1_COMMANDS_REGISTRY[key];
};
