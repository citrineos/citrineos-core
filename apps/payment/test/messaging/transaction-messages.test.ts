// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
  parseTransactionMessage,
  TransactionMessageKind,
} from '../../src/messaging/transaction-messages.js';
import {
  IdTokenEnum,
  OCPP_CallAction,
  TransactionEventEnum,
  TriggerReasonEnum,
} from '@citrineos/types';

// Headers as Core's toAmqpHeaders sets them: the message context is spread in, tenantId as a string.
function headers(action: string) {
  return { action, state: '1', origin: 'cs', tenantId: '3', ocppConnectionName: 'CS-9' };
}

// Core publishes instanceToPlain(Message), which keeps the underscored field names.
function body(payload: object, plain = false): Buffer {
  return Buffer.from(JSON.stringify(plain ? { payload } : { _payload: payload, _action: 'x' }));
}

const station = { tenantId: 3, ocppConnectionName: 'CS-9' };

describe('parseTransactionMessage', () => {
  it('reads the idTag of an OCPP 1.6 StartTransaction', () => {
    expect(
      parseTransactionMessage(
        headers(OCPP_CallAction.StartTransaction),
        body({ connectorId: 1, idTag: 'PAY_12', meterStart: 0, timestamp: '2026-10-23T10:00:00Z' }),
      ),
    ).toEqual([{ kind: TransactionMessageKind.Started, ...station, idToken: 'PAY_12' }]);
  });

  it('reads the transaction of an OCPP 1.6 StopTransaction', () => {
    expect(
      parseTransactionMessage(
        headers(OCPP_CallAction.StopTransaction),
        body({ transactionId: 44, meterStop: 900, timestamp: '2026-10-23T11:00:00Z' }, true),
      ),
    ).toEqual([{ kind: TransactionMessageKind.Ended, ...station, transactionId: '44' }]);
  });

  it('reads the idToken of an OCPP 2.x TransactionEvent', () => {
    expect(
      parseTransactionMessage(
        headers(OCPP_CallAction.TransactionEvent),
        body({
          eventType: TransactionEventEnum.Started,
          triggerReason: 'RemoteStart',
          transactionInfo: { transactionId: 'abc' },
          idToken: { idToken: 'PAY_12', type: IdTokenEnum.Central },
        }),
      ),
    ).toEqual([
      { kind: TransactionMessageKind.Started, ...station, idToken: 'PAY_12', transactionId: 'abc' },
    ]);
  });

  it('reads the end of an OCPP 2.x transaction', () => {
    expect(
      parseTransactionMessage(
        headers(OCPP_CallAction.TransactionEvent),
        body({
          eventType: TransactionEventEnum.Ended,
          triggerReason: 'EVCommunicationLost',
          transactionInfo: { transactionId: 'abc' },
        }),
      ),
    ).toEqual([{ kind: TransactionMessageKind.Ended, ...station, transactionId: 'abc' }]);
  });

  it.each([
    TriggerReasonEnum.CablePluggedIn,
    TriggerReasonEnum.EVDetected,
    TriggerReasonEnum.SignedDataReceived,
  ])(
    'reads an OCPP 2.x transaction started by %s, before anyone is authorised',
    (triggerReason) => {
      expect(
        parseTransactionMessage(
          headers(OCPP_CallAction.TransactionEvent),
          body({
            eventType: TransactionEventEnum.Started,
            triggerReason,
            transactionInfo: { transactionId: 'abc' },
          }),
        ),
      ).toEqual([{ kind: TransactionMessageKind.PluggedIn, ...station, transactionId: 'abc' }]);
    },
  );

  it('reads both from an event that authorises and ends', () => {
    expect(
      parseTransactionMessage(
        headers(OCPP_CallAction.TransactionEvent),
        body({
          eventType: TransactionEventEnum.Ended,
          triggerReason: 'StopAuthorized',
          transactionInfo: { transactionId: 'abc' },
          idToken: { idToken: 'PAY_12', type: IdTokenEnum.Central },
        }),
      ).map((message) => message.kind),
    ).toEqual([TransactionMessageKind.Started, TransactionMessageKind.Ended]);
  });

  it.each([
    [
      'an update without an idToken',
      headers(OCPP_CallAction.TransactionEvent),
      {
        eventType: TransactionEventEnum.Updated,
        triggerReason: 'MeterValuePeriodic',
        transactionInfo: { transactionId: 'abc' },
      },
    ],
    [
      'a start without an idToken that is not the EV’s doing',
      headers(OCPP_CallAction.TransactionEvent),
      {
        eventType: TransactionEventEnum.Started,
        triggerReason: 'Deauthorized',
        transactionInfo: { transactionId: 'abc' },
      },
    ],
    [
      'a plug-in that does not start a transaction',
      headers(OCPP_CallAction.TransactionEvent),
      {
        eventType: TransactionEventEnum.Updated,
        triggerReason: TriggerReasonEnum.CablePluggedIn,
        transactionInfo: { transactionId: 'abc' },
      },
    ],
    ['another action', headers('Heartbeat'), {}],
    [
      'a payload it cannot read',
      headers(OCPP_CallAction.StopTransaction),
      { transactionId: 'not-a-number' },
    ],
    [
      'headers without a station',
      { action: OCPP_CallAction.StopTransaction, tenantId: '3' },
      { transactionId: 1 },
    ],
  ])('ignores %s', (_name, messageHeaders, payload) => {
    expect(parseTransactionMessage(messageHeaders, body(payload))).toEqual([]);
  });
});
