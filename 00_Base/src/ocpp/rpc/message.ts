// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OcppRequest, OcppResponse } from "../..";

/**
 * Definition of Call Message (4.2.1 CALL)
 */
export type Call = [messageTypeId: MessageTypeId, messageId: string, action: CallAction, payload: OcppRequest];

/**
 * Definition of CallResult Message (4.2.2 CALLRESULT)
 */
export type CallResult = [messageTypeId: MessageTypeId, messageId: string, payload: OcppResponse];

/**
 * Definition of CallError Message (4.2.1 CALLERROR)
 */
export type CallError = [messageTypeId: MessageTypeId, messageId: string, errorCode: ErrorCode, errorDescription: string, errorDetails: object];

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
 * The different OCPP action types.
 *
 */
export enum CallAction {
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
  FormatViolation = 'FormatViolation', // Payload for Action is syntactically incorrect
  NotImplemented = 'NotImplemented', // Requested Action is not known by receiver
  ProtocolError = 'ProtocolError', // Payload for Action is not conform the PDU structure
  GenericError = 'GenericError', // Any other error not covered by the more specific error codes in this table
  InternalError = 'InternalError', // An internal error occurred and the receiver was not able to process the requested Action successfully
  MessageTypeNotSupported = 'MessageTypeNotSupported', // A message with an Message Type Number received that is not supported by this implementation.
  NotSupported = 'NotSupported', // Requested Action is recognized but not supported by the receiver
  OccurrenceConstraintViolation = 'OccurrenceConstraintViolation', // Payload for Action is syntactically correct but at least one of the fields violates occurrence constraints
  PropertyConstraintViolation = 'PropertyConstraintViolation', // Payload is syntactically correct but at least one field contains an invalid value
  RpcFrameworkError = 'RpcFrameworkError', // Content of the call is not a valid RPC Request, for example: MessageId could not be read.
  SecurityError = 'SecurityError', // During the processing of Action a security issue occurred preventing receiver from completing the Action successfully
  TypeConstraintViolation = 'TypeConstraintViolation', // Payload for Action is syntactically correct but at least one of the fields violates data type constraints (e.g. 'somestring': 12)
}

/**
 * Custom error to handle OCPP errors better.
 */
export class OcppError extends Error {

  private _messageId: string;
  private _errorCode: ErrorCode;
  private _errorDetails: object;

  constructor(messageId: string, errorCode: ErrorCode, errorDescription: string, errorDetails: object = {}) {
      super(errorDescription);
      this.name = "OcppError";
      this._messageId = messageId;
      this._errorCode = errorCode;
      this._errorDetails = errorDetails;
  }

  asCallError(): CallError {
      return [MessageTypeId.CallError, this._messageId, this._errorCode, this.message, this._errorDetails] as CallError;
  }
}
