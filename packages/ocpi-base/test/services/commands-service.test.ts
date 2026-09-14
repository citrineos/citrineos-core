// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { Logger } from 'tslog';

import { CommandsService } from '../../src/services/commands-service.js';
import { CommandType } from '../../src/model/command-type.js';
import { CommandResponseType } from '../../src/model/command-response.js';
import { ocpiConfigSchema } from '../../src/config/ocpi-types.js';

const TIMEOUT = 42;
const COUNTRY_CODE = 'GB';
const PARTY_ID = 'VLT';

// The service reads only commands.timeout; the rest is the minimum the schema accepts.
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

const PARTNER = { id: 11, countryCode: COUNTRY_CODE, partyId: PARTY_ID } as never;

function aCapturingGraphqlClient(result: unknown) {
  const request = vi.fn().mockResolvedValue(result);
  return { client: { request } as never, request };
}

function anExecutor() {
  return {
    executeStartSession: vi.fn().mockResolvedValue(undefined),
    executeStopSession: vi.fn().mockResolvedValue(undefined),
    executeUnlockConnector: vi.fn().mockResolvedValue(undefined),
  };
}

function aService(client: never, executor: ReturnType<typeof anExecutor> = anExecutor()) {
  return new CommandsService({
    config: CONFIG,
    logger: new Logger({ type: 'hidden' }),
    ocpiGraphqlClient: client,
    commandExecutor: executor,
  } as never);
}

function aStartSession(overrides: Record<string, unknown> = {}) {
  return {
    response_url: 'https://emsp.test/commands/START_SESSION/1',
    token: { uid: 'TOK1', country_code: COUNTRY_CODE, party_id: PARTY_ID },
    location_id: '7',
    evse_uid: 'cs-001::1',
    ...overrides,
  } as never;
}

// locationId stays a number; the service compares it to location_id via toString().
function aStation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cs-001',
    ocppConnectionName: 'cs-001',
    locationId: 7,
    isOnline: true,
    ...overrides,
  };
}

function anUnlockConnector(overrides: Record<string, unknown> = {}) {
  return {
    response_url: 'https://emsp.test/commands/UNLOCK_CONNECTOR/1',
    location_id: '7',
    evse_uid: 'cs-001::1',
    connector_id: '2',
    ...overrides,
  } as never;
}

function aStopSession() {
  return { response_url: 'https://emsp.test/commands/STOP_SESSION/1', session_id: 'tx-1' } as never;
}

function aTransactionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    transactionId: 'tx-1',
    station: { id: 'cs-001', ocppConnectionName: 'cs-001', isOnline: true },
    ...overrides,
  };
}

describe('CommandsService.postCommand', () => {
  describe('unimplemented command types', () => {
    it('answers CANCEL_RESERVATION with NOT_SUPPORTED, without hasura or the executor', async () => {
      const { client, request } = aCapturingGraphqlClient({});
      const executor = anExecutor();

      const response = await aService(client, executor).postCommand(
        CommandType.CANCEL_RESERVATION,
        { response_url: 'https://emsp.test/cb', reservation_id: 'r-1' } as never,
        PARTNER,
      );

      expect(response.status_code).toBe(1000);
      expect(response.status_message).toBe('Success');
      expect(response.data).toEqual({
        result: CommandResponseType.NOT_SUPPORTED,
        timeout: TIMEOUT,
      });
      expect(request).not.toHaveBeenCalled();
      expect(executor.executeStartSession).not.toHaveBeenCalled();
    });

    it('answers RESERVE_NOW with NOT_SUPPORTED', async () => {
      const { client, request } = aCapturingGraphqlClient({});

      const response = await aService(client).postCommand(
        CommandType.RESERVE_NOW,
        { response_url: 'https://emsp.test/cb' } as never,
        PARTNER,
      );

      expect(response.status_code).toBe(1000);
      expect(response.data).toEqual({
        result: CommandResponseType.NOT_SUPPORTED,
        timeout: TIMEOUT,
      });
      expect(request).not.toHaveBeenCalled();
    });

    it('names an unknown command type in a 2000 error', async () => {
      const { client } = aCapturingGraphqlClient({});

      const response = await aService(client).postCommand(
        'MADE_UP' as never,
        { response_url: 'https://emsp.test/cb' } as never,
        PARTNER,
      );

      expect(response.status_code).toBe(2000);
      expect(response.status_message).toBe('Unknown command type: MADE_UP');
      expect(response.data).toEqual({
        result: CommandResponseType.NOT_SUPPORTED,
        timeout: TIMEOUT,
      });
    });
  });

  describe('START_SESSION', () => {
    it('rejects without an evse_uid before any lookup', async () => {
      const { client, request } = aCapturingGraphqlClient({ ChargingStations: [] });
      const executor = anExecutor();

      const response = await aService(client, executor).postCommand(
        CommandType.START_SESSION,
        aStartSession({ evse_uid: undefined }),
        PARTNER,
      );

      expect(response.status_code).toBe(2001);
      expect(response.status_message).toBe('EVSE UID required by this CPO');
      expect(response.data).toEqual({ result: CommandResponseType.REJECTED, timeout: TIMEOUT });
      expect(request).not.toHaveBeenCalled();
      expect(executor.executeStartSession).not.toHaveBeenCalled();
    });

    it('rejects a token that belongs to another party than the caller', async () => {
      const { client, request } = aCapturingGraphqlClient({ ChargingStations: [] });

      const response = await aService(client).postCommand(
        CommandType.START_SESSION,
        aStartSession({ token: { uid: 'TOK1', country_code: 'DE', party_id: 'XYZ' } }),
        PARTNER,
      );

      expect(response.status_code).toBe(2001);
      expect(response.status_message).toBe('Token information does not match credentials');
      expect(request).not.toHaveBeenCalled();
    });

    it('looks the station up by the station half of evse_uid and rejects when none exists', async () => {
      const { client, request } = aCapturingGraphqlClient({ ChargingStations: [] });

      const response = await aService(client).postCommand(
        CommandType.START_SESSION,
        aStartSession(),
        PARTNER,
      );

      expect(request).toHaveBeenCalledOnce();
      const [document, variables] = request.mock.calls[0];
      expect(String(document)).toContain('ocppConnectionName: { _eq: $id }');
      expect(variables).toEqual({ id: 'cs-001' });
      expect(response.status_code).toBe(2001);
      expect(response.status_message).toBe('Unknown charging station');
    });

    it('treats a station on a different location as unknown', async () => {
      const { client } = aCapturingGraphqlClient({
        ChargingStations: [aStation({ locationId: 8 })],
      });

      const response = await aService(client).postCommand(
        CommandType.START_SESSION,
        aStartSession(),
        PARTNER,
      );

      expect(response.status_code).toBe(2001);
      expect(response.status_message).toBe('Unknown charging station');
    });

    it('rejects when the station is offline', async () => {
      const { client } = aCapturingGraphqlClient({
        ChargingStations: [aStation({ isOnline: false })],
      });
      const executor = anExecutor();

      const response = await aService(client, executor).postCommand(
        CommandType.START_SESSION,
        aStartSession(),
        PARTNER,
      );

      expect(response.status_code).toBe(2001);
      expect(response.status_message).toBe('Charging station is offline');
      expect(executor.executeStartSession).not.toHaveBeenCalled();
    });

    it('rejects a connector_id the station does not have', async () => {
      const { client } = aCapturingGraphqlClient({
        ChargingStations: [aStation({ connectors: [{ id: 1, connectorId: 1 }] })],
      });
      const executor = anExecutor();

      const response = await aService(client, executor).postCommand(
        CommandType.START_SESSION,
        aStartSession({ connector_id: '9' }),
        PARTNER,
      );

      expect(response.status_code).toBe(2001);
      expect(response.status_message).toBe('Unknown connector');
      expect(executor.executeStartSession).not.toHaveBeenCalled();
    });

    it('accepts and hands the fetched station to the executor', async () => {
      const station = aStation();
      const { client } = aCapturingGraphqlClient({ ChargingStations: [station] });
      const executor = anExecutor();
      const payload = aStartSession();

      const response = await aService(client, executor).postCommand(
        CommandType.START_SESSION,
        payload,
        PARTNER,
      );

      expect(response.status_code).toBe(1000);
      expect(response.data).toEqual({ result: CommandResponseType.ACCEPTED, timeout: TIMEOUT });
      expect(executor.executeStartSession).toHaveBeenCalledOnce();
      expect(executor.executeStartSession).toHaveBeenCalledWith(payload, PARTNER, station);
      expect(executor.executeStopSession).not.toHaveBeenCalled();
    });

    it('stays ACCEPTED when the executor later fails', async () => {
      // The OCPP exchange runs after the sync answer; its failure travels back through the
      // async CommandResult callback, never this response.
      const { client } = aCapturingGraphqlClient({ ChargingStations: [aStation()] });
      const executor = anExecutor();
      executor.executeStartSession.mockRejectedValue(new Error('ws send failed'));

      const response = await aService(client, executor).postCommand(
        CommandType.START_SESSION,
        aStartSession(),
        PARTNER,
      );

      expect(response.status_code).toBe(1000);
      expect(response.data).toEqual({ result: CommandResponseType.ACCEPTED, timeout: TIMEOUT });
      expect(executor.executeStartSession).toHaveBeenCalledOnce();
      await new Promise((resolve) => setImmediate(resolve));
    });

    it('propagates a station lookup failure', async () => {
      const request = vi.fn().mockRejectedValue(new Error('hasura unreachable'));

      await expect(
        aService({ request } as never).postCommand(
          CommandType.START_SESSION,
          aStartSession(),
          PARTNER,
        ),
      ).rejects.toThrow(/hasura unreachable/);
    });
  });

  describe('STOP_SESSION', () => {
    it('answers UNKNOWN_SESSION without a lookup when the caller has no party', async () => {
      const { client, request } = aCapturingGraphqlClient({ Transactions: [] });

      const response = await aService(client).postCommand(
        CommandType.STOP_SESSION,
        aStopSession(),
        { id: 11 } as never,
      );

      expect(response.status_code).toBe(2001);
      expect(response.status_message).toBe('Session not found');
      expect(response.data).toEqual({
        result: CommandResponseType.UNKNOWN_SESSION,
        timeout: TIMEOUT,
      });
      expect(request).not.toHaveBeenCalled();
    });

    it('scopes the transaction lookup to the calling party and active sessions', async () => {
      // session_id alone would let any partner stop a foreign session; the predicate has to be
      // in the query itself.
      const { client, request } = aCapturingGraphqlClient({ Transactions: [] });

      const response = await aService(client).postCommand(
        CommandType.STOP_SESSION,
        aStopSession(),
        PARTNER,
      );

      expect(request).toHaveBeenCalledOnce();
      const [document, variables] = request.mock.calls[0];
      expect(String(document)).toContain('isActive: { _eq: true }');
      expect(String(document)).toContain(
        'TenantPartner: { countryCode: { _eq: $countryCode }, partyId: { _eq: $partyId } }',
      );
      expect(variables).toEqual({
        transactionId: 'tx-1',
        countryCode: COUNTRY_CODE,
        partyId: PARTY_ID,
      });
      expect(response.status_code).toBe(2001);
      expect(response.data).toEqual({
        result: CommandResponseType.UNKNOWN_SESSION,
        timeout: TIMEOUT,
      });
    });

    it('refuses a session_id that matches more than one transaction', async () => {
      const { client } = aCapturingGraphqlClient({
        Transactions: [aTransactionRow({ id: 1 }), aTransactionRow({ id: 2 })],
      });
      const executor = anExecutor();

      const response = await aService(client, executor).postCommand(
        CommandType.STOP_SESSION,
        aStopSession(),
        PARTNER,
      );

      expect(response.status_code).toBe(2001);
      expect(response.status_message).toBe('Session could not be uniquely identified');
      expect(executor.executeStopSession).not.toHaveBeenCalled();
    });

    it('rejects when the transaction station is offline', async () => {
      const { client } = aCapturingGraphqlClient({
        Transactions: [aTransactionRow({ station: { id: 'cs-001', isOnline: false } })],
      });

      const response = await aService(client).postCommand(
        CommandType.STOP_SESSION,
        aStopSession(),
        PARTNER,
      );

      expect(response.status_code).toBe(2001);
      expect(response.status_message).toBe('Charging station is offline');
      expect(response.data).toEqual({ result: CommandResponseType.REJECTED, timeout: TIMEOUT });
    });

    it('accepts and hands the transaction station to the executor', async () => {
      const row = aTransactionRow();
      const { client } = aCapturingGraphqlClient({ Transactions: [row] });
      const executor = anExecutor();
      const payload = aStopSession();

      const response = await aService(client, executor).postCommand(
        CommandType.STOP_SESSION,
        payload,
        PARTNER,
      );

      expect(response.status_code).toBe(1000);
      expect(response.data).toEqual({ result: CommandResponseType.ACCEPTED, timeout: TIMEOUT });
      expect(executor.executeStopSession).toHaveBeenCalledOnce();
      expect(executor.executeStopSession).toHaveBeenCalledWith(payload, PARTNER, row.station);
    });
  });

  describe('UNLOCK_CONNECTOR', () => {
    it('rejects an unknown station, addressed by the station half of evse_uid', async () => {
      const { client, request } = aCapturingGraphqlClient({ ChargingStations: [] });

      const response = await aService(client).postCommand(
        CommandType.UNLOCK_CONNECTOR,
        anUnlockConnector(),
        PARTNER,
      );

      expect(request).toHaveBeenCalledOnce();
      expect(request.mock.calls[0][1]).toEqual({ id: 'cs-001' });
      expect(response.status_code).toBe(2001);
      expect(response.status_message).toBe('Unknown charging station');
      expect(response.data).toEqual({ result: CommandResponseType.REJECTED, timeout: TIMEOUT });
    });

    it('rejects when the station is offline', async () => {
      const { client } = aCapturingGraphqlClient({
        ChargingStations: [aStation({ isOnline: false })],
      });

      const response = await aService(client).postCommand(
        CommandType.UNLOCK_CONNECTOR,
        anUnlockConnector(),
        PARTNER,
      );

      expect(response.status_code).toBe(2001);
      expect(response.status_message).toBe('Charging station is offline');
    });

    it('rejects a connector the station does not have', async () => {
      const { client } = aCapturingGraphqlClient({
        ChargingStations: [aStation({ connectors: [{ id: 1, connectorId: 1 }] })],
      });
      const executor = anExecutor();

      const response = await aService(client, executor).postCommand(
        CommandType.UNLOCK_CONNECTOR,
        anUnlockConnector({ connector_id: '9' }),
        PARTNER,
      );

      expect(response.status_code).toBe(2001);
      expect(response.status_message).toBe('Unknown connector');
      expect(executor.executeUnlockConnector).not.toHaveBeenCalled();
    });

    it('accepts and hands the fetched station to the executor', async () => {
      const station = aStation({ connectors: [{ id: 2, connectorId: 2 }] });
      const { client } = aCapturingGraphqlClient({ ChargingStations: [station] });
      const executor = anExecutor();
      const payload = anUnlockConnector();

      const response = await aService(client, executor).postCommand(
        CommandType.UNLOCK_CONNECTOR,
        payload,
        PARTNER,
      );

      expect(response.status_code).toBe(1000);
      expect(response.data).toEqual({ result: CommandResponseType.ACCEPTED, timeout: TIMEOUT });
      expect(executor.executeUnlockConnector).toHaveBeenCalledOnce();
      expect(executor.executeUnlockConnector).toHaveBeenCalledWith(payload, PARTNER, station);
    });
  });
});
