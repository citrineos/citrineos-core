// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Enum of all modal component types
 * This file contains ONLY the enum to avoid circular dependencies
 */
export enum ModalComponentType {
  // Admin Commands
  forceDisconnect,
  // Common Commands
  remoteStart,
  remoteStop,
  reset,
  otherCommands,
  // OCPP 1.6 Commands
  changeAvailability16,
  changeConfiguration16,
  getConfiguration16,
  getDiagnostics16,
  triggerMessage16,
  updateFirmware16,
  // Shared Commands (same modal for both OCPP versions)
  dataTransfer,
  // OCPP 2.0.1 Commands
  certificateSigned,
  changeAvailability201,
  clearCache,
  customerInformation,
  deleteCertificate,
  deleteStationNetworkProfiles,
  getBaseReport,
  getInstalledCertificateIds,
  getLogs,
  getTransactionStatus,
  getVariables,
  installCertificate,
  setNetworkProfile,
  setVariables,
  triggerMessage201,
  unlockConnector,
  updateAuthPassword,
  updateFirmware201,
  // Status Toggle Confirmations
  toggleStationOnlineStatus,
  toggleTransactionActiveStatus,
  firstLoginHelp,
}
