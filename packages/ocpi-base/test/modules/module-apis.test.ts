// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Barrel first: the ModuleApi files resolve BaseController through src/index.js,
// so the barrel must finish evaluating before the deep imports below run.
import { CommandType, OcpiHeaders, PaginatedParams, VersionNumber } from '../../src/index.js';
import { CommandsModuleApi } from '../../src/modules/commands/module/commands-module-api.js';
import { LocationsModuleApi } from '../../src/modules/locations/module/locations-module-api.js';
import { SessionsModuleApi } from '../../src/modules/sessions/module/sessions-module-api.js';
import { CdrsModuleApi } from '../../src/modules/cdrs/module/cdrs-module-api.js';
import { TariffsModuleApi } from '../../src/modules/tariffs/module/tariffs-module-api.js';
import { ChargingProfilesModuleApi } from '../../src/modules/charging-profiles/module/charging-profiles-module-api.js';
import { VersionsModuleApi } from '../../src/modules/versions/module/versions-module-api.js';

const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } as any;

const HEADERS = new OcpiHeaders('US', 'CPO', 'DE', 'MSP');
const VERSION = VersionNumber.TWO_DOT_TWO_DOT_ONE;
const TENANT_PARTNER = { id: 9, partyId: 'MSP' } as any;
const CTX = { state: { tenantPartner: TENANT_PARTNER } };

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('CommandsModuleApi.postCommand', () => {
  const SERVICE_RESPONSE = { status_code: 1000, data: { result: 'ACCEPTED' } };

  function build() {
    const commandsService = { postCommand: vi.fn().mockResolvedValue(SERVICE_RESPONSE) };
    const commandExecutor = { handleAsyncCommandResponse: vi.fn() };
    const api = new CommandsModuleApi({
      logger,
      commandsService: commandsService as any,
      commandExecutor: commandExecutor as any,
    });
    return { api, commandsService, commandExecutor };
  }

  it('delegates a valid CANCEL_RESERVATION to the service with the ctx tenant partner', async () => {
    const { api, commandsService } = build();
    const payload = { response_url: 'https://msp.example.com/cb', reservation_id: 'RES-1' };

    const result = await api.postCommand(VERSION, CommandType.CANCEL_RESERVATION, payload, CTX);

    expect(result).toBe(SERVICE_RESPONSE);
    expect(commandsService.postCommand).toHaveBeenCalledExactlyOnceWith(
      CommandType.CANCEL_RESERVATION,
      { response_url: 'https://msp.example.com/cb', reservation_id: 'RES-1' },
      TENANT_PARTNER,
    );
    expect(logger.debug).toHaveBeenCalledWith(
      'postCommand',
      CommandType.CANCEL_RESERVATION,
      payload,
    );
  });

  it('passes only schema fields to the service, dropping unknown payload keys', async () => {
    const { api, commandsService } = build();

    await api.postCommand(
      VERSION,
      CommandType.CANCEL_RESERVATION,
      { response_url: 'https://msp.example.com/cb', reservation_id: 'RES-2', extra: 'x' } as any,
      CTX,
    );

    expect(commandsService.postCommand).toHaveBeenCalledTimes(1);
    expect(commandsService.postCommand.mock.calls[0][1]).toEqual({
      response_url: 'https://msp.example.com/cb',
      reservation_id: 'RES-2',
    });
  });

  it('returns a 2000 response naming the missing fields when validation fails', async () => {
    const { api, commandsService } = build();

    const result: any = await api.postCommand(
      VERSION,
      CommandType.CANCEL_RESERVATION,
      {} as any,
      CTX,
    );

    expect(result.status_code).toBe(2000);
    expect(result.status_message).toContain('response_url');
    expect(result.status_message).toContain('reservation_id');
    expect(commandsService.postCommand).not.toHaveBeenCalled();
  });

  it('returns a 2000 response for an unknown command type without calling the service', async () => {
    const { api, commandsService } = build();

    const result: any = await api.postCommand(VERSION, 'SELF_DESTRUCT' as any, {} as any, CTX);

    expect(result.status_code).toBe(2000);
    expect(result.status_message).toBe('Unknown command type: SELF_DESTRUCT');
    expect(commandsService.postCommand).not.toHaveBeenCalled();
  });

  it('postAsynchronousResponse forwards all params to the command executor', async () => {
    const { api, commandExecutor } = build();

    await api.postAsynchronousResponse(7, 'ocpp2.0.1' as any, CommandType.STOP_SESSION, 'cmd-123', {
      result: 'ACCEPTED',
    });

    expect(commandExecutor.handleAsyncCommandResponse).toHaveBeenCalledExactlyOnceWith(
      7,
      'ocpp2.0.1',
      CommandType.STOP_SESSION,
      'cmd-123',
      { result: 'ACCEPTED' },
    );
  });
});

describe('LocationsModuleApi', () => {
  function build() {
    const locationsService = {
      getLocations: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      getLocationById: vi.fn().mockResolvedValue({ status_code: 1000 }),
      getEvseById: vi.fn().mockResolvedValue({ status_code: 1000 }),
      getConnectorById: vi.fn().mockResolvedValue({ status_code: 1000 }),
    };
    const api = new LocationsModuleApi({ logger, locationsService: locationsService as any });
    return { api, locationsService };
  }

  it('getLocations passes headers and pagination through unchanged', async () => {
    const { api, locationsService } = build();
    const params = new PaginatedParams();

    const result = await api.getLocations(VERSION, HEADERS, params);

    expect(result).toEqual({ data: [], total: 0 });
    expect(locationsService.getLocations).toHaveBeenCalledExactlyOnceWith(HEADERS, params);
  });

  it('getLocationById forwards the location id', async () => {
    const { api, locationsService } = build();

    await api.getLocationById(VERSION, HEADERS, 'LOC-1');

    expect(locationsService.getLocationById).toHaveBeenCalledExactlyOnceWith(HEADERS, 'LOC-1');
  });

  it('getEvseById splits the evse uid into station id and numeric evse id', async () => {
    const { api, locationsService } = build();

    await api.getEvseById(VERSION, HEADERS, 'LOC-1', 'CS-01::2');

    expect(locationsService.getEvseById).toHaveBeenCalledExactlyOnceWith(
      HEADERS,
      'LOC-1',
      'CS-01',
      2,
    );
  });

  // EXTRACT_STATION_ID/EXTRACT_EVSE_ID return '' when the uid carries no delimiter,
  // and the api's Number('') lands that on evse 0.
  it('getEvseById maps a uid without the :: delimiter to empty station and evse 0', async () => {
    const { api, locationsService } = build();

    await api.getEvseById(VERSION, HEADERS, 'LOC-1', 'CS-01');

    expect(locationsService.getEvseById).toHaveBeenCalledExactlyOnceWith(HEADERS, 'LOC-1', '', 0);
  });

  it('getConnectorById converts evse and connector ids to numbers', async () => {
    const { api, locationsService } = build();

    await api.getConnectorById(VERSION, HEADERS, 'LOC-1', 'CS-01::2', '7');

    expect(locationsService.getConnectorById).toHaveBeenCalledExactlyOnceWith(
      HEADERS,
      'LOC-1',
      'CS-01',
      2,
      7,
    );
  });
});

describe('SessionsModuleApi', () => {
  const PAGE = { data: [], total: 0, offset: 0, limit: 10 };

  function build() {
    const sessionsService = { getSessions: vi.fn().mockResolvedValue(PAGE) };
    const api = new SessionsModuleApi({ logger, sessionsService: sessionsService as any });
    return { api, sessionsService };
  }

  it('getSessions flattens headers and pagination into positional args', async () => {
    const { api, sessionsService } = build();
    const params = new PaginatedParams();
    params.dateFrom = new Date('2026-01-01T00:00:00.000Z');
    params.dateTo = new Date('2026-02-01T00:00:00.000Z');

    const result = await api.getSessions(VERSION, params, HEADERS);

    expect(result).toBe(PAGE);
    expect(sessionsService.getSessions).toHaveBeenCalledExactlyOnceWith(
      'US',
      'CPO',
      'DE',
      'MSP',
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-02-01T00:00:00.000Z'),
      0,
      10,
    );
  });

  it('getSessions passes undefined dates and paging when params are omitted', async () => {
    const { api, sessionsService } = build();

    await api.getSessions(VERSION, undefined, HEADERS);

    expect(sessionsService.getSessions).toHaveBeenCalledExactlyOnceWith(
      'US',
      'CPO',
      'DE',
      'MSP',
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });

  it('updateChargingPreferences logs the input and returns the canned module mock', async () => {
    const { api, sessionsService } = build();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const body = { profile_type: 'FAST' } as any;

    const first = await api.updateChargingPreferences('S-1', body);
    const second = await api.updateChargingPreferences('S-2', body);

    // Stub endpoint: same module-level mock object on every call, service untouched.
    expect(first).toBe(second);
    expect(log).toHaveBeenCalledWith('updateChargingPreferences', 'S-1', body);
    expect(log).toHaveBeenCalledTimes(2);
    expect(sessionsService.getSessions).not.toHaveBeenCalled();
  });
});

describe('CdrsModuleApi.getCdrs', () => {
  const PAGE = { data: [], total: 0, offset: 0, limit: 10 };

  function build() {
    const cdrsService = { getCdrs: vi.fn().mockResolvedValue(PAGE) };
    const api = new CdrsModuleApi({ logger, cdrsService: cdrsService as any });
    return { api, cdrsService };
  }

  it('flattens headers and pagination into positional args', async () => {
    const { api, cdrsService } = build();
    const params = new PaginatedParams();
    params.offset = 5;
    params.limit = 25;

    const result = await api.getCdrs(params, HEADERS);

    expect(result).toBe(PAGE);
    expect(cdrsService.getCdrs).toHaveBeenCalledExactlyOnceWith(
      'US',
      'CPO',
      'DE',
      'MSP',
      undefined,
      undefined,
      5,
      25,
    );
  });

  it('propagates a service rejection', async () => {
    const { api, cdrsService } = build();
    cdrsService.getCdrs.mockRejectedValueOnce(new Error('db down'));

    await expect(api.getCdrs(undefined, HEADERS)).rejects.toThrow('db down');
    expect(cdrsService.getCdrs).toHaveBeenCalledTimes(1);
  });
});

describe('TariffsModuleApi.getTariffs', () => {
  const TARIFF = { id: 'T-1' } as any;

  function build(count: number) {
    const tariffsService = { getTariffs: vi.fn().mockResolvedValue({ data: [TARIFF], count }) };
    const api = new TariffsModuleApi({ logger, tariffsService: tariffsService as any });
    return { api, tariffsService };
  }

  it('wraps service data in an envelope with default offset 0 and limit 10', async () => {
    const { api, tariffsService } = build(7);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await api.getTariffs(VERSION, HEADERS, undefined);

    expect(tariffsService.getTariffs).toHaveBeenCalledExactlyOnceWith(HEADERS, undefined);
    expect(result.data).toEqual([TARIFF]);
    expect(result.total).toBe(7);
    expect(result.offset).toBe(0);
    expect(result.limit).toBe(10);
    expect(result.status_code).toBe(1000);
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it('echoes explicit offset and limit from the pagination params', async () => {
    const { api, tariffsService } = build(120);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const params = new PaginatedParams();
    params.offset = 20;
    params.limit = 50;

    const result = await api.getTariffs(VERSION, HEADERS, params);

    expect(tariffsService.getTariffs).toHaveBeenCalledExactlyOnceWith(HEADERS, params);
    expect(result.total).toBe(120);
    expect(result.offset).toBe(20);
    expect(result.limit).toBe(50);
  });
});

describe('ChargingProfilesModuleApi', () => {
  const RESPONSE = { status_code: 1000, data: { result: 'ACCEPTED', timeout: 30 } };

  function build() {
    const chargingProfilesService = {
      getActiveChargingProfile: vi.fn().mockResolvedValue(RESPONSE),
      deleteChargingProfile: vi.fn().mockResolvedValue(RESPONSE),
      putChargingProfile: vi.fn().mockResolvedValue(RESPONSE),
    };
    const api = new ChargingProfilesModuleApi({
      logger,
      chargingProfilesService: chargingProfilesService as any,
    });
    return { api, chargingProfilesService };
  }

  it('getActiveChargingProfile forwards session id, duration, and response url', async () => {
    const { api, chargingProfilesService } = build();

    const result = await api.getActiveChargingProfile('S-1', 300, 'https://msp.example.com/cb');

    expect(result).toBe(RESPONSE);
    expect(chargingProfilesService.getActiveChargingProfile).toHaveBeenCalledExactlyOnceWith(
      'S-1',
      300,
      'https://msp.example.com/cb',
    );
  });

  it('deleteChargingProfile forwards session id and response url', async () => {
    const { api, chargingProfilesService } = build();

    const result = await api.deleteChargingProfile('S-2', 'https://msp.example.com/cb2');

    expect(result).toBe(RESPONSE);
    expect(chargingProfilesService.deleteChargingProfile).toHaveBeenCalledExactlyOnceWith(
      'S-2',
      'https://msp.example.com/cb2',
    );
  });

  it('updateChargingProfile forwards the payload to putChargingProfile', async () => {
    const { api, chargingProfilesService } = build();
    const payload = { charging_profile: { charging_rate_unit: 'W' } } as any;

    const result = await api.updateChargingProfile('S-3', payload);

    expect(result).toBe(RESPONSE);
    expect(chargingProfilesService.putChargingProfile).toHaveBeenCalledExactlyOnceWith(
      'S-3',
      payload,
    );
  });

  it('propagates a putChargingProfile rejection', async () => {
    const { api, chargingProfilesService } = build();
    chargingProfilesService.putChargingProfile.mockRejectedValueOnce(new Error('station offline'));

    await expect(api.updateChargingProfile('S-4', {} as any)).rejects.toThrow('station offline');
    expect(chargingProfilesService.putChargingProfile).toHaveBeenCalledTimes(1);
  });
});

describe('VersionsModuleApi', () => {
  const LIST = { status_code: 1000, data: [{ version: '2.2.1' }] };
  const DETAILS = { status_code: 1000, data: { version: '2.2.1', endpoints: [] } };

  function build() {
    const versionService = {
      getVersions: vi.fn().mockResolvedValue(LIST),
      getVersionDetails: vi.fn().mockResolvedValue(DETAILS),
    };
    const api = new VersionsModuleApi({ logger, versionService: versionService as any });
    return { api, versionService };
  }

  it('getVersions forwards the tenant id', async () => {
    const { api, versionService } = build();

    const result = await api.getVersions(42);

    expect(result).toBe(LIST);
    expect(versionService.getVersions).toHaveBeenCalledExactlyOnceWith(42);
  });

  it('getVersionDetails forwards tenant id and version number', async () => {
    const { api, versionService } = build();

    const result = await api.getVersionDetails(42, VERSION);

    expect(result).toBe(DETAILS);
    expect(versionService.getVersionDetails).toHaveBeenCalledExactlyOnceWith(
      42,
      VersionNumber.TWO_DOT_TWO_DOT_ONE,
    );
  });

  it('propagates a getVersions rejection', async () => {
    const { api, versionService } = build();
    versionService.getVersions.mockRejectedValueOnce(new Error('tenant missing'));

    await expect(api.getVersions(404)).rejects.toThrow('tenant missing');
    expect(versionService.getVersions).toHaveBeenCalledTimes(1);
  });
});
