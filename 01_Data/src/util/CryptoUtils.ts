import { Pbkdf2 } from './Pbkdf2.js';

export class CryptoUtils {
  static passwordHashAlgorithm = new Pbkdf2();

  static getPasswordHash(password: string): string {
    return CryptoUtils.passwordHashAlgorithm.getSaltedHash(password);
  }

  static isPasswordMatch(storedValue: string, inputPassword: string): boolean {
    return CryptoUtils.passwordHashAlgorithm.isHashMatch(storedValue, inputPassword);
  }
}
