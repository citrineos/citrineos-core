// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { Logger } from 'tslog';
import { describe, expect, it, vi } from 'vitest';

import { InvalidParamException } from '../../src/exception/invalid-param-exception.js';
import { UnknownTokenException } from '../../src/exception/unknown-token-exception.js';
import { WrongClientAccessException } from '../../src/exception/wrong-client-access-exception.js';
import { OcpiHeaders } from '../../src/model/ocpi-headers.js';
import { OcpiResponseStatusCode } from '../../src/model/ocpi-response.js';
import { TokenType } from '../../src/model/token-type.js';
import { VersionNumber } from '../../src/model/version-number.js';
import { WhitelistType } from '../../src/model/whitelist-type.js';
import { CredentialsModuleApi } from '../../src/modules/credentials/module/credentials-module-api.js';
import { TokensModuleApi } from '../../src/modules/tokens/module/tokens-module-api.js';

const VERSION = VersionNumber.TWO_DOT_TWO_DOT_ONE;
const TENANT_PARTNER = { id: 7, tenant: { id: 3 } };
const CTX = { state: { tenantPartner: TENANT_PARTNER } };

const CREDENTIALS_DTO = {
  token: 'token-b',
  url: 'https://partner.example.com/ocpi/versions',
  roles: [],
} as never;

function aCredentialsService() {
  return {
    getCredentials: vi.fn(),
    postCredentials: vi.fn(),
    putCredentials: vi.fn(),
    deleteCredentials: vi.fn(),
    registerCredentialsTokenA: vi.fn(),
    unregisterClient: vi.fn(),
    generateCredentialsTokenA: vi.fn(),
    regenerateCredentialsToken: vi.fn(),
  };
}

function aCredentialsApi(service: ReturnType<typeof aCredentialsService>) {
  return new CredentialsModuleApi({
    logger: new Logger({ type: 'hidden' }),
    credentialsService: service,
  } as never);
}

function aTokensService() {
  return {
    getToken: vi.fn(),
    upsertToken: vi.fn(),
    patchToken: vi.fn(),
    realTimeAuthorization: vi.fn(),
  };
}

function aTokensApi(service: ReturnType<typeof aTokensService>) {
  return new TokensModuleApi({
    logger: new Logger({ type: 'hidden' }),
    tokensService: service,
  } as never);
}

// fromCountryCode/fromPartyId are what the controllers compare against path params.
function headersFrom(countryCode: string, partyId: string) {
  return new OcpiHeaders(countryCode, partyId, 'US', 'CPO');
}

function aTokenDto(uid: string) {
  return {
    country_code: 'DE',
    party_id: 'MSP',
    uid,
    type: TokenType.RFID,
    contract_id: 'DEMSPC00000001',
    issuer: 'TestMobility',
    valid: true,
    whitelist: WhitelistType.ALLOWED,
    last_updated: new Date('2026-08-01T00:00:00.000Z'),
  } as never;
}

describe('CredentialsModuleApi', () => {
  it('getCredentials wraps the service DTO in a 1000 envelope', async () => {
    const service = aCredentialsService();
    service.getCredentials.mockResolvedValue(CREDENTIALS_DTO);
    const api = aCredentialsApi(service);

    const result = await api.getCredentials(VERSION, CTX);

    expect(service.getCredentials).toHaveBeenCalledTimes(1);
    expect(service.getCredentials).toHaveBeenCalledWith(TENANT_PARTNER);
    expect(result.status_code).toBe(OcpiResponseStatusCode.GenericSuccessCode);
    expect(result.status_message).toBeUndefined();
    expect(result.data).toBe(CREDENTIALS_DTO);
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it('getCredentials propagates a service rejection', async () => {
    const service = aCredentialsService();
    service.getCredentials.mockRejectedValue(new Error('db down'));
    const api = aCredentialsApi(service);

    await expect(api.getCredentials(VERSION, CTX)).rejects.toThrow('db down');
  });

  it('postCredentials passes tenant partner, body, and version to the service', async () => {
    const service = aCredentialsService();
    const serverCredentials = { token: 'token-c' } as never;
    service.postCredentials.mockResolvedValue(serverCredentials);
    const api = aCredentialsApi(service);

    const result = await api.postCredentials(VERSION, CTX, CREDENTIALS_DTO);

    expect(service.postCredentials).toHaveBeenCalledTimes(1);
    expect(service.postCredentials).toHaveBeenCalledWith(TENANT_PARTNER, CREDENTIALS_DTO, VERSION);
    expect(result.status_code).toBe(OcpiResponseStatusCode.GenericSuccessCode);
    expect(result.data).toBe(serverCredentials);
  });

  it('putCredentials passes tenant partner and body but no version', async () => {
    const service = aCredentialsService();
    const serverCredentials = { token: 'token-c2' } as never;
    service.putCredentials.mockResolvedValue(serverCredentials);
    const api = aCredentialsApi(service);

    const result = await api.putCredentials(VERSION, CTX, CREDENTIALS_DTO);

    expect(service.putCredentials).toHaveBeenCalledTimes(1);
    expect(service.putCredentials).toHaveBeenCalledWith(TENANT_PARTNER, CREDENTIALS_DTO);
    expect(result.data).toBe(serverCredentials);
  });

  it('deleteCredentials deletes by auth token and returns an empty 1000 envelope', async () => {
    const service = aCredentialsService();
    service.deleteCredentials.mockResolvedValue(undefined);
    const api = aCredentialsApi(service);

    const result = await api.deleteCredentials(VERSION, 'auth-token-c');

    expect(service.deleteCredentials).toHaveBeenCalledTimes(1);
    expect(service.deleteCredentials).toHaveBeenCalledWith('auth-token-c');
    expect(result.status_code).toBe(OcpiResponseStatusCode.GenericSuccessCode);
    expect(result.data).toBeUndefined();
  });

  it('deleteCredentials propagates a service rejection', async () => {
    const service = aCredentialsService();
    service.deleteCredentials.mockRejectedValue(new Error('not registered'));
    const api = aCredentialsApi(service);

    await expect(api.deleteCredentials(VERSION, 'auth-token-c')).rejects.toThrow('not registered');
  });

  it('registerCredentialsTokenA reorders params to country, party, url, body, version', async () => {
    const service = aCredentialsService();
    const serverCredentials = { token: 'token-b-new' } as never;
    service.registerCredentialsTokenA.mockResolvedValue(serverCredentials);
    const api = aCredentialsApi(service);

    const result = await api.registerCredentialsTokenA(
      VERSION,
      'https://cpo.example.com/ocpi/versions',
      'DE',
      'CPO',
      CREDENTIALS_DTO,
    );

    expect(service.registerCredentialsTokenA).toHaveBeenCalledTimes(1);
    expect(service.registerCredentialsTokenA).toHaveBeenCalledWith(
      'DE',
      'CPO',
      'https://cpo.example.com/ocpi/versions',
      CREDENTIALS_DTO,
      VERSION,
    );
    expect(result.status_code).toBe(OcpiResponseStatusCode.GenericSuccessCode);
    expect(result.data).toBe(serverCredentials);
  });

  it('deleteTenant returns an empty 1000 envelope without touching the service', async () => {
    const service = aCredentialsService();
    const api = aCredentialsApi(service);

    const result = await api.deleteTenant(VERSION, '42');

    expect(result.status_code).toBe(OcpiResponseStatusCode.GenericSuccessCode);
    expect(result.data).toBeUndefined();
    for (const fn of Object.values(service)) {
      expect(fn).toHaveBeenCalledTimes(0);
    }
  });

  it('unregisterClient forwards the request body and resolves void', async () => {
    const service = aCredentialsService();
    service.unregisterClient.mockResolvedValue(undefined);
    const api = aCredentialsApi(service);
    const request = { countryCode: 'DE', partyId: 'MSP' } as never;

    const result = await api.unregisterClient(VERSION, request);

    expect(service.unregisterClient).toHaveBeenCalledTimes(1);
    expect(service.unregisterClient).toHaveBeenCalledWith(request);
    expect(result).toBeUndefined();
  });

  it('generateCredentialsTokenA forwards request then version', async () => {
    const service = aCredentialsService();
    const created = { token: 'token-a' } as never;
    service.generateCredentialsTokenA.mockResolvedValue(created);
    const api = aCredentialsApi(service);
    const request = { versionUrl: 'https://msp.example.com/versions' } as never;

    const result = await api.generateCredentialsTokenA(VERSION, request);

    expect(service.generateCredentialsTokenA).toHaveBeenCalledTimes(1);
    expect(service.generateCredentialsTokenA).toHaveBeenCalledWith(request, VERSION);
    expect(result.status_code).toBe(OcpiResponseStatusCode.GenericSuccessCode);
    expect(result.data).toBe(created);
  });

  it('regenerateCredentialsToken forwards request then version', async () => {
    const service = aCredentialsService();
    const regenerated = { token: 'token-a2' } as never;
    service.regenerateCredentialsToken.mockResolvedValue(regenerated);
    const api = aCredentialsApi(service);
    const request = { versionUrl: 'https://msp.example.com/versions' } as never;

    const result = await api.regenerateCredentialsToken(VERSION, request);

    expect(service.regenerateCredentialsToken).toHaveBeenCalledTimes(1);
    expect(service.regenerateCredentialsToken).toHaveBeenCalledWith(request, VERSION);
    expect(result.data).toBe(regenerated);
  });
});

describe('TokensModuleApi', () => {
  describe('getTokens', () => {
    it('rejects a country code not matching the sender header', async () => {
      const service = aTokensService();
      const api = aTokensApi(service);

      const call = api.getTokens(VERSION, 'FR', 'MSP', 'UID1', headersFrom('DE', 'MSP'));

      await expect(call).rejects.toBeInstanceOf(WrongClientAccessException);
      expect(service.getToken).toHaveBeenCalledTimes(0);
    });

    it('throws UnknownTokenException when the service finds nothing', async () => {
      const service = aTokensService();
      service.getToken.mockResolvedValue(undefined);
      const api = aTokensApi(service);

      const call = api.getTokens(VERSION, 'DE', 'MSP', 'UID1', headersFrom('DE', 'MSP'));

      await expect(call).rejects.toThrow(UnknownTokenException);
      expect(service.getToken).toHaveBeenCalledTimes(1);
      // type defaults to RFID when the query param is absent
      expect(service.getToken).toHaveBeenCalledWith({
        country_code: 'DE',
        party_id: 'MSP',
        uid: 'UID1',
        type: TokenType.RFID,
      });
    });

    it('returns the token in a 1000 envelope and forwards an explicit type', async () => {
      const service = aTokensService();
      const token = aTokenDto('UID1');
      service.getToken.mockResolvedValue(token);
      const api = aTokensApi(service);

      const result = await api.getTokens(
        VERSION,
        'DE',
        'MSP',
        'UID1',
        headersFrom('DE', 'MSP'),
        TokenType.APP_USER,
      );

      expect(service.getToken).toHaveBeenCalledWith({
        country_code: 'DE',
        party_id: 'MSP',
        uid: 'UID1',
        type: TokenType.APP_USER,
      });
      expect(result.status_code).toBe(OcpiResponseStatusCode.GenericSuccessCode);
      expect(result.data).toBe(token);
    });
  });

  describe('putToken', () => {
    it('rejects a party id not matching the sender header', async () => {
      const service = aTokensService();
      const api = aTokensApi(service);

      const call = api.putToken(
        VERSION,
        'DE',
        'OTHER',
        'UID1',
        headersFrom('DE', 'MSP'),
        aTokenDto('UID1'),
        undefined,
        CTX,
      );

      await expect(call).rejects.toThrow('Client is trying to access wrong resource');
      expect(service.upsertToken).toHaveBeenCalledTimes(0);
    });

    it('rejects when path uid and body uid differ', async () => {
      const service = aTokensService();
      const api = aTokensApi(service);

      const call = api.putToken(
        VERSION,
        'DE',
        'MSP',
        'UID1',
        headersFrom('DE', 'MSP'),
        aTokenDto('UID2'),
        undefined,
        CTX,
      );

      await expect(call).rejects.toThrow('Path token_uid and body token_uid must match');
      expect(service.upsertToken).toHaveBeenCalledTimes(0);
    });

    it('rejects when the context has no tenant partner', async () => {
      const service = aTokensService();
      const api = aTokensApi(service);

      const call = api.putToken(
        VERSION,
        'DE',
        'MSP',
        'UID1',
        headersFrom('DE', 'MSP'),
        aTokenDto('UID1'),
        undefined,
        undefined,
      );

      await expect(call).rejects.toThrow('Tenant information not available');
      expect(service.upsertToken).toHaveBeenCalledTimes(0);
    });

    it('rejects when the tenant partner has no tenant id', async () => {
      const service = aTokensService();
      const api = aTokensApi(service);

      const call = api.putToken(
        VERSION,
        'DE',
        'MSP',
        'UID1',
        headersFrom('DE', 'MSP'),
        aTokenDto('UID1'),
        undefined,
        { state: { tenantPartner: { id: 7 } } },
      );

      await expect(call).rejects.toBeInstanceOf(InvalidParamException);
      expect(service.upsertToken).toHaveBeenCalledTimes(0);
    });

    it('upserts with tenant id and partner id from the context', async () => {
      const service = aTokensService();
      service.upsertToken.mockResolvedValue(undefined);
      const api = aTokensApi(service);
      const dto = aTokenDto('UID1');

      const result = await api.putToken(
        VERSION,
        'DE',
        'MSP',
        'UID1',
        headersFrom('DE', 'MSP'),
        dto,
        undefined,
        CTX,
      );

      expect(service.upsertToken).toHaveBeenCalledTimes(1);
      expect(service.upsertToken).toHaveBeenCalledWith(dto, 3, 7);
      expect(result.status_code).toBe(OcpiResponseStatusCode.GenericSuccessCode);
      expect(result.data).toBeUndefined();
    });
  });

  describe('patchToken', () => {
    it('rejects a country code not matching the sender header', async () => {
      const service = aTokensService();
      const api = aTokensApi(service);

      const call = api.patchToken(
        VERSION,
        'FR',
        'MSP',
        'UID1',
        headersFrom('DE', 'MSP'),
        { valid: false },
        undefined,
        CTX,
      );

      await expect(call).rejects.toBeInstanceOf(WrongClientAccessException);
      expect(service.patchToken).toHaveBeenCalledTimes(0);
    });

    it('rejects when the context has no tenant partner', async () => {
      const service = aTokensService();
      const api = aTokensApi(service);

      const call = api.patchToken(
        VERSION,
        'DE',
        'MSP',
        'UID1',
        headersFrom('DE', 'MSP'),
        { valid: false },
        undefined,
        {},
      );

      await expect(call).rejects.toThrow('Tenant information not available');
      expect(service.patchToken).toHaveBeenCalledTimes(0);
    });

    it('patches with RFID as the default type', async () => {
      const service = aTokensService();
      service.patchToken.mockResolvedValue(undefined);
      const api = aTokensApi(service);
      const partial = { valid: false };

      const result = await api.patchToken(
        VERSION,
        'DE',
        'MSP',
        'UID1',
        headersFrom('DE', 'MSP'),
        partial,
        undefined,
        CTX,
      );

      expect(service.patchToken).toHaveBeenCalledTimes(1);
      expect(service.patchToken).toHaveBeenCalledWith('UID1', TokenType.RFID, partial, 3, 7);
      expect(result.status_code).toBe(OcpiResponseStatusCode.GenericSuccessCode);
      expect(result.data).toBeUndefined();
    });

    it('forwards an explicit type', async () => {
      const service = aTokensService();
      service.patchToken.mockResolvedValue(undefined);
      const api = aTokensApi(service);
      const partial = { language: 'de' };

      await api.patchToken(
        VERSION,
        'DE',
        'MSP',
        'UID9',
        headersFrom('DE', 'MSP'),
        partial,
        TokenType.APP_USER,
        CTX,
      );

      expect(service.patchToken).toHaveBeenCalledWith('UID9', TokenType.APP_USER, partial, 3, 7);
    });
  });

  describe('realTimeAuthorization', () => {
    it('returns the service result unchanged', async () => {
      const service = aTokensService();
      const response = { allowed: 'ALLOWED' } as never;
      service.realTimeAuthorization.mockResolvedValue(response);
      const api = aTokensApi(service);
      const request = { idToken: 'UID1', tenantPartnerId: 7 } as never;

      const result = await api.realTimeAuthorization(VERSION, request);

      expect(service.realTimeAuthorization).toHaveBeenCalledTimes(1);
      expect(service.realTimeAuthorization).toHaveBeenCalledWith(request);
      expect(result).toBe(response);
    });

    it('propagates a service rejection', async () => {
      const service = aTokensService();
      service.realTimeAuthorization.mockRejectedValue(new Error('auth backend unavailable'));
      const api = aTokensApi(service);

      await expect(api.realTimeAuthorization(VERSION, {} as never)).rejects.toThrow(
        'auth backend unavailable',
      );
    });
  });
});
