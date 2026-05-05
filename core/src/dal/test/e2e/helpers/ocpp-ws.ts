// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Tiny WebSocket helper for e2e tests. Every test reimplemented these
 * the same way; centralizing them removes ~40 lines of duplication
 * from each migration.
 */

import WebSocket from 'ws';

/** Open an OCPP 2.0.1 WebSocket against `ws://host:port/<stationId>`. */
export function connectOcpp(wsUrl: string, stationId: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsUrl}/${stationId}`, ['ocpp2.0.1']);
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

/** Same, but for OCPP 1.6 chargers. */
export function connectOcpp16(wsUrl: string, stationId: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsUrl}/${stationId}`, ['ocpp1.6']);
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

/**
 * Send a CALL frame and resolve when the server responds with a
 * CALLRESULT or CALLERROR. Returns the parsed frame.
 */
export function sendCall(
  ws: WebSocket,
  msgId: string,
  action: string,
  payload: object,
  timeoutMs = 10_000,
): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`No OCPP response for ${action} within ${timeoutMs}ms`)),
      timeoutMs,
    );
    ws.once('message', (data) => {
      clearTimeout(timeout);
      try {
        resolve(JSON.parse(data.toString()) as unknown[]);
      } catch (e) {
        reject(e);
      }
    });
    ws.send(JSON.stringify([2, msgId, action, payload]));
  });
}
