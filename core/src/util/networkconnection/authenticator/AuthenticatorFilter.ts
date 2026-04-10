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
    stationId: string,
    request: IncomingMessage,
    options?: AuthenticationOptions,
  ): Promise<void>;

  async authenticate(
    tenantId: number,
    stationId: string,
    request: IncomingMessage,
    options: AuthenticationOptions,
  ): Promise<void> {
    if (this.shouldFilter(options)) {
      this._logger.debug(`Applying filter for: ${stationId}`);
      try {
        await this.filter(tenantId, stationId, request, options);
        this._logger.debug(`Filter passed for: ${stationId}`);
      } catch (error) {
        this._logger.warn(`Filter failed for: ${stationId}`);
        throw error;
      }
    } else {
      this._logger.debug(`Filter skipped for: ${stationId}`);
    }
  }
}
