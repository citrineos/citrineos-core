// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  CreateDirectoryOptions,
  DeleteFileOptions,
  IFileStorage,
  TrustOptions,
} from '@citrineos/base';
import fs from 'fs';
import path from 'path';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

export class LocalStorage implements IFileStorage {
  protected readonly _logger: Logger<ILogObj>;
  private defaultRoot: string;

  constructor(defaultRoot: string, logger?: Logger<ILogObj>) {
    this.defaultRoot = defaultRoot;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Writes content to the resolved path, creating any missing parent directories automatically.
   * @param key File name or relative path.
   * @param content File content as a Buffer.
   * @param bucket Optional directory override; defaults to `defaultRoot`.
   * @param options Pass `{ trusted: true }` for trusted, config-driven paths that may be absolute or
   *   outside the storage root; untrusted keys are validated with {@link _validatePath}.
   *
   * @returns The key used to store the file.
   */
  async saveFile(
    key: string,
    content: Buffer,
    bucket?: string,
    options?: TrustOptions,
  ): Promise<string> {
    const absolutePath = this._resolvePath(key, bucket, options?.trusted);
    this._logger.debug(`Saving file to ${absolutePath}`);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content, 'utf-8');
    return key;
  }

  /**
   * Reads the file at the resolved path and returns its content as a UTF-8 string.
   * @param key File name or relative path.
   * @param bucket Optional directory override; defaults to `defaultRoot`.
   * @param options Pass `{ trusted: true }` for trusted, config-driven paths that may be absolute or
   *   outside the storage root; untrusted keys are validated with {@link _validatePath}.
   *
   * @returns File content, or undefined if the path does not exist.
   */
  async getFile(key: string, bucket?: string, options?: TrustOptions): Promise<string | undefined> {
    const absolutePath = this._resolvePath(key, bucket, options?.trusted);
    this._logger.debug(`Getting file from ${absolutePath}`);
    if (!fs.existsSync(absolutePath)) {
      return;
    }
    return fs.readFileSync(absolutePath, 'utf-8');
  }

  /**
   * Checks whether the resolved path exists on the filesystem.
   * @param key File name or relative path.
   * @param bucket Optional directory override; defaults to `defaultRoot`.
   * @param options Pass `{ trusted: true }` for trusted, config-driven paths that may be absolute or
   *   outside the storage root; untrusted keys are validated with {@link _validatePath}.
   *
   * @returns True if the path exists.
   */
  async exists(key: string, bucket?: string, options?: TrustOptions): Promise<boolean> {
    const absolutePath = this._resolvePath(key, bucket, options?.trusted);
    this._logger.debug(`Checking existence of ${absolutePath}`);
    return fs.existsSync(absolutePath);
  }

  /**
   * Creates a directory at the resolved path.
   * @param key Directory path.
   * @param bucket Optional directory override; defaults to `defaultRoot`.
   * @param options Pass `{ recursive: true }` to create all missing parent directories; `{ trusted: true }`
   *   for trusted, config-driven paths that may be absolute or outside the storage root; untrusted keys
   *   are validated with {@link _validatePath}.
   */
  async createDirectory(
    key: string,
    bucket?: string,
    options?: CreateDirectoryOptions,
  ): Promise<void> {
    const absolutePath = this._resolvePath(key, bucket, options?.trusted);
    this._logger.debug(`Creating directory ${absolutePath}`);
    fs.mkdirSync(absolutePath, { recursive: options?.recursive });
  }

  /**
   * Deletes a file or directory at the resolved path.
   * @param key File or directory path.
   * @param bucket Optional directory override; defaults to `defaultRoot`.
   * @param options Pass `{ recursive: true }` to remove a directory tree; `{ force: true }` to suppress
   *   not-found errors; `{ trusted: true }` for trusted, config-driven paths that may be absolute or
   *   outside the storage root; untrusted keys are validated with {@link _validatePath}.
   */
  async deleteFile(key: string, bucket?: string, options?: DeleteFileOptions): Promise<void> {
    const absolutePath = this._resolvePath(key, bucket, options?.trusted);
    this._logger.debug(`Deleting ${absolutePath}`);
    fs.rmSync(absolutePath, { recursive: options?.recursive, force: options?.force });
  }

  /**
   * Validates a caller-supplied key so untrusted input cannot escape the storage root.
   *
   * Applied for every non-trusted call. Rejects NUL bytes, absolute paths
   * (POSIX, Windows drive-letter, and UNC), and any parent-directory (`..`) traversal segment.
   * Throws on failure; returns void when the key is safe.
   */
  private _validatePath(key: string): void {
    // NUL bytes can truncate a path string in lower-level layers letting a value that passed our checks resolve to a different file than intended.
    // Technically this is guarded against by Node but the storage backends could be vulnerable.
    // Rejecting this at the boundary so every storage backend fails predictably instead of relying on each one to handle NUL safely
    if (key.includes('\0')) {
      throw new Error('Invalid filePath: contains a NUL byte');
    }
    // Reject Windows drive-letter and network ("\\host") absolute paths
    if (/^[a-zA-Z]:[\\/]/.test(key) || key.startsWith('\\\\')) {
      throw new Error(`Invalid filePath "${key}": absolute paths are not allowed`);
    }
    // Reject Linux style absolute paths and any leading separator.
    if (path.isAbsolute(key) || key.startsWith('/') || key.startsWith('\\')) {
      throw new Error(`Invalid filePath "${key}": absolute paths are not allowed`);
    }
    // Reject any parent-directory traversal, splitting on both separators.
    if (key.split(/[\\/]+/).some((segment) => segment === '..')) {
      throw new Error(
        `Invalid filePath "${key}": parent directory traversal ("..") is not allowed`,
      );
    }
  }

  /**
   * Resolves a key to an absolute filesystem path.
   * - Untrusted keys are validated by {@link _validatePath}
   * - Trusted keys skip validation: absolute keys are used as-is (bypass root
   *   entirely) and relative keys are joined with bucket (or defaultRoot). Use only for internal,
   *   config-driven paths.
   */
  private _resolvePath(key: string, bucket?: string, trusted = false): string {
    if (!trusted) {
      this._validatePath(key);
    }
    if (path.isAbsolute(key)) return key;
    const normalized = key.split('/').join(path.sep);
    return path.resolve(process.cwd(), bucket ?? this.defaultRoot, normalized);
  }
}
