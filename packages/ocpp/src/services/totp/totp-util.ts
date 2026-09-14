// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { createHmac } from 'node:crypto';

const TIME_STEP_SECONDS = 30;
const DIGITS = 6;

/**
 * Computes an HOTP (HMAC-based One-Time Password) for the given counter value.
 * Implements RFC 4226.
 */
function computeHotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) {
    buf[i] = tmp & 0xff;
    tmp = Math.floor(tmp / 256);
  }

  const hmac = createHmac('sha1', secret);
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

/**
 * Parses a shared secret string into a Buffer.
 * Supports hex-encoded secrets (e.g. "AABBCCDD") and raw UTF-8 strings.
 */
function parseSecret(secret: string): Buffer {
  // If the string is a non-empty even-length hex string, decode it as hex
  if (secret.length > 0 && secret.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(secret)) {
    return Buffer.from(secret, 'hex');
  }
  return Buffer.from(secret, 'utf-8');
}

/**
 * TOTP (Time-based One-Time Password) utility implementing RFC 6238.
 *
 * Used in C25 QR-code web payment to validate the TOTP embedded in the QR URL.
 * The shared secret is stored in the WebPaymentsCtrlr.SharedSecret device model attribute.
 *
 * Secret encoding: if the attribute value is a non-empty, even-length hex string it is
 * decoded from hex; otherwise it is treated as a raw UTF-8 string.
 */
export class TotpUtil {
  /**
   * Generates the current TOTP token for the given shared secret.
   * Useful for testing and for the charging station side URL generation.
   *
   * @param secret - Shared secret (hex-encoded or raw UTF-8)
   * @returns 6-digit zero-padded TOTP string
   */
  static generate(secret: string): string {
    const secretBuf = parseSecret(secret);
    const counter = Math.floor(Date.now() / 1000 / TIME_STEP_SECONDS);
    return computeHotp(secretBuf, counter);
  }

  /**
   * Validates a TOTP token against the shared secret.
   * Accepts a ±window of time steps to accommodate clock skew between CSMS and CS.
   *
   * C25.FR.07: CSMS SHALL validate the TOTP in the QR URL.
   * C25.FR.08: If TOTP validation fails, CSMS SHALL NOT authorize or forward to PSP.
   * C25.FR.09: If TOTP validation fails, CSMS SHALL NOT start a transaction.
   *
   * @param secret - Shared secret (hex-encoded or raw UTF-8)
   * @param token - The TOTP token from the QR URL to validate
   * @param window - Number of time steps before/after current step to accept (default 1)
   * @returns true if the token is valid within the window
   */
  static validate(secret: string, token: string, window = 1): boolean {
    const secretBuf = parseSecret(secret);
    const counter = Math.floor(Date.now() / 1000 / TIME_STEP_SECONDS);
    for (let i = -window; i <= window; i++) {
      if (computeHotp(secretBuf, counter + i) === token) {
        return true;
      }
    }
    return false;
  }
}
