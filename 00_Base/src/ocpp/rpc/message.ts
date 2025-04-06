// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OcppRequest, OcppResponse } from '../..';

/**
 * Definition of Call Message (4.2.1 CALL)
 */
export type Call = [
  messageTypeId: MessageTypeId,
  messageId: string,
  action: CallAction,
  payload: OcppRequest,
];

/**
 * Definition of CallResult Message (4.2.2 CALLRESULT)
 */
export type CallResult = [messageTypeId: MessageTypeId, messageId: string, payload: OcppResponse];

/**
 * Definition of CallError Message (4.2.1 CALLERROR)
 */
export type CallError = [
  messageTypeId: MessageTypeId,
  messageId: string,
  errorCode: ErrorCode,
  errorDescription: string,
  errorDetails: object,
];

/**
 * Number identifying the different types of OCPP messages.
 */
export enum MessageTypeId {
  // Call identifies a request.
  Call = 2,
  // CallResult identifies a successful response.
  CallResult = 3,
  // CallError identifies an erroneous response.
  CallError = 4,
}

/**
 * Supported OCPP versions
 */
export enum OCPPVersion {
  OCPP1_6 = 'ocpp1.6',
  OCPP2_0_1 = 'ocpp2.0.1',
}

export type OCPPVersionType = 'ocpp1.6' | 'ocpp2.0.1';

/**
 * The different OCPP action types.
 *
 */

export type CallAction = OCPP1_6_CallAction | OCPP2_0_1_CallAction;

export enum OCPP1_6_CallAction {
  Authorize = 'Authorize',
  BootNotification = 'BootNotification',
  CancelReservation = 'CancelReservation',
  ChangeAvailability = 'ChangeAvailability',
  ChangeConfiguration = 'ChangeConfiguration',
  ClearCache = 'ClearCache',
  ClearChargingProfile = 'ClearChargingProfile',
  DataTransfer = 'DataTransfer',
  DiagnosticsStatusNotification = 'DiagnosticsStatusNotification',
  FirmwareStatusNotification = 'FirmwareStatusNotification',
  GetCompositeSchedule = 'GetCompositeSchedule',
  GetConfiguration = 'GetConfiguration',
  GetDiagnostics = 'GetDiagnostics',
  GetLocalListVersion = 'GetLocalListVersion',
  Heartbeat = 'Heartbeat',
  MeterValues = 'MeterValues',
  RemoteStartTransaction = 'RemoteStartTransaction',
  RemoteStopTransaction = 'RemoteStopTransaction',
  ReserveNow = 'ReserveNow',
  Reset = 'Reset',
  SendLocalList = 'SendLocalList',
  SetChargingProfile = 'SetChargingProfile',
  StartTransaction = 'StartTransaction',
  StatusNotification = 'StatusNotification',
  StopTransaction = 'StopTransaction',
  TriggerMessage = 'TriggerMessage',
  UnlockConnector = 'UnlockConnector',
  UpdateFirmware = 'UpdateFirmware',
}

export enum OCPP2_0_1_CallAction {
  Authorize = 'Authorize',
  BootNotification = 'BootNotification',
  CancelReservation = 'CancelReservation',
  CertificateSigned = 'CertificateSigned',
  ChangeAvailability = 'ChangeAvailability',
  ClearCache = 'ClearCache',
  ClearChargingProfile = 'ClearChargingProfile',
  ClearDisplayMessage = 'ClearDisplayMessage',
  ClearedChargingLimit = 'ClearedChargingLimit',
  ClearVariableMonitoring = 'ClearVariableMonitoring',
  CostUpdated = 'CostUpdated',
  CustomerInformation = 'CustomerInformation',
  DataTransfer = 'DataTransfer',
  DeleteCertificate = 'DeleteCertificate',
  FirmwareStatusNotification = 'FirmwareStatusNotification',
  Get15118EVCertificate = 'Get15118EVCertificate',
  GetBaseReport = 'GetBaseReport',
  GetCertificateStatus = 'GetCertificateStatus',
  GetChargingProfiles = 'GetChargingProfiles',
  GetCompositeSchedule = 'GetCompositeSchedule',
  GetDisplayMessages = 'GetDisplayMessages',
  GetInstalledCertificateIds = 'GetInstalledCertificateIds',
  GetLocalListVersion = 'GetLocalListVersion',
  GetLog = 'GetLog',
  GetMonitoringReport = 'GetMonitoringReport',
  GetReport = 'GetReport',
  GetTransactionStatus = 'GetTransactionStatus',
  GetVariables = 'GetVariables',
  Heartbeat = 'Heartbeat',
  InstallCertificate = 'InstallCertificate',
  LogStatusNotification = 'LogStatusNotification',
  MeterValues = 'MeterValues',
  NotifyChargingLimit = 'NotifyChargingLimit',
  NotifyCustomerInformation = 'NotifyCustomerInformation',
  NotifyDisplayMessages = 'NotifyDisplayMessages',
  NotifyEVChargingNeeds = 'NotifyEVChargingNeeds',
  NotifyEVChargingSchedule = 'NotifyEVChargingSchedule',
  NotifyEvent = 'NotifyEvent',
  NotifyMonitoringReport = 'NotifyMonitoringReport',
  NotifyReport = 'NotifyReport',
  PublishFirmware = 'PublishFirmware',
  PublishFirmwareStatusNotification = 'PublishFirmwareStatusNotification',
  ReportChargingProfiles = 'ReportChargingProfiles',
  RequestStartTransaction = 'RequestStartTransaction',
  RequestStopTransaction = 'RequestStopTransaction',
  ReservationStatusUpdate = 'ReservationStatusUpdate',
  ReserveNow = 'ReserveNow',
  Reset = 'Reset',
  SecurityEventNotification = 'SecurityEventNotification',
  SendLocalList = 'SendLocalList',
  SetChargingProfile = 'SetChargingProfile',
  SetDisplayMessage = 'SetDisplayMessage',
  SetMonitoringBase = 'SetMonitoringBase',
  SetMonitoringLevel = 'SetMonitoringLevel',
  SetNetworkProfile = 'SetNetworkProfile',
  SetVariableMonitoring = 'SetVariableMonitoring',
  SetVariables = 'SetVariables',
  SignCertificate = 'SignCertificate',
  StatusNotification = 'StatusNotification',
  TransactionEvent = 'TransactionEvent',
  TriggerMessage = 'TriggerMessage',
  UnlockConnector = 'UnlockConnector',
  UnpublishFirmware = 'UnpublishFirmware',
  UpdateFirmware = 'UpdateFirmware',
}

/**
 * Error codes for CallError message (4.3 RPC Framework Error Codes)
 *
 */
export enum ErrorCode {
  /**
   * Payload for Action is syntactically incorrect (OCPP 2.0.1 only, see FormationViolation for OCPP 1.6)
   */
  FormatViolation = 'FormatViolation',
  /**
   * Payload for Action is syntactically incorrect (OCPP 1.6 only, see FormatViolation for OCPP 2.0.1)
   */
  FormationViolation = 'FormationViolation',
  /**
   * Requested Action is not known by receiver
   */
  NotImplemented = 'NotImplemented',
  /**
   * Payload for Action is not conform the PDU structure
   */
  ProtocolError = 'ProtocolError',
  /**
   * Any other error not covered by the more specific error codes in this table
   */
  GenericError = 'GenericError',
  /**
   * An internal error occurred and the receiver was not able to process the requested Action successfully
   */
  InternalError = 'InternalError',
  /**
   * A message with a Message Type Number received that is not supported by this implementation.
   */
  MessageTypeNotSupported = 'MessageTypeNotSupported',
  /**
   * Requested Action is recognized but not supported by the receiver
   */
  NotSupported = 'NotSupported',
  /**
   * Payload for Action is syntactically correct but at least one of the fields violates occurrence constraints
   */
  OccurrenceConstraintViolation = 'OccurrenceConstraintViolation',
  /**
   * Payload is syntactically correct but at least one field contains an invalid value
   */
  PropertyConstraintViolation = 'PropertyConstraintViolation',
  /**
   * Content of the call is not a valid RPC Request, for example: MessageId could not be read.
   */
  RpcFrameworkError = 'RpcFrameworkError',
  /**
   * During the processing of Action a security issue occurred preventing receiver from completing the Action successfully
   */
  SecurityError = 'SecurityError',
  /**
   * Payload for Action is syntactically correct but at least one of the fields violates data type constraints (e.g. 'somestring': 12)
   */
  TypeConstraintViolation = 'TypeConstraintViolation',
}

/**
 * Custom error to handle OCPP errors better.
 */
export class OcppError extends Error {
  private _messageId: string;
  private _errorCode: ErrorCode;
  private _errorDetails: object;

  constructor(
    messageId: string,
    errorCode: ErrorCode,
    errorDescription: string,
    errorDetails: object = {},
  ) {
    super(errorDescription);
    this.name = 'OcppError';
    this._messageId = messageId;
    this._errorCode = errorCode;
    this._errorDetails = errorDetails;
  }

  asCallError(): CallError {
    return [
      MessageTypeId.CallError,
      this._messageId,
      this._errorCode,
      this.message,
      this._errorDetails,
    ] as CallError;
  }
}

/**
 * Maps a string to the corresponding OCPP CallAction enum value based on protocol version
 * @param version OCPP protocol version
 * @param action String representation of the action
 * @returns The corresponding enum value
 * @throws Error if the action is invalid for the specified version
 */
export function mapToCallAction(version: OCPPVersionType, action: string): CallAction {
  // Validate the action string is non-empty
  if (!action || typeof action !== 'string') {
    throw new Error('Action must be a non-empty string');
  }

  switch (version) {
    case 'ocpp1.6':
      if (action in OCPP1_6_CallAction) {
        return OCPP1_6_CallAction[action as keyof typeof OCPP1_6_CallAction];
      }
      throw new Error(`Invalid OCPP 1.6 action: ${action}`);

    case 'ocpp2.0.1':
      if (action in OCPP2_0_1_CallAction) {
        return OCPP2_0_1_CallAction[action as keyof typeof OCPP2_0_1_CallAction];
      }
      throw new Error(`Invalid OCPP 2.0.1 action: ${action}`);

    default:
      throw new Error(`Unsupported OCPP version: ${version}`);
  }
}
