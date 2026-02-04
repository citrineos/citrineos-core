// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { OcppRequest, OcppResponse } from '../../index.js';
import { Expose } from 'class-transformer';

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
  OCPP2_1 = 'ocpp2.1',
}

/**
 * All OCPP 2.x versions
 */
export const OCPP_2_VER_LIST = [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1];

export type OCPPVersionType = 'ocpp1.6' | 'ocpp2.0.1' | 'ocpp2.1';

export const OCPP_VERSION_LIST: OCPPVersionType[] = ['ocpp1.6', 'ocpp2.0.1', 'ocpp2.1'];

/**
 * The different OCPP action types.
 *
 */

export type CallAction = OCPP_CallAction;

export enum OCPP_CallAction {
  AdjustPeriodicEventStream = 'AdjustPeriodicEventStream',
  AFRRSignal = 'AFRRSignal',
  Authorize = 'Authorize',
  BatterySwap = 'BatterySwap',
  BootNotification = 'BootNotification',
  CancelReservation = 'CancelReservation',
  ChangeAvailability = 'ChangeAvailability',
  ChangeConfiguration = 'ChangeConfiguration',
  ChangeTransactionTariff = 'ChangeTransactionTariff',
  CertificateSigned = 'CertificateSigned',
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
  GetDiagnostics = 'GetDiagnostics',
  GetDERControl = 'GetDERControl',
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
  PullDynamicScheduleUpdate = 'PullDynamicScheduleUpdate',
  PublishFirmware = 'PublishFirmware',
  PublishFirmwareStatusNotification = 'PublishFirmwareStatusNotification',
  ReportChargingProfiles = 'ReportChargingProfiles',
  ReportDERControl = 'ReportDERControl',
  RequestBatterySwap = 'RequestBatterySwap',
  RequestStartTransaction = 'RequestStartTransaction',
  RequestStopTransaction = 'RequestStopTransaction',
  ReservationStatusUpdate = 'ReservationStatusUpdate',
  ReserveNow = 'ReserveNow',
  Reset = 'Reset',
  RemoteStartTransaction = 'RemoteStartTransaction',
  RemoteStopTransaction = 'RemoteStopTransaction',
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

/**
 * Custom error to handle OCPP errors better.
 */
export class OcppError extends Error {
  private _messageId: string;
  private _errorCode: ErrorCode;
  private _errorDetails: object;

  @Expose()
  get message(): string {
    return super.message;
  }

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

const OCPP_Base_CallActions = new Set<string>([
  OCPP_CallAction.Authorize,
  OCPP_CallAction.BootNotification,
  OCPP_CallAction.CancelReservation,
  OCPP_CallAction.ChangeAvailability,
  OCPP_CallAction.ClearCache,
  OCPP_CallAction.ClearChargingProfile,
  OCPP_CallAction.DataTransfer,
  OCPP_CallAction.FirmwareStatusNotification,
  OCPP_CallAction.GetCompositeSchedule,
  OCPP_CallAction.GetConfiguration,
  OCPP_CallAction.GetLocalListVersion,
  OCPP_CallAction.Heartbeat,
  OCPP_CallAction.MeterValues,
  OCPP_CallAction.ReserveNow,
  OCPP_CallAction.Reset,
  OCPP_CallAction.SendLocalList,
  OCPP_CallAction.SetChargingProfile,
  OCPP_CallAction.StartTransaction,
  OCPP_CallAction.StatusNotification,
  OCPP_CallAction.StopTransaction,
  OCPP_CallAction.TriggerMessage,
  OCPP_CallAction.UnlockConnector,
  OCPP_CallAction.UpdateFirmware,
]);

const OCPP1_6_CallActions = new Set<string>([
  ...OCPP_Base_CallActions,
  OCPP_CallAction.ChangeConfiguration,
  OCPP_CallAction.DiagnosticsStatusNotification,
  OCPP_CallAction.GetConfiguration,
  OCPP_CallAction.GetDiagnostics,
  OCPP_CallAction.RemoteStartTransaction,
  OCPP_CallAction.RemoteStopTransaction,
  OCPP_CallAction.StartTransaction,
  OCPP_CallAction.StopTransaction,
]);

const OCPP2_0_1_CallActions = new Set<string>([
  ...OCPP_Base_CallActions,
  OCPP_CallAction.CertificateSigned,
  OCPP_CallAction.ClearDisplayMessage,
  OCPP_CallAction.ClearedChargingLimit,
  OCPP_CallAction.ClearVariableMonitoring,
  OCPP_CallAction.CostUpdated,
  OCPP_CallAction.CustomerInformation,
  OCPP_CallAction.DeleteCertificate,
  OCPP_CallAction.Get15118EVCertificate,
  OCPP_CallAction.GetBaseReport,
  OCPP_CallAction.GetCertificateStatus,
  OCPP_CallAction.GetChargingProfiles,
  OCPP_CallAction.GetDisplayMessages,
  OCPP_CallAction.GetInstalledCertificateIds,
  OCPP_CallAction.GetLog,
  OCPP_CallAction.GetMonitoringReport,
  OCPP_CallAction.GetReport,
  OCPP_CallAction.GetTransactionStatus,
  OCPP_CallAction.GetVariables,
  OCPP_CallAction.InstallCertificate,
  OCPP_CallAction.LogStatusNotification,
  OCPP_CallAction.NotifyChargingLimit,
  OCPP_CallAction.NotifyCustomerInformation,
  OCPP_CallAction.NotifyDisplayMessages,
  OCPP_CallAction.NotifyEVChargingNeeds,
  OCPP_CallAction.NotifyEVChargingSchedule,
  OCPP_CallAction.NotifyEvent,
  OCPP_CallAction.NotifyMonitoringReport,
  OCPP_CallAction.NotifyReport,
  OCPP_CallAction.PublishFirmware,
  OCPP_CallAction.PublishFirmwareStatusNotification,
  OCPP_CallAction.ReportChargingProfiles,
  OCPP_CallAction.RequestStartTransaction,
  OCPP_CallAction.RequestStopTransaction,
  OCPP_CallAction.ReservationStatusUpdate,
  OCPP_CallAction.SecurityEventNotification,
  OCPP_CallAction.SetDisplayMessage,
  OCPP_CallAction.SetMonitoringBase,
  OCPP_CallAction.SetMonitoringLevel,
  OCPP_CallAction.SetNetworkProfile,
  OCPP_CallAction.SetVariableMonitoring,
  OCPP_CallAction.SetVariables,
  OCPP_CallAction.SignCertificate,
  OCPP_CallAction.TransactionEvent,
  OCPP_CallAction.UnpublishFirmware,
]);

const OCPP2_1_CallActions = new Set<string>([
  ...OCPP2_0_1_CallActions,
  OCPP_CallAction.AdjustPeriodicEventStream,
  OCPP_CallAction.AFRRSignal,
  OCPP_CallAction.BatterySwap,
  OCPP_CallAction.ChangeTransactionTariff,
  OCPP_CallAction.ClearDERControl,
  OCPP_CallAction.ClearTariffs,
  OCPP_CallAction.ClosePeriodicEventStream,
  OCPP_CallAction.GetCertificateChainStatus,
  OCPP_CallAction.GetDERControl,
  OCPP_CallAction.GetPeriodicEventStream,
  OCPP_CallAction.GetTariffs,
  OCPP_CallAction.NotifyAllowedEnergyTransfer,
  OCPP_CallAction.NotifyDERAlarm,
  OCPP_CallAction.NotifyDERStartStop,
  OCPP_CallAction.NotifyPeriodicEventStream,
  OCPP_CallAction.NotifyPriorityCharging,
  OCPP_CallAction.NotifySettlement,
  OCPP_CallAction.NotifyWebPaymentStarted,
  OCPP_CallAction.OpenPeriodicEventStream,
  OCPP_CallAction.PullDynamicScheduleUpdate,
  OCPP_CallAction.ReportDERControl,
  OCPP_CallAction.RequestBatterySwap,
  OCPP_CallAction.SetDefaultTariff,
  OCPP_CallAction.SetDERControl,
  OCPP_CallAction.UpdateDynamicSchedule,
  OCPP_CallAction.UsePriorityCharging,
  OCPP_CallAction.VatNumberValidation,
]);

const ALLOWED_ACTIONS: Record<OCPPVersionType, Set<string>> = {
  [OCPPVersion.OCPP1_6]: OCPP1_6_CallActions,
  [OCPPVersion.OCPP2_0_1]: OCPP2_0_1_CallActions,
  [OCPPVersion.OCPP2_1]: OCPP2_1_CallActions,
};

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
    case OCPPVersion.OCPP1_6:
      if (action in OCPP_CallAction && ALLOWED_ACTIONS[OCPPVersion.OCPP1_6].has(action)) {
        return OCPP_CallAction[action as keyof typeof OCPP_CallAction];
      }
      throw new Error(`Invalid OCPP 1.6 action: ${action}`);

    case OCPPVersion.OCPP2_0_1:
      if (action in OCPP_CallAction && ALLOWED_ACTIONS[OCPPVersion.OCPP2_0_1].has(action)) {
        return OCPP_CallAction[action as keyof typeof OCPP_CallAction];
      }
      throw new Error(`Invalid OCPP 2.0.1 action: ${action}`);

    default:
      throw new Error(`Unsupported OCPP version: ${version}`);
  }
}
