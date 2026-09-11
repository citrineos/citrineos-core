// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { OCPPVersion } from '@citrineos/types';
import { Logger } from 'tslog';
import { describe, expect, it, vi } from 'vitest';

import { ocpiConfigSchema } from '../../src/config/ocpi-types.js';
import { GET_TENANT_PARTNER_BY_ID } from '../../src/graphql/index.js';
import { CommandResultType } from '../../src/model/command-result.js';
import { CommandType } from '../../src/model/command-type.js';
import { CommandExecutor } from '../../src/util/command-executor.js';
import {
  COMMAND_RESPONSE_URL_CACHE_NAMESPACE,
  COMMAND_RESPONSE_URL_CACHE_RESOLVED,
} from '../../src/util/consts.js';

const TIMEOUT = 42;
const RESPONSE_URL = 'https://emsp.test/commands/START_SESSION/1';

// The executor reads only commands.timeout; the rest is the minimum the schema accepts.
const CONFIG = ocpiConfigSchema.parse({
  env: 'development',
  ocpiServer: { host: '0.0.0.0', port: 8085 },
  ocpiModules: {},
  database: { host: 'localhost', port: 5432, database: 'ocpi', username: 'ocpi', password: '' },
  cache: { memory: true },
  graphql: { endpoint: 'http://localhost:8090/v1/graphql' },
  commands: {
    timeout: TIMEOUT,
    ocpiBaseUrl: 'http://localhost:8085/ocpi',
    ocpp1_6: {
      remoteStartTransactionRequestUrl: 'http://core/ocpp/1.6/remoteStart',
      remoteStopTransactionRequestUrl: 'http://core/ocpp/1.6/remoteStop',
      unlockConnectorRequestUrl: 'http://core/ocpp/1.6/unlock',
    },
    ocpp2_0_1: {
      requestStartTransactionRequestUrl: 'http://core/ocpp/2.0.1/requestStart',
      requestStopTransactionRequestUrl: 'http://core/ocpp/2.0.1/requestStop',
      unlockConnectorRequestUrl: 'http://core/ocpp/2.0.1/unlock',
    },
    ocpp2_1: {
      requestStartTransactionRequestUrl: 'http://core/ocpp/2.1/requestStart',
      requestStopTransactionRequestUrl: 'http://core/ocpp/2.1/requestStop',
      unlockConnectorRequestUrl: 'http://core/ocpp/2.1/unlock',
    },
  },
  logLevel: 6,
  defaultPageLimit: 50,
  maxPageLimit: 1000,
});

const PARTNER = { id: 11, countryCode: 'GB', partyId: 'MSP' } as never;
const FAILED_MESSAGE = { language: 'en', text: 'Charging station communication failed' };

const aStation = (protocol: OCPPVersion | null) => ({ id: 5, protocol }) as never;
const aStartSession = () => ({ response_url: RESPONSE_URL, token: { uid: 'TOK1' } }) as never;
const aStopSession = () => ({ response_url: RESPONSE_URL, session_id: 'S1' }) as never;
const anUnlockConnector = () =>
  ({ response_url: RESPONSE_URL, location_id: '7', evse_uid: 'cs-001::1' }) as never;

function aHandler(version: OCPPVersion) {
  return {
    supportedVersion: version,
    sendStartSessionCommand: vi.fn().mockResolvedValue(undefined),
    sendStopSessionCommand: vi.fn().mockResolvedValue(undefined),
    sendUnlockConnectorCommand: vi.fn().mockResolvedValue(undefined),
    handleAsyncCommandResponse: vi.fn().mockResolvedValue(undefined),
  };
}

// Registry gets a 1.6 and a 2.0.1 handler; 2.1 is deliberately left uncovered.
function anExecutor() {
  const cache = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    onChange: vi.fn().mockResolvedValue(COMMAND_RESPONSE_URL_CACHE_RESOLVED),
  };
  const request = vi.fn();
  const postCommandResult = vi.fn().mockResolvedValue(undefined);
  const handler16 = aHandler(OCPPVersion.OCPP1_6);
  const handler201 = aHandler(OCPPVersion.OCPP2_0_1);
  const executor = new CommandExecutor({
    config: CONFIG,
    logger: new Logger({ type: 'hidden' }),
    ocpiGraphqlClient: { request } as never,
    commandsClientApi: { postCommandResult } as never,
    cacheWrapper: { cache } as never,
    handlers: [handler16, handler201] as never,
  });
  return { executor, cache, request, postCommandResult, handler16, handler201 };
}

const flushCallbacks = () => new Promise((resolve) => setImmediate(resolve));

describe('CommandExecutor command dispatch', () => {
  it('StartSession on a 1.6 station goes to the 1.6 handler', async () => {
    const { executor, handler16, handler201, postCommandResult } = anExecutor();
    const startSession = aStartSession();
    const station = aStation(OCPPVersion.OCPP1_6);

    await executor.executeStartSession(startSession, PARTNER, station);

    expect(handler16.sendStartSessionCommand).toHaveBeenCalledOnce();
    const [session, partner, passedStation, commandId] =
      handler16.sendStartSessionCommand.mock.calls[0];
    expect(session).toBe(startSession);
    expect(partner).toBe(PARTNER);
    expect(passedStation).toBe(station);
    expect(commandId).toMatch(/^[0-9a-f-]{36}$/);
    expect(handler201.sendStartSessionCommand).not.toHaveBeenCalled();
    expect(postCommandResult).not.toHaveBeenCalled();
  });

  it('StopSession on a 2.0.1 station goes to the 2.0.1 handler', async () => {
    const { executor, handler16, handler201 } = anExecutor();
    const stopSession = aStopSession();
    const station = aStation(OCPPVersion.OCPP2_0_1);

    await executor.executeStopSession(stopSession, PARTNER, station);

    expect(handler201.sendStopSessionCommand).toHaveBeenCalledOnce();
    expect(handler201.sendStopSessionCommand.mock.calls[0].slice(0, 3)).toEqual([
      stopSession,
      PARTNER,
      station,
    ]);
    expect(handler16.sendStopSessionCommand).not.toHaveBeenCalled();
  });

  it('UnlockConnector reaches the matching handler with the station', async () => {
    const { executor, handler16 } = anExecutor();
    const unlock = anUnlockConnector();
    const station = aStation(OCPPVersion.OCPP1_6);

    await executor.executeUnlockConnector(unlock, PARTNER, station);

    expect(handler16.sendUnlockConnectorCommand).toHaveBeenCalledOnce();
    expect(handler16.sendUnlockConnectorCommand.mock.calls[0].slice(0, 3)).toEqual([
      unlock,
      PARTNER,
      station,
    ]);
  });

  it('the commandId handed to the handler is the cache key for the response url', async () => {
    const { executor, cache, handler16 } = anExecutor();

    await executor.executeStartSession(aStartSession(), PARTNER, aStation(OCPPVersion.OCPP1_6));

    const commandId = handler16.sendStartSessionCommand.mock.calls[0][3];
    expect(cache.set).toHaveBeenCalledOnce();
    expect(cache.set).toHaveBeenCalledWith(
      commandId,
      RESPONSE_URL,
      COMMAND_RESPONSE_URL_CACHE_NAMESPACE,
      TIMEOUT,
    );
    expect(cache.onChange).toHaveBeenCalledWith(
      commandId,
      TIMEOUT,
      COMMAND_RESPONSE_URL_CACHE_NAMESPACE,
    );
  });

  it('a handler failure propagates to the caller', async () => {
    const { executor, handler16 } = anExecutor();
    handler16.sendStartSessionCommand.mockRejectedValue(new Error('station unreachable'));

    await expect(
      executor.executeStartSession(aStartSession(), PARTNER, aStation(OCPPVersion.OCPP1_6)),
    ).rejects.toThrow('station unreachable');
  });
});

describe('CommandExecutor with no handler for the protocol', () => {
  // ocpp2.1 has no registered handler; null is a station whose protocol was never recorded.
  it.each([OCPPVersion.OCPP2_1, null])(
    'protocol %s posts FAILED to the response url instead of dispatching',
    async (protocol) => {
      const { executor, handler16, handler201, postCommandResult } = anExecutor();

      await executor.executeStartSession(aStartSession(), PARTNER, aStation(protocol));

      expect(handler16.sendStartSessionCommand).not.toHaveBeenCalled();
      expect(handler201.sendStartSessionCommand).not.toHaveBeenCalled();
      expect(postCommandResult).toHaveBeenCalledOnce();
      const [partner, url, result, commandId] = postCommandResult.mock.calls[0];
      expect(partner).toBe(PARTNER);
      expect(url).toBe(RESPONSE_URL);
      expect(result).toEqual({ result: CommandResultType.FAILED, message: FAILED_MESSAGE });
      expect(commandId).toMatch(/^[0-9a-f-]{36}$/);
    },
  );
});

describe('CommandExecutor command timeout', () => {
  it('a cache entry that expires unresolved posts TIMEOUT to the response url', async () => {
    const { executor, cache, postCommandResult, handler16 } = anExecutor();
    cache.onChange.mockResolvedValue(null);

    await executor.executeStartSession(aStartSession(), PARTNER, aStation(OCPPVersion.OCPP1_6));
    await vi.waitFor(() => expect(postCommandResult).toHaveBeenCalledOnce());

    const commandId = handler16.sendStartSessionCommand.mock.calls[0][3];
    expect(postCommandResult).toHaveBeenCalledWith(
      PARTNER,
      RESPONSE_URL,
      { result: CommandResultType.TIMEOUT, message: FAILED_MESSAGE },
      commandId,
    );
  });

  it('a cache entry marked resolved posts nothing', async () => {
    const { executor, postCommandResult } = anExecutor();

    await executor.executeStartSession(aStartSession(), PARTNER, aStation(OCPPVersion.OCPP1_6));
    await flushCallbacks();

    expect(postCommandResult).not.toHaveBeenCalled();
  });
});

describe('CommandExecutor.handleAsyncCommandResponse', () => {
  const ocppResponse = { status: 'Accepted' };

  it('relays the station response through the handler for the negotiated version', async () => {
    const { executor, cache, request, handler16, handler201 } = anExecutor();
    cache.get.mockResolvedValue(RESPONSE_URL);
    request.mockResolvedValue({ TenantPartners_by_pk: PARTNER });

    await executor.handleAsyncCommandResponse(
      11,
      OCPPVersion.OCPP1_6,
      CommandType.START_SESSION,
      'cmd-1',
      ocppResponse,
    );

    expect(cache.get).toHaveBeenCalledOnce();
    expect(cache.get).toHaveBeenCalledWith('cmd-1', COMMAND_RESPONSE_URL_CACHE_NAMESPACE);
    expect(request).toHaveBeenCalledOnce();
    expect(request).toHaveBeenCalledWith(GET_TENANT_PARTNER_BY_ID, { id: 11 });
    expect(handler16.handleAsyncCommandResponse).toHaveBeenCalledOnce();
    expect(handler16.handleAsyncCommandResponse).toHaveBeenCalledWith(
      PARTNER,
      CommandType.START_SESSION,
      RESPONSE_URL,
      ocppResponse,
      'cmd-1',
    );
    expect(handler201.handleAsyncCommandResponse).not.toHaveBeenCalled();
  });

  it('an unknown commandId ends the flow before the tenant partner lookup', async () => {
    const { executor, cache, request, handler16 } = anExecutor();
    cache.get.mockResolvedValue(null);

    await executor.handleAsyncCommandResponse(
      11,
      OCPPVersion.OCPP1_6,
      CommandType.START_SESSION,
      'cmd-gone',
      ocppResponse,
    );

    expect(request).not.toHaveBeenCalled();
    expect(handler16.handleAsyncCommandResponse).not.toHaveBeenCalled();
  });

  it('a missing tenant partner ends the flow without a result post', async () => {
    const { executor, cache, request, handler16, postCommandResult } = anExecutor();
    cache.get.mockResolvedValue(RESPONSE_URL);
    request.mockResolvedValue({ TenantPartners_by_pk: null });

    await executor.handleAsyncCommandResponse(
      99,
      OCPPVersion.OCPP1_6,
      CommandType.STOP_SESSION,
      'cmd-2',
      ocppResponse,
    );

    expect(request).toHaveBeenCalledWith(GET_TENANT_PARTNER_BY_ID, { id: 99 });
    expect(handler16.handleAsyncCommandResponse).not.toHaveBeenCalled();
    expect(postCommandResult).not.toHaveBeenCalled();
  });

  it('a version with no handler posts FAILED to the cached response url', async () => {
    const { executor, cache, request, handler16, handler201, postCommandResult } = anExecutor();
    cache.get.mockResolvedValue(RESPONSE_URL);
    request.mockResolvedValue({ TenantPartners_by_pk: PARTNER });

    await executor.handleAsyncCommandResponse(
      11,
      OCPPVersion.OCPP2_1,
      CommandType.UNLOCK_CONNECTOR,
      'cmd-9',
      ocppResponse,
    );

    expect(handler16.handleAsyncCommandResponse).not.toHaveBeenCalled();
    expect(handler201.handleAsyncCommandResponse).not.toHaveBeenCalled();
    expect(postCommandResult).toHaveBeenCalledOnce();
    expect(postCommandResult).toHaveBeenCalledWith(
      PARTNER,
      RESPONSE_URL,
      { result: CommandResultType.FAILED, message: FAILED_MESSAGE },
      'cmd-9',
    );
  });

  it('a tenant partner lookup failure propagates', async () => {
    const { executor, cache, request } = anExecutor();
    cache.get.mockResolvedValue(RESPONSE_URL);
    request.mockRejectedValue(new Error('hasura down'));

    await expect(
      executor.handleAsyncCommandResponse(
        11,
        OCPPVersion.OCPP1_6,
        CommandType.START_SESSION,
        'cmd-3',
        ocppResponse,
      ),
    ).rejects.toThrow('hasura down');
  });
});
