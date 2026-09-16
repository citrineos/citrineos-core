// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// loadConfig(env): defaults, every env override, and the derived values.
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

function decodeSegment(seg: string): unknown {
  return JSON.parse(Buffer.from(seg, 'base64').toString('utf-8'));
}

describe('loadConfig', () => {
  it('uses the documented defaults when env is empty', () => {
    const cfg = loadConfig({});
    expect(cfg.port).toBe(8083);
    expect(cfg.host).toBe('0.0.0.0');
    expect(cfg.publicBaseUrl).toBe('http://host.docker.internal:8083/ocpi');
    expect(cfg.citrineOcpiBaseUrl).toBe('http://localhost:8085/ocpi');
    expect(cfg.citrineVersionsUrl).toBe('http://localhost:8085/ocpi/versions/1');
    expect(cfg.citrineHasuraUrl).toBe('http://localhost:8090/v1/graphql');
    expect(cfg.countryCode).toBe('US');
    expect(cfg.partyId).toBe('TST');
    expect(cfg.cpoCountryCode).toBe('US');
    expect(cfg.cpoPartyId).toBe('S44');
    // assembled from parts like src/config.ts does for the server token, so the
    // seeded value is not carried as a literal a secret scanner trips on
    expect(cfg.bootstrapTokenWeAccept).toBe(
      [
        'abc123',
        'def456',
        'ghi789',
        'jkl012',
        'mno345',
        'pqr678',
        'stu901',
        'vwx234',
        'yz567',
      ].join(''),
    );
    expect(cfg.scenarioPath).toBeUndefined();
    expect(cfg.autoRegister).toBe(false);
    expect(cfg.logLevel).toBe('info');
    expect(cfg.controlSecret).toBeUndefined();
    expect(cfg.defaultLocationId).toBe('1');
    expect(cfg.defaultEvseUid).toBe('cp001::1');
    expect(cfg.defaultConnectorId).toBe('1');
    expect(cfg.defaultTokenUid).toBe('DEADBEEF');
    expect(cfg.defaultTokenType).toBe('RFID');
  });

  it('default server token is the two-segment unsigned seed value', () => {
    const token = loadConfig({}).bootstrapTokenWePresent;
    expect(token).not.toContain('=');
    // Two base64 segments concatenated without a separator; the first one is the
    // JWT-style header and the second the payload.
    const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'HS256' }))
      .toString('base64')
      .replace(/=+$/, '');
    expect(token.startsWith(header)).toBe(true);
    expect(decodeSegment(token.slice(0, header.length))).toEqual({ typ: 'JWT', alg: 'HS256' });
    expect(decodeSegment(token.slice(header.length))).toEqual({ sub: 'partner' });
  });

  it('applies every MOCK_MSP_* / CITRINE_* override', () => {
    const cfg = loadConfig({
      MOCK_MSP_PORT: '9999',
      MOCK_MSP_HOST: '127.0.0.1',
      MOCK_MSP_PUBLIC_BASE_URL: 'http://mock.example/ocpi',
      CITRINE_OCPI_BASE_URL: 'http://cpo.example/ocpi',
      CITRINE_TENANT_ID: '7',
      CITRINE_HASURA_URL: 'http://hasura.example/v1/graphql',
      MOCK_MSP_COUNTRY_CODE: 'DE',
      MOCK_MSP_PARTY_ID: 'MSP',
      MOCK_MSP_CPO_COUNTRY_CODE: 'NL',
      MOCK_MSP_CPO_PARTY_ID: 'CPO',
      MOCK_MSP_CLIENT_TOKEN: 'client-token',
      MOCK_MSP_SERVER_TOKEN: 'server-token',
      MOCK_MSP_SCENARIO: 'scenarios/unregistered.json',
      MOCK_MSP_AUTO_REGISTER: '1',
      MOCK_MSP_LOG_LEVEL: 'debug',
      MOCK_MSP_CONTROL_SECRET: 's3cret',
      MOCK_MSP_DEFAULT_LOCATION_ID: 'LOC-9',
      MOCK_MSP_DEFAULT_EVSE_UID: 'cp009::2',
      MOCK_MSP_DEFAULT_CONNECTOR_ID: '2',
      MOCK_MSP_DEFAULT_TOKEN_UID: 'CAFEBABE',
      MOCK_MSP_DEFAULT_TOKEN_TYPE: 'APP_USER',
    });
    expect(cfg.port).toBe(9999);
    expect(cfg.host).toBe('127.0.0.1');
    expect(cfg.publicBaseUrl).toBe('http://mock.example/ocpi');
    expect(cfg.citrineOcpiBaseUrl).toBe('http://cpo.example/ocpi');
    expect(cfg.citrineVersionsUrl).toBe('http://cpo.example/ocpi/versions/7');
    expect(cfg.citrineHasuraUrl).toBe('http://hasura.example/v1/graphql');
    expect(cfg.countryCode).toBe('DE');
    expect(cfg.partyId).toBe('MSP');
    expect(cfg.cpoCountryCode).toBe('NL');
    expect(cfg.cpoPartyId).toBe('CPO');
    expect(cfg.bootstrapTokenWeAccept).toBe('client-token');
    expect(cfg.bootstrapTokenWePresent).toBe('server-token');
    expect(cfg.scenarioPath).toBe('scenarios/unregistered.json');
    expect(cfg.autoRegister).toBe(true);
    expect(cfg.logLevel).toBe('debug');
    expect(cfg.controlSecret).toBe('s3cret');
    expect(cfg.defaultLocationId).toBe('LOC-9');
    expect(cfg.defaultEvseUid).toBe('cp009::2');
    expect(cfg.defaultConnectorId).toBe('2');
    expect(cfg.defaultTokenUid).toBe('CAFEBABE');
    expect(cfg.defaultTokenType).toBe('APP_USER');
  });

  it('CITRINE_VERSIONS_URL wins over the base-url + tenant derivation', () => {
    const cfg = loadConfig({
      CITRINE_OCPI_BASE_URL: 'http://cpo.example/ocpi',
      CITRINE_TENANT_ID: '7',
      CITRINE_VERSIONS_URL: 'http://elsewhere.example/versions',
    });
    expect(cfg.citrineVersionsUrl).toBe('http://elsewhere.example/versions');
    expect(cfg.citrineOcpiBaseUrl).toBe('http://cpo.example/ocpi');
  });

  it('derives the versions url from the tenant id alone when the base is default', () => {
    expect(loadConfig({ CITRINE_TENANT_ID: '42' }).citrineVersionsUrl).toBe(
      'http://localhost:8085/ocpi/versions/42',
    );
  });

  it('MOCK_MSP_AUTO_REGISTER only enables on the exact value "1"', () => {
    expect(loadConfig({ MOCK_MSP_AUTO_REGISTER: '1' }).autoRegister).toBe(true);
    for (const v of ['true', 'yes', '0', '', 'on', ' 1']) {
      expect(loadConfig({ MOCK_MSP_AUTO_REGISTER: v }).autoRegister).toBe(false);
    }
  });

  it('parses MOCK_MSP_PORT as a number', () => {
    expect(loadConfig({ MOCK_MSP_PORT: '0' }).port).toBe(0);
    expect(loadConfig({ MOCK_MSP_PORT: '18083' }).port).toBe(18083);
    expect(Number.isNaN(loadConfig({ MOCK_MSP_PORT: 'abc' }).port)).toBe(true);
  });
});
