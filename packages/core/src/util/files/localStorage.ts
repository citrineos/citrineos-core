// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import path from 'path';
import type { ConfigStore, SystemConfig } from '@citrineos/base';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

export class LocalStorage implements ConfigStore {
  protected readonly _logger: Logger<ILogObj>;
  private defaultRoot: string;
  private configFileName: string;
  private configDir: string | undefined;

  constructor(
    defaultRoot: string,
    configFileName: string,
    configDir?: string,
    logger?: Logger<ILogObj>,
  ) {
    this.defaultRoot = defaultRoot;
    this.configFileName = configFileName;
    this.configDir = configDir;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Writes content to the resolved path, creating any missing parent directories automatically.
   * @param key File name or relative path.
   * @param content File content as a Buffer.
   * @param bucket Optional directory override; defaults to `defaultRoot`.
   *
   * @returns The key used to store the file.
   */
  async saveFile(key: string, content: Buffer, bucket?: string): Promise<string> {
    const absolutePath = this._resolvePath(key, bucket);
    this._logger.debug(`Saving file to ${absolutePath}`);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content, 'utf-8');
    return key;
  }

  /**
   * Reads the file at the resolved path and returns its content as a UTF-8 string.
   * @param key File name or relative path.
   * @param bucket Optional directory override; defaults to `defaultRoot`.
   *
   * @returns File content, or undefined if the path does not exist.
   */
  async getFile(key: string, bucket?: string): Promise<string | undefined> {
    const absolutePath = this._resolvePath(key, bucket);
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
   *
   * @returns True if the path exists.
   */
  async exists(key: string, bucket?: string): Promise<boolean> {
    const absolutePath = this._resolvePath(key, bucket);
    this._logger.debug(`Checking existence of ${absolutePath}`);
    return fs.existsSync(absolutePath);
  }

  /**
   * Creates a directory at the resolved path.
   * @param key Directory path.
   * @param bucket Optional directory override; defaults to `defaultRoot`.
   * @param options Pass `{ recursive: true }` to create all missing parent directories.
   */
  async createDirectory(
    key: string,
    bucket?: string,
    options?: { recursive?: boolean },
  ): Promise<void> {
    const absolutePath = this._resolvePath(key, bucket);
    this._logger.debug(`Creating directory ${absolutePath}`);
    fs.mkdirSync(absolutePath, options);
  }

  /**
   * Deletes a file or directory at the resolved path.
   * @param key File or directory path.
   * @param bucket Optional directory override; defaults to `defaultRoot`.
   * @param options Pass `{ recursive: true }` to remove a directory tree; `{ force: true }` to suppress not-found errors.
   */
  async deleteFile(
    key: string,
    bucket?: string,
    options?: { recursive?: boolean; force?: boolean },
  ): Promise<void> {
    const absolutePath = this._resolvePath(key, bucket);
    this._logger.debug(`Deleting ${absolutePath}`);
    fs.rmSync(absolutePath, options);
  }

  async fetchConfig(): Promise<SystemConfig | null> {
    try {
      const configString = await this.getFile(this.configFileName, this.configDir);
      if (!configString) return null;
      return JSON.parse(configString) as SystemConfig;
    } catch (error) {
      this._logger.error('Error fetching config from local storage:', error);
      return null;
    }
  }

  async saveConfig(config: SystemConfig): Promise<void> {
    try {
      await this.saveFile(
        this.configFileName,
        Buffer.from(JSON.stringify(config, null, 2)),
        this.configDir,
      );
      this._logger.info('Config saved locally.');
    } catch (error) {
      this._logger.error('Error saving config to local storage:', error);
    }
  }

  /**
   * Resolves a key to an absolute filesystem path.
   * - Absolute keys are used as-is (bypass root entirely).
   * - Relative keys are joined with bucket (or defaultRoot) after normalizing
   *   forward slashes to the OS-native separator for cross-platform compatibility.
   */
  private _resolvePath(key: string, bucket?: string): string {
    if (path.isAbsolute(key)) return key;
    const normalized = key.split('/').join(path.sep);
    return path.resolve(process.cwd(), bucket ?? this.defaultRoot, normalized);
  }
}
