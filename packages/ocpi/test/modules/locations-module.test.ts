// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';

import { LocationsModule } from '@ocpi/modules/locations/index.js';
import {
  GET_CHARGING_STATION_BY_PK_QUERY,
  GET_EVSE_BY_ID_QUERY,
} from '@ocpi/transport/graphql/index.js';
import { DtoEventObjectType, DtoEventType } from '@ocpi/handlers/types.js';

// A StatusNotification only writes the Connector row; these tests pin the EVSE-level status
// broadcast the module derives from that connector notification.

const TENANT = { id: 1, countryCode: 'US', partyId: 'CPO' };
const STATION = { id: 7, ocppConnectionName: 'cp001', locationId: 42 };

function aLogger() {
  const logger = {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    getSubLogger: vi.fn(),
  };
  logger.getSubLogger.mockReturnValue(logger);
  return logger;
}

function build() {
  const logger = aLogger();
  const locationsBroadcaster = {
    broadcastPatchConnector: vi.fn().mockResolvedValue(undefined),
    broadcastPatchEvseStatus: vi.fn().mockResolvedValue(undefined),
  };
  const ocpiGraphqlClient = { request: vi.fn() };
  const module = new LocationsModule({
    config: {},
    logger,
    dtoEventReceiverFactory: () => ({ init: vi.fn(), shutdown: vi.fn() }),
    locationsBroadcaster,
    ocpiGraphqlClient,
  } as never);
  return { module, logger, locationsBroadcaster, ocpiGraphqlClient };
}

function connectorUpdate(changed: Record<string, unknown>) {
  return {
    _eventId: 'evt-1',
    _context: { eventType: DtoEventType.UPDATE, objectType: DtoEventObjectType.Connector },
    _payload: {
      id: 3,
      stationId: STATION.id,
      evseId: 2,
      tenantId: TENANT.id,
      tenant: TENANT,
      ...changed,
    },
  } as never;
}

describe('LocationsModule connector update', () => {
  it('broadcasts the EVSE status derived from all its connectors when a connector status changed', async () => {
    const { module, locationsBroadcaster, ocpiGraphqlClient } = build();
    const evseRecord = {
      id: 2,
      updatedAt: '2026-09-30T01:02:03.000Z',
      connectors: [
        { id: 3, status: 'Charging' },
        { id: 4, status: 'Available' },
      ],
    };
    ocpiGraphqlClient.request
      .mockResolvedValueOnce({ ChargingStations: [STATION] })
      .mockResolvedValueOnce({
        Locations: [{ chargingPool: [{ ...STATION, evses: [evseRecord] }] }],
      });

    await module.handleConnectorUpdate(connectorUpdate({ status: 'Charging' }));

    expect(locationsBroadcaster.broadcastPatchConnector).toHaveBeenCalledOnce();
    expect(ocpiGraphqlClient.request).toHaveBeenNthCalledWith(1, GET_CHARGING_STATION_BY_PK_QUERY, {
      id: STATION.id,
    });
    expect(ocpiGraphqlClient.request).toHaveBeenNthCalledWith(2, GET_EVSE_BY_ID_QUERY, {
      locationId: 42,
      stationId: 'cp001',
      evseId: 2,
      countryCode: 'US',
      partyId: 'CPO',
    });
    expect(locationsBroadcaster.broadcastPatchEvseStatus).toHaveBeenCalledOnce();
    expect(locationsBroadcaster.broadcastPatchEvseStatus).toHaveBeenCalledWith(
      TENANT,
      evseRecord,
      STATION,
    );
  });

  it('leaves the EVSE alone when the connector change carries no status', async () => {
    const { module, locationsBroadcaster, ocpiGraphqlClient } = build();
    ocpiGraphqlClient.request.mockResolvedValueOnce({ ChargingStations: [STATION] });

    await module.handleConnectorUpdate(connectorUpdate({ maximumAmperage: 32 }));

    expect(locationsBroadcaster.broadcastPatchConnector).toHaveBeenCalledOnce();
    expect(ocpiGraphqlClient.request).toHaveBeenCalledOnce();
    expect(locationsBroadcaster.broadcastPatchEvseStatus).not.toHaveBeenCalled();
  });

  it('logs and skips the EVSE broadcast when the EVSE cannot be read back', async () => {
    const { module, logger, locationsBroadcaster, ocpiGraphqlClient } = build();
    ocpiGraphqlClient.request
      .mockResolvedValueOnce({ ChargingStations: [STATION] })
      .mockResolvedValueOnce({ Locations: [] });

    await module.handleConnectorUpdate(connectorUpdate({ status: 'Faulted' }));

    expect(locationsBroadcaster.broadcastPatchConnector).toHaveBeenCalledOnce();
    expect(locationsBroadcaster.broadcastPatchEvseStatus).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledOnce();
  });
});
