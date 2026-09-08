// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { LocalStorage } from '@/config/index.js';
import type { IFileStorage } from '@citrineos/base';
import type { WebsocketServerConfig } from '@citrineos/types';
import * as https from 'https';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

export class TlsCredentialManager {
  private _credentialsPromise: Promise<{ key: Buffer; cert: Buffer; ca?: Buffer }>;
  private config: WebsocketServerConfig;
  private _fileStorage: IFileStorage;
  protected _logger: Logger<ILogObj>;

  constructor(config: WebsocketServerConfig, fileStorage: IFileStorage, logger?: Logger<ILogObj>) {
    this.config = config;
    this._fileStorage = fileStorage;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
    this._credentialsPromise = this._readFromStorage();
  }

  async reload(): Promise<void> {
    this._credentialsPromise = this._readFromStorage();
    await this._credentialsPromise;
    this._logger.info('TLS credentials reloaded from storage');
  }

  /*
   * Loads TLS credentials from storage. If all required cert files exist in the configured
   * file storage, they are loaded from there. Otherwise, falls back to a local
   * storage that resolves files directly by their configured paths, i.e., read from disk.
   */
  private async _readFromStorage(): Promise<{ key: Buffer; cert: Buffer; ca?: Buffer }> {
    const requiredPaths = [
      this.config.tlsKeyFilePath as string,
      this.config.tlsCertificateChainFilePath as string,
      ...(this.config.rootCACertificateFilePath ? [this.config.rootCACertificateFilePath] : []),
    ];

    const existResults = await Promise.all(
      requiredPaths.map((p) => this._fileStorage.exists(p, undefined, { trusted: true })),
    );
    const allExistInFileStorage = existResults.every(Boolean);

    if (allExistInFileStorage) {
      this._logger.debug('Loading TLS credentials from configured file storage');
    } else {
      this._logger.debug(
        'Not all TLS cert files found in configured file storage, falling back to direct path lookup',
      );
    }

    const storage: IFileStorage = allExistInFileStorage ? this._fileStorage : new LocalStorage('');

    const keyStr = await storage.getFile(this.config.tlsKeyFilePath as string, undefined, {
      trusted: true,
    });
    if (!keyStr) {
      throw new Error(`TLS key file not found: ${this.config.tlsKeyFilePath}`);
    }
    const certStr = await storage.getFile(
      this.config.tlsCertificateChainFilePath as string,
      undefined,
      { trusted: true },
    );
    if (!certStr) {
      throw new Error(
        `TLS certificate chain file not found: ${this.config.tlsCertificateChainFilePath}`,
      );
    }
    const creds: { key: Buffer; cert: Buffer; ca?: Buffer } = {
      key: Buffer.from(keyStr),
      cert: Buffer.from(certStr),
    };
    if (this.config.rootCACertificateFilePath) {
      const caStr = await storage.getFile(this.config.rootCACertificateFilePath, undefined, {
        trusted: true,
      });
      if (caStr) {
        creds.ca = Buffer.from(caStr);
      }
    }
    return creds;
  }

  async getServerOptions(config: WebsocketServerConfig): Promise<https.ServerOptions> {
    const credentials = await this._credentialsPromise;
    return {
      ...credentials,
      requestCert: config.securityProfile > 2,
      rejectUnauthorized: config.securityProfile > 2,
    };
  }
}
