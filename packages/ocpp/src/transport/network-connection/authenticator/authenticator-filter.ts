// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { AuthenticationOptions } from '@citrineos/base';
import { IncomingMessage } from 'http';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

export abstract class AuthenticatorFilter {
  protected _logger: Logger<ILogObj>;

  protected constructor(logger?: Logger<ILogObj>) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  protected abstract shouldFilter(options: AuthenticationOptions): boolean;
  protected abstract filter(
    tenantId: number,
    ocppConnectionName: string,
    request: IncomingMessage,
    options?: AuthenticationOptions,
  ): Promise<void>;

  async authenticate(
    tenantId: number,
    ocppConnectionName: string,
    request: IncomingMessage,
    options: AuthenticationOptions,
  ): Promise<void> {
    if (this.shouldFilter(options)) {
      this._logger.debug(`Applying filter for: ${ocppConnectionName}`);
      try {
        await this.filter(tenantId, ocppConnectionName, request, options);
        this._logger.debug(`Filter passed for: ${ocppConnectionName}`);
      } catch (error) {
        this._logger.warn(`Filter failed for: ${ocppConnectionName}`);
        throw error;
      }
    } else {
      this._logger.debug(`Filter skipped for: ${ocppConnectionName}`);
    }
  }
}
