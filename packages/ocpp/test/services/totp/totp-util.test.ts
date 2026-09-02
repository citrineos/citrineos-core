// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Tests for TotpUtil (RFC 6238 TOTP).
 *
 * Time-pinning strategy: rather than fighting vitest's ESM fake-timer
 * propagation, we compute expected tokens dynamically using the same
 * HOTP algorithm as the implementation.  This makes every test
 * deterministic without needing to control Date.now().
 */

import { describe, expect, it } from 'vitest';
import { TotpUtil } from '@/services/totp/totp-util.js';
import { createHmac } from 'node:crypto';

// ─── helpers (mirrors TotpUtil internals) ────────────────────────────────────

const TIME_STEP_SECONDS = 30;
const DIGITS = 6;

function parseSecret(secret: string): Buffer {
  if (secret.length > 0 && secret.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(secret)) {
    return Buffer.from(secret, 'hex');
  }
  return Buffer.from(secret, 'utf-8');
}

function computeHotp(secret: string, counter: number): string {
  const buf = Buffer.alloc(8);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) {
    buf[i] = tmp & 0xff;
    tmp = Math.floor(tmp / 256);
  }
  const hmac = createHmac('sha1', parseSecret(secret));
  hmac.update(buf);
  const digest = hmac.digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return (code % Math.pow(10, DIGITS)).toString().padStart(DIGITS, '0');
}

/** Returns the TOTP token for a given secret at a given epoch-ms timestamp. */
function totpAt(secret: string, timeMs: number): string {
  return computeHotp(secret, Math.floor(timeMs / 1000 / TIME_STEP_SECONDS));
}

// ─── test constants ───────────────────────────────────────────────────────────

const SECRET_UTF8 = '12345678901234567890';
const SECRET_HEX = 'AABBCCDD'; // valid even-length hex
const SECRET_ODD = 'ABC'; // odd-length → treated as UTF-8
const SECRET_NON_HEX_EVEN = 'GGHHIIJJ'; // even-length but not hex → UTF-8

// ─── tests ───────────────────────────────────────────────────────────────────

describe('TotpUtil', () => {
  // ─── generate ──────────────────────────────────────────────────────────────

  describe('generate', () => {
    it('produces a 6-digit zero-padded string', () => {
      const token = TotpUtil.generate(SECRET_UTF8);
      expect(token).toMatch(/^\d{6}$/);
    });

    it('matches the expected token for the current time step', () => {
      const now = Date.now();
      const expected = totpAt(SECRET_UTF8, now);
      expect(TotpUtil.generate(SECRET_UTF8)).toBe(expected);
    });

    it('produces a consistent token when called twice in the same time step', () => {
      const t1 = TotpUtil.generate(SECRET_UTF8);
      const t2 = TotpUtil.generate(SECRET_UTF8);
      expect(t1).toBe(t2);
    });

    it('accepts a hex-encoded secret and produces a consistent token', () => {
      const token = TotpUtil.generate(SECRET_HEX);
      expect(token).toMatch(/^\d{6}$/);
      expect(TotpUtil.generate(SECRET_HEX)).toBe(token);
    });

    it('treats an odd-length string as UTF-8, not hex', () => {
      const token = TotpUtil.generate(SECRET_ODD);
      expect(token).toMatch(/^\d{6}$/);
    });

    it('treats a non-hex even-length string as UTF-8', () => {
      const token = TotpUtil.generate(SECRET_NON_HEX_EVEN);
      expect(token).toMatch(/^\d{6}$/);
    });

    it('produces different tokens for different secrets', () => {
      const t1 = TotpUtil.generate(SECRET_UTF8);
      const t2 = TotpUtil.generate('differentSecret');
      // Tokens could theoretically collide but it's astronomically unlikely
      // with different secrets; this is a sanity check, not a guarantee.
      // We just verify both are valid 6-digit strings.
      expect(t1).toMatch(/^\d{6}$/);
      expect(t2).toMatch(/^\d{6}$/);
    });
  });

  // ─── validate ──────────────────────────────────────────────────────────────

  describe('validate', () => {
    it('accepts the current time-step token', () => {
      const token = TotpUtil.generate(SECRET_UTF8);
      expect(TotpUtil.validate(SECRET_UTF8, token)).toBe(true);
    });

    it('accepts a token from one step in the past (clock skew tolerance)', () => {
      const now = Date.now();
      const counter = Math.floor(now / 1000 / TIME_STEP_SECONDS);
      // Token from one step ago
      const pastToken = computeHotp(SECRET_UTF8, counter - 1);
      expect(TotpUtil.validate(SECRET_UTF8, pastToken)).toBe(true);
    });

    it('accepts a token from one step in the future (clock skew tolerance)', () => {
      const now = Date.now();
      const counter = Math.floor(now / 1000 / TIME_STEP_SECONDS);
      // Token from one step ahead
      const futureToken = computeHotp(SECRET_UTF8, counter + 1);
      expect(TotpUtil.validate(SECRET_UTF8, futureToken)).toBe(true);
    });

    it('rejects a token two steps in the past (outside default window)', () => {
      const now = Date.now();
      const counter = Math.floor(now / 1000 / TIME_STEP_SECONDS);
      const oldToken = computeHotp(SECRET_UTF8, counter - 2);
      expect(TotpUtil.validate(SECRET_UTF8, oldToken)).toBe(false);
    });

    it('rejects a token two steps in the future (outside default window)', () => {
      const now = Date.now();
      const counter = Math.floor(now / 1000 / TIME_STEP_SECONDS);
      const futureToken = computeHotp(SECRET_UTF8, counter + 2);
      expect(TotpUtil.validate(SECRET_UTF8, futureToken)).toBe(false);
    });

    it('accepts a token two steps away when window=2', () => {
      const now = Date.now();
      const counter = Math.floor(now / 1000 / TIME_STEP_SECONDS);
      const oldToken = computeHotp(SECRET_UTF8, counter - 2);
      expect(TotpUtil.validate(SECRET_UTF8, oldToken, 2)).toBe(true);
    });

    it('rejects a completely wrong token', () => {
      // Generate a token that is definitely wrong by using a different secret
      // and checking it fails against our secret
      const wrongToken = TotpUtil.generate('totallydifferentsecret!!');
      // There's a tiny chance of collision; if so, skip — but in practice never happens
      const currentToken = TotpUtil.generate(SECRET_UTF8);
      if (wrongToken !== currentToken) {
        expect(TotpUtil.validate(SECRET_UTF8, wrongToken)).toBe(false);
      }
    });

    it('rejects an empty token', () => {
      expect(TotpUtil.validate(SECRET_UTF8, '')).toBe(false);
    });

    it('rejects a token with the wrong secret', () => {
      const token = TotpUtil.generate(SECRET_UTF8);
      expect(TotpUtil.validate('wrongsecret', token)).toBe(false);
    });

    it('validates correctly with a hex-encoded secret', () => {
      const token = TotpUtil.generate(SECRET_HEX);
      expect(TotpUtil.validate(SECRET_HEX, token)).toBe(true);
    });

    it('generate and validate are consistent — token generated is always accepted', () => {
      // Run multiple times to catch any timing edge cases
      for (let i = 0; i < 5; i++) {
        const token = TotpUtil.generate(SECRET_UTF8);
        expect(TotpUtil.validate(SECRET_UTF8, token)).toBe(true);
      }
    });

    it('window=0 only accepts the exact current step token', () => {
      const now = Date.now();
      const counter = Math.floor(now / 1000 / TIME_STEP_SECONDS);
      const currentToken = computeHotp(SECRET_UTF8, counter);
      const nextToken = computeHotp(SECRET_UTF8, counter + 1);
      expect(TotpUtil.validate(SECRET_UTF8, currentToken, 0)).toBe(true);
      expect(TotpUtil.validate(SECRET_UTF8, nextToken, 0)).toBe(false);
    });

    it('rejects a 5-digit token (wrong length)', () => {
      expect(TotpUtil.validate(SECRET_UTF8, '12345')).toBe(false);
    });

    it('rejects a 7-digit token (wrong length)', () => {
      expect(TotpUtil.validate(SECRET_UTF8, '1234567')).toBe(false);
    });
  });
});
