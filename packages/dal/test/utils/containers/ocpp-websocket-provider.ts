// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPPVersion } from '@citrineos/types';
import { WS_PORT } from './ports.js';

export function connectOcpp(
  stationId: string,
  protocol: string = OCPPVersion.OCPP2_0_1,
): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${WS_PORT}/${stationId}`, [protocol]);
    ws.addEventListener('open', () => resolve(ws), { once: true });
    ws.addEventListener(
      'error',
      () => reject(new Error(`Could not open an OCPP connection for ${stationId}`)),
      { once: true },
    );
  });
}

export function sendCall(
  ws: WebSocket,
  msgId: string,
  action: string,
  payload: object,
): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`No OCPP response for ${action} within 10 s`)),
      10_000,
    );

    ws.addEventListener(
      'message',
      (event: MessageEvent) => {
        clearTimeout(timeout);
        try {
          const data =
            typeof event.data === 'string'
              ? event.data
              : new TextDecoder().decode(event.data as ArrayBuffer);
          resolve(JSON.parse(data) as unknown[]);
        } catch (e) {
          reject(e as Error);
        }
      },
      { once: true },
    );

    ws.send(JSON.stringify([2, msgId, action, payload]));
  });
}
