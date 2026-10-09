// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export const PERMISSION_CERTIFICATE_SIGNED = 'ocpp.certificates.certificateSigned';
export const PERMISSION_DELETE_CERTIFICATE = 'ocpp.certificates.deleteCertificate';
export const PERMISSION_GET_INSTALLED_CERTIFICATE_IDS =
  'ocpp.certificates.getInstalledCertificateIds';
export const PERMISSION_INSTALL_CERTIFICATE = 'ocpp.certificates.installCertificate';

export const PERMISSION_CHANGE_AVAILABILITY = 'ocpp.configuration.changeAvailability';
export const PERMISSION_CHANGE_CONFIGURATION = 'ocpp.configuration.changeConfiguration';
export const PERMISSION_DATA_TRANSFER = 'ocpp.configuration.dataTransfer';
export const PERMISSION_GET_CONFIGURATION = 'ocpp.configuration.getConfiguration';
export const PERMISSION_RESET = 'ocpp.configuration.reset';
export const PERMISSION_SET_NETWORK_PROFILE = 'ocpp.configuration.setNetworkProfile';
export const PERMISSION_TRIGGER_MESSAGE = 'ocpp.configuration.triggerMessage';
export const PERMISSION_UPDATE_FIRMWARE = 'ocpp.configuration.updateFirmware';

export const PERMISSION_CLEAR_CACHE = 'ocpp.evdriver.clearCache';
export const PERMISSION_REMOTE_START_TRANSACTION = 'ocpp.evdriver.remoteStartTransaction';
export const PERMISSION_REMOTE_STOP_TRANSACTION = 'ocpp.evdriver.remoteStopTransaction';
export const PERMISSION_REQUEST_START_TRANSACTION = 'ocpp.evdriver.requestStartTransaction';
export const PERMISSION_REQUEST_STOP_TRANSACTION = 'ocpp.evdriver.requestStopTransaction';
export const PERMISSION_UNLOCK_CONNECTOR = 'ocpp.evdriver.unlockConnector';

export const PERMISSION_GET_VARIABLES = 'ocpp.monitoring.getVariables';
export const PERMISSION_SET_VARIABLES = 'ocpp.monitoring.setVariables';

export const PERMISSION_CUSTOMER_INFORMATION = 'ocpp.reporting.customerInformation';
export const PERMISSION_GET_BASE_REPORT = 'ocpp.reporting.getBaseReport';
export const PERMISSION_GET_DIAGNOSTICS = 'ocpp.reporting.getDiagnostics';
export const PERMISSION_GET_LOG = 'ocpp.reporting.getLog';

export const PERMISSION_GET_TRANSACTION_STATUS = 'ocpp.transactions.getTransactionStatus';

export const PERMISSION_DELETE_STATION_NETWORK_PROFILE = 'commands.stationNetworkProfile.delete';
export const PERMISSION_SET_STATION_PASSWORD = 'commands.setStationPassword.post';
export const PERMISSION_FORCE_DISCONNECT = 'ocpprouter.connection.delete';

export const START_TRANSACTION_PERMISSIONS = [
  PERMISSION_REMOTE_START_TRANSACTION,
  PERMISSION_REQUEST_START_TRANSACTION,
];

export const STOP_TRANSACTION_PERMISSIONS = [
  PERMISSION_REMOTE_STOP_TRANSACTION,
  PERMISSION_REQUEST_STOP_TRANSACTION,
];

export const UI_PERMISSIONS = [
  PERMISSION_CERTIFICATE_SIGNED,
  PERMISSION_DELETE_CERTIFICATE,
  PERMISSION_GET_INSTALLED_CERTIFICATE_IDS,
  PERMISSION_INSTALL_CERTIFICATE,
  PERMISSION_CHANGE_AVAILABILITY,
  PERMISSION_CHANGE_CONFIGURATION,
  PERMISSION_DATA_TRANSFER,
  PERMISSION_GET_CONFIGURATION,
  PERMISSION_RESET,
  PERMISSION_SET_NETWORK_PROFILE,
  PERMISSION_TRIGGER_MESSAGE,
  PERMISSION_UPDATE_FIRMWARE,
  PERMISSION_CLEAR_CACHE,
  PERMISSION_REMOTE_START_TRANSACTION,
  PERMISSION_REMOTE_STOP_TRANSACTION,
  PERMISSION_REQUEST_START_TRANSACTION,
  PERMISSION_REQUEST_STOP_TRANSACTION,
  PERMISSION_UNLOCK_CONNECTOR,
  PERMISSION_GET_VARIABLES,
  PERMISSION_SET_VARIABLES,
  PERMISSION_CUSTOMER_INFORMATION,
  PERMISSION_GET_BASE_REPORT,
  PERMISSION_GET_DIAGNOSTICS,
  PERMISSION_GET_LOG,
  PERMISSION_GET_TRANSACTION_STATUS,
  PERMISSION_DELETE_STATION_NETWORK_PROFILE,
  PERMISSION_SET_STATION_PASSWORD,
  PERMISSION_FORCE_DISCONNECT,
] as const;
