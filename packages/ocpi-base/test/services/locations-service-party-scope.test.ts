// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { Logger } from 'tslog';

// The mapper barrel reaches BaseClientApi, whose parameterless @Inject() needs design:type
// metadata the test transform does not emit. These tests never map a row, so a stub is enough.
// citrineos/citrineos-core#913 removes the need for this.
vi.mock('../../src/mapper/index.js', () => ({
  ConnectorMapper: class {},
  EvseMapper: class {},
  LocationMapper: class {},
  TariffMapper: class {},
}));

import { LocationsService } from '../../src/services/locations-service.js';
import { OcpiHeaders } from '../../src/model/ocpi-headers.js';

const COUNTRY_CODE = 'GB';
const PARTY_ID = 'VLT';

/**
 * The Locations sender interface serves one CPO, named by the to_ headers. getLocations filters on
 * them; the by-id reads addressed a numeric id alone, so any partner could read another CPO's
 * location, EVSE or connector by walking ids.
 */
function aCapturingGraphqlClient() {
  const request = vi.fn().mockResolvedValue({ Locations: [] });
  return { client: { request } as never, request };
}

function someHeaders(): OcpiHeaders {
  return { toCountryCode: COUNTRY_CODE, toPartyId: PARTY_ID } as OcpiHeaders;
}

function variablesFrom(request: ReturnType<typeof aCapturingGraphqlClient>['request']) {
  expect(request).toHaveBeenCalledOnce();
  return request.mock.calls[0][1] as Record<string, unknown>;
}

/** The party predicate has to be in the query itself; passing the variables alone filters nothing. */
function expectPartyPredicate(request: ReturnType<typeof aCapturingGraphqlClient>['request']) {
  const document = String(request.mock.calls[0][0]);
  expect(document).toContain('countryCode: { _eq: $countryCode }');
  expect(document).toContain('partyId: { _eq: $partyId }');
}

function aService(client: never) {
  return new LocationsService({
    logger: new Logger({ type: 'hidden' }),
    ocpiGraphqlClient: client,
  } as never);
}

describe('LocationsService by-id reads are scoped to the requesting party', () => {
  it('scopes getLocationById to the CPO in the headers', async () => {
    const { client, request } = aCapturingGraphqlClient();

    await aService(client).getLocationById(someHeaders(), '7');

    expect(variablesFrom(request)).toMatchObject({
      id: 7,
      countryCode: COUNTRY_CODE,
      partyId: PARTY_ID,
    });
    expectPartyPredicate(request);
  });

  it('scopes getEvseById to the CPO in the headers', async () => {
    const { client, request } = aCapturingGraphqlClient();

    await aService(client).getEvseById(someHeaders(), '7', 'cs-001', 1);

    expect(variablesFrom(request)).toMatchObject({
      locationId: 7,
      countryCode: COUNTRY_CODE,
      partyId: PARTY_ID,
    });
    expectPartyPredicate(request);
  });

  it('scopes getConnectorById to the CPO in the headers', async () => {
    const { client, request } = aCapturingGraphqlClient();

    await aService(client).getConnectorById(someHeaders(), '7', 'cs-001', 1, 2);

    expect(variablesFrom(request)).toMatchObject({
      locationId: 7,
      countryCode: COUNTRY_CODE,
      partyId: PARTY_ID,
    });
    expectPartyPredicate(request);
  });

  it('reports a location outside the requesting party as unknown, not as an error', async () => {
    const { client } = aCapturingGraphqlClient();

    const response = await aService(client).getLocationById(someHeaders(), '7');

    // 2003 is ClientUnknownLocation; a cross-party id must look exactly like a missing one.
    expect(response.status_code).toBe(2003);
  });
});
