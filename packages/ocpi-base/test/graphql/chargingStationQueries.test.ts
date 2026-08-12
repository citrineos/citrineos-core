// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
  GET_CHARGING_STATION_BY_ID_QUERY,
  GET_CHARGING_STATION_BY_PK_QUERY,
} from '../../src/graphql/queries/chargingStation.queries.js';

/**
 * These two queries are the only station source for the OCPI command path:
 * START_SESSION and UNLOCK_CONNECTOR resolve by ocppConnectionName (…BY_ID),
 * STOP_SESSION resolves by primary key from transaction.stationId (…BY_PK).
 */
const COMMAND_STATION_QUERIES: ReadonlyArray<[string, string]> = [
  ['GET_CHARGING_STATION_BY_ID_QUERY', GET_CHARGING_STATION_BY_ID_QUERY],
  ['GET_CHARGING_STATION_BY_PK_QUERY', GET_CHARGING_STATION_BY_PK_QUERY],
];

describe('charging station queries feeding OCPI commands', () => {
  describe.each(COMMAND_STATION_QUERIES)('%s', (_name, query) => {
    // Regression guard. CommandExecutor.getCommandHandler() selects the OCPP
    // command handler from `protocol`; when a command's station arrived without
    // it, the executor logged "Unsupported OCPP version for command", posted a
    // CommandResult of FAILED ("Charging station communication failed"), and
    // never sent anything to the station — while the eMSP had already been told
    // sync ACCEPTED. Dropping this field breaks START, STOP and UNLOCK alike.
    it('selects protocol', () => {
      expect(query).toMatch(/^\s*protocol\s*$/m);
    });

    it('selects the fields the handlers address the station by', () => {
      // ocppConnectionName becomes the `identifier` query param on the OCPP
      // call; isOnline gates the sync REJECTED; id feeds the 2.0.1 remoteStartId
      // sequence lookup; evses/connectors are read by UnlockConnector.
      expect(query).toMatch(/^\s*ocppConnectionName\s*$/m);
      expect(query).toMatch(/^\s*isOnline\s*$/m);
      expect(query).toMatch(/^\s*id\s*$/m);
      expect(query).toMatch(/evses:\s*Evses\s*\{/);
      expect(query).toMatch(/connectors:\s*Connectors\s*\{/);
    });
  });
});
