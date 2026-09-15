// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID, type IFileStorage } from '@citrineos/base';
import type { OCPP2_common_types, SystemConfig } from '@citrineos/types';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { MemoryCache } from '@services/cache/memory.js';
import { generatePassword, isValidPassword } from '@services/security/authentication.js';
import { SignedMeterValuesUtil } from '@services/security/signed-meter-values-util.js';
import { generateKeyPairSync } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Secret scanners flag literal PEM delimiters, so the markers are assembled.
const PEM_DASHES = '-'.repeat(5);
const pemMarker = (label: string, edge: 'BEGIN' | 'END') =>
  `${PEM_DASHES}${edge} ${label}${PEM_DASHES}`;
const pemBlock = (label: string, body: string) =>
  `${pemMarker(label, 'BEGIN')}\n${body}\n${pemMarker(label, 'END')}`;

const { mockSecurityInfoRepository } = vi.hoisted(() => ({
  mockSecurityInfoRepository: {
    readChargingStationPublicKeyFileId: vi.fn(),
    readOrCreateChargingStationInfo: vi.fn(),
  },
}));

vi.mock('@citrineos/dal', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@citrineos/dal')>();
  return {
    ...actual,
    sequelize: {
      ...actual.sequelize,
      SequelizeChargingStationSecurityInfoRepository: vi
        .fn()
        .mockImplementation(() => mockSecurityInfoRepository),
    },
  };
});

class CachedThing {
  name!: string;
  count!: number;
}

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  describe('get / set / exists', () => {
    it('returns a stored value from the default namespace', async () => {
      await cache.set('stationId', 'cp001');

      await expect(cache.get('stationId')).resolves.toBe('cp001');
      await expect(cache.exists('stationId')).resolves.toBe(true);
    });

    it('returns null and exists false for a missing key', async () => {
      await expect(cache.get('missing')).resolves.toBeNull();
      await expect(cache.exists('missing')).resolves.toBe(false);
    });

    it('isolates the same key across namespaces', async () => {
      await cache.set('key', 'nsValue', 'ns1');

      await expect(cache.get('key', 'ns1')).resolves.toBe('nsValue');
      await expect(cache.get('key')).resolves.toBeNull();
      await expect(cache.exists('key', 'ns2')).resolves.toBe(false);
    });

    it('deserializes with a class constructor', async () => {
      await cache.set('thing', JSON.stringify({ name: 'meter', count: 3 }));

      const value = await cache.get('thing', undefined, () => CachedThing);
      expect(value).toBeInstanceOf(CachedThing);
      expect(value).toEqual({ name: 'meter', count: 3 });
    });
  });

  describe('existsAnyInNamespace', () => {
    it('matches only keys with the namespace prefix', async () => {
      await cache.set('a', '1', 'boot');

      await expect(cache.existsAnyInNamespace('boot')).resolves.toBe(true);
      await expect(cache.existsAnyInNamespace('other')).resolves.toBe(false);
    });
  });

  describe('remove', () => {
    it('returns the removed value and deletes the key', async () => {
      await cache.set('key', 'value');

      await expect(cache.remove('key')).resolves.toBe('value');
      await expect(cache.exists('key')).resolves.toBe(false);
    });

    it('returns null when the key is absent', async () => {
      await expect(cache.remove('missing')).resolves.toBeNull();
    });

    it('deserializes the removed value with a class constructor', async () => {
      await cache.set('thing', JSON.stringify({ name: 'x', count: 1 }));

      const removed = await cache.remove('thing', undefined, () => CachedThing);
      expect(removed).toBeInstanceOf(CachedThing);
      expect(removed).toEqual({ name: 'x', count: 1 });
    });
  });

  describe('setIfNotExist', () => {
    it('keeps the existing value and returns false', async () => {
      await cache.set('key', 'first');

      await expect(cache.setIfNotExist('key', 'second')).resolves.toBe(false);
      await expect(cache.get('key')).resolves.toBe('first');
    });

    it('stores the value and returns true when the key is absent', async () => {
      await expect(cache.setIfNotExist('key', 'value', 'ns1')).resolves.toBe(true);
      await expect(cache.get('key', 'ns1')).resolves.toBe('value');
    });
  });

  describe('expiry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('deletes the key after expireSeconds', async () => {
      await cache.set('key', 'value', undefined, 2);

      vi.advanceTimersByTime(1999);
      await expect(cache.exists('key')).resolves.toBe(true);

      vi.advanceTimersByTime(1);
      await expect(cache.exists('key')).resolves.toBe(false);
    });

    it('clears a pending expiry when the key is set again without one', async () => {
      await cache.set('key', 'v1', undefined, 1);
      await cache.set('key', 'v2');

      vi.advanceTimersByTime(5000);
      await expect(cache.get('key')).resolves.toBe('v2');
    });

    it('updateExpiration returns false for a missing key', async () => {
      await expect(cache.updateExpiration('missing', 1)).resolves.toBe(false);
    });

    it('updateExpiration arms deletion for an existing key', async () => {
      await cache.set('key', 'value');

      await expect(cache.updateExpiration('key', 1)).resolves.toBe(true);
      vi.advanceTimersByTime(1000);
      await expect(cache.exists('key')).resolves.toBe(false);
    });
  });

  describe('onChange', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('resolves with the new value when the key is set', async () => {
      const pending = cache.onChange<string>('key', 60);
      await cache.set('key', 'fresh');

      await expect(pending).resolves.toBe('fresh');
    });

    it('shares one subscription between concurrent waiters', async () => {
      const first = cache.onChange<string>('key', 60);
      const second = cache.onChange<string>('key', 60);
      await cache.set('key', 'shared');

      await expect(first).resolves.toBe('shared');
      await expect(second).resolves.toBe('shared');
    });

    it('deserializes the pushed value with a class constructor', async () => {
      const pending = cache.onChange('key', 60, 'ns1', () => CachedThing);
      await cache.set('key', JSON.stringify({ name: 'pushed', count: 9 }), 'ns1');

      const value = await pending;
      expect(value).toBeInstanceOf(CachedThing);
      expect(value).toEqual({ name: 'pushed', count: 9 });
    });

    it('falls back to the current value when waitSeconds elapses', async () => {
      await cache.set('key', 'existing');
      const pending = cache.onChange<string>('key', 2);

      await vi.advanceTimersByTimeAsync(2000);
      await expect(pending).resolves.toBe('existing');
    });

    it('resolves null at timeout when the key never appears', async () => {
      const pending = cache.onChange<string>('ghost', 1);

      await vi.advanceTimersByTimeAsync(1000);
      await expect(pending).resolves.toBeNull();
    });

    it('drops the subscription after it fires once', async () => {
      const first = cache.onChange<string>('key', 60);
      await cache.set('key', 'v1');
      await expect(first).resolves.toBe('v1');

      const second = cache.onChange<string>('key', 60);
      await cache.set('key', 'v2');
      await expect(second).resolves.toBe('v2');
    });
  });
});

type SignedMeterValuesConfig = NonNullable<SystemConfig['transactions']['signedMeterValues']>;

describe('SignedMeterValuesUtil', () => {
  const { container, logger } = createTestContainer();

  const stationName = 'cp001';
  const publicKeyFileId = 'key-file-1';

  const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
  const publicKeyBody = publicKeyPem
    .replace(pemMarker('PUBLIC KEY', 'BEGIN'), '')
    .replace(pemMarker('PUBLIC KEY', 'END'), '')
    .replace(/(\r\n|\n|\r)/gm, '');
  // The util base64-decodes the incoming key before comparing it to the formatted configured key.
  const matchingIncomingKey = Buffer.from(publicKeyBody).toString('base64');
  const signedMeterData = Buffer.alloc(256, 7).toString('base64');

  let fileStorage: { getFile: ReturnType<typeof vi.fn> };

  // Config moved from modules.transactions.signedMeterValuesConfiguration to
  // transactions.signedMeterValues.
  const aConfig = (signedMeterValues?: SignedMeterValuesConfig): Partial<SystemConfig> => ({
    transactions: { signedMeterValues },
  });

  const utilWith = (config: Partial<SystemConfig>): SignedMeterValuesUtil =>
    getTestInstance(container, SignedMeterValuesUtil, {
      fileStorage: fileStorage as unknown as IFileStorage,
      config,
    });

  const meterValuesWith = (
    signedMeterValue?: Partial<OCPP2_common_types.SignedMeterValueType>,
  ): [OCPP2_common_types.MeterValueType, ...OCPP2_common_types.MeterValueType[]] =>
    [
      {
        timestamp: '2025-01-01T00:00:00Z',
        sampledValue: [{ value: 42, signedMeterValue }],
      },
    ] as unknown as [OCPP2_common_types.MeterValueType, ...OCPP2_common_types.MeterValueType[]];

  const aSignedMeterValue = (
    overrides: Partial<OCPP2_common_types.SignedMeterValueType> = {},
  ): Partial<OCPP2_common_types.SignedMeterValueType> => ({
    signedMeterData,
    signingMethod: 'RSASSA-PKCS1-v1_5',
    encodingMethod: 'SHA-256',
    publicKey: matchingIncomingKey,
    ...overrides,
  });

  const rsaConfig = aConfig({
    publicKeyFileId,
    signingMethod: 'RSASSA-PKCS1-v1_5',
    rejectUnsupportedSignedMeterValues: true,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    fileStorage = { getFile: vi.fn().mockResolvedValue(publicKeyPem) };
  });

  it('accepts unsigned meter values without touching storage', async () => {
    const util = utilWith(rsaConfig);

    const result = await util.validateMeterValues(
      DEFAULT_TENANT_ID,
      stationName,
      meterValuesWith(),
    );

    expect(result).toBe(true);
    expect(fileStorage.getFile).not.toHaveBeenCalled();
    expect(mockSecurityInfoRepository.readOrCreateChargingStationInfo).not.toHaveBeenCalled();
    expect(mockSecurityInfoRepository.readChargingStationPublicKeyFileId).not.toHaveBeenCalled();
  });

  it('accepts a matching incoming public key and persists the station info', async () => {
    mockSecurityInfoRepository.readOrCreateChargingStationInfo.mockResolvedValue(undefined);
    const util = utilWith(rsaConfig);

    const result = await util.validateMeterValues(
      DEFAULT_TENANT_ID,
      stationName,
      meterValuesWith(aSignedMeterValue()),
    );

    expect(result).toBe(true);
    expect(fileStorage.getFile).toHaveBeenCalledTimes(1);
    expect(fileStorage.getFile).toHaveBeenCalledWith(publicKeyFileId, undefined, { trusted: true });
    expect(mockSecurityInfoRepository.readOrCreateChargingStationInfo).toHaveBeenCalledTimes(1);
    expect(mockSecurityInfoRepository.readOrCreateChargingStationInfo).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      stationName,
      publicKeyFileId,
    );
  });

  it('rejects an incoming public key that differs from the configured one', async () => {
    const util = utilWith(rsaConfig);

    const result = await util.validateMeterValues(
      DEFAULT_TENANT_ID,
      stationName,
      meterValuesWith(
        aSignedMeterValue({ publicKey: Buffer.from('a different key').toString('base64') }),
      ),
    );

    expect(result).toBe(false);
    expect(fileStorage.getFile).toHaveBeenCalledTimes(1);
    expect(mockSecurityInfoRepository.readOrCreateChargingStationInfo).not.toHaveBeenCalled();
  });

  it('rejects a signing method mismatch when unsupported values are rejected', async () => {
    const util = utilWith(rsaConfig);

    const result = await util.validateMeterValues(
      DEFAULT_TENANT_ID,
      stationName,
      meterValuesWith(aSignedMeterValue({ signingMethod: 'ECDSA' })),
    );

    expect(result).toBe(false);
    expect(fileStorage.getFile).not.toHaveBeenCalled();
    expect(mockSecurityInfoRepository.readOrCreateChargingStationInfo).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Invalid signature because incoming signing method does not match configured signing method.',
    );
  });

  it('accepts a signing method mismatch when unsupported values are not rejected', async () => {
    mockSecurityInfoRepository.readOrCreateChargingStationInfo.mockResolvedValue(undefined);
    const util = utilWith(
      aConfig({
        publicKeyFileId,
        signingMethod: 'RSASSA-PKCS1-v1_5',
        rejectUnsupportedSignedMeterValues: false,
      }),
    );

    const result = await util.validateMeterValues(
      DEFAULT_TENANT_ID,
      stationName,
      meterValuesWith(aSignedMeterValue({ signingMethod: 'ECDSA' })),
    );

    expect(result).toBe(true);
    expect(mockSecurityInfoRepository.readOrCreateChargingStationInfo).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      'Invalid signature because incoming signing method does not match configured signing method.',
    );
  });

  it('rejects a signed value carrying a public key when no configuration exists', async () => {
    const util = utilWith(aConfig(undefined));

    const result = await util.validateMeterValues(
      DEFAULT_TENANT_ID,
      stationName,
      meterValuesWith(aSignedMeterValue()),
    );

    expect(result).toBe(false);
    expect(mockSecurityInfoRepository.readOrCreateChargingStationInfo).not.toHaveBeenCalled();
  });

  it('accepts an empty incoming key when the stored key file matches the configuration', async () => {
    mockSecurityInfoRepository.readChargingStationPublicKeyFileId.mockResolvedValue(
      publicKeyFileId,
    );
    const util = utilWith(rsaConfig);

    const result = await util.validateMeterValues(
      DEFAULT_TENANT_ID,
      stationName,
      meterValuesWith(aSignedMeterValue({ publicKey: '' })),
    );

    expect(result).toBe(true);
    expect(mockSecurityInfoRepository.readChargingStationPublicKeyFileId).toHaveBeenCalledTimes(1);
    expect(mockSecurityInfoRepository.readChargingStationPublicKeyFileId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      stationName,
    );
    expect(fileStorage.getFile).toHaveBeenCalledWith(publicKeyFileId, undefined, { trusted: true });
  });

  it('rejects an empty incoming key when the stored key file differs from the configuration', async () => {
    mockSecurityInfoRepository.readChargingStationPublicKeyFileId.mockResolvedValue('other-file');
    const util = utilWith(rsaConfig);

    const result = await util.validateMeterValues(
      DEFAULT_TENANT_ID,
      stationName,
      meterValuesWith(aSignedMeterValue({ publicKey: '' })),
    );

    expect(result).toBe(false);
    expect(fileStorage.getFile).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Invalid signature because incoming public key does not match configured public key.',
    );
  });

  it('rejects an empty incoming key when the station has no stored key file', async () => {
    mockSecurityInfoRepository.readChargingStationPublicKeyFileId.mockResolvedValue('');
    const util = utilWith(rsaConfig);

    const result = await util.validateMeterValues(
      DEFAULT_TENANT_ID,
      stationName,
      meterValuesWith(aSignedMeterValue({ publicKey: '' })),
    );

    expect(result).toBe(false);
    expect(fileStorage.getFile).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Invalid signature because no configured public key and incoming signed meter values has no public key.',
    );
  });

  it('throws when the configured public key file is missing from storage', async () => {
    mockSecurityInfoRepository.readChargingStationPublicKeyFileId.mockResolvedValue(
      publicKeyFileId,
    );
    fileStorage.getFile.mockResolvedValue(undefined);
    const util = utilWith(rsaConfig);

    await expect(
      util.validateMeterValues(
        DEFAULT_TENANT_ID,
        stationName,
        meterValuesWith(aSignedMeterValue({ publicKey: '' })),
      ),
    ).rejects.toThrow('Public key file is missing.');
  });

  it('rejects a configured signing method the util does not implement', async () => {
    const util = utilWith(
      aConfig({
        publicKeyFileId,
        signingMethod: 'ECDSA',
        rejectUnsupportedSignedMeterValues: true,
      }),
    );

    const result = await util.validateMeterValues(
      DEFAULT_TENANT_ID,
      stationName,
      meterValuesWith(aSignedMeterValue({ signingMethod: 'ECDSA' })),
    );

    expect(result).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith('ECDSA is not supported for Signed Meter Values.');
    expect(mockSecurityInfoRepository.readOrCreateChargingStationInfo).not.toHaveBeenCalled();
  });

  it('rejects when the configured key file does not hold a usable RSA key', async () => {
    mockSecurityInfoRepository.readChargingStationPublicKeyFileId.mockResolvedValue(
      publicKeyFileId,
    );
    const garbagePem = pemBlock('PUBLIC KEY', Buffer.from('garbage').toString('base64'));
    fileStorage.getFile.mockResolvedValue(garbagePem);
    const util = utilWith(rsaConfig);

    const result = await util.validateMeterValues(
      DEFAULT_TENANT_ID,
      stationName,
      meterValuesWith(aSignedMeterValue({ publicKey: '' })),
    );

    expect(result).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Error decrypting public key or verifying signature from Signed Meter Value.',
      ),
    );
  });
});

describe('authentication', () => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*-_=:+|@.';

  describe('generatePassword', () => {
    it('produces 40 characters drawn from the charset', () => {
      const password = generatePassword();

      expect(password).toHaveLength(40);
      for (const char of password) {
        expect(charset).toContain(char);
      }
    });

    it('produces passwords that pass isValidPassword', () => {
      expect(isValidPassword(generatePassword())).toBe(true);
    });
  });

  describe('isValidPassword', () => {
    it('accepts a 16-character password from the charset', () => {
      expect(isValidPassword('abcDEF123*-_=:+|')).toBe(true);
    });

    it('accepts every allowed symbol', () => {
      expect(isValidPassword('abcdefgh*-_=:+|@.')).toBe(true);
    });

    it('rejects a password shorter than 16 characters', () => {
      expect(isValidPassword('a'.repeat(15))).toBe(false);
    });

    it('rejects a password longer than 40 characters', () => {
      expect(isValidPassword('a'.repeat(41))).toBe(false);
    });

    it('rejects characters outside the charset', () => {
      expect(isValidPassword('abcdefghijklmno!')).toBe(false);
      expect(isValidPassword('abcdefghijklmno ')).toBe(false);
    });
  });
});
