// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { generateKeyPairSync, type KeyObject, randomUUID } from 'crypto';

export const DEV_ISSUER = 'citrineos-local-dev';

export class DevKeyPair {
  readonly keyId = randomUUID();
  readonly privateKey: KeyObject;
  readonly publicKey: KeyObject;

  constructor() {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }
}
