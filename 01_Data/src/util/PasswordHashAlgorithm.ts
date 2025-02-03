export interface PasswordHashAlgorithm {
  /**
   * Generates a salted hash for a given password.
   * @param password The plain text password.
   * @returns A string containing the salt and hash separated by a colon.
   */
  getSaltedHash(password: string): string;

  /**
   * Validates if an input password matches a stored salted hash.
   * @param storedValue The stored value containing salt and hash separated by a colon.
   * @param inputPassword The input password to validate.
   * @returns A boolean indicating if the password matches.
   */
  isHashMatch(storedValue: string, inputPassword: string): boolean;
}
