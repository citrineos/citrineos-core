// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  MessageOriginSchema,
  MessageTypeSchema,
  OCPPVersionSchema,
} from '@interfaces/dto/types/ocpp-message.js';
import { WebsocketEventTypeSchema } from '@interfaces/dto/types/websocket-event.js';
import { z } from 'zod';

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
 * - **websocket** — one step in a socket's lifecycle as the transport saw it, including attempts that
 *   never became a connection: rejected upgrades and failed TLS handshakes.
 */
export enum MessagesEventKind {
  Frame = 'frame',
  Connection = 'connection',
  Websocket = 'websocket',
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
  kind: z.literal(MessagesEventKind.Frame),
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
  kind: z.literal(MessagesEventKind.Connection),
  state: z.enum(ConnectionEventState),
  /** Known on connect; absent on a close where the protocol could not be recovered. */
  protocol: OCPPVersionSchema.optional(),
});

export const WebsocketLifecycleEventSchema = z.object({
  ...messagesEventBase,
  /** Absent when no identifier could be read, e.g. a TLS handshake fails before any HTTP. */
  ocppConnectionName: z.string().optional(),
  kind: z.literal(MessagesEventKind.Websocket),
  type: WebsocketEventTypeSchema,
  serverId: z.string(),
  /** Hostname of the instance that saw the event. */
  host: z.string(),
  remoteAddress: z.string().optional(),
  /** Request path, without the query string. */
  uri: z.string().optional(),
  subprotocol: z.string().optional(),
  httpStatus: z.number().int().optional(),
  /** Close code reported by the close event — the station's echo when we initiated. */
  wsCloseCode: z.number().int().optional(),
  /** Close code we sent, when we initiated the close. */
  sentCode: z.number().int().optional(),
  closeReason: z.string().optional(),
  initiator: MessageOriginSchema.optional(),
  source: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const MessagesEventSchema = z.discriminatedUnion('kind', [
  FrameEventSchema,
  ConnectionEventSchema,
  WebsocketLifecycleEventSchema,
]);

export type FrameEvent = z.infer<typeof FrameEventSchema>;
export type ConnectionEvent = z.infer<typeof ConnectionEventSchema>;
export type WebsocketLifecycleEvent = z.infer<typeof WebsocketLifecycleEventSchema>;
export type MessagesEvent = z.infer<typeof MessagesEventSchema>;

export const isFrameEvent = (event: MessagesEvent): event is FrameEvent =>
  event.kind === MessagesEventKind.Frame;

export const isConnectionEvent = (event: MessagesEvent): event is ConnectionEvent =>
  event.kind === MessagesEventKind.Connection;

export const isWebsocketLifecycleEvent = (event: MessagesEvent): event is WebsocketLifecycleEvent =>
  event.kind === MessagesEventKind.Websocket;

export const MESSAGES_EXCHANGE = 'messages';

export const MESSAGES_DLX = `${MESSAGES_EXCHANGE}.dlx`;

/**
 * One queue for each message "type" to avoid processing of either message interfering with the other.
 */
export const MESSAGES_QUEUES = [
  {
    kind: MessagesEventKind.Frame,
    queue: `${MESSAGES_EXCHANGE}.ocpp`,
    dlq: `${MESSAGES_EXCHANGE}.ocpp.dlq`,
    binding: 'frame.#',
  },
  {
    kind: MessagesEventKind.Connection,
    queue: `${MESSAGES_EXCHANGE}.connections`,
    dlq: `${MESSAGES_EXCHANGE}.connections.dlq`,
    binding: 'connection.#',
  },
  {
    kind: MessagesEventKind.Websocket,
    queue: `${MESSAGES_EXCHANGE}.websocket`,
    dlq: `${MESSAGES_EXCHANGE}.websocket.dlq`,
    binding: 'websocket.#',
  },
];

export type MessagesQueueSpec = (typeof MESSAGES_QUEUES)[number];

/**
 * Routing key: `frame.<direction>.<action>`, `connection.<state>` or `websocket.<type>`.
 *
 * Kind first, so each queue's binding is a prefix match. `action` defaults to `na` — never empty,
 * because an empty AMQP routing-key segment would not match `#`. The tenant is in the envelope, not
 * the key: nothing routes on it.
 */
export const messagesEventRoutingKey = (event: MessagesEvent): string => {
  switch (event.kind) {
    case MessagesEventKind.Frame:
      return `frame.${event.direction}.${event.action && event.action.length > 0 ? event.action : 'na'}`;
    case MessagesEventKind.Connection:
      return `connection.${event.state}`;
    case MessagesEventKind.Websocket:
      return `websocket.${event.type}`;
  }
};

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

/** Runs for socket lifecycle events, off the `messages.websocket` queue. */
export type IWebsocketLifecycleEventProcessor = IMessagesEventProcessor<WebsocketLifecycleEvent>;

/** Outcome of handing an event to the messages plane. */
export interface MessagesRecordResult {
  /** True when the broker accepted the event. */
  delivered: boolean;
}
