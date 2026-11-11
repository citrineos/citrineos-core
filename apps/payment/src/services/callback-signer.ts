// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Signs the remote-start callback URL handed to Core. The checkout's public id alone is not enough:
 * the driver holds it too, and a forged "Rejected" would cancel their own payment hold.
 */
export class CallbackSigner {
  constructor(private readonly _secret: string) {}

  sign(checkoutPublicId: string): string {
    return createHmac('sha256', this._secret).update(checkoutPublicId).digest('base64url');
  }

  verify(checkoutPublicId: string, signature: string): boolean {
    const expected = Buffer.from(this.sign(checkoutPublicId));
    const given = Buffer.from(signature);
    return expected.length === given.length && timingSafeEqual(expected, given);
  }
}
