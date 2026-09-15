// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { HttpMethod } from '@citrineos/types';
import type { TenantDto } from '@citrineos/types';

import { LocationsBroadcaster } from '../../src/broadcaster/locations-broadcaster.js';
import { TariffsBroadcaster } from '../../src/broadcaster/tariffs-broadcaster.js';
import { SessionBroadcaster } from '../../src/broadcaster/session-broadcaster.js';
import { CdrBroadcaster } from '../../src/broadcaster/cdr-broadcaster.js';
import { ModuleId } from '../../src/model/module-id.js';
import { InterfaceRole } from '../../src/model/interface-role.js';
import { OcpiEmptyResponseSchema } from '../../src/model/ocpi-empty-response.js';
import { TariffType } from '../../src/model/tariff-type.js';
import { TariffDimensionType } from '../../src/model/tariff-dimension-type.js';
import { GET_TARIFF_BY_KEY_QUERY } from '../../src/graphql/index.js';

// Partner lookup and per-partner iteration live in BaseClientApi.broadcastToClients;
// the broadcasters only assemble the call, so tests stop at that boundary.

const TENANT = { countryCode: 'US', partyId: 'CPO' } as TenantDto;

function aLogger() {
  return { error: vi.fn(), warn: vi.fn(), debug: vi.fn(), info: vi.fn() };
}

function aClientApi() {
  return { broadcastToClients: vi.fn().mockResolvedValue([]) };
}

function broadcastCallOf(clientApi: ReturnType<typeof aClientApi>) {
  expect(clientApi.broadcastToClients).toHaveBeenCalledOnce();
  return clientApi.broadcastToClients.mock.calls[0][0] as Record<string, unknown>;
}

describe('LocationsBroadcaster', () => {
  function build() {
    const logger = aLogger();
    const locationsClientApi = aClientApi();
    const locationMapper = { fromGraphql: vi.fn(), fromPartialGraphql: vi.fn() };
    const evseMapper = { fromGraphql: vi.fn(), fromPartialGraphql: vi.fn() };
    const connectorMapper = { fromGraphql: vi.fn(), fromPartialGraphql: vi.fn() };
    const broadcaster = new LocationsBroadcaster({
      logger,
      credentialsService: {},
      locationsClientApi,
      locationMapper,
      evseMapper,
      connectorMapper,
    } as never);
    return { broadcaster, logger, locationsClientApi, locationMapper, evseMapper, connectorMapper };
  }

  it('PUT location maps the dto and broadcasts to the locations receiver endpoint', async () => {
    const { broadcaster, locationsClientApi, locationMapper } = build();
    const locationDto = { id: 'loc-1' };
    const mapped = { id: 'loc-1', name: 'Depot' };
    locationMapper.fromGraphql.mockReturnValue(mapped);

    await broadcaster.broadcastPutLocation(TENANT, locationDto as never);

    expect(locationMapper.fromGraphql).toHaveBeenCalledOnce();
    expect(locationMapper.fromGraphql).toHaveBeenCalledWith(locationDto);
    const call = broadcastCallOf(locationsClientApi);
    expect(call.cpoCountryCode).toBe('US');
    expect(call.cpoPartyId).toBe('CPO');
    expect(call.moduleId).toBe(ModuleId.Locations);
    expect(call.interfaceRole).toBe(InterfaceRole.RECEIVER);
    expect(call.httpMethod).toBe(HttpMethod.Put);
    expect(call.schema).toBe(OcpiEmptyResponseSchema);
    expect(call.body).toBe(mapped);
    expect(call.path).toBe('/US/CPO/loc-1');
  });

  it('PATCH location keeps the dto id in the path even when the partial body drops it', async () => {
    const { broadcaster, locationsClientApi, locationMapper } = build();
    locationMapper.fromPartialGraphql.mockReturnValue({ name: 'Renamed' });

    await broadcaster.broadcastPatchLocation(TENANT, { id: 'loc-1', name: 'Renamed' } as never);

    expect(locationMapper.fromPartialGraphql).toHaveBeenCalledOnce();
    const call = broadcastCallOf(locationsClientApi);
    expect(call.httpMethod).toBe(HttpMethod.Patch);
    expect(call.path).toBe('/US/CPO/loc-1');
    expect(call.body).toEqual({ name: 'Renamed' });
  });

  it('PATCH location without an id throws before mapping or broadcasting', async () => {
    const { broadcaster, locationsClientApi, locationMapper } = build();

    await expect(
      broadcaster.broadcastPatchLocation(TENANT, { name: 'NoId' } as never),
    ).rejects.toThrow('Location ID missing');

    expect(locationMapper.fromPartialGraphql).not.toHaveBeenCalled();
    expect(locationsClientApi.broadcastToClients).not.toHaveBeenCalled();
  });

  it('swallows client failures on location broadcast and logs them', async () => {
    const { broadcaster, locationsClientApi, locationMapper, logger } = build();
    locationMapper.fromGraphql.mockReturnValue({ id: 'loc-1' });
    const failure = new Error('partner unreachable');
    locationsClientApi.broadcastToClients.mockRejectedValue(failure);

    await expect(
      broadcaster.broadcastPutLocation(TENANT, { id: 'loc-1' } as never),
    ).resolves.toBeUndefined();

    // HttpMethod enum values are uppercase, hence broadcastPUTLocation
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      'broadcastPUTLocation failed for Location /US/CPO/loc-1',
      failure,
    );
  });

  it('PUT evse builds the path from locationId and stationName::evseId', async () => {
    const { broadcaster, locationsClientApi, evseMapper } = build();
    const evseDto = { id: 2, ocppConnectionName: 'cp001' };
    const stationDto = { locationId: 42 };
    const mapped = { uid: 'cp001::2', status: 'AVAILABLE' };
    evseMapper.fromGraphql.mockReturnValue(mapped);

    await broadcaster.broadcastPutEvse(TENANT, evseDto as never, stationDto as never);

    expect(evseMapper.fromGraphql).toHaveBeenCalledOnce();
    expect(evseMapper.fromGraphql).toHaveBeenCalledWith(stationDto, evseDto);
    const call = broadcastCallOf(locationsClientApi);
    expect(call.httpMethod).toBe(HttpMethod.Put);
    expect(call.moduleId).toBe(ModuleId.Locations);
    expect(call.body).toBe(mapped);
    expect(call.path).toBe('/US/CPO/42/cp001::2');
  });

  it('PUT evse without a station locationId throws and skips the client', async () => {
    const { broadcaster, locationsClientApi } = build();

    await expect(
      broadcaster.broadcastPutEvse(
        TENANT,
        { id: 2, ocppConnectionName: 'cp001' } as never,
        {
          locationId: undefined,
        } as never,
      ),
    ).rejects.toThrow('Location ID missing in EVSE data');

    expect(locationsClientApi.broadcastToClients).not.toHaveBeenCalled();
  });

  it('PUT evse throws when the mapper returns nothing', async () => {
    const { broadcaster, locationsClientApi, evseMapper } = build();
    evseMapper.fromGraphql.mockReturnValue(undefined);

    await expect(
      broadcaster.broadcastPutEvse(
        TENANT,
        { id: 2, ocppConnectionName: 'cp001' } as never,
        {
          locationId: 42,
        } as never,
      ),
    ).rejects.toThrow('Failed to map EVSE data');

    expect(locationsClientApi.broadcastToClients).not.toHaveBeenCalled();
  });

  it('PATCH evse uses the partial mapper and logs client failures without rethrowing', async () => {
    const { broadcaster, locationsClientApi, evseMapper, logger } = build();
    evseMapper.fromPartialGraphql.mockReturnValue({ status: 'CHARGING' });
    const failure = new Error('timeout');
    locationsClientApi.broadcastToClients.mockRejectedValue(failure);

    await expect(
      broadcaster.broadcastPatchEvse(
        TENANT,
        { id: 2, ocppConnectionName: 'cp001' } as never,
        {
          locationId: 42,
        } as never,
      ),
    ).resolves.toBeUndefined();

    expect(evseMapper.fromPartialGraphql).toHaveBeenCalledOnce();
    const call = broadcastCallOf(locationsClientApi);
    expect(call.httpMethod).toBe(HttpMethod.Patch);
    expect(call.path).toBe('/US/CPO/42/cp001::2');
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      'broadcastPATCHEvse failed for /US/CPO/42/cp001::2',
      failure,
    );
  });

  it('PUT connector appends the connector id after the evse uid in the path', async () => {
    const { broadcaster, locationsClientApi, connectorMapper } = build();
    const connectorDto = {
      id: 3,
      evseId: 2,
      ocppConnectionName: 'cp001',
      chargingStation: { locationId: 42 },
    };
    const mapped = { id: '3', standard: 'IEC_62196_T2' };
    connectorMapper.fromGraphql.mockReturnValue(mapped);

    await broadcaster.broadcastPutConnector(TENANT, connectorDto as never);

    expect(connectorMapper.fromGraphql).toHaveBeenCalledOnce();
    expect(connectorMapper.fromGraphql).toHaveBeenCalledWith(connectorDto);
    const call = broadcastCallOf(locationsClientApi);
    expect(call.httpMethod).toBe(HttpMethod.Put);
    expect(call.body).toBe(mapped);
    expect(call.path).toBe('/US/CPO/42/cp001::2/3');
  });

  it('PATCH connector without chargingStation.locationId throws', async () => {
    const { broadcaster, locationsClientApi } = build();

    await expect(
      broadcaster.broadcastPatchConnector(TENANT, { id: 3, evseId: 2 } as never),
    ).rejects.toThrow('Location ID missing in Connector data');

    expect(locationsClientApi.broadcastToClients).not.toHaveBeenCalled();
  });

  it('PATCH connector throws when the partial mapper returns nothing', async () => {
    const { broadcaster, connectorMapper } = build();
    connectorMapper.fromPartialGraphql.mockReturnValue(undefined);

    await expect(
      broadcaster.broadcastPatchConnector(TENANT, {
        id: 3,
        evseId: 2,
        ocppConnectionName: 'cp001',
        chargingStation: { locationId: 42 },
      } as never),
    ).rejects.toThrow('Failed to map Connector data');
  });

  it('logs connector client failures with the connector path', async () => {
    const { broadcaster, locationsClientApi, connectorMapper, logger } = build();
    connectorMapper.fromGraphql.mockReturnValue({ id: '3' });
    const failure = new Error('502');
    locationsClientApi.broadcastToClients.mockRejectedValue(failure);

    await expect(
      broadcaster.broadcastPutConnector(TENANT, {
        id: 3,
        evseId: 2,
        ocppConnectionName: 'cp001',
        chargingStation: { locationId: 42 },
      } as never),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      'broadcastPUTConnector failed for /US/CPO/42/cp001::2/3',
      failure,
    );
  });
});

describe('TariffsBroadcaster', () => {
  const UPDATED_AT = new Date('2026-08-20T11:00:00Z');

  function build() {
    const logger = aLogger();
    const tariffsClientApi = aClientApi();
    const ocpiGraphqlClient = { request: vi.fn() };
    const broadcaster = new TariffsBroadcaster({
      logger,
      tariffsClientApi,
      ocpiGraphqlClient,
    } as never);
    return { broadcaster, logger, tariffsClientApi, ocpiGraphqlClient };
  }

  function aTariffDto(overrides: Record<string, unknown> = {}) {
    return {
      id: 5,
      currency: 'USD',
      pricePerKwh: 0.42,
      tenant: { countryCode: 'US', partyId: 'CPO' },
      updatedAt: UPDATED_AT,
      ...overrides,
    };
  }

  it('PUT with a complete dto skips the graphql fetch and broadcasts the mapped tariff', async () => {
    const { broadcaster, tariffsClientApi, ocpiGraphqlClient } = build();

    await broadcaster.broadcastPutTariff(TENANT, aTariffDto() as never);

    expect(ocpiGraphqlClient.request).not.toHaveBeenCalled();
    const call = broadcastCallOf(tariffsClientApi);
    expect(call.moduleId).toBe(ModuleId.Tariffs);
    expect(call.interfaceRole).toBe(InterfaceRole.RECEIVER);
    expect(call.httpMethod).toBe(HttpMethod.Put);
    expect(call.path).toBe('/US/CPO/5');
    const body = call.body as Record<string, any>;
    expect(body.id).toBe('5');
    expect(body.country_code).toBe('US');
    expect(body.party_id).toBe('CPO');
    expect(body.currency).toBe('USD');
    expect(body.type).toBe(TariffType.AD_HOC_PAYMENT);
    expect(body.last_updated).toBe(UPDATED_AT);
    expect(body.elements[0].price_components[0]).toEqual({
      type: TariffDimensionType.ENERGY,
      price: 0.42,
      vat: undefined,
      step_size: 1,
    });
  });

  it('PUT with missing currency fetches the tariff by key and uses the fetched fields', async () => {
    const { broadcaster, tariffsClientApi, ocpiGraphqlClient } = build();
    ocpiGraphqlClient.request.mockResolvedValue({
      Tariffs: [{ currency: 'EUR', pricePerKwh: 0.3 }],
    });

    await broadcaster.broadcastPutTariff(
      TENANT,
      aTariffDto({ currency: undefined, pricePerKwh: undefined }) as never,
    );

    expect(ocpiGraphqlClient.request).toHaveBeenCalledOnce();
    expect(ocpiGraphqlClient.request).toHaveBeenCalledWith(GET_TARIFF_BY_KEY_QUERY, {
      id: 5,
      countryCode: 'US',
      partyId: 'CPO',
    });
    const body = broadcastCallOf(tariffsClientApi).body as Record<string, any>;
    expect(body.currency).toBe('EUR');
    expect(body.elements[0].price_components[0].price).toBe(0.3);
  });

  it('PUT gives up with an error log when the graphql fetch returns no tariff', async () => {
    const { broadcaster, tariffsClientApi, ocpiGraphqlClient, logger } = build();
    ocpiGraphqlClient.request.mockResolvedValue({ Tariffs: [] });

    await expect(
      broadcaster.broadcastPutTariff(TENANT, aTariffDto({ currency: undefined }) as never),
    ).resolves.toBeUndefined();

    expect(tariffsClientApi.broadcastToClients).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to fetch Tariff 5 data from GraphQL to fill required fields for broadcast PUT',
    );
  });

  it('deletion broadcasts DELETE with no body', async () => {
    const { broadcaster, tariffsClientApi, ocpiGraphqlClient } = build();

    await broadcaster.broadcastTariffDeletion(TENANT, aTariffDto() as never);

    expect(ocpiGraphqlClient.request).not.toHaveBeenCalled();
    const call = broadcastCallOf(tariffsClientApi);
    expect(call.httpMethod).toBe(HttpMethod.Delete);
    expect(call.path).toBe('/US/CPO/5');
    expect(call.body).toBeUndefined();
  });

  it('logs and swallows client failures', async () => {
    const { broadcaster, tariffsClientApi, logger } = build();
    const failure = new Error('conn reset');
    tariffsClientApi.broadcastToClients.mockRejectedValue(failure);

    await expect(
      broadcaster.broadcastTariffDeletion(TENANT, aTariffDto() as never),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      'broadcastDELETE failed for Tariff /US/CPO/5',
      failure,
    );
  });
});

describe('SessionBroadcaster', () => {
  function build() {
    const logger = aLogger();
    const sessionsClientApi = aClientApi();
    const sessionMapper = {
      mapTransactionToSession: vi.fn(),
      mapPartialTransactionToPartialSession: vi.fn(),
      getChargingPeriods: vi.fn(),
    };
    const broadcaster = new SessionBroadcaster({
      logger,
      sessionsClientApi,
      sessionMapper,
    } as never);
    return { broadcaster, logger, sessionsClientApi, sessionMapper };
  }

  it('PUT maps the transaction and broadcasts under the session id path', async () => {
    const { broadcaster, sessionsClientApi, sessionMapper } = build();
    const transactionDto = { transactionId: 'tx-1' };
    const session = { id: 'sess-1', kwh: 2 };
    sessionMapper.mapTransactionToSession.mockResolvedValue(session);

    await broadcaster.broadcastPutSession(TENANT, transactionDto as never);

    expect(sessionMapper.mapTransactionToSession).toHaveBeenCalledOnce();
    expect(sessionMapper.mapTransactionToSession).toHaveBeenCalledWith(transactionDto);
    const call = broadcastCallOf(sessionsClientApi);
    expect(call.moduleId).toBe(ModuleId.Sessions);
    expect(call.interfaceRole).toBe(InterfaceRole.RECEIVER);
    expect(call.httpMethod).toBe(HttpMethod.Put);
    expect(call.schema).toBe(OcpiEmptyResponseSchema);
    expect(call.body).toBe(session);
    expect(call.path).toBe('/US/CPO/sess-1');
  });

  it('PATCH uses the partial mapper and the PATCH method', async () => {
    const { broadcaster, sessionsClientApi, sessionMapper } = build();
    const partialDto = { totalKwh: 3 };
    sessionMapper.mapPartialTransactionToPartialSession.mockResolvedValue({
      id: 'sess-1',
      kwh: 3,
    });

    await broadcaster.broadcastPatchSession(TENANT, partialDto as never);

    expect(sessionMapper.mapPartialTransactionToPartialSession).toHaveBeenCalledOnce();
    expect(sessionMapper.mapPartialTransactionToPartialSession).toHaveBeenCalledWith(partialDto);
    const call = broadcastCallOf(sessionsClientApi);
    expect(call.httpMethod).toBe(HttpMethod.Patch);
    expect(call.path).toBe('/US/CPO/sess-1');
    expect(call.body).toEqual({ id: 'sess-1', kwh: 3 });
  });

  it('charging period PATCH stringifies the tariff id and keys the path by transactionId', async () => {
    const { broadcaster, sessionsClientApi, sessionMapper } = build();
    const meterValueDto = { transactionId: 'tx-9', tariffId: 7 };
    const periods = [{ start_date_time: new Date('2026-08-20T10:00:00Z') }];
    sessionMapper.getChargingPeriods.mockReturnValue(periods);

    await broadcaster.broadcastPatchSessionChargingPeriod(TENANT, meterValueDto as never);

    expect(sessionMapper.getChargingPeriods).toHaveBeenCalledOnce();
    expect(sessionMapper.getChargingPeriods).toHaveBeenCalledWith([meterValueDto], '7');
    const call = broadcastCallOf(sessionsClientApi);
    expect(call.httpMethod).toBe(HttpMethod.Patch);
    expect(call.path).toBe('/US/CPO/tx-9');
    expect(call.body).toEqual({ charging_periods: periods });
  });

  it('mapper failures propagate, only client failures are swallowed', async () => {
    const { broadcaster, sessionsClientApi, sessionMapper } = build();
    sessionMapper.mapTransactionToSession.mockRejectedValue(new Error('no active tariff'));

    await expect(
      broadcaster.broadcastPutSession(TENANT, { transactionId: 'tx-1' } as never),
    ).rejects.toThrow('no active tariff');

    expect(sessionsClientApi.broadcastToClients).not.toHaveBeenCalled();
  });

  it('logs client failures with method and path, then resolves', async () => {
    const { broadcaster, sessionsClientApi, sessionMapper, logger } = build();
    sessionMapper.mapTransactionToSession.mockResolvedValue({ id: 'sess-1' });
    const failure = new Error('boom');
    sessionsClientApi.broadcastToClients.mockRejectedValue(failure);

    await expect(
      broadcaster.broadcastPutSession(TENANT, { transactionId: 'tx-1' } as never),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      'broadcastPUTSession failed for /US/CPO/sess-1',
      failure,
    );
  });
});

describe('CdrBroadcaster', () => {
  function build() {
    const logger = aLogger();
    const cdrsClientApi = aClientApi();
    const cdrMapper = { mapTransactionsToCdrs: vi.fn() };
    const broadcaster = new CdrBroadcaster({ logger, cdrMapper, cdrsClientApi } as never);
    return { broadcaster, logger, cdrsClientApi, cdrMapper };
  }

  it('POSTs the first mapped CDR, routed by the CDR party fields, with no path', async () => {
    const { broadcaster, cdrsClientApi, cdrMapper } = build();
    const transactionDto = { transactionId: 'tx-1' };
    const cdrA = { id: 'cdr-1', country_code: 'US', party_id: 'CPO' };
    const cdrB = { id: 'cdr-2', country_code: 'US', party_id: 'CPO' };
    cdrMapper.mapTransactionsToCdrs.mockResolvedValue([cdrA, cdrB]);

    await broadcaster.broadcastPostCdr(transactionDto as never);

    expect(cdrMapper.mapTransactionsToCdrs).toHaveBeenCalledOnce();
    expect(cdrMapper.mapTransactionsToCdrs).toHaveBeenCalledWith([transactionDto]);
    const call = broadcastCallOf(cdrsClientApi);
    expect(call.cpoCountryCode).toBe('US');
    expect(call.cpoPartyId).toBe('CPO');
    expect(call.moduleId).toBe(ModuleId.Cdrs);
    expect(call.interfaceRole).toBe(InterfaceRole.RECEIVER);
    expect(call.httpMethod).toBe(HttpMethod.Post);
    expect(call.schema).toBe(OcpiEmptyResponseSchema);
    // only the first CDR is broadcast
    expect(call.body).toBe(cdrA);
    expect(call.path).toBeUndefined();
  });

  it('warns and skips the client when the mapper yields no CDRs', async () => {
    const { broadcaster, cdrsClientApi, cdrMapper, logger } = build();
    cdrMapper.mapTransactionsToCdrs.mockResolvedValue([]);

    await broadcaster.broadcastPostCdr({ transactionId: 'tx-1' } as never);

    expect(cdrsClientApi.broadcastToClients).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledOnce();
    expect(logger.warn).toHaveBeenCalledWith('No CDRs generated for Transaction: tx-1');
  });

  it('logs client failures with the CDR id and resolves', async () => {
    const { broadcaster, cdrsClientApi, cdrMapper, logger } = build();
    cdrMapper.mapTransactionsToCdrs.mockResolvedValue([
      { id: 'cdr-1', country_code: 'US', party_id: 'CPO' },
    ]);
    const failure = new Error('receiver down');
    cdrsClientApi.broadcastToClients.mockRejectedValue(failure);

    await expect(
      broadcaster.broadcastPostCdr({ transactionId: 'tx-1' } as never),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith('broadcastPostCdr failed for CDR cdr-1', failure);
  });
});
