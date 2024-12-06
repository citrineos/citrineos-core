import { pbkdf2Sync, randomBytes } from 'crypto';

export class CryptoUtils {
  /**
   * Generates a salted hash for a given password.
   * @param password The plain text password.
   * @returns A string containing the salt and hash separated by a colon.
   */
  static getSaltedHash(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Validates if an input password matches a stored salted hash.
   * @param storedValue The stored value containing salt and hash separated by a colon.
   * @param inputPassword The input password to validate.
   * @returns A boolean indicating if the password matches.
   */
  static isHashMatch(storedValue: string, inputPassword: string): boolean {
    const [salt, originalHash] = storedValue.split(':');
    const hash = pbkdf2Sync(inputPassword, salt, 1000, 64, 'sha512').toString('hex');
    return hash === originalHash;
  }
}
