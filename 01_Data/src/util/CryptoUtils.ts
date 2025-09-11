// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { Pbkdf2 } from './Pbkdf2';

export class CryptoUtils {
  static passwordHashAlgorithm = new Pbkdf2();

  static getPasswordHash(password: string): string {
    return CryptoUtils.passwordHashAlgorithm.getSaltedHash(password);
  }

  static isPasswordMatch(storedValue: string, inputPassword: string): boolean {
    return CryptoUtils.passwordHashAlgorithm.isHashMatch(storedValue, inputPassword);
  }
}
