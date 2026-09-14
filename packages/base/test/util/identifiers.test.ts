// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';
import {
  createIdentifier,
  DEFAULT_TENANT_ID,
  getStationIdFromIdentifier,
  getTenantIdFromIdentifier,
} from '../../src/util/identifiers.js';

/**
 * The station name is the last segment of the websocket URL, so its content is chosen by whoever
 * connects. It reaches createIdentifier unaltered, and every inbound message is attributed to
 * whatever getStationIdFromIdentifier reads back out.
 */
const STATION_NAMES = ['CP001', 'CP:001', 'A:B', 'a:b:c:d', ':leading', 'trailing:', ''];

describe('identifier round trip', () => {
  it.each(STATION_NAMES)('recovers the station name %j unchanged', (ocppConnectionName) => {
    const identifier = createIdentifier(7, ocppConnectionName);

    expect(getStationIdFromIdentifier(identifier)).toBe(ocppConnectionName);
    expect(getTenantIdFromIdentifier(identifier)).toBe(7);
  });

  it('does not let one station be read back as another', () => {
    // Without splitting on the first delimiter only, "A:B" reads back as "A", so a station
    // connecting under that name has its messages attributed to a different station.
    expect(getStationIdFromIdentifier(createIdentifier(1, 'A:B'))).not.toBe(
      getStationIdFromIdentifier(createIdentifier(1, 'A')),
    );
  });
});

describe('getStationIdFromIdentifier', () => {
  it('returns the input when there is no delimiter at all', () => {
    expect(getStationIdFromIdentifier('CP001')).toBe('CP001');
  });
});

describe('getTenantIdFromIdentifier', () => {
  it('reads the tenant from the first segment', () => {
    expect(getTenantIdFromIdentifier('42:CP001')).toBe(42);
  });

  it('falls back to the default tenant when the first segment is empty', () => {
    expect(getTenantIdFromIdentifier(':CP001')).toBe(DEFAULT_TENANT_ID);
  });

  it('falls back to the default tenant rather than returning NaN', () => {
    // Number('abc') is NaN, which is truthy-checked as a string and so was returned as-is.
    // A NaN tenant matches no row, so it surfaces as an empty result rather than an error.
    expect(getTenantIdFromIdentifier('abc:CP001')).toBe(DEFAULT_TENANT_ID);
  });
});
