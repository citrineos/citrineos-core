// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { createHmac } from 'node:crypto';

const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function computeTotpV1(secret: string, timeInterval: number, length: number): string {
  const timeBytes = Buffer.alloc(8);
  timeBytes.writeBigUInt64BE(BigInt(timeInterval));

  const hash = createHmac('sha256', Buffer.from(secret, 'utf-8')).update(timeBytes).digest();

  const offset = hash[hash.length - 1] & 0x0f;
  let token = '';
  for (let i = 0; i < length; i++) {
    token += BASE62[hash[(offset + i) % hash.length] % BASE62.length];
  }
  return token;
}

function currentTimeInterval(validityTime: number): number {
  return Math.floor(Date.now() / 1000 / validityTime);
}

/**
 * TOTP (Time-based One-Time Password) utility implementing "TOTP algorithm, version 1" of
 * OCPP 2.1 use case C25.
 *
 * Used in C25 QR-code web payment to validate the TOTP embedded in the QR URL.
 * The shared secret, validity time and length are the WebPaymentsCtrlr.SharedSecret,
 * ValidityTime and Length device model attributes. The shared secret is used as UTF-8 bytes.
 */
export class TotpUtil {
  /**
   * Generates the TOTP token for the current time interval.
   * Useful for testing and for the charging station side URL generation.
   *
   * @param secret - Shared secret
   * @param validityTime - Validity of a token in seconds
   * @param length - Number of characters in the token
   * @returns TOTP token of `length` base62 characters
   */
  static generate(secret: string, validityTime: number, length: number): string {
    return computeTotpV1(secret, currentTimeInterval(validityTime), length);
  }

  /**
   * Validates a TOTP token against the tokens of the current, previous and next time interval.
   *
   * C25.FR.07: CSMS SHALL validate the TOTP in the QR URL.
   * C25.FR.08: If TOTP validation fails, CSMS SHALL NOT authorize or forward to PSP.
   * C25.FR.09: If TOTP validation fails, CSMS SHALL NOT start a transaction.
   *
   * @param secret - Shared secret
   * @param token - The TOTP token from the QR URL to validate
   * @param validityTime - Validity of a token in seconds
   * @param length - Number of characters in the token
   * @returns true if the token matches one of the three intervals
   */
  static validate(secret: string, token: string, validityTime: number, length: number): boolean {
    const timeInterval = currentTimeInterval(validityTime);
    for (let i = -1; i <= 1; i++) {
      if (computeTotpV1(secret, timeInterval + i, length) === token) {
        return true;
      }
    }
    return false;
  }
}
