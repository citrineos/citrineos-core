// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ModalComponentType } from '@lib/client/components/modals/modal.types';

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
  },
  'Change Availability': {
    displayName: 'Change Availability',
    displayNameKey: 'ChargingStations.commands.changeAvailability',
    modalType: ModalComponentType.changeAvailability201,
  },
  'Clear Cache': {
    displayName: 'Clear Cache',
    displayNameKey: 'ChargingStations.commands.clearCache',
    modalType: ModalComponentType.clearCache,
  },
  'Customer Information': {
    displayName: 'Customer Information',
    displayNameKey: 'ChargingStations.commands.customerInformation',
    modalType: ModalComponentType.customerInformation,
  },
  'Data Transfer': {
    displayName: 'Data Transfer',
    displayNameKey: 'ChargingStations.commands.dataTransfer',
    modalType: ModalComponentType.dataTransfer,
  },
  'Delete Certificate': {
    displayName: 'Delete Certificate',
    displayNameKey: 'ChargingStations.commands.deleteCertificate',
    modalType: ModalComponentType.deleteCertificate,
  },
  'Delete Station Network Profiles': {
    displayName: 'Delete Station Network Profiles',
    displayNameKey: 'ChargingStations.commands.deleteStationNetworkProfiles',
    modalType: ModalComponentType.deleteStationNetworkProfiles,
  },
  'Get Base Report': {
    displayName: 'Get Base Report',
    displayNameKey: 'ChargingStations.commands.getBaseReport',
    modalType: ModalComponentType.getBaseReport,
  },
  'Get Installed Certificate IDs': {
    displayName: 'Get Installed Certificate IDs',
    displayNameKey: 'ChargingStations.commands.getInstalledCertificateIds',
    modalType: ModalComponentType.getInstalledCertificateIds,
  },
  'Get Logs': {
    displayName: 'Get Logs',
    displayNameKey: 'ChargingStations.commands.getLogs',
    modalType: ModalComponentType.getLogs,
  },
  'Get Transaction Status': {
    displayName: 'Get Transaction Status',
    displayNameKey: 'ChargingStations.commands.getTransactionStatus',
    modalType: ModalComponentType.getTransactionStatus,
  },
  'Get Variables': {
    displayName: 'Get Variables',
    displayNameKey: 'ChargingStations.commands.getVariables',
    modalType: ModalComponentType.getVariables,
  },
  'Install Certificate': {
    displayName: 'Install Certificate',
    displayNameKey: 'ChargingStations.commands.installCertificate',
    modalType: ModalComponentType.installCertificate,
  },
  'Set Network Profile': {
    displayName: 'Set Network Profile',
    displayNameKey: 'ChargingStations.commands.setNetworkProfile',
    modalType: ModalComponentType.setNetworkProfile,
  },
  'Set Variables': {
    displayName: 'Set Variables',
    displayNameKey: 'ChargingStations.commands.setVariables',
    modalType: ModalComponentType.setVariables,
  },
  'Trigger Message': {
    displayName: 'Trigger Message',
    displayNameKey: 'ChargingStations.commands.triggerMessage',
    modalType: ModalComponentType.triggerMessage201,
  },
  'Unlock Connector': {
    displayName: 'Unlock Connector',
    displayNameKey: 'ChargingStations.commands.unlockConnector',
    modalType: ModalComponentType.unlockConnector,
  },
  'Update Auth Password': {
    displayName: 'Update Auth Password',
    displayNameKey: 'ChargingStations.commands.updateAuthPassword',
    modalType: ModalComponentType.updateAuthPassword,
  },
  'Update Firmware': {
    displayName: 'Update Firmware',
    displayNameKey: 'ChargingStations.commands.updateFirmware',
    modalType: ModalComponentType.updateFirmware201,
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
