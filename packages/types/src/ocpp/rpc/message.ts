// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { OcppRequest, OcppResponse } from '@ocpp/internal-types.js';

/**
 * Definition of Call Message (4.2.1 CALL)
 *
 * This is the wire shape: the JSON array as it arrives over the websocket. The
 * `Call` model in `@citrineos/base` wraps it for field access; use these types to
 * validate the array structure.
 */
export type RawCall = [
  messageTypeId: MessageTypeId,
  messageId: string,
  action: CallAction,
  payload: OcppRequest,
];

/**
 * Definition of CallResult Message (4.2.2 CALLRESULT)
 *
 * This is the wire shape. See {@link RawCall}.
 */
export type RawCallResult = [
  messageTypeId: MessageTypeId,
  messageId: string,
  payload: OcppResponse,
];

/**
 * Definition of CallError Message (4.2.3 CALLERROR)
 *
 * This is the wire shape. See {@link RawCall}. `errorDetails` is optional here:
 * it is required by the specification but omitted by some implementations.
 */
export type RawCallError =
  | [
      messageTypeId: MessageTypeId,
      messageId: string,
      errorCode: ErrorCode,
      errorDescription: string,
      errorDetails: object,
    ]
  | [
      messageTypeId: MessageTypeId,
      messageId: string,
      errorCode: ErrorCode,
      errorDescription: string,
    ];

/**
 * Any OCPP RPC frame in its wire (JSON array) form.
 */
export type RawRpcMessage = RawCall | RawCallResult | RawCallError;

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
  OCPP2_1 = 'ocpp2.1',
}

/**
 * All OCPP 2.x versions
 */
export const OCPP_2_VER_LIST = [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1];

export type OCPPVersionType = 'ocpp1.6' | 'ocpp2.0.1' | 'ocpp2.1';

/**
 * The different OCPP action types.
 *
 */

export type CallAction = OCPP_CallAction;
// NoAction is used when the action is not known, for example when a message is invalid json or otherwise violates the OCPP protocol to the extent that the action cannot be determined. This allows us to still store and process these messages, while marking them as having an unknown action.
export const NO_ACTION = 'NoAction';

export enum OCPP_CallAction {
  AdjustPeriodicEventStream = 'AdjustPeriodicEventStream',
  AFRRSignal = 'AFRRSignal',
  Authorize = 'Authorize',
  BatterySwap = 'BatterySwap',
  BootNotification = 'BootNotification',
  CancelReservation = 'CancelReservation',
  CertificateSigned = 'CertificateSigned',
  ChangeAvailability = 'ChangeAvailability',
  ChangeConfiguration = 'ChangeConfiguration',
  ChangeTransactionTariff = 'ChangeTransactionTariff',
  ClearCache = 'ClearCache',
  ClearChargingProfile = 'ClearChargingProfile',
  ClearDERControl = 'ClearDERControl',
  ClearDisplayMessage = 'ClearDisplayMessage',
  ClearTariffs = 'ClearTariffs',
  ClearVariableMonitoring = 'ClearVariableMonitoring',
  ClearedChargingLimit = 'ClearedChargingLimit',
  ClosePeriodicEventStream = 'ClosePeriodicEventStream',
  CostUpdated = 'CostUpdated',
  CustomerInformation = 'CustomerInformation',
  DataTransfer = 'DataTransfer',
  DeleteCertificate = 'DeleteCertificate',
  DiagnosticsStatusNotification = 'DiagnosticsStatusNotification',
  FirmwareStatusNotification = 'FirmwareStatusNotification',
  Get15118EVCertificate = 'Get15118EVCertificate',
  GetBaseReport = 'GetBaseReport',
  GetCertificateChainStatus = 'GetCertificateChainStatus',
  GetCertificateStatus = 'GetCertificateStatus',
  GetChargingProfiles = 'GetChargingProfiles',
  GetCompositeSchedule = 'GetCompositeSchedule',
  GetConfiguration = 'GetConfiguration',
  GetDERControl = 'GetDERControl',
  GetDiagnostics = 'GetDiagnostics',
  GetDisplayMessages = 'GetDisplayMessages',
  GetInstalledCertificateIds = 'GetInstalledCertificateIds',
  GetLocalListVersion = 'GetLocalListVersion',
  GetLog = 'GetLog',
  GetMonitoringReport = 'GetMonitoringReport',
  GetPeriodicEventStream = 'GetPeriodicEventStream',
  GetReport = 'GetReport',
  GetTariffs = 'GetTariffs',
  GetTransactionStatus = 'GetTransactionStatus',
  GetVariables = 'GetVariables',
  Heartbeat = 'Heartbeat',
  InstallCertificate = 'InstallCertificate',
  LogStatusNotification = 'LogStatusNotification',
  MeterValues = 'MeterValues',
  NotifyAllowedEnergyTransfer = 'NotifyAllowedEnergyTransfer',
  NotifyChargingLimit = 'NotifyChargingLimit',
  NotifyCustomerInformation = 'NotifyCustomerInformation',
  NotifyDERAlarm = 'NotifyDERAlarm',
  NotifyDERStartStop = 'NotifyDERStartStop',
  NotifyDisplayMessages = 'NotifyDisplayMessages',
  NotifyEVChargingNeeds = 'NotifyEVChargingNeeds',
  NotifyEVChargingSchedule = 'NotifyEVChargingSchedule',
  NotifyEvent = 'NotifyEvent',
  NotifyMonitoringReport = 'NotifyMonitoringReport',
  NotifyPeriodicEventStream = 'NotifyPeriodicEventStream',
  NotifyPriorityCharging = 'NotifyPriorityCharging',
  NotifyReport = 'NotifyReport',
  NotifySettlement = 'NotifySettlement',
  NotifyWebPaymentStarted = 'NotifyWebPaymentStarted',
  OpenPeriodicEventStream = 'OpenPeriodicEventStream',
  PublishFirmware = 'PublishFirmware',
  PublishFirmwareStatusNotification = 'PublishFirmwareStatusNotification',
  PullDynamicScheduleUpdate = 'PullDynamicScheduleUpdate',
  RemoteStartTransaction = 'RemoteStartTransaction',
  RemoteStopTransaction = 'RemoteStopTransaction',
  ReportChargingProfiles = 'ReportChargingProfiles',
  ReportDERControl = 'ReportDERControl',
  RequestBatterySwap = 'RequestBatterySwap',
  RequestStartTransaction = 'RequestStartTransaction',
  RequestStopTransaction = 'RequestStopTransaction',
  ReservationStatusUpdate = 'ReservationStatusUpdate',
  ReserveNow = 'ReserveNow',
  Reset = 'Reset',
  SecurityEventNotification = 'SecurityEventNotification',
  SendLocalList = 'SendLocalList',
  SetChargingProfile = 'SetChargingProfile',
  SetDefaultTariff = 'SetDefaultTariff',
  SetDERControl = 'SetDERControl',
  SetDisplayMessage = 'SetDisplayMessage',
  SetMonitoringBase = 'SetMonitoringBase',
  SetMonitoringLevel = 'SetMonitoringLevel',
  SetNetworkProfile = 'SetNetworkProfile',
  SetVariableMonitoring = 'SetVariableMonitoring',
  SetVariables = 'SetVariables',
  SignCertificate = 'SignCertificate',
  SignedFirmwareStatusNotification = 'SignedFirmwareStatusNotification',
  SignedUpdateFirmware = 'SignedUpdateFirmware',
  StartTransaction = 'StartTransaction',
  StatusNotification = 'StatusNotification',
  StopTransaction = 'StopTransaction',
  TransactionEvent = 'TransactionEvent',
  TriggerMessage = 'TriggerMessage',
  UnlockConnector = 'UnlockConnector',
  UnpublishFirmware = 'UnpublishFirmware',
  UpdateDynamicSchedule = 'UpdateDynamicSchedule',
  UpdateFirmware = 'UpdateFirmware',
  UsePriorityCharging = 'UsePriorityCharging',
  VatNumberValidation = 'VatNumberValidation',
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
