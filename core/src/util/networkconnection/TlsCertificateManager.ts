// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { WebsocketServerConfig } from '@citrineos/base';
import fs from 'fs';
import * as https from 'https';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

export class TlsCredentialManager {
  private credentials: { key: Buffer; cert: Buffer; ca?: Buffer };
  private config: WebsocketServerConfig;
  protected _logger: Logger<ILogObj>;

  constructor(config: WebsocketServerConfig, logger?: Logger<ILogObj>) {
    this.config = config;
    this.credentials = this.readFromDisk();
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  public reload() {
    this.credentials = this.readFromDisk();
    this._logger.info('TLS credentials reloaded from disk');
  }

  private readFromDisk() {
    const creds: { key: Buffer; cert: Buffer; ca?: Buffer } = {
      key: fs.readFileSync(this.config.tlsKeyFilePath as string),
      cert: fs.readFileSync(this.config.tlsCertificateChainFilePath as string),
    };
    if (this.config.rootCACertificateFilePath) {
      creds.ca = fs.readFileSync(this.config.rootCACertificateFilePath as string);
    }
    return creds;
  }

  getServerOptions(config: WebsocketServerConfig): https.ServerOptions {
    return {
      ...this.credentials,
      requestCert: config.securityProfile > 2,
      rejectUnauthorized: config.securityProfile > 2,
    };
  }
}
