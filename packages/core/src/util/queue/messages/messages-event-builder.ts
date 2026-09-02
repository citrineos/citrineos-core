// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type ConnectionEvent,
  ConnectionEventState,
  FrameDirection,
  type FrameEvent,
  MessageOrigin,
  MessagesEventType,
  MessageTypeId,
  type OCPPVersionType,
} from '@citrineos/types';

/**
 * Pulls the payload out of an RPC frame by role.
 *
 * Lifted verbatim from the old `WebhookDispatcher._extractPayloadFromRpcMessage` so the envelope and
 * the row that used to be written inline agree on what `payload` means.
 */
export function extractPayloadFromRpcMessage(rpcMessage: any, type?: MessageTypeId): any {
  switch (type) {
    case MessageTypeId.Call:
      return rpcMessage?.[3];
    case MessageTypeId.CallResult:
      return rpcMessage?.[2];
    case MessageTypeId.CallError:
      return {
        errorCode: rpcMessage?.[2],
        errorDescription: rpcMessage?.[3],
        errorDetails: rpcMessage?.[4],
      };
    default:
      return undefined;
  }
}

/** A frame from the station is inbound; anything else is something the CSMS wrote. */
export function directionFromOrigin(origin: MessageOrigin): FrameDirection {
  return origin === MessageOrigin.ChargingStation
    ? FrameDirection.Inbound
    : FrameDirection.Outbound;
}

export interface BuildFrameEventInput {
  tenantId: number;
  ocppConnectionName: string;
  /** Who sent the frame. `direction` is derived from this, so the two can never disagree. */
  origin: MessageOrigin;
  correlationId: string;
  protocol: OCPPVersionType;
  /** Exact wire text. For the unparsed path this is the only thing that is trustworthy. */
  raw: string;
  timestamp: string;
  type?: MessageTypeId;
  action?: string;
  /** The RPC frame as an array, when there was one. */
  rpcMessage?: any;
  meta?: Record<string, string>;
}

/**
 * Usually an OCPP frame event.
 */
export function buildFrameEvent(input: BuildFrameEventInput): FrameEvent {
  const parsed = input.rpcMessage !== undefined && input.type !== undefined;

  return {
    kind: MessagesEventType.Frame,
    tenantId: input.tenantId,
    ocppConnectionName: input.ocppConnectionName,
    direction: directionFromOrigin(input.origin),
    correlationId: input.correlationId,
    origin: input.origin,
    type: input.type,
    action: input.action,
    protocol: input.protocol,
    raw: input.raw,
    payload: parsed ? extractPayloadFromRpcMessage(input.rpcMessage, input.type) : undefined,
    frame: input.rpcMessage,
    timestamp: input.timestamp,
    parsed,
    meta: input.meta,
  } as FrameEvent;
}

export interface BuildConnectionEventInput {
  tenantId: number;
  ocppConnectionName: string;
  state: ConnectionEventState;
  timestamp: string;
  protocol?: OCPPVersionType;
  meta?: Record<string, string>;
}

/**
 * A station connected or disconnected.
 */
export function buildConnectionEvent(input: BuildConnectionEventInput): ConnectionEvent {
  return {
    kind: MessagesEventType.Connection,
    tenantId: input.tenantId,
    ocppConnectionName: input.ocppConnectionName,
    state: input.state,
    timestamp: input.timestamp,
    protocol: input.protocol,
    meta: input.meta,
  } as ConnectionEvent;
}
