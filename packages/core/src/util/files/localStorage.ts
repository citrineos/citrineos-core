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
  private defaultFilePath: string;
  private configFileName: string;
  private configDir: string | undefined;

  constructor(
    defaultFilePath: string,
    configFileName: string,
    configDir?: string,
    logger?: Logger<ILogObj>,
  ) {
    this.defaultFilePath = defaultFilePath;
    this.configFileName = configFileName;
    this.configDir = configDir;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async saveFile(fileId: string, content: Buffer): Promise<string> {
    const absolutePath = this._resolvePath(fileId);
    this._logger.debug(`Saving file to ${absolutePath}`);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content, 'utf-8');
    return fileId;
  }

  async getFile(fileId: string): Promise<string | undefined> {
    const absolutePath = this._resolvePath(fileId);
    this._logger.debug(`Getting file from ${absolutePath}`);
    if (!fs.existsSync(absolutePath)) {
      return;
    }
    return fs.readFileSync(absolutePath, 'utf-8');
  }

  async exists(fileId: string): Promise<boolean> {
    const absolutePath = this._resolvePath(fileId);
    this._logger.debug(`Checking existence of ${absolutePath}`);
    return fs.existsSync(absolutePath);
  }

  async createDirectory(fileId: string, options?: { recursive?: boolean }): Promise<void> {
    const absolutePath = this._resolvePath(fileId);
    this._logger.debug(`Creating directory ${absolutePath}`);
    fs.mkdirSync(absolutePath, options);
  }

  async deleteFile(
    fileId: string,
    options?: { recursive?: boolean; force?: boolean },
  ): Promise<void> {
    const absolutePath = this._resolvePath(fileId);
    this._logger.debug(`Deleting ${absolutePath}`);
    fs.rmSync(absolutePath, options);
  }

  async fetchConfig(): Promise<SystemConfig | null> {
    try {
      const filePath = this._configFilePath();
      if (!fs.existsSync(filePath)) return null;
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as SystemConfig;
    } catch (error) {
      this._logger.error('Error fetching config from local storage:', error);
      return null;
    }
  }

  async saveConfig(config: SystemConfig): Promise<void> {
    try {
      const filePath = this._configFilePath();
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
      this._logger.info('Config saved locally.');
    } catch (error) {
      this._logger.error('Error saving config to local storage:', error);
    }
  }

  private _configFilePath(): string {
    const dir = this.configDir
      ? path.resolve(this.configDir)
      : path.resolve(process.cwd(), this.defaultFilePath);
    return path.join(dir, this.configFileName);
  }

  private _resolvePath(fileId: string): string {
    return path.resolve(process.cwd(), this.defaultFilePath, fileId);
  }
}
