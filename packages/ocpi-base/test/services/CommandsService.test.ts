// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import type { ChargingStationDto, TenantPartnerDto } from '@citrineos/types';
import { describe, expect, it, vi } from 'vitest';
import { Logger } from 'tslog';

import { CommandsService } from '../../src/services/CommandsService.js';
import { CommandType } from '../../src/model/CommandType.js';
import { CommandResponseType } from '../../src/model/CommandResponse.js';
import { OcpiResponseStatusCode } from '../../src/model/OcpiResponse.js';
import type { StartSession } from '../../src/model/StartSession.js';
import type { StopSession } from '../../src/model/StopSession.js';

const TIMEOUT = 30;
const STATION_ID = 'cs-001';
const EVSE_UID = `${STATION_ID}::1`;
const LOCATION_ID = '7';

const partner = { countryCode: 'GB', partyId: 'VLT' } as TenantPartnerDto;

function aChargingStation(overrides: Record<string, unknown> = {}): ChargingStationDto {
  return {
    id: STATION_ID,
    locationId: Number(LOCATION_ID),
    isOnline: true,
    connectors: [{ id: 1 }],
    ...overrides,
  } as unknown as ChargingStationDto;
}

function aStartSession(overrides: Record<string, unknown> = {}): StartSession {
  return {
    response_url: 'https://emsp.test/commands/START_SESSION/1',
    token: { country_code: 'GB', party_id: 'VLT', uid: 'token-1' },
    location_id: LOCATION_ID,
    evse_uid: EVSE_UID,
    ...overrides,
  } as unknown as StartSession;
}

/**
 * CommandsService resolves its collaborators through typedi, but the guard logic under test is
 * reachable by assigning them onto a plain instance.
 */
function aCommandsService(graphqlResult: unknown) {
  const executor = {
    executeStartSession: vi.fn().mockResolvedValue(undefined),
    executeStopSession: vi.fn().mockResolvedValue(undefined),
    executeUnlockConnector: vi.fn().mockResolvedValue(undefined),
  };
  const service = new CommandsService();
  Object.assign(service, {
    logger: new Logger({ type: 'hidden' }),
    ocpiGraphqlClient: { request: vi.fn().mockResolvedValue(graphqlResult) },
    commandExecutor: executor,
    config: { commands: { timeout: TIMEOUT } },
  });
  return { service, executor };
}

const INVALID_PARAMS = OcpiResponseStatusCode.ClientInvalidOrMissingParameters;

describe('CommandsService.postCommand START_SESSION', () => {
  it('accepts a command for an online station and hands it to the executor', async () => {
    const { service, executor } = aCommandsService({ ChargingStations: [aChargingStation()] });

    const response = await service.postCommand(
      CommandType.START_SESSION,
      aStartSession({ connector_id: '1' }),
      partner,
    );

    expect(response.status_code).toBe(OcpiResponseStatusCode.GenericSuccessCode);
    expect(response.data?.result).toBe(CommandResponseType.ACCEPTED);
    expect(response.data?.timeout).toBe(TIMEOUT);
    expect(executor.executeStartSession).toHaveBeenCalledOnce();
  });

  it('refuses a command with no evse_uid', async () => {
    const { service, executor } = aCommandsService({ ChargingStations: [aChargingStation()] });

    const response = await service.postCommand(
      CommandType.START_SESSION,
      aStartSession({ evse_uid: undefined }),
      partner,
    );

    expect(response.status_code).toBe(INVALID_PARAMS);
    expect(response.data?.result).toBe(CommandResponseType.REJECTED);
    expect(executor.executeStartSession).not.toHaveBeenCalled();
  });

  it('refuses a token belonging to a different party than the caller', async () => {
    const { service, executor } = aCommandsService({ ChargingStations: [aChargingStation()] });

    const response = await service.postCommand(
      CommandType.START_SESSION,
      aStartSession({ token: { country_code: 'GB', party_id: 'OTH', uid: 'token-1' } }),
      partner,
    );

    expect(response.status_code).toBe(INVALID_PARAMS);
    expect(executor.executeStartSession).not.toHaveBeenCalled();
  });

  it('refuses an evse_uid that resolves to a station at a different location', async () => {
    const { service, executor } = aCommandsService({
      ChargingStations: [aChargingStation({ locationId: 99 })],
    });

    const response = await service.postCommand(CommandType.START_SESSION, aStartSession(), partner);

    expect(response.status_code).toBe(INVALID_PARAMS);
    expect(executor.executeStartSession).not.toHaveBeenCalled();
  });

  it('refuses an unknown station', async () => {
    const { service, executor } = aCommandsService({ ChargingStations: [] });

    const response = await service.postCommand(CommandType.START_SESSION, aStartSession(), partner);

    expect(response.status_code).toBe(INVALID_PARAMS);
    expect(executor.executeStartSession).not.toHaveBeenCalled();
  });

  it('refuses a station that is offline', async () => {
    const { service, executor } = aCommandsService({
      ChargingStations: [aChargingStation({ isOnline: false })],
    });

    const response = await service.postCommand(CommandType.START_SESSION, aStartSession(), partner);

    expect(response.status_code).toBe(INVALID_PARAMS);
    expect(executor.executeStartSession).not.toHaveBeenCalled();
  });

  it('refuses a connector the station does not have', async () => {
    const { service, executor } = aCommandsService({ ChargingStations: [aChargingStation()] });

    const response = await service.postCommand(
      CommandType.START_SESSION,
      aStartSession({ connector_id: '4' }),
      partner,
    );

    expect(response.status_code).toBe(INVALID_PARAMS);
    expect(executor.executeStartSession).not.toHaveBeenCalled();
  });
});

describe('CommandsService.postCommand STOP_SESSION', () => {
  function aTransaction(overrides: Record<string, unknown> = {}) {
    return {
      id: 1,
      isActive: true,
      station: aChargingStation(),
      authorization: { tenantPartner: { countryCode: 'GB', partyId: 'VLT' } },
      ...overrides,
    };
  }

  const stopSession = {
    response_url: 'https://emsp.test/commands/STOP_SESSION/1',
    session_id: 'tx-1',
  } as unknown as StopSession;

  it('accepts a stop for an active session and hands it to the executor', async () => {
    const { service, executor } = aCommandsService({ Transactions: [aTransaction()] });

    const response = await service.postCommand(CommandType.STOP_SESSION, stopSession, partner);

    expect(response.data?.result).toBe(CommandResponseType.ACCEPTED);
    expect(executor.executeStopSession).toHaveBeenCalledOnce();
  });

  it('reports UNKNOWN_SESSION for a session id it cannot find', async () => {
    const { service, executor } = aCommandsService({ Transactions: [] });

    const response = await service.postCommand(CommandType.STOP_SESSION, stopSession, partner);

    expect(response.data?.result).toBe(CommandResponseType.UNKNOWN_SESSION);
    expect(executor.executeStopSession).not.toHaveBeenCalled();
  });

  it('refuses to stop a session belonging to a different party', async () => {
    const { service, executor } = aCommandsService({
      Transactions: [
        aTransaction({ authorization: { tenantPartner: { countryCode: 'GB', partyId: 'OTH' } } }),
      ],
    });

    const response = await service.postCommand(CommandType.STOP_SESSION, stopSession, partner);

    expect(response.data?.result).toBe(CommandResponseType.REJECTED);
    expect(executor.executeStopSession).not.toHaveBeenCalled();
  });

  it('refuses to stop a session that has already ended', async () => {
    const { service, executor } = aCommandsService({
      Transactions: [aTransaction({ isActive: false })],
    });

    const response = await service.postCommand(CommandType.STOP_SESSION, stopSession, partner);

    expect(response.data?.result).toBe(CommandResponseType.REJECTED);
    expect(executor.executeStopSession).not.toHaveBeenCalled();
  });
});

describe('CommandsService.postCommand unimplemented commands', () => {
  it.each([CommandType.RESERVE_NOW, CommandType.CANCEL_RESERVATION])(
    'reports %s as NOT_SUPPORTED rather than as done',
    async (commandType) => {
      const { service } = aCommandsService({});

      const response = await service.postCommand(commandType, {} as never, partner);

      expect(response.data?.result).toBe(CommandResponseType.NOT_SUPPORTED);
    },
  );

  it('reports an unrecognised command type as NOT_SUPPORTED', async () => {
    const { service } = aCommandsService({});

    const response = await service.postCommand('TELEPORT' as CommandType, {} as never, partner);

    expect(response.data?.result).toBe(CommandResponseType.NOT_SUPPORTED);
  });
});
