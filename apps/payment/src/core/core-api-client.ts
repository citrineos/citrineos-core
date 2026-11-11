// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { OCPP1_6, OCPP2_1 } from '@citrineos/types';
import { OCPP2_0_1, OCPPVersion } from '@citrineos/types';
import type { ICoreAuth } from './core-auth.js';

export interface RemoteStartRequest {
  tenantId: number;
  ocppConnectionName: string;
  protocol: OCPPVersion;
  idToken: string;
  /** OCPP 2.x: the EVSE's evseTypeId. */
  evseTypeId: number | null;
  /** OCPP 1.6: the station-wide connector number. */
  ocpp16ConnectorId: number | null;
  /** OCPP 2.x: the station's next remoteStartId. */
  remoteStartId: number | null;
  /** OCPP 2.1: the most the transaction may cost, in major units. */
  maxCost: number | null;
  callbackUrl: string;
}

export interface RemoteStartResult {
  /** Core accepted the request and sent it to the station; the station's answer comes later. */
  sent: boolean;
  detail: string;
}

/** OCPP 2.x: a message the station shows for the length of a transaction. */
export interface DisplayMessageRequest {
  tenantId: number;
  ocppConnectionName: string;
  protocol: OCPPVersion;
  id: number;
  transactionId: string;
  /** Where the station fetches what it displays. */
  uri: string;
}

export interface ClearDisplayMessageRequest {
  tenantId: number;
  ocppConnectionName: string;
  protocol: OCPPVersion;
  id: number;
}

export interface ICoreApiClient {
  remoteStart(request: RemoteStartRequest): Promise<RemoteStartResult>;
  setDisplayMessage(request: DisplayMessageRequest): Promise<RemoteStartResult>;
  clearDisplayMessage(request: ClearDisplayMessageRequest): Promise<RemoteStartResult>;
}

interface MessageConfirmation {
  success: boolean;
  payload?: unknown;
}

/** Sends commands to stations through Core's per-version message API. */
export class CoreApiClient implements ICoreApiClient {
  constructor(
    private readonly _baseUrl: string,
    private readonly _auth: ICoreAuth,
    private readonly _fetch: typeof fetch = fetch,
  ) {}

  async remoteStart(request: RemoteStartRequest): Promise<RemoteStartResult> {
    const { path, body } = this._remoteStartMessage(request);
    return this._send(request, path, body, request.callbackUrl);
  }

  async setDisplayMessage(request: DisplayMessageRequest): Promise<RemoteStartResult> {
    const body: OCPP2_0_1.SetDisplayMessageRequest = {
      message: {
        id: request.id,
        priority: OCPP2_0_1.MessagePriorityEnumType.AlwaysFront,
        transactionId: request.transactionId,
        message: { format: OCPP2_0_1.MessageFormatEnumType.URI, content: request.uri },
      },
    };
    return this._send(request, this._ocpp2Path(request.protocol, 'setDisplayMessage'), body);
  }

  async clearDisplayMessage(request: ClearDisplayMessageRequest): Promise<RemoteStartResult> {
    const body: OCPP2_0_1.ClearDisplayMessageRequest = { id: request.id };
    return this._send(request, this._ocpp2Path(request.protocol, 'clearDisplayMessage'), body);
  }

  private async _send(
    station: { tenantId: number; ocppConnectionName: string },
    path: string,
    body: object,
    callbackUrl?: string,
  ): Promise<RemoteStartResult> {
    const url = new URL(path, this._baseUrl);
    url.searchParams.set('identifier', station.ocppConnectionName);
    url.searchParams.set('tenantId', String(station.tenantId));
    if (callbackUrl) {
      url.searchParams.set('callbackUrl', callbackUrl);
    }

    const post = async () =>
      this._fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await this._auth.headersFor(station.tenantId)),
        },
        body: JSON.stringify(body),
      });
    let response = await post();
    if (response.status === 401) {
      // E.g. a localDev Core restarted with a new signing key: a fresh token may do.
      this._auth.invalidate(station.tenantId);
      response = await post();
    }
    const text = await response.text();
    if (!response.ok) {
      return { sent: false, detail: `Core answered ${response.status}: ${text}` };
    }
    const confirmations: MessageConfirmation[] = JSON.parse(text);
    const confirmation = confirmations[0];
    return {
      sent: confirmation?.success === true,
      detail: JSON.stringify(confirmation?.payload ?? null),
    };
  }

  /** Display messages live in Core's configuration module and exist from OCPP 2.0.1 on. */
  private _ocpp2Path(protocol: OCPPVersion, action: string): string {
    if (protocol === OCPPVersion.OCPP1_6) {
      throw new Error(`${action} needs OCPP 2.0.1 or later`);
    }
    return `/ocpp/${protocol.replace(/^ocpp/, '')}/configuration/${action}`;
  }

  private _remoteStartMessage(request: RemoteStartRequest): {
    path: string;
    body: OCPP1_6.RemoteStartTransactionRequest | OCPP2_1.RequestStartTransactionRequest;
  } {
    switch (request.protocol) {
      case OCPPVersion.OCPP1_6: {
        const body: OCPP1_6.RemoteStartTransactionRequest = { idTag: request.idToken };
        if (request.ocpp16ConnectorId !== null) {
          body.connectorId = request.ocpp16ConnectorId;
        }
        return { path: '/ocpp/1.6/evdriver/remoteStartTransaction', body };
      }
      case OCPPVersion.OCPP2_0_1:
      case OCPPVersion.OCPP2_1: {
        if (request.remoteStartId === null) {
          throw new Error(`${request.protocol} remote start needs a remoteStartId`);
        }
        const body: OCPP2_1.RequestStartTransactionRequest = {
          remoteStartId: request.remoteStartId,
          idToken: { idToken: request.idToken, type: 'Central' },
        };
        if (request.evseTypeId !== null) {
          body.evseId = request.evseTypeId;
        }
        if (request.protocol === OCPPVersion.OCPP2_1 && request.maxCost !== null) {
          body.customData = {
            vendorId: 'citrineos',
            transactionLimit: { maxCost: request.maxCost },
          };
        }
        const version = request.protocol.replace(/^ocpp/, '');
        return { path: `/ocpp/${version}/evdriver/requestStartTransaction`, body };
      }
    }
  }
}
