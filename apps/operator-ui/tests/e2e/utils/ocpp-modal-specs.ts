// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Single source of truth for the OCPP modal inventory. 31 entries, all
// dispatchable (each has a UI component, a ModalComponentType, a registry
// entry, and is reachable via a command-bar button or the OtherCommandsModal
// dispatcher). The parametric harness
// (tests/e2e/specs/charging-stations/commands.parametric.spec.ts) smoke-tests
// every entry.
//
// Each entry maps a modal to:
//   - the OCPP version(s) it serves
//   - its category (shared / 1.6 / 2.0.1 / admin / status)
//   - its priority (P0/P1/P2)
//   - the bespoke E2E-XXX scenarios (if any) that cover it at depth
//   - parametricOnly (true when no bespoke scenarios exist; the parametric
//     harness then provides the only coverage at smoke depth)
//   - dispatchable: whether the modal can actually be opened from the UI
//   - openButtonNamePattern: the regex matched by getByRole('button', { name }).
//     For modals reachable only via the OtherCommandsModal dispatcher, this is
//     the menu-item accessible name inside that dispatcher.
//   - titlePattern: the regex matched against the opened dialog's heading. The
//     parametric harness asserts THIS (not just "a dialog is visible") so it
//     can never false-positive on the still-open dispatcher.

export interface ModalSpec {
  readonly name: string;
  readonly versions: ReadonlyArray<'1.6' | '2.0.1' | 'shared' | 'admin'>;
  readonly category: 'shared' | 'ocpp1.6' | 'ocpp2.0.1' | 'admin' | 'toggle-status';
  readonly priority: 'P0' | 'P1' | 'P2';
  readonly bespokeScenarios: ReadonlyArray<string>;
  readonly parametricOnly: boolean;
  readonly dispatchable: boolean;
  readonly openButtonNamePattern: RegExp;
  readonly titlePattern: RegExp;
}

// Total entries in the table.
export const OCPP_MODAL_COUNT = 31;
// Entries that can actually be opened from the UI (dispatchable === true).
// Every entry is dispatchable, so this matches OCPP_MODAL_COUNT.
export const DISPATCHABLE_MODAL_COUNT = 31;

export const OCPP_MODAL_SPECS: ReadonlyArray<ModalSpec> = [
  // Shared (5)
  {
    name: 'RemoteStartTransactionModal',
    versions: ['shared'],
    category: 'shared',
    priority: 'P0',
    bespokeScenarios: ['E2E-074', 'E2E-075', 'E2E-076'],
    parametricOnly: false,
    dispatchable: true,
    openButtonNamePattern: /remote start|start transaction/i,
    titlePattern: /remote start|start transaction/i,
  },
  {
    name: 'RemoteStopTransactionModal',
    versions: ['shared'],
    category: 'shared',
    priority: 'P0',
    bespokeScenarios: ['E2E-077', 'E2E-077b', 'E2E-078'],
    parametricOnly: false,
    dispatchable: true,
    openButtonNamePattern: /remote stop|stop transaction/i,
    titlePattern: /remote stop|stop transaction/i,
  },
  {
    name: 'ResetModal',
    versions: ['shared'],
    category: 'shared',
    priority: 'P0',
    bespokeScenarios: ['E2E-070', 'E2E-071', 'E2E-072', 'E2E-073'],
    parametricOnly: false,
    dispatchable: true,
    openButtonNamePattern: /^reset$/i,
    titlePattern: /reset/i,
  },
  {
    name: 'OtherCommandsModal',
    versions: ['shared'],
    category: 'shared',
    priority: 'P2',
    bespokeScenarios: ['E2E-088'],
    parametricOnly: false,
    dispatchable: true,
    openButtonNamePattern: /other commands/i,
    titlePattern: /other commands/i,
  },
  {
    name: 'DataTransferModal',
    versions: ['shared'],
    category: 'shared',
    priority: 'P0',
    bespokeScenarios: ['E2E-087', 'E2E-087b'],
    parametricOnly: false,
    dispatchable: true,
    openButtonNamePattern: /data transfer/i,
    titlePattern: /data transfer/i,
  },

  // OCPP 1.6 (6)
  {
    name: 'ChangeAvailabilityModal16',
    versions: ['1.6'],
    category: 'ocpp1.6',
    priority: 'P0',
    bespokeScenarios: ['E2E-083'],
    parametricOnly: false,
    dispatchable: true,
    openButtonNamePattern: /change availability/i,
    titlePattern: /change availability/i,
  },
  {
    name: 'ChangeConfigurationModal',
    versions: ['1.6'],
    category: 'ocpp1.6',
    priority: 'P0',
    bespokeScenarios: ['E2E-082b'],
    parametricOnly: false,
    dispatchable: true,
    openButtonNamePattern: /change configuration/i,
    titlePattern: /change configuration/i,
  },
  {
    name: 'GetConfigurationModal',
    versions: ['1.6'],
    category: 'ocpp1.6',
    priority: 'P1',
    bespokeScenarios: [],
    parametricOnly: true,
    dispatchable: true,
    openButtonNamePattern: /get configuration/i,
    titlePattern: /get configuration/i,
  },
  {
    name: 'GetDiagnosticsModal',
    versions: ['1.6'],
    category: 'ocpp1.6',
    priority: 'P1',
    bespokeScenarios: [],
    parametricOnly: true,
    dispatchable: true,
    openButtonNamePattern: /get diagnostics/i,
    titlePattern: /get diagnostics/i,
  },
  {
    name: 'TriggerMessageModal16',
    versions: ['1.6'],
    category: 'ocpp1.6',
    priority: 'P0',
    bespokeScenarios: ['E2E-084', 'E2E-084b'],
    parametricOnly: false,
    dispatchable: true,
    openButtonNamePattern: /trigger message/i,
    titlePattern: /trigger message/i,
  },
  {
    name: 'UpdateFirmwareModal16',
    versions: ['1.6'],
    category: 'ocpp1.6',
    priority: 'P0',
    bespokeScenarios: ['E2E-085'],
    parametricOnly: false,
    dispatchable: true,
    openButtonNamePattern: /update firmware/i,
    titlePattern: /update firmware/i,
  },

  // OCPP 2.0.1 (18)
  {
    name: 'ChangeAvailabilityModal201',
    versions: ['2.0.1'],
    category: 'ocpp2.0.1',
    priority: 'P0',
    bespokeScenarios: ['E2E-082'],
    parametricOnly: false,
    dispatchable: true,
    openButtonNamePattern: /change availability/i,
    titlePattern: /change availability/i,
  },
  {
    name: 'CertificateSignedModal',
    versions: ['2.0.1'],
    category: 'ocpp2.0.1',
    priority: 'P1',
    bespokeScenarios: [],
    parametricOnly: true,
    dispatchable: true,
    openButtonNamePattern: /certificate signed/i,
    titlePattern: /certificate signed/i,
  },
  {
    name: 'ClearCacheModal',
    versions: ['2.0.1'],
    category: 'ocpp2.0.1',
    priority: 'P1',
    bespokeScenarios: [],
    parametricOnly: true,
    dispatchable: true,
    openButtonNamePattern: /clear cache/i,
    titlePattern: /clear cache/i,
  },
  {
    name: 'CustomerInformationModal',
    versions: ['2.0.1'],
    category: 'ocpp2.0.1',
    priority: 'P1',
    bespokeScenarios: [],
    parametricOnly: true,
    dispatchable: true,
    openButtonNamePattern: /customer information/i,
    titlePattern: /customer information/i,
  },
  {
    name: 'DeleteCertificateModal',
    versions: ['2.0.1'],
    category: 'ocpp2.0.1',
    priority: 'P0',
    bespokeScenarios: [],
    parametricOnly: true,
    dispatchable: true,
    openButtonNamePattern: /delete certificate/i,
    titlePattern: /delete certificate/i,
  },
  {
    name: 'DeleteStationNetworkProfilesModal',
    versions: ['2.0.1'],
    category: 'ocpp2.0.1',
    priority: 'P1',
    bespokeScenarios: [],
    parametricOnly: true,
    dispatchable: true,
    openButtonNamePattern: /delete (station )?network profiles?/i,
    titlePattern: /network profiles?/i,
  },
  {
    name: 'GetBaseReportModal',
    versions: ['2.0.1'],
    category: 'ocpp2.0.1',
    priority: 'P1',
    bespokeScenarios: [],
    parametricOnly: true,
    dispatchable: true,
    openButtonNamePattern: /get base report/i,
    titlePattern: /get base report/i,
  },
  {
    name: 'GetInstalledCertificateIdsModal',
    versions: ['2.0.1'],
    category: 'ocpp2.0.1',
    priority: 'P1',
    bespokeScenarios: [],
    parametricOnly: true,
    dispatchable: true,
    openButtonNamePattern: /get installed certificate/i,
    titlePattern: /installed certificate/i,
  },
  {
    name: 'GetLogsModal',
    versions: ['2.0.1'],
    category: 'ocpp2.0.1',
    priority: 'P1',
    bespokeScenarios: [],
    parametricOnly: true,
    dispatchable: true,
    openButtonNamePattern: /get logs/i,
    titlePattern: /get logs?/i,
  },
  {
    name: 'GetTransactionStatusModal',
    versions: ['2.0.1'],
    category: 'ocpp2.0.1',
    priority: 'P0',
    bespokeScenarios: [],
    parametricOnly: true,
    dispatchable: true,
    openButtonNamePattern: /get transaction status/i,
    titlePattern: /get transaction status/i,
  },
  {
    name: 'GetVariablesModal',
    versions: ['2.0.1'],
    category: 'ocpp2.0.1',
    priority: 'P0',
    bespokeScenarios: ['E2E-079', 'E2E-080'],
    parametricOnly: false,
    dispatchable: true,
    openButtonNamePattern: /get variables/i,
    titlePattern: /get variables/i,
  },
  {
    name: 'InstallCertificateModal',
    versions: ['2.0.1'],
    category: 'ocpp2.0.1',
    priority: 'P0',
    bespokeScenarios: [],
    parametricOnly: true,
    dispatchable: true,
    openButtonNamePattern: /install certificate/i,
    titlePattern: /install certificate/i,
  },
  {
    name: 'SetNetworkProfileModal',
    versions: ['2.0.1'],
    category: 'ocpp2.0.1',
    priority: 'P0',
    bespokeScenarios: [],
    parametricOnly: true,
    dispatchable: true,
    openButtonNamePattern: /set network profile/i,
    titlePattern: /network profile/i,
  },
  {
    name: 'SetVariablesModal',
    versions: ['2.0.1'],
    category: 'ocpp2.0.1',
    priority: 'P0',
    bespokeScenarios: ['E2E-089', 'E2E-089b'],
    parametricOnly: false,
    dispatchable: true,
    openButtonNamePattern: /set variables/i,
    titlePattern: /set variables/i,
  },
  {
    name: 'TriggerMessageModal201',
    versions: ['2.0.1'],
    category: 'ocpp2.0.1',
    priority: 'P0',
    bespokeScenarios: ['E2E-084', 'E2E-084b'],
    parametricOnly: false,
    dispatchable: true,
    openButtonNamePattern: /trigger message/i,
    titlePattern: /trigger message/i,
  },
  {
    name: 'UnlockConnectorModal',
    versions: ['2.0.1'],
    category: 'ocpp2.0.1',
    priority: 'P0',
    bespokeScenarios: ['E2E-086', 'E2E-086b'],
    parametricOnly: false,
    dispatchable: true,
    openButtonNamePattern: /unlock connector/i,
    titlePattern: /unlock connector/i,
  },
  {
    name: 'UpdateAuthPasswordModal',
    versions: ['2.0.1'],
    category: 'ocpp2.0.1',
    priority: 'P0',
    bespokeScenarios: [],
    parametricOnly: true,
    dispatchable: true,
    openButtonNamePattern: /update auth password/i,
    titlePattern: /auth password/i,
  },
  {
    name: 'UpdateFirmwareModal201',
    versions: ['2.0.1'],
    category: 'ocpp2.0.1',
    priority: 'P0',
    bespokeScenarios: ['E2E-085'],
    parametricOnly: false,
    dispatchable: true,
    openButtonNamePattern: /update firmware/i,
    titlePattern: /update firmware/i,
  },

  // Admin + status toggles (2)
  {
    name: 'ForceDisconnectModal',
    versions: ['admin'],
    category: 'admin',
    priority: 'P0',
    bespokeScenarios: [],
    parametricOnly: true,
    dispatchable: true,
    openButtonNamePattern: /force disconnect/i,
    titlePattern: /force disconnect/i,
  },
  {
    name: 'ToggleStationOnlineModal',
    versions: ['admin'],
    category: 'toggle-status',
    priority: 'P1',
    bespokeScenarios: [],
    parametricOnly: true,
    dispatchable: true,
    openButtonNamePattern: /toggle (station )?online/i,
    titlePattern: /online/i,
  },
];

if (OCPP_MODAL_SPECS.length !== OCPP_MODAL_COUNT) {
  // Eager fail at module load so an accidental edit cannot leave the table out
  // of sync with the inventory count.
  throw new Error(
    `OCPP_MODAL_SPECS must have exactly ${OCPP_MODAL_COUNT} entries; found ${OCPP_MODAL_SPECS.length}.`,
  );
}

const dispatchableCount = OCPP_MODAL_SPECS.filter((s) => s.dispatchable).length;
if (dispatchableCount !== DISPATCHABLE_MODAL_COUNT) {
  throw new Error(
    `Expected ${DISPATCHABLE_MODAL_COUNT} dispatchable modals; found ${dispatchableCount}.`,
  );
}
