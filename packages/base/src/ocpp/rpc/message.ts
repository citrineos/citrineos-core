// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type CallAction,
  type OcppRequest,
  type OcppResponse,
  type OCPPVersionType,
  type RawCall,
  type RawCallError,
  type RawCallResult,
  ErrorCode,
  MessageTypeId,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import { Expose } from 'class-transformer';

/**
 * MessageId used when the one on the frame cannot be read (OCPP 2.0.1 part 4,
 * section 4.2.3: the CALLERROR SHALL then contain "-1" as MessageId).
 */
export const UNREADABLE_MESSAGE_ID = '-1';

/**
 * Reads the messageId off a frame that has not been validated yet, falling back
 * to {@link UNREADABLE_MESSAGE_ID} when it is absent or not a string.
 */
export function readMessageId(raw: unknown): string {
  const messageId = Array.isArray(raw) ? raw[1] : undefined;
  // OCPP 2.0.1 part 4, section 4.2.3, When also the MessageId cannot be read, the CALLERROR SHALL contain "-1" as MessageId.
  return typeof messageId === 'string' && messageId.length > 0 ? messageId : UNREADABLE_MESSAGE_ID;
}

/**
 * Asserts that `raw` is structurally a frame of the given message type: an array
 * of at least `minLength` elements carrying a readable messageId. Trailing
 * elements beyond the ones the specification defines are ignored.
 *
 * Payload contents are *not* checked here — that is schema validation, and it
 * needs to know the OCPP version and action.
 *
 * @throws {OcppError} ProtocolError if the frame is not the expected shape.
 * @throws {Error} if the frame's messageTypeId is not the one for this model.
 */
function assertRawFrame(
  raw: unknown,
  messageTypeId: MessageTypeId,
  minLength: number,
  name: string,
): asserts raw is unknown[] {
  if (!Array.isArray(raw) || raw.length < minLength) {
    throw new OcppError(
      readMessageId(raw),
      ErrorCode.ProtocolError,
      `Malformed ${name} frame: expected an array of at least ${minLength} elements`,
    );
  }
  if (raw[0] !== messageTypeId) {
    // The messageTypeId decides which model a frame becomes, so the caller has
    // already read it to get here. A mismatch means we dispatched on it wrongly:
    // that is a bug on this side, not a protocol violation by the sender, and it
    // must not go back over the wire as one.
    throw new Error(
      `Cannot build a ${name} model from a frame with messageTypeId ${JSON.stringify(raw[0])}`,
    );
  }
  if (typeof raw[1] !== 'string' || raw[1].length === 0) {
    throw new OcppError(
      UNREADABLE_MESSAGE_ID,
      ErrorCode.ProtocolError,
      `Malformed ${name} frame: messageId is not a non-empty string`,
    );
  }
}

/**
 * Asserts that a frame element is a payload object, i.e. not a primitive or null.
 *
 * @throws {OcppError} ProtocolError if it is not.
 */
function assertPayload(
  payload: unknown,
  messageId: string,
  name: string,
): asserts payload is object {
  if (typeof payload !== 'object' || payload === null) {
    throw new OcppError(
      messageId,
      ErrorCode.ProtocolError,
      `Malformed ${name} frame: payload is not an object`,
    );
  }
}

/**
 * A CALL message (4.2.1) with named fields.
 *
 * Construct from a parsed frame to validate its structure and read it by field
 * name, or from the fields themselves to build an outbound CALL:
 *
 * ```ts
 * const call = new Call(JSON.parse(rawMessage) as RawCall); // inbound, validates
 * const call = new Call(correlationId, action, payload);     // outbound, trusted
 * ```
 *
 * The frame form is untrusted and throws on anything malformed. The field form is
 * type-checked at the call site and never throws, so building an error reply
 * cannot itself fail.
 *
 * `JSON.stringify` yields the wire form again, so a model object can be handed
 * straight to the socket.
 */
export class Call {
  readonly messageTypeId: MessageTypeId.Call = MessageTypeId.Call;
  readonly messageId: string;
  readonly action: CallAction;
  readonly payload: OcppRequest;

  /**
   * @param raw - A parsed CALL frame, not yet known to be well-formed.
   * @throws {OcppError} ProtocolError if the frame is not a structurally valid CALL.
   * @throws {Error} if the frame is not a CALL at all, which is a caller bug.
   */
  constructor(raw: RawCall);
  constructor(messageId: string, action: CallAction, payload: OcppRequest);
  constructor(rawOrMessageId: RawCall | string, action?: CallAction, payload?: OcppRequest) {
    if (typeof rawOrMessageId === 'string' && action !== undefined) {
      this.messageId = rawOrMessageId;
      this.action = action;
      this.payload = payload as OcppRequest;
      return;
    }
    const raw: unknown = rawOrMessageId;
    assertRawFrame(raw, MessageTypeId.Call, 4, 'CALL');
    const messageId = raw[1] as string;
    if (typeof raw[2] !== 'string' || raw[2].length === 0) {
      throw new OcppError(
        messageId,
        ErrorCode.ProtocolError,
        'Malformed CALL frame: action is not a non-empty string',
      );
    }
    assertPayload(raw[3], messageId, 'CALL');
    this.messageId = messageId;
    this.action = raw[2] as CallAction;
    this.payload = raw[3] as OcppRequest;
  }

  toJSON(): RawCall {
    return [this.messageTypeId, this.messageId, this.action, this.payload];
  }
}

/**
 * A CALLRESULT message (4.2.2) with named fields. See {@link Call}.
 */
export class CallResult {
  readonly messageTypeId: MessageTypeId.CallResult = MessageTypeId.CallResult;
  readonly messageId: string;
  readonly payload: OcppResponse;

  /**
   * @param raw - A parsed CALLRESULT frame, not yet known to be well-formed.
   * @throws {OcppError} ProtocolError if the frame is not a structurally valid CALLRESULT.
   * @throws {Error} if the frame is not a CALLRESULT at all, which is a caller bug.
   */
  constructor(raw: RawCallResult);
  constructor(messageId: string, payload: OcppResponse);
  constructor(rawOrMessageId: RawCallResult | string, payload?: OcppResponse) {
    if (typeof rawOrMessageId === 'string' && payload !== undefined) {
      this.messageId = rawOrMessageId;
      this.payload = payload;
      return;
    }
    const raw: unknown = rawOrMessageId;
    assertRawFrame(raw, MessageTypeId.CallResult, 3, 'CALLRESULT');
    const messageId = raw[1] as string;
    assertPayload(raw[2], messageId, 'CALLRESULT');
    this.messageId = messageId;
    this.payload = raw[2] as OcppResponse;
  }

  toJSON(): RawCallResult {
    return [this.messageTypeId, this.messageId, this.payload];
  }
}

/**
 * A CALLERROR message (4.2.3) with named fields. See {@link Call}.
 */
export class CallError {
  readonly messageTypeId: MessageTypeId.CallError = MessageTypeId.CallError;
  readonly messageId: string;
  readonly errorCode: ErrorCode;
  readonly errorDescription: string;
  readonly errorDetails: object;

  /**
   * @param raw - A parsed CALLERROR frame, not yet known to be well-formed.
   * @throws {OcppError} ProtocolError if the frame is not a structurally valid CALLERROR.
   * @throws {Error} if the frame is not a CALLERROR at all, which is a caller bug.
   */
  constructor(raw: RawCallError);
  constructor(
    messageId: string,
    errorCode: ErrorCode,
    errorDescription: string,
    errorDetails?: object,
  );
  constructor(
    rawOrMessageId: RawCallError | string,
    errorCode?: ErrorCode,
    errorDescription?: string,
    errorDetails: object = {},
  ) {
    if (typeof rawOrMessageId === 'string' && errorCode !== undefined) {
      this.messageId = rawOrMessageId;
      this.errorCode = errorCode;
      this.errorDescription = errorDescription as string;
      this.errorDetails = errorDetails;
      return;
    }
    const raw: unknown = rawOrMessageId;
    assertRawFrame(raw, MessageTypeId.CallError, 4, 'CALLERROR');
    this.messageId = raw[1] as string;
    this.errorCode = raw[2] as ErrorCode;
    this.errorDescription = typeof raw[3] === 'string' ? raw[3] : '';
    this.errorDetails = typeof raw[4] === 'object' && raw[4] !== null ? (raw[4] as object) : {};
  }

  /**
   * The error as an {@link OcppError}, for routing to the module that issued the
   * original Call.
   */
  asOcppError(): OcppError {
    return new OcppError(this.messageId, this.errorCode, this.errorDescription, this.errorDetails);
  }

  toJSON(): RawCallError {
    return [
      this.messageTypeId,
      this.messageId,
      this.errorCode,
      this.errorDescription,
      this.errorDetails,
    ];
  }
}

/**
 * Any OCPP RPC frame as a model object. Discriminate on `messageTypeId`.
 */
export type RpcMessage = Call | CallResult | CallError;

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

  get messageId(): string {
    return this._messageId;
  }

  get errorCode(): ErrorCode {
    return this._errorCode;
  }

  get errorDetails(): object {
    return this._errorDetails;
  }

  constructor(
    messageId: string,
    errorCode: ErrorCode,
    errorDescription: string,
    errorDetails: object = {},
  ) {
    super(errorDescription);
    this.name = 'OcppError';
    Object.defineProperty(this, 'message', {
      value: errorDescription,
      enumerable: true,
      writable: true,
      configurable: true,
    });
    this._messageId = messageId;
    this._errorCode = errorCode;
    this._errorDetails = errorDetails;
  }

  asCallError(): CallError {
    return new CallError(this._messageId, this._errorCode, this.message, this._errorDetails);
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

const OCPP_CallActions = new Set<string>([
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
  [OCPPVersion.OCPP1_6]: OCPP_CallActions,
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

    case OCPPVersion.OCPP2_1:
      if (action in OCPP_CallAction && ALLOWED_ACTIONS[OCPPVersion.OCPP2_1].has(action)) {
        return OCPP_CallAction[action as keyof typeof OCPP_CallAction];
      }
      throw new Error(`Invalid OCPP 2.1 action: ${action}`);

    default:
      throw new Error(`Unsupported OCPP version: ${version}`);
  }
}
