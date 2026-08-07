// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
  type RawCall,
  type RawCallError,
  type RawCallResult,
  ErrorCode,
  MessageTypeId,
  OCPP_CallAction,
} from '@citrineos/types';
import {
  Call,
  CallError,
  CallResult,
  OcppError,
  readMessageId,
  UNREADABLE_MESSAGE_ID,
} from '../../../src/ocpp/rpc/message.js';

const MESSAGE_ID = 'msg-123';

describe('Call', () => {
  const raw: RawCall = [
    MessageTypeId.Call,
    MESSAGE_ID,
    OCPP_CallAction.BootNotification,
    { reason: 'PowerUp' },
  ];

  it('exposes the frame elements as named fields', () => {
    const call = new Call(raw);

    expect(call.messageTypeId).toBe(MessageTypeId.Call);
    expect(call.messageId).toBe(MESSAGE_ID);
    expect(call.action).toBe(OCPP_CallAction.BootNotification);
    expect(call.payload).toEqual({ reason: 'PowerUp' });
  });

  it('round-trips through JSON unchanged', () => {
    expect(JSON.parse(JSON.stringify(new Call(raw)))).toEqual(raw);
  });

  it('builds an outbound Call from its fields', () => {
    const call = new Call(MESSAGE_ID, OCPP_CallAction.Heartbeat, {});

    expect(call.toJSON()).toEqual([MessageTypeId.Call, MESSAGE_ID, OCPP_CallAction.Heartbeat, {}]);
  });

  it('ignores elements beyond the four the specification defines', () => {
    const call = new Call([...raw, 'extra'] as unknown as RawCall);

    expect(call.toJSON()).toEqual(raw);
  });

  it.each([
    ['not an array', 'nope'],
    ['too few elements', [MessageTypeId.Call, MESSAGE_ID, OCPP_CallAction.Heartbeat]],
    ['a non-string action', [MessageTypeId.Call, MESSAGE_ID, 42, {}]],
    ['an empty action', [MessageTypeId.Call, MESSAGE_ID, '', {}]],
    ['a primitive payload', [MessageTypeId.Call, MESSAGE_ID, 'Heartbeat', 'payload']],
    ['a null payload', [MessageTypeId.Call, MESSAGE_ID, 'Heartbeat', null]],
  ])('rejects a frame with %s', (_description, frame) => {
    expect(() => new Call(frame as unknown as RawCall)).toThrow(
      expect.objectContaining({ errorCode: ErrorCode.ProtocolError }),
    );
  });

  it('reports "-1" as the messageId when the frame carries none', () => {
    expect(() => new Call([MessageTypeId.Call, 42, 'Heartbeat', {}] as unknown as RawCall)).toThrow(
      expect.objectContaining({ messageId: UNREADABLE_MESSAGE_ID }),
    );
  });

  it('reports the frame messageId on rejection when it is readable', () => {
    expect(() => new Call([MessageTypeId.Call, MESSAGE_ID, 42, {}] as unknown as RawCall)).toThrow(
      expect.objectContaining({ messageId: MESSAGE_ID }),
    );
  });
});

describe('CallResult', () => {
  const raw: RawCallResult = [MessageTypeId.CallResult, MESSAGE_ID, { currentTime: 'now' }];

  it('exposes the frame elements as named fields', () => {
    const callResult = new CallResult(raw);

    expect(callResult.messageTypeId).toBe(MessageTypeId.CallResult);
    expect(callResult.messageId).toBe(MESSAGE_ID);
    expect(callResult.payload).toEqual({ currentTime: 'now' });
  });

  it('round-trips through JSON unchanged', () => {
    expect(JSON.parse(JSON.stringify(new CallResult(raw)))).toEqual(raw);
  });

  it('builds an outbound CallResult from its fields', () => {
    expect(new CallResult(MESSAGE_ID, {}).toJSON()).toEqual([
      MessageTypeId.CallResult,
      MESSAGE_ID,
      {},
    ]);
  });

  it.each([
    ['too few elements', [MessageTypeId.CallResult, MESSAGE_ID]],
    ['a primitive payload', [MessageTypeId.CallResult, MESSAGE_ID, 7]],
  ])('rejects a frame with %s', (_description, frame) => {
    expect(() => new CallResult(frame as unknown as RawCallResult)).toThrow(
      expect.objectContaining({ errorCode: ErrorCode.ProtocolError }),
    );
  });
});

describe('CallError', () => {
  const raw: RawCallError = [
    MessageTypeId.CallError,
    MESSAGE_ID,
    ErrorCode.InternalError,
    'it broke',
    { detail: 'why' },
  ];

  it('exposes the frame elements as named fields', () => {
    const callError = new CallError(raw);

    expect(callError.messageTypeId).toBe(MessageTypeId.CallError);
    expect(callError.messageId).toBe(MESSAGE_ID);
    expect(callError.errorCode).toBe(ErrorCode.InternalError);
    expect(callError.errorDescription).toBe('it broke');
    expect(callError.errorDetails).toEqual({ detail: 'why' });
  });

  it('round-trips through JSON unchanged', () => {
    expect(JSON.parse(JSON.stringify(new CallError(raw)))).toEqual(raw);
  });

  it('defaults errorDetails to an empty object when the frame omits it', () => {
    const callError = new CallError([
      MessageTypeId.CallError,
      MESSAGE_ID,
      ErrorCode.GenericError,
      'no details',
    ]);

    expect(callError.errorDetails).toEqual({});
  });

  it('defaults an unreadable errorDescription to an empty string', () => {
    const callError = new CallError([
      MessageTypeId.CallError,
      MESSAGE_ID,
      ErrorCode.GenericError,
      null,
      {},
    ] as unknown as RawCallError);

    expect(callError.errorDescription).toBe('');
  });

  it('builds an outbound CallError from its fields', () => {
    expect(new CallError(MESSAGE_ID, ErrorCode.SecurityError, 'denied').toJSON()).toEqual([
      MessageTypeId.CallError,
      MESSAGE_ID,
      ErrorCode.SecurityError,
      'denied',
      {},
    ]);
  });

  it('converts to an OcppError for routing back to the caller', () => {
    const ocppError = new CallError(raw).asOcppError();

    expect(ocppError).toBeInstanceOf(OcppError);
    expect(ocppError.messageId).toBe(MESSAGE_ID);
    expect(ocppError.errorCode).toBe(ErrorCode.InternalError);
    expect(ocppError.message).toBe('it broke');
    expect(ocppError.errorDetails).toEqual({ detail: 'why' });
  });

  it.each([
    ['too few elements', [MessageTypeId.CallError, MESSAGE_ID, ErrorCode.GenericError]],
    ['an unreadable messageId', [MessageTypeId.CallError, null, 'x', 'y', {}]],
  ])('rejects a frame with %s', (_description, frame) => {
    expect(() => new CallError(frame as unknown as RawCallError)).toThrow(
      expect.objectContaining({ errorCode: ErrorCode.ProtocolError }),
    );
  });
});

describe('OcppError', () => {
  it('converts to a CallError frame', () => {
    const error = new OcppError(MESSAGE_ID, ErrorCode.FormatViolation, 'bad payload', {
      errors: ['nope'],
    });

    expect(error.asCallError()).toBeInstanceOf(CallError);
    expect(JSON.stringify(error.asCallError())).toBe(
      JSON.stringify([
        MessageTypeId.CallError,
        MESSAGE_ID,
        ErrorCode.FormatViolation,
        'bad payload',
        { errors: ['nope'] },
      ]),
    );
  });
});

describe('a frame given to the wrong model', () => {
  // The messageTypeId decides which model a frame becomes, so a mismatch is a
  // dispatch bug on our side. It must not surface as an OcppError, or it would be
  // reported to the sender as a protocol violation it did not commit.
  it.each([
    ['Call', () => new Call([MessageTypeId.CallResult, MESSAGE_ID, {}, {}] as unknown as RawCall)],
    [
      'CallResult',
      () =>
        new CallResult([
          MessageTypeId.Call,
          MESSAGE_ID,
          OCPP_CallAction.Heartbeat,
          {},
        ] as unknown as RawCallResult),
    ],
    [
      'CallError',
      () =>
        new CallError([
          MessageTypeId.CallResult,
          MESSAGE_ID,
          ErrorCode.GenericError,
          'x',
          {},
        ] as unknown as RawCallError),
    ],
  ])('reports building a %s as a caller bug, not an OcppError', (name, build) => {
    expect(build).toThrow(new RegExp(`Cannot build a ${name.toUpperCase()} model`));
    expect(build).not.toThrow(OcppError);
  });
});

describe('readMessageId', () => {
  it('reads the messageId off an unvalidated frame', () => {
    expect(readMessageId([MessageTypeId.Call, MESSAGE_ID, 'Heartbeat', {}])).toBe(MESSAGE_ID);
  });

  it.each([
    ['a non-array', {}],
    ['an empty array', []],
    ['a non-string messageId', [MessageTypeId.Call, 7]],
    ['an empty messageId', [MessageTypeId.Call, '']],
  ])('falls back to "-1" for %s', (_description, frame) => {
    expect(readMessageId(frame)).toBe(UNREADABLE_MESSAGE_ID);
  });
});
