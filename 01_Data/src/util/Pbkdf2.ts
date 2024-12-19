import { PasswordHashAlgorithm } from './PasswordHashAlgorithm';
import { pbkdf2Sync, randomBytes } from 'crypto';

export class Pbkdf2 implements PasswordHashAlgorithm {
  iterations = 1000;
  keyLen = 64;
  digest = 'sha512';

  getSaltedHash(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = this.getHashFromStringWithSalt(password, salt);
    return `PBKDF2:${this.iterations}:${this.keyLen}:${this.digest}:${salt}:${hash}`;
  }

  isHashMatch(storedValue: string, inputPassword: string): boolean {
    const [_algorithm, _iterations, _keyLen, _digest, salt, originalHash] = storedValue.split(':');
    const hash = this.getHashFromStringWithSalt(inputPassword, salt);
    return hash === originalHash;
  }

  getHashFromStringWithSalt(str: string, salt: string): string {
    return pbkdf2Sync(str, salt, this.iterations, this.keyLen, this.digest).toString('hex');
  }
}
