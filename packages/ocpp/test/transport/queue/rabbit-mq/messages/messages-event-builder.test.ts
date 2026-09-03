// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  ConnectionEventState,
  FrameDirection,
  MessageOrigin,
  MessagesEventSchema,
  MessagesEventType,
  MessageTypeId,
  MESSAGES_DLX,
  MESSAGES_EXCHANGE,
  MESSAGES_QUEUES,
  messagesEventRoutingKey,
  isConnectionEvent,
  isFrameEvent,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import {
  buildConnectionEvent,
  buildFrameEvent,
  directionFromOrigin,
  extractPayloadFromRpcMessage,
} from '@/transport/index.js';
import { describe, expect, it } from 'vitest';

const TENANT_ID = 1;
const STATION_ID = 'CS001';
const CORRELATION_ID = 'msg-123';
const TIMESTAMP = '2026-01-01T00:00:00.000Z';

function frameInput(override?: Record<string, any>) {
  return {
    tenantId: TENANT_ID,
    ocppConnectionName: STATION_ID,
    origin: MessageOrigin.ChargingStation,
    correlationId: CORRELATION_ID,
    protocol: OCPPVersion.OCPP2_0_1,
    raw: '[]',
    timestamp: TIMESTAMP,
    ...override,
  } as any;
}

describe('directionFromOrigin', () => {
  it('should treat a frame from the station as inbound', () => {
    expect(directionFromOrigin(MessageOrigin.ChargingStation)).toBe(FrameDirection.Inbound);
  });

  it('should treat a frame from the CSMS as outbound', () => {
    expect(directionFromOrigin(MessageOrigin.ChargingStationManagementSystem)).toBe(
      FrameDirection.Outbound,
    );
  });
});

describe('extractPayloadFromRpcMessage', () => {
  it('should read slot 3 of a Call', () => {
    const payload = { customData: null };
    expect(
      extractPayloadFromRpcMessage(
        [MessageTypeId.Call, CORRELATION_ID, OCPP_CallAction.Heartbeat, payload],
        MessageTypeId.Call,
      ),
    ).toBe(payload);
  });

  it('should read slot 2 of a CallResult', () => {
    const payload = { currentTime: TIMESTAMP };
    expect(
      extractPayloadFromRpcMessage(
        [MessageTypeId.CallResult, CORRELATION_ID, payload],
        MessageTypeId.CallResult,
      ),
    ).toBe(payload);
  });

  it('should reassemble the three error slots of a CallError', () => {
    expect(
      extractPayloadFromRpcMessage(
        [MessageTypeId.CallError, CORRELATION_ID, 'InternalError', 'boom', { detail: 1 }],
        MessageTypeId.CallError,
      ),
    ).toEqual({
      errorCode: 'InternalError',
      errorDescription: 'boom',
      errorDetails: { detail: 1 },
    });
  });

  it('should return undefined for an unknown message type', () => {
    expect(extractPayloadFromRpcMessage([99, CORRELATION_ID], 99 as MessageTypeId)).toBeUndefined();
  });

  it('should return undefined when there is no frame to read', () => {
    expect(extractPayloadFromRpcMessage(undefined, MessageTypeId.Call)).toBeUndefined();
  });
});

describe('buildFrameEvent', () => {
  it('should derive the direction from the origin rather than taking it as input', () => {
    expect(
      buildFrameEvent(frameInput({ origin: MessageOrigin.ChargingStationManagementSystem })),
    ).toMatchObject({
      origin: MessageOrigin.ChargingStationManagementSystem,
      direction: FrameDirection.Outbound,
    });
  });

  it('should mark an event parsed and extract its payload when a typed RPC frame is supplied', () => {
    const rpcMessage = [MessageTypeId.Call, CORRELATION_ID, OCPP_CallAction.Heartbeat, { a: 1 }];

    const event = buildFrameEvent(
      frameInput({
        raw: JSON.stringify(rpcMessage),
        type: MessageTypeId.Call,
        action: OCPP_CallAction.Heartbeat,
        rpcMessage,
      }),
    );

    expect(event).toMatchObject({
      kind: MessagesEventType.Frame,
      parsed: true,
      payload: { a: 1 },
      frame: rpcMessage,
    });
  });

  it('should leave payload undefined on the unparsed path even though raw survives', () => {
    const event = buildFrameEvent(
      frameInput({ raw: 'invalid-json', type: MessageTypeId.Call, action: 'NoAction' }),
    );

    expect(event.parsed).toBe(false);
    expect(event.payload).toBeUndefined();
    expect(event.frame).toBeUndefined();
    expect(event.raw).toBe('invalid-json');
  });

  it('should not claim to be parsed when a frame arrived without a message type', () => {
    const event = buildFrameEvent(frameInput({ rpcMessage: [1, CORRELATION_ID], type: undefined }));

    expect(event.parsed).toBe(false);
  });

  it('should produce an envelope the consumer-side schema accepts', () => {
    const event = buildFrameEvent(
      frameInput({ type: MessageTypeId.Call, action: OCPP_CallAction.Heartbeat, rpcMessage: [] }),
    );

    expect(MessagesEventSchema.safeParse(event).success).toBe(true);
  });
});

describe('buildConnectionEvent', () => {
  it('should build a connected event carrying the negotiated protocol', () => {
    const event = buildConnectionEvent({
      tenantId: TENANT_ID,
      ocppConnectionName: STATION_ID,
      state: ConnectionEventState.Connected,
      timestamp: TIMESTAMP,
      protocol: OCPPVersion.OCPP2_0_1,
    });

    expect(event).toMatchObject({
      kind: MessagesEventType.Connection,
      state: ConnectionEventState.Connected,
      protocol: OCPPVersion.OCPP2_0_1,
    });
    expect(MessagesEventSchema.safeParse(event).success).toBe(true);
  });

  it('should stay valid when a close could not recover the protocol', () => {
    const event = buildConnectionEvent({
      tenantId: TENANT_ID,
      ocppConnectionName: STATION_ID,
      state: ConnectionEventState.Closed,
      timestamp: TIMESTAMP,
    });

    expect(event.protocol).toBeUndefined();
    expect(MessagesEventSchema.safeParse(event).success).toBe(true);
  });
});

describe('kind discrimination', () => {
  it('should narrow a frame event', () => {
    const event = buildFrameEvent(frameInput());
    expect(isFrameEvent(event)).toBe(true);
    expect(isConnectionEvent(event)).toBe(false);
  });

  it('should narrow a connection event', () => {
    const event = buildConnectionEvent({
      tenantId: TENANT_ID,
      ocppConnectionName: STATION_ID,
      state: ConnectionEventState.Closed,
      timestamp: TIMESTAMP,
    });
    expect(isConnectionEvent(event)).toBe(true);
    expect(isFrameEvent(event)).toBe(false);
  });

  it('should reject an envelope with an unknown kind', () => {
    expect(MessagesEventSchema.safeParse({ kind: 'telemetry', tenantId: 1 }).success).toBe(false);
  });
});

describe('messagesEventRoutingKey', () => {
  it('should key a frame by direction and action', () => {
    expect(
      messagesEventRoutingKey(buildFrameEvent(frameInput({ action: OCPP_CallAction.Heartbeat }))),
    ).toBe('frame.inbound.Heartbeat');
  });

  it('should key an outbound frame by its own direction', () => {
    expect(
      messagesEventRoutingKey(
        buildFrameEvent(
          frameInput({
            origin: MessageOrigin.ChargingStationManagementSystem,
            action: OCPP_CallAction.GetBaseReport,
          }),
        ),
      ),
    ).toBe('frame.outbound.GetBaseReport');
  });

  it.each([
    ['absent', undefined],
    ['empty', ''],
  ])('should substitute na when the action is %s', (_label, action) => {
    expect(messagesEventRoutingKey(buildFrameEvent(frameInput({ action })))).toBe(
      'frame.inbound.na',
    );
  });

  it('should key a connection event by state', () => {
    expect(
      messagesEventRoutingKey(
        buildConnectionEvent({
          tenantId: TENANT_ID,
          ocppConnectionName: STATION_ID,
          state: ConnectionEventState.Closed,
          timestamp: TIMESTAMP,
        }),
      ),
    ).toBe('connection.closed');
  });

  it('should not encode the tenant, so nothing routes on it', () => {
    const one = messagesEventRoutingKey(buildFrameEvent(frameInput({ tenantId: 1 })));
    const other = messagesEventRoutingKey(buildFrameEvent(frameInput({ tenantId: 99 })));

    expect(one).toBe(other);
  });
});

describe('messages-plane topology constants', () => {
  it('should name one queue per event kind, each with its own dead-letter queue', () => {
    expect(MESSAGES_QUEUES).toEqual([
      {
        kind: MessagesEventType.Frame,
        queue: 'messages.ocpp',
        dlq: 'messages.ocpp.dlq',
        binding: 'frame.#',
      },
      {
        kind: MessagesEventType.Connection,
        queue: 'messages.connections',
        dlq: 'messages.connections.dlq',
        binding: 'connection.#',
      },
    ]);
    expect(MESSAGES_EXCHANGE).toBe('messages');
    expect(MESSAGES_DLX).toBe('messages.dlx');
  });

  it('should bind each queue to exactly the keys its own kind produces', () => {
    const frames = [
      buildFrameEvent(frameInput({ action: OCPP_CallAction.Heartbeat })),
      buildFrameEvent(frameInput({ action: undefined })),
      buildFrameEvent(frameInput({ origin: MessageOrigin.ChargingStationManagementSystem })),
    ];
    const connections = [ConnectionEventState.Connected, ConnectionEventState.Closed].map((state) =>
      buildConnectionEvent({
        tenantId: TENANT_ID,
        ocppConnectionName: STATION_ID,
        state,
        timestamp: TIMESTAMP,
      }),
    );

    for (const event of frames) {
      expect(messagesEventRoutingKey(event).startsWith('frame.')).toBe(true);
    }
    for (const event of connections) {
      expect(messagesEventRoutingKey(event).startsWith('connection.')).toBe(true);
    }
  });
});
