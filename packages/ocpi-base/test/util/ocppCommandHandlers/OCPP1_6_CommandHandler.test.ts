// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { Logger } from 'tslog';

// The package barrel reaches BaseClientApi, whose `@Inject()` is evaluated as the module loads and
// needs design:type metadata that esbuild does not emit. Stub the barrel down to the handful of
// values this handler and its base class read from it.
vi.mock('../../../src/index.js', async () => {
  const { Token } = await import('typedi');
  return {
    CommandResultType: { ACCEPTED: 'ACCEPTED', REJECTED: 'REJECTED', FAILED: 'FAILED' },
    CommandType: { START_SESSION: 'START_SESSION', UNLOCK_CONNECTOR: 'UNLOCK_CONNECTOR' },
    ModuleId: { Commands: 'commands' },
    OcpiConfigToken: new Token('OcpiConfig'),
  };
});
vi.mock('../../../src/graphql/index.js', () => ({ OcpiGraphqlClient: class {} }));
vi.mock('../../../src/trigger/CommandsClientApi.js', () => ({ CommandsClientApi: class {} }));

// typedi's bare `@Inject()` resolves the property type from design:type metadata, which esbuild
// does not emit, so the decorators throw as the class is defined. The dependencies this test needs
// are assigned explicitly below, so the decorators can be inert here.
vi.mock('typedi', () => {
  const noop = () => () => undefined;
  return {
    Service: noop,
    Inject: noop,
    Token: class Token {
      constructor(public name?: string) {}
    },
    Container: { get: () => undefined, set: () => undefined },
  };
});

import { OCPP1_6_CommandHandler } from '../../../src/util/ocppCommandHandlers/OCPP1_6_CommandHandler.js';

/**
 * OCPI addresses a connector by its database id; OCPP 1.6 addresses it by the per-station serial
 * number the charger itself uses. This station's connector 12 is the charger's connector 2.
 */
const CONNECTOR_DB_ID = 12;
const OCPP_CONNECTOR_NUMBER = 2;

const chargingStation = {
  id: 5,
  ocppConnectionName: 'CS001',
  connectors: [
    { id: 11, connectorId: 1 },
    { id: CONNECTOR_DB_ID, connectorId: OCPP_CONNECTOR_NUMBER },
  ],
} as never;

const tenantPartner = {
  id: 3,
  countryCode: 'GB',
  partyId: 'MSP',
  partnerProfileOCPI: {},
  tenant: { id: 1, countryCode: 'GB', partyId: 'VLT' },
} as never;

/**
 * The handler's dependencies arrive by typedi property injection, which does not run for a plain
 * `new`. Assign the few it actually reads, and capture the OCPP payload instead of sending it.
 */
function aHandler() {
  const handler = new OCPP1_6_CommandHandler();
  const sent: { url: string; payload: any }[] = [];
  const postCommandResult = vi.fn().mockResolvedValue(undefined);

  Object.assign(handler as never, {
    logger: new Logger({ type: 'hidden' }),
    commandsClientApi: { postCommandResult },
    config: {
      commands: {
        coreHeaders: {},
        ocpiBaseUrl: 'http://ocpi.test',
        ocpp1_6: {
          remoteStartTransactionRequestUrl: 'http://core.test/remoteStart',
          unlockConnectorRequestUrl: 'http://core.test/unlock',
        },
      },
    },
  });
  (handler as never as { sendOCPPMessage: unknown }).sendOCPPMessage = async (
    url: string,
    payload: any,
  ) => {
    sent.push({ url, payload });
  };

  return { handler, sent, postCommandResult };
}

const aStartSession = (connectorId?: string | null) =>
  ({
    connector_id: connectorId,
    token: { uid: 'TAG001' },
    response_url: 'http://msp.test/callback',
  }) as never;

describe('OCPP1_6_CommandHandler.sendStartSessionCommand', () => {
  it("addresses the charger's connector number, not the connector's database id", async () => {
    const { handler, sent } = aHandler();

    await handler.sendStartSessionCommand(
      aStartSession(String(CONNECTOR_DB_ID)),
      tenantPartner,
      chargingStation,
      'cmd-1',
    );

    expect(sent).toHaveLength(1);
    expect(sent[0].payload).toEqual({
      connectorId: OCPP_CONNECTOR_NUMBER,
      idTag: 'TAG001',
    });
  });

  it.each([undefined, null])(
    'lets the station choose when connector_id is %s, which OCPI allows',
    async (connectorId) => {
      // connector_id is optional on StartSession and connectorId is optional on
      // RemoteStartTransaction, so an omitted connector is a valid command, not a missing one.
      const { handler, sent, postCommandResult } = aHandler();

      await handler.sendStartSessionCommand(
        aStartSession(connectorId),
        tenantPartner,
        chargingStation,
        'cmd-3',
      );

      expect(postCommandResult).not.toHaveBeenCalled();
      expect(sent).toHaveLength(1);
      expect(sent[0].payload).toEqual({ idTag: 'TAG001' });
    },
  );

  it('reports FAILED rather than guessing when the connector is not on the station', async () => {
    const { handler, sent, postCommandResult } = aHandler();

    await handler.sendStartSessionCommand(
      aStartSession('999'),
      tenantPartner,
      chargingStation,
      'cmd-2',
    );

    expect(sent).toHaveLength(0);
    expect(postCommandResult).toHaveBeenCalledOnce();
    // postCommandResult(tenantPartner, responseUrl, commandResult, commandId) — the result body is arg 2.
    expect(postCommandResult.mock.calls[0][2]).toMatchObject({ result: 'FAILED' });
  });
});
