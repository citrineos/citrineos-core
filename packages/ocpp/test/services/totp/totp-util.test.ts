// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TotpUtil } from '@services/totp/totp-util.js';

const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NOW_MS = 1_700_000_000_000;
const SHARED_SECRET = 'mysharedsecret';

function specTotpV1(
  sharedSecret: string,
  validityTime: number,
  totpLength: number,
  timeMs: number,
): string {
  const timeBytes = Buffer.alloc(8);
  timeBytes.writeBigUInt64BE(BigInt(Math.floor(timeMs / 1000 / validityTime)));
  const hash = createHmac('sha256', Buffer.from(sharedSecret, 'utf-8')).update(timeBytes).digest();
  const offset = hash[hash.length - 1] & 0x0f;
  let token = '';
  for (let i = 0; i < totpLength; i++) {
    token += BASE62[hash[(offset + i) % hash.length] % BASE62.length];
  }
  return token;
}

describe('TotpUtil', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW_MS);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generate', () => {
    it.each([
      [SHARED_SECRET, 30, 8, 'Mrc351Gu'],
      [SHARED_SECRET, 300, 10, 'jiphb6DeeG'],
      ['AABBCCDD', 30, 8, 'eAAbSMJ8'],
    ])(
      'matches the C# sample of the spec for secret %s, ValidityTime %i and Length %i',
      (secret, validityTime, length, expected) => {
        expect(TotpUtil.generate(secret, validityTime, length)).toBe(expected);
      },
    );

    it('matches a port of the spec algorithm', () => {
      expect(TotpUtil.generate(SHARED_SECRET, 45, 12)).toBe(
        specTotpV1(SHARED_SECRET, 45, 12, NOW_MS),
      );
    });
  });

  describe('validate', () => {
    it.each([
      ['the previous', 'XI92DWtM'],
      ['the current', 'Mrc351Gu'],
      ['the next', 'e1cMer4s'],
    ])('accepts the token of %s interval', (_label, token) => {
      expect(TotpUtil.validate(SHARED_SECRET, token, 30, 8)).toBe(true);
    });

    it.each([
      ['two intervals before', '96y3Rjq0'],
      ['two intervals after', 'OV9ZAtfs'],
    ])('rejects the token of %s', (_label, token) => {
      expect(TotpUtil.validate(SHARED_SECRET, token, 30, 8)).toBe(false);
    });

    it('measures the interval in ValidityTime seconds', () => {
      const token = specTotpV1(SHARED_SECRET, 300, 8, NOW_MS - 300_000);

      expect(TotpUtil.validate(SHARED_SECRET, token, 300, 8)).toBe(true);
    });

    it('rejects a token computed with another secret', () => {
      const token = specTotpV1('anothersecret', 30, 8, NOW_MS);

      expect(TotpUtil.validate(SHARED_SECRET, token, 30, 8)).toBe(false);
    });

    it('rejects an empty token', () => {
      expect(TotpUtil.validate(SHARED_SECRET, '', 30, 8)).toBe(false);
    });
  });
});
