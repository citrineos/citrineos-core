// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import type { TransactionPluggedIn } from '../services/scan-and-charge-service.js';
import type { TransactionEnded, TransactionStarted } from '../services/settlement-service.js';

/** The station-to-CSMS calls this app follows, as Core publishes them. */
export const TRANSACTION_ACTIONS = ['StartTransaction', 'StopTransaction', 'TransactionEvent'];

export type TransactionMessage =
  | ({ kind: 'started' } & TransactionStarted)
  | ({ kind: 'ended' } & TransactionEnded)
  | ({ kind: 'plugged-in' } & TransactionPluggedIn);

/** What starts a 2.x transaction before anyone is authorised: the EV, not a driver's token. */
const UNAUTHORIZED_START_TRIGGERS: readonly string[] = [
  'CablePluggedIn',
  'EVDetected',
  'SignedDataReceived',
];

const Headers = z.object({
  action: z.string(),
  tenantId: z.coerce.number().int(),
  ocppConnectionName: z.string().min(1),
});

const StartTransaction = z.object({ idTag: z.string() });
const StopTransaction = z.object({ transactionId: z.number().int() });
const TransactionEvent = z.object({
  eventType: z.enum(['Started', 'Updated', 'Ended']),
  triggerReason: z.string(),
  transactionInfo: z.object({ transactionId: z.string() }),
  idToken: z.object({ idToken: z.string() }).nullish(),
});

/**
 * Reads a bus message into what settlement needs, or nothing when the message is not one this app
 * acts on. Core has already validated the payload against the OCPP schema before publishing it.
 */
export function parseTransactionMessage(
  headers: Record<string, unknown>,
  body: Buffer,
): TransactionMessage[] {
  const parsedHeaders = Headers.safeParse(headers);
  if (!parsedHeaders.success) {
    return [];
  }
  const { action, tenantId, ocppConnectionName } = parsedHeaders.data;
  const message: unknown = JSON.parse(body.toString('utf-8'));
  const payload =
    typeof message === 'object' && message !== null
      ? 'payload' in message
        ? message.payload
        : '_payload' in message
          ? message._payload
          : undefined
      : undefined;
  const station = { tenantId, ocppConnectionName };

  switch (action) {
    case 'StartTransaction': {
      const start = StartTransaction.safeParse(payload);
      return start.success ? [{ kind: 'started', ...station, idToken: start.data.idTag }] : [];
    }
    case 'StopTransaction': {
      const stop = StopTransaction.safeParse(payload);
      return stop.success
        ? [{ kind: 'ended', ...station, transactionId: String(stop.data.transactionId) }]
        : [];
    }
    case 'TransactionEvent': {
      const event = TransactionEvent.safeParse(payload);
      if (!event.success) {
        return [];
      }
      const { transactionId } = event.data.transactionInfo;
      const messages: TransactionMessage[] = [];
      if (event.data.idToken?.idToken) {
        messages.push({
          kind: 'started',
          ...station,
          idToken: event.data.idToken.idToken,
          transactionId,
        });
      } else if (
        event.data.eventType === 'Started' &&
        UNAUTHORIZED_START_TRIGGERS.includes(event.data.triggerReason)
      ) {
        messages.push({ kind: 'plugged-in', ...station, transactionId });
      }
      if (event.data.eventType === 'Ended') {
        messages.push({ kind: 'ended', ...station, transactionId });
      }
      return messages;
    }
    default:
      return [];
  }
}
