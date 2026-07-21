import { OCPPVersion } from '@citrineos/base';
import WebSocket from 'ws';

const WS_PORT = 8081; // OCPP WebSocket (allowUnknownChargingStations: true)

export function connectOcpp(
  stationId: string,
  protocol = OCPPVersion.OCPP2_0_1,
): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${WS_PORT}/${stationId}`, [protocol]);
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

export function sendCall(
  ws: WebSocket,
  msgId: string,
  action: string,
  payload: object,
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`No OCPP response for ${action} within 10 s`)),
      10_000,
    );
    ws.once('message', (data) => {
      clearTimeout(timeout);
      try {
        resolve(JSON.parse(data.toString()) as any[]);
      } catch (e) {
        reject(e);
      }
    });
    ws.send(JSON.stringify([2, msgId, action, payload]));
  });
}
