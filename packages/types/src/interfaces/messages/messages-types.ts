// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  MessageOriginSchema,
  MessageTypeSchema,
  OCPPVersionSchema,
} from '@interfaces/dto/types/ocpp-message.js';
import { z } from 'zod';

/**
 * What a processor may hand to the processors that run after it.
 *
 * Mutable on purpose: the persistence processor writes back the action the DB correlation trigger
 * resolved for a CALLRESULT/CALLERROR, and the webhook dispatcher wants that value — nothing else in
 * the pipeline can know it.
 */
export interface MessagesEventContext {
  /** Action as stored, after `ocpp_correlate_response()` filled it in from the CALL. */
  persistedAction?: string;
  /** Primary key of the persisted row, for processors that want to reference it. */
  persistedId?: number;
}

/**
 * - **frame** — one OCPP frame crossing the socket, in either direction, parsed or not.
 * - **connection** — a station connected or disconnected. The webhook dispatcher loads a station's
 *   subscriptions on connect and fires onConnect/onClose callbacks, so without this it would have no
 *   idea a station exists.
 */
export enum MessagesEventType {
  Frame = 'frame',
  Connection = 'connection',
}

export enum FrameDirection {
  /** Charging station -> CSMS */
  Inbound = 'inbound',
  /** CSMS -> charging station */
  Outbound = 'outbound',
}

export enum ConnectionEventState {
  Connected = 'connected',
  Closed = 'closed',
}

const messagesEventBase = {
  tenantId: z.number().int(),
  ocppConnectionName: z.string(),
  timestamp: z.string(),
  /** Non-authoritative producer metadata (instance id, trace id). Consumers tolerate absence. */
  meta: z.record(z.string(), z.string()).optional(),
};

export const FrameEventSchema = z.object({
  ...messagesEventBase,
  kind: z.literal(MessagesEventType.Frame),
  direction: z.enum(FrameDirection),
  correlationId: z.string(),
  origin: MessageOriginSchema,
  type: MessageTypeSchema.optional(),
  action: z.string().optional(),
  protocol: OCPPVersionSchema,
  raw: z.string(),
  payload: z.any().optional(),
  /** Whole RPC frame, for the deprecated `message` column. */
  frame: z.any().optional(),
  /** false => produced by the unparsed path; `payload`/`frame`/`type` may all be absent. */
  parsed: z.boolean(),
});

export const ConnectionEventSchema = z.object({
  ...messagesEventBase,
  kind: z.literal(MessagesEventType.Connection),
  state: z.enum(ConnectionEventState),
  /** Known on connect; absent on a close where the protocol could not be recovered. */
  protocol: OCPPVersionSchema.optional(),
});

export const MessagesEventSchema = z.discriminatedUnion('kind', [
  FrameEventSchema,
  ConnectionEventSchema,
]);

export type FrameEvent = z.infer<typeof FrameEventSchema>;
export type ConnectionEvent = z.infer<typeof ConnectionEventSchema>;
export type MessagesEvent = z.infer<typeof MessagesEventSchema>;

export const isFrameEvent = (event: MessagesEvent): event is FrameEvent =>
  event.kind === MessagesEventType.Frame;

export const isConnectionEvent = (event: MessagesEvent): event is ConnectionEvent =>
  event.kind === MessagesEventType.Connection;

export const MESSAGES_EXCHANGE = 'messages';

export const MESSAGES_DLX = `${MESSAGES_EXCHANGE}.dlx`;

/**
 * One queue for each message "type" to avoid processing of either message interfering with the other.
 */
export const MESSAGES_QUEUES = [
  {
    kind: MessagesEventType.Frame,
    queue: `${MESSAGES_EXCHANGE}.ocpp`,
    dlq: `${MESSAGES_EXCHANGE}.ocpp.dlq`,
    binding: 'frame.#',
  },
  {
    kind: MessagesEventType.Connection,
    queue: `${MESSAGES_EXCHANGE}.connections`,
    dlq: `${MESSAGES_EXCHANGE}.connections.dlq`,
    binding: 'connection.#',
  },
];

export type MessagesQueueSpec = (typeof MESSAGES_QUEUES)[number];

/**
 * Routing key: `frame.<direction>.<action>` or `connection.<state>`.
 *
 * Kind first, so each queue's binding is a prefix match. `action` defaults to `na` — never empty,
 * because an empty AMQP routing-key segment would not match `#`. The tenant is in the envelope, not
 * the key: nothing routes on it.
 */
export const messagesEventRoutingKey = (event: MessagesEvent): string =>
  isFrameEvent(event)
    ? `frame.${event.direction}.${event.action && event.action.length > 0 ? event.action : 'na'}`
    : `connection.${event.state}`;

export interface IMessagesEventProcessor<TEvent extends MessagesEvent = MessagesEvent> {
  readonly name: string;

  /**
   * When true, a throw fails the whole event (retry, then dead-letter). When false, a throw is
   * logged and the pipeline continues.
   */
  readonly critical: boolean;

  process(event: TEvent, context: MessagesEventContext): Promise<void>;
}

/** Runs for OCPP frames, off the `messages.ocpp` queue. */
export type IFrameEventProcessor = IMessagesEventProcessor<FrameEvent>;

/** Runs for station connect/disconnect, off the `messages.connections` queue. */
export type IConnectionEventProcessor = IMessagesEventProcessor<ConnectionEvent>;

/** Outcome of handing an event to the messages plane. */
export interface MessagesRecordResult {
  /** True when the broker accepted the event. */
  delivered: boolean;
}
