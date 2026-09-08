// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
  GET_CHARGING_STATION_BY_ID_QUERY,
  GET_CHARGING_STATION_BY_PK_QUERY,
} from '../../src/graphql/queries/charging-station-queries.js';
import { GET_ACTIVE_TRANSACTION_FOR_STOP_SESSION_QUERY } from '../../src/graphql/queries/transaction-queries.js';

/** Pulls the body of a `<alias>: ChargingStation { ... }` selection out of a query. */
function stationSelection(query: string): string | null {
  return /:\s*ChargingStation\s*\{([^}]*)\}/.exec(query)?.[1] ?? null;
}

/** Pulls the body of the top-level `ChargingStations(...) { ... }` selection. */
function chargingStationsSelection(query: string): string {
  return query;
}

/**
 * Every station an OCPI command acts on comes from one of these queries:
 *   START_SESSION / UNLOCK_CONNECTOR -> …BY_ID (by ocppConnectionName)
 *   STOP_SESSION                     -> the transaction's `station` relation
 * `…BY_PK` backs the same shape and is used by the Locations module.
 */
describe('station sources for OCPI commands', () => {
  // Regression guard. CommandExecutor.getCommandHandler() picks the OCPP command
  // handler from `protocol`. STOP_SESSION's station came from the transaction
  // query, whose station selection omitted it — so the lookup missed, the
  // executor logged "Unsupported OCPP version for command" and posted a
  // CommandResult of FAILED ("Charging station communication failed") without
  // ever sending a RequestStopTransaction, and the transaction kept charging
  // even though the eMSP had already been told sync ACCEPTED.
  it('STOP_SESSION: the transaction query selects protocol on its station', () => {
    const selection = stationSelection(GET_ACTIVE_TRANSACTION_FOR_STOP_SESSION_QUERY);

    expect(selection).not.toBeNull();
    expect(selection!).toMatch(/^\s*protocol\s*$/m);
  });

  it('STOP_SESSION: the transaction query keeps the fields the stop path uses', () => {
    const selection = stationSelection(GET_ACTIVE_TRANSACTION_FOR_STOP_SESSION_QUERY);

    // ocppConnectionName becomes the `identifier` query param on the OCPP call,
    // isOnline gates the sync REJECTED, id is used for logging.
    expect(selection!).toMatch(/^\s*ocppConnectionName\s*$/m);
    expect(selection!).toMatch(/^\s*isOnline\s*$/m);
    expect(selection!).toMatch(/^\s*id\s*$/m);
  });

  it.each([
    ['GET_CHARGING_STATION_BY_ID_QUERY', GET_CHARGING_STATION_BY_ID_QUERY],
    ['GET_CHARGING_STATION_BY_PK_QUERY', GET_CHARGING_STATION_BY_PK_QUERY],
  ])('START_SESSION / UNLOCK_CONNECTOR: %s selects protocol', (_name, query) => {
    expect(chargingStationsSelection(query)).toMatch(/^\s*protocol\s*$/m);
  });

  it('UNLOCK_CONNECTOR: the station query still carries evses and connectors', () => {
    // The unlock handlers map evse_uid/connector_id through these relations.
    expect(GET_CHARGING_STATION_BY_ID_QUERY).toMatch(/evses:\s*Evses\s*\{/);
    expect(GET_CHARGING_STATION_BY_ID_QUERY).toMatch(/connectors:\s*Connectors\s*\{/);
  });
});
