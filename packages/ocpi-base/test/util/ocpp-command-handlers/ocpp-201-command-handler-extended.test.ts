// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { Ajv } from 'ajv';
import { Logger } from 'tslog';
import { describe, expect, it, vi } from 'vitest';

// Imported through the package barrel: the handler modules and the barrel form an import
// cycle that only resolves when evaluation starts at the barrel, as it does in production.
import {
  CommandType,
  GET_SEQUENCE,
  OCPP2_0_1_CommandHandler,
  OCPP2_1_CommandHandler,
  UPSERT_SEQUENCE,
} from '../../../src/index.js';

// One Ajv for the whole file: validate() rewrites schema.$id in place the first time a
// schema compiles, so a fresh instance per handler would re-prefix the shared schema object.
const ajv = new Ajv({
  removeAdditional: 'all',
  useDefaults: true,
  coerceTypes: 'array',
  strict: false,
});

const commandUrls2_0_1 = {
  requestStartTransactionRequestUrl: 'http://core.test/ocpp/2.0.1/requestStartTransaction',
  requestStopTransactionRequestUrl: 'http://core.test/ocpp/2.0.1/requestStopTransaction',
  unlockConnectorRequestUrl: 'http://core.test/ocpp/2.0.1/unlockConnector',
};
const commandUrls2_1 = {
  requestStartTransactionRequestUrl: 'http://core.test/ocpp/2.1/requestStartTransaction',
  requestStopTransactionRequestUrl: 'http://core.test/ocpp/2.1/requestStopTransaction',
  unlockConnectorRequestUrl: 'http://core.test/ocpp/2.1/unlockConnector',
};

/**
 * OCPI addresses hardware by database id; OCPP 2.x addresses it by the station's own
 * numbering. EVSE db id 2 is the charger's evseId 102, connector db id 22 its connectorId 2.
 */
const chargingStation = {
  id: 5,
  ocppConnectionName: 'CS001',
  evses: [
    { id: 1, evseTypeId: 101 },
    { id: 2, evseTypeId: 102 },
  ],
  connectors: [
    { id: 21, evseTypeConnectorId: 1 },
    { id: 22, evseTypeConnectorId: 2 },
  ],
} as never;

const tenantPartner = {
  id: 3,
  countryCode: 'DE',
  partyId: 'MSP',
  tenant: { id: 1, countryCode: 'DE', partyId: 'CPO' },
} as never;

/**
 * Real handler with mocked collaborators; sendOCPPMessage is captured instead of hitting
 * the core over HTTP.
 */
function aHandler(Handler: typeof OCPP2_0_1_CommandHandler = OCPP2_0_1_CommandHandler) {
  const sent: {
    url: string;
    payload: any;
    options: any;
    responseUrl: string;
    commandId: string;
  }[] = [];
  const postCommandResult = vi.fn().mockResolvedValue(undefined);
  const graphqlRequest = vi.fn().mockResolvedValue({ ChargingStationSequences: [{ value: 41 }] });
  const mapOcpiTokenTypeToOcppIdTokenType = vi.fn().mockReturnValue('ISO14443');

  const handler = new Handler({
    logger: new Logger({ type: 'hidden' }),
    commandsClientApi: { postCommandResult },
    ajv,
    ocpiGraphqlClient: { request: graphqlRequest },
    tokensMapper: { mapOcpiTokenTypeToOcppIdTokenType },
    config: {
      commands: {
        coreHeaders: { Authorization: 'Bearer core' },
        ocpiBaseUrl: 'http://ocpi.test',
        ocpp2_0_1: commandUrls2_0_1,
        ocpp2_1: commandUrls2_1,
      },
    },
  } as never);
  (handler as never as { sendOCPPMessage: unknown }).sendOCPPMessage = async (
    url: string,
    payload: any,
    options: any,
    _tenantPartner: unknown,
    responseUrl: string,
    commandId: string,
  ) => {
    sent.push({ url, payload, options, responseUrl, commandId });
  };

  return { handler, sent, postCommandResult, graphqlRequest, mapOcpiTokenTypeToOcppIdTokenType };
}

const aStartSession = () =>
  ({
    token: { uid: 'TAG001', type: 'RFID' },
    evse_uid: 'CS001::2',
    response_url: 'http://msp.test/callback/start',
  }) as never;

const aStopSession = () =>
  ({
    session_id: 'session-9',
    response_url: 'http://msp.test/callback/stop',
  }) as never;

const anUnlock = (overrides: Record<string, unknown> = {}) =>
  ({
    evse_uid: 'CS001::2',
    connector_id: '22',
    response_url: 'http://msp.test/callback/unlock',
    ...overrides,
  }) as never;

describe('OCPP2_0_1_CommandHandler.sendStartSessionCommand', () => {
  it('posts RequestStartTransaction with the next remoteStartId and the mapped token', async () => {
    const { handler, sent, mapOcpiTokenTypeToOcppIdTokenType } = aHandler();

    await handler.sendStartSessionCommand(aStartSession(), tenantPartner, chargingStation, 'cmd-1');

    expect(sent).toHaveLength(1);
    expect(sent[0].url).toBe(commandUrls2_0_1.requestStartTransactionRequestUrl);
    expect(sent[0].payload).toEqual({
      remoteStartId: 42,
      idToken: { idToken: 'TAG001', type: 'ISO14443' },
      evseId: 2,
    });
    expect(mapOcpiTokenTypeToOcppIdTokenType).toHaveBeenCalledTimes(1);
    expect(mapOcpiTokenTypeToOcppIdTokenType).toHaveBeenCalledWith('RFID');
  });

  it('addresses the station and the OCPI callback through the core query parameters', async () => {
    const { handler, sent } = aHandler();

    await handler.sendStartSessionCommand(aStartSession(), tenantPartner, chargingStation, 'cmd-2');

    expect(sent[0].options.additionalHeaders).toEqual({ Authorization: 'Bearer core' });
    expect(sent[0].options.queryParameters.params).toEqual({
      identifier: 'CS001',
      tenantId: 1,
      callbackUrl: 'http://ocpi.test/2.2.1/commands/callback/3/ocpp2.0.1/START_SESSION/cmd-2',
    });
    expect(sent[0].responseUrl).toBe('http://msp.test/callback/start');
    expect(sent[0].commandId).toBe('cmd-2');
  });

  it('reads and upserts the remoteStartId sequence for the station', async () => {
    const { handler, graphqlRequest } = aHandler();

    await handler.sendStartSessionCommand(aStartSession(), tenantPartner, chargingStation, 'cmd-3');

    expect(graphqlRequest).toHaveBeenCalledTimes(2);
    expect(graphqlRequest).toHaveBeenNthCalledWith(1, GET_SEQUENCE, {
      tenantId: 1,
      stationId: 5,
      type: 'remoteStartId',
    });
    expect(graphqlRequest).toHaveBeenNthCalledWith(
      2,
      UPSERT_SEQUENCE,
      expect.objectContaining({
        tenantId: 1,
        stationId: 5,
        ocppConnectionName: 'CS001',
        type: 'remoteStartId',
        value: 42,
      }),
    );
  });

  it('starts the sequence at 1 when the station has none', async () => {
    const { handler, sent, graphqlRequest } = aHandler();
    graphqlRequest.mockResolvedValueOnce({ ChargingStationSequences: [] });

    await handler.sendStartSessionCommand(aStartSession(), tenantPartner, chargingStation, 'cmd-4');

    expect(sent[0].payload.remoteStartId).toBe(1);
    expect(graphqlRequest).toHaveBeenNthCalledWith(
      2,
      UPSERT_SEQUENCE,
      expect.objectContaining({ value: 1 }),
    );
  });

  it('still sends the command when the sequence upsert fails', async () => {
    // The upsert is fire-and-forget; a persistence failure must not block the session.
    const { handler, sent, graphqlRequest, postCommandResult } = aHandler();
    graphqlRequest
      .mockResolvedValueOnce({ ChargingStationSequences: [{ value: 7 }] })
      .mockRejectedValueOnce(new Error('sequence upsert failed'));

    await handler.sendStartSessionCommand(aStartSession(), tenantPartner, chargingStation, 'cmd-5');

    expect(sent).toHaveLength(1);
    expect(sent[0].payload.remoteStartId).toBe(8);
    expect(postCommandResult).not.toHaveBeenCalled();
  });
});

describe('OCPP2_0_1_CommandHandler.sendStopSessionCommand', () => {
  it('posts RequestStopTransaction with the OCPI session id as transactionId', async () => {
    const { handler, sent, postCommandResult } = aHandler();

    await handler.sendStopSessionCommand(aStopSession(), tenantPartner, chargingStation, 'cmd-6');

    expect(sent).toHaveLength(1);
    expect(sent[0].url).toBe(commandUrls2_0_1.requestStopTransactionRequestUrl);
    expect(sent[0].payload).toEqual({ transactionId: 'session-9' });
    expect(sent[0].options.queryParameters.params.callbackUrl).toBe(
      'http://ocpi.test/2.2.1/commands/callback/3/ocpp2.0.1/STOP_SESSION/cmd-6',
    );
    expect(sent[0].responseUrl).toBe('http://msp.test/callback/stop');
    expect(postCommandResult).not.toHaveBeenCalled();
  });
});

describe('OCPP2_0_1_CommandHandler.sendUnlockConnectorCommand', () => {
  it("translates OCPI evse/connector ids to the charger's own numbering", async () => {
    const { handler, sent, postCommandResult } = aHandler();

    await handler.sendUnlockConnectorCommand(anUnlock(), tenantPartner, chargingStation, 'cmd-7');

    expect(sent).toHaveLength(1);
    expect(sent[0].url).toBe(commandUrls2_0_1.unlockConnectorRequestUrl);
    expect(sent[0].payload).toEqual({ evseId: 102, connectorId: 2 });
    expect(sent[0].options.queryParameters.params.callbackUrl).toBe(
      'http://ocpi.test/2.2.1/commands/callback/3/ocpp2.0.1/UNLOCK_CONNECTOR/cmd-7',
    );
    expect(postCommandResult).not.toHaveBeenCalled();
  });

  it.each([
    ['EVSE is not on the station', anUnlock({ evse_uid: 'CS001::9' }), chargingStation],
    ['connector is not on the station', anUnlock({ connector_id: '999' }), chargingStation],
    [
      'station has no evses or connectors loaded',
      anUnlock(),
      { id: 5, ocppConnectionName: 'CS001' } as never,
    ],
  ])('reports FAILED without sending OCPP when the %s', async (_name, unlock, station) => {
    const { handler, sent, postCommandResult } = aHandler();

    await handler.sendUnlockConnectorCommand(unlock, tenantPartner, station, 'cmd-8');

    expect(sent).toHaveLength(0);
    expect(postCommandResult).toHaveBeenCalledTimes(1);
    expect(postCommandResult).toHaveBeenCalledWith(
      tenantPartner,
      'http://msp.test/callback/unlock',
      {
        result: 'FAILED',
        message: { language: 'en', text: 'Charging station communication failed' },
      },
      'cmd-8',
    );
  });
});

describe('OCPP2_0_1_CommandHandler.handleAsyncCommandResponse', () => {
  it.each([
    {
      command: CommandType.START_SESSION,
      status: 'Accepted',
      result: 'ACCEPTED',
      text: 'Charging station start session successful',
    },
    {
      command: CommandType.START_SESSION,
      status: 'Rejected',
      result: 'EVSE_OCCUPIED',
      text: 'Charging station already in use',
    },
    {
      command: CommandType.STOP_SESSION,
      status: 'Accepted',
      result: 'ACCEPTED',
      text: 'Charging station stop session successful',
    },
    {
      command: CommandType.STOP_SESSION,
      status: 'Rejected',
      result: 'REJECTED',
      text: 'Charging station rejected stop session',
    },
    {
      command: CommandType.UNLOCK_CONNECTOR,
      status: 'Unlocked',
      result: 'ACCEPTED',
      text: 'Charging station unlock connector successful',
    },
    {
      command: CommandType.UNLOCK_CONNECTOR,
      status: 'OngoingAuthorizedTransaction',
      result: 'EVSE_OCCUPIED',
      text: 'Charging station already in use',
    },
    {
      command: CommandType.UNLOCK_CONNECTOR,
      status: 'UnknownConnector',
      result: 'REJECTED',
      text: 'Charging station unknown connector',
    },
    {
      command: CommandType.UNLOCK_CONNECTOR,
      status: 'UnlockFailed',
      result: 'FAILED',
      text: 'Charging station unlock connector failed',
    },
  ])('$command $status posts $result', async ({ command, status, result, text }) => {
    const { handler, postCommandResult } = aHandler();

    await handler.handleAsyncCommandResponse(
      tenantPartner,
      command,
      'http://msp.test/response',
      { status, statusInfo: { reasonCode: 'TestReason' } },
      'cmd-9',
    );

    expect(postCommandResult).toHaveBeenCalledTimes(1);
    expect(postCommandResult).toHaveBeenCalledWith(
      tenantPartner,
      'http://msp.test/response',
      { result, message: { language: 'en', text } },
      'cmd-9',
    );
  });

  it('rejects a response that fails schema validation and posts nothing', async () => {
    const { handler, postCommandResult } = aHandler();

    await expect(
      handler.handleAsyncCommandResponse(
        tenantPartner,
        CommandType.START_SESSION,
        'http://msp.test/response',
        { status: 'Bogus' },
        'cmd-10',
      ),
    ).rejects.toThrow(/Validation failed:.*must be equal to one of the allowed values/);
    expect(postCommandResult).not.toHaveBeenCalled();
  });

  it('throws on a command type it does not implement', async () => {
    // Reservations are not implemented for OCPP 2.0.1 / 2.1 stations.
    const { handler, postCommandResult } = aHandler();

    await expect(
      handler.handleAsyncCommandResponse(
        tenantPartner,
        CommandType.RESERVE_NOW,
        'http://msp.test/response',
        { status: 'Accepted' },
        'cmd-11',
      ),
    ).rejects.toThrow('Unknown command type: RESERVE_NOW');
    expect(postCommandResult).not.toHaveBeenCalled();
  });
});

describe('OCPP2_1_CommandHandler', () => {
  it('posts every command to the version-namespaced 2.1 routes', async () => {
    const { handler, sent } = aHandler(OCPP2_1_CommandHandler);

    expect(handler.supportedVersion).toBe('ocpp2.1');

    await handler.sendStartSessionCommand(
      aStartSession(),
      tenantPartner,
      chargingStation,
      'cmd-12',
    );
    await handler.sendStopSessionCommand(aStopSession(), tenantPartner, chargingStation, 'cmd-12');
    await handler.sendUnlockConnectorCommand(anUnlock(), tenantPartner, chargingStation, 'cmd-12');

    expect(sent.map((message) => message.url)).toEqual([
      commandUrls2_1.requestStartTransactionRequestUrl,
      commandUrls2_1.requestStopTransactionRequestUrl,
      commandUrls2_1.unlockConnectorRequestUrl,
    ]);
  });

  it('advertises ocpp2.1 in the callback url so the async response routes back to it', async () => {
    const { handler, sent } = aHandler(OCPP2_1_CommandHandler);

    await handler.sendStopSessionCommand(aStopSession(), tenantPartner, chargingStation, 'cmd-13');

    expect(sent[0].options.queryParameters.params.callbackUrl).toBe(
      'http://ocpi.test/2.2.1/commands/callback/3/ocpp2.1/STOP_SESSION/cmd-13',
    );
  });
});
