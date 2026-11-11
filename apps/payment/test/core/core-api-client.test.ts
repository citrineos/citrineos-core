// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPPVersion } from '@citrineos/types';
import { describe, expect, it } from 'vitest';
import type { RemoteStartRequest } from '../../src/core/core-api-client.js';
import { CoreApiClient } from '../../src/core/core-api-client.js';
import type { ICoreAuth } from '../../src/core/core-auth.js';
import { StaticCoreAuth } from '../../src/core/core-auth.js';

interface Sent {
  url: URL;
  headers: Headers;
  body: unknown;
}

function aClient(answer: Response | (() => Response) = Response.json([{ success: true }])) {
  const sent: Sent[] = [];
  const fetchFn: typeof fetch = async (input, init) => {
    sent.push({
      url: new URL(String(input)),
      headers: new Headers(init?.headers),
      body: JSON.parse(String(init?.body)),
    });
    return typeof answer === 'function' ? answer() : answer;
  };
  const client = new CoreApiClient(
    'http://core:8080',
    new StaticCoreAuth(
      { Authorization: 'Bearer default' },
      { '2': { Authorization: 'Bearer tenant-2' } },
    ),
    fetchFn,
  );
  return { client, sent };
}

function aRequest(overrides: Partial<RemoteStartRequest> = {}): RemoteStartRequest {
  return {
    tenantId: 1,
    ocppConnectionName: 'CS-1',
    protocol: OCPPVersion.OCPP2_0_1,
    idToken: 'PAY_5',
    evseTypeId: 1,
    ocpp16ConnectorId: null,
    remoteStartId: 9,
    maxCost: 50,
    callbackUrl: 'http://payment:9010/api/callbacks/remote-start/x?signature=s',
    ...overrides,
  };
}

describe('CoreApiClient.remoteStart', () => {
  it('sends an OCPP 2.0.1 RequestStartTransaction for the station and tenant', async () => {
    const { client, sent } = aClient();

    expect(await client.remoteStart(aRequest())).toEqual({ sent: true, detail: 'null' });

    const [request] = sent;
    expect(request.url.pathname).toBe('/ocpp/2.0.1/evdriver/requestStartTransaction');
    expect(Object.fromEntries(request.url.searchParams)).toEqual({
      identifier: 'CS-1',
      tenantId: '1',
      callbackUrl: 'http://payment:9010/api/callbacks/remote-start/x?signature=s',
    });
    expect(request.headers.get('Authorization')).toBe('Bearer default');
    expect(request.body).toEqual({
      remoteStartId: 9,
      idToken: { idToken: 'PAY_5', type: 'Central' },
      evseId: 1,
    });
  });

  it('limits an OCPP 2.1 transaction to the hold', async () => {
    const { client, sent } = aClient();

    await client.remoteStart(aRequest({ protocol: OCPPVersion.OCPP2_1 }));

    expect(sent[0].url.pathname).toBe('/ocpp/2.1/evdriver/requestStartTransaction');
    expect(sent[0].body).toMatchObject({
      customData: { vendorId: 'citrineos', transactionLimit: { maxCost: 50 } },
    });
  });

  it('sends an OCPP 1.6 RemoteStartTransaction with the idTag and connector', async () => {
    const { client, sent } = aClient();

    await client.remoteStart(
      aRequest({ protocol: OCPPVersion.OCPP1_6, ocpp16ConnectorId: 2, remoteStartId: null }),
    );

    expect(sent[0].url.pathname).toBe('/ocpp/1.6/evdriver/remoteStartTransaction');
    expect(sent[0].body).toEqual({ idTag: 'PAY_5', connectorId: 2 });
  });

  it('uses the tenant’s own headers when it has them', async () => {
    const { client, sent } = aClient();

    await client.remoteStart(aRequest({ tenantId: 2 }));

    expect(sent[0].headers.get('Authorization')).toBe('Bearer tenant-2');
  });

  it('reports a request Core did not send', async () => {
    const { client } = aClient(Response.json([{ success: false, payload: 'Station offline' }]));

    expect(await client.remoteStart(aRequest())).toEqual({
      sent: false,
      detail: '"Station offline"',
    });
  });

  it('reports a request Core refused', async () => {
    const { client } = aClient(() => new Response('Missing permission', { status: 403 }));

    expect(await client.remoteStart(aRequest())).toEqual({
      sent: false,
      detail: 'Core answered 403: Missing permission',
    });
  });
});

describe('CoreApiClient display messages', () => {
  const station = { tenantId: 2, ocppConnectionName: 'CS-1' };

  it('shows a URI for the length of a transaction, in front of anything else', async () => {
    const { client, sent } = aClient();

    const result = await client.setDisplayMessage({
      ...station,
      protocol: OCPPVersion.OCPP2_1,
      id: 41,
      transactionId: 'tx-1',
      uri: 'https://pay.example.com/api/checkouts/x/qr.png',
    });

    expect(result.sent).toBe(true);
    const [request] = sent;
    expect(request.url.pathname).toBe('/ocpp/2.1/configuration/setDisplayMessage');
    expect(Object.fromEntries(request.url.searchParams)).toEqual({
      identifier: 'CS-1',
      tenantId: '2',
    });
    expect(request.headers.get('Authorization')).toBe('Bearer tenant-2');
    expect(request.body).toEqual({
      message: {
        id: 41,
        priority: 'AlwaysFront',
        transactionId: 'tx-1',
        message: { format: 'URI', content: 'https://pay.example.com/api/checkouts/x/qr.png' },
      },
    });
  });

  it('clears a message by its id', async () => {
    const { client, sent } = aClient();

    await client.clearDisplayMessage({ ...station, protocol: OCPPVersion.OCPP2_0_1, id: 41 });

    expect(sent[0].url.pathname).toBe('/ocpp/2.0.1/configuration/clearDisplayMessage');
    expect(sent[0].body).toEqual({ id: 41 });
  });

  it('refuses OCPP 1.6, which has no display messages', async () => {
    const { client, sent } = aClient();

    await expect(
      client.clearDisplayMessage({ ...station, protocol: OCPPVersion.OCPP1_6, id: 41 }),
    ).rejects.toThrow('OCPP 2.0.1');
    expect(sent).toHaveLength(0);
  });
});

describe('CoreApiClient authentication', () => {
  it('asks once more with fresh headers when Core refuses the first ones', async () => {
    const issued: string[] = [];
    let invalidated = 0;
    const auth: ICoreAuth = {
      headersFor: async () => {
        const token = `token-${issued.length + 1}`;
        issued.push(token);
        return { Authorization: `Bearer ${token}` };
      },
      invalidate: () => invalidated++,
    };
    const answers = [new Response('expired', { status: 401 }), Response.json([{ success: true }])];
    const sent: string[] = [];
    const client = new CoreApiClient('http://core:8080', auth, async (_input, init) => {
      sent.push(new Headers(init?.headers).get('Authorization') ?? '');
      return answers.shift()!;
    });

    expect((await client.remoteStart(aRequest())).sent).toBe(true);
    expect(sent).toEqual(['Bearer token-1', 'Bearer token-2']);
    expect(invalidated).toBe(1);
  });
});
