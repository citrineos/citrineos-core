// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ModalComponentType } from '@lib/client/components/modals/modal.types';

/**
 * Command definition for OCPP 1.6 commands
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
 * Registry of all OCPP 1.6 commands
 *
 * This registry maps command identifiers to their modal types.
 * To add a new command:
 * 1. Add the modal component to src/lib/client/components/modals/index.tsx
 * 2. Add the corresponding ModalComponentType enum value
 * 3. Add a new entry to this registry with a unique key
 */
export const OCPP1_6_COMMANDS_REGISTRY: Record<string, CommandDefinition> = {
  'Change Availability': {
    displayName: 'Change Availability',
    displayNameKey: 'ChargingStations.commands.changeAvailability',
    modalType: ModalComponentType.changeAvailability16,
  },
  'Data Transfer': {
    displayName: 'Data Transfer',
    displayNameKey: 'ChargingStations.commands.dataTransfer',
    modalType: ModalComponentType.dataTransfer,
  },
  'Change Configuration': {
    displayName: 'Change Configuration',
    displayNameKey: 'ChargingStations.commands.changeConfiguration',
    modalType: ModalComponentType.changeConfiguration16,
  },
  'Get Configuration': {
    displayName: 'Get Configuration',
    displayNameKey: 'ChargingStations.commands.getConfiguration',
    modalType: ModalComponentType.getConfiguration16,
  },
  'Get Diagnostics': {
    displayName: 'Get Diagnostics',
    displayNameKey: 'ChargingStations.commands.getDiagnostics',
    modalType: ModalComponentType.getDiagnostics16,
  },
  'Trigger Message': {
    displayName: 'Trigger Message',
    displayNameKey: 'ChargingStations.commands.triggerMessage',
    modalType: ModalComponentType.triggerMessage16,
  },
  'Update Firmware': {
    displayName: 'Update Firmware',
    displayNameKey: 'ChargingStations.commands.updateFirmware',
    modalType: ModalComponentType.updateFirmware16,
  },
};

/**
 * Get all command keys in the registry
 */
export const getOCPP16CommandKeys = (): string[] => {
  return Object.keys(OCPP1_6_COMMANDS_REGISTRY);
};

/**
 * Get command definition by key
 */
export const getOCPP16Command = (key: string): CommandDefinition | undefined => {
  return OCPP1_6_COMMANDS_REGISTRY[key];
};
