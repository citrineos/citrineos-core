import { pbkdf2Sync, randomBytes } from 'crypto';

export class CryptoUtils {
  static iterations = 1000;
  static keyLen = 64;
  static digest = 'sha512';
  /**
   * Generates a salted hash for a given password.
   * @param password The plain text password.
   * @returns A string containing the salt and hash separated by a colon.
   */
  static getSaltedHash(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = CryptoUtils.getHashFromStringWithSalt(password, salt);
    return `PBKDF2:${CryptoUtils.iterations}:${salt}:${hash}`;
  }

  /**
   * Validates if an input password matches a stored salted hash.
   * @param storedValue The stored value containing salt and hash separated by a colon.
   * @param inputPassword The input password to validate.
   * @returns A boolean indicating if the password matches.
   */
  static isHashMatch(storedValue: string, inputPassword: string): boolean {
    const [_algorithm, _iterations, salt, originalHash] = storedValue.split(':');
    const hash = CryptoUtils.getHashFromStringWithSalt(inputPassword, salt);
    return hash === originalHash;
  }

  /**
   * Generates a hash from a given string and salt using the PBKDF2 algorithm.
   *
   * @param str - The input string to hash.
   * @param salt - The salt to combine with the input string for hashing.
   * @returns The resulting hash as a hexadecimal string.
   */
  static getHashFromStringWithSalt(str: string, salt: string): string {
    return pbkdf2Sync(str, salt, CryptoUtils.iterations, CryptoUtils.keyLen, CryptoUtils.digest).toString('hex');
  }
}
