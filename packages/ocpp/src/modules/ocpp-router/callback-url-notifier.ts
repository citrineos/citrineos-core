// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { AbstractModule, type ICache } from '@citrineos/base';
import type { SystemConfig } from '@citrineos/types';
import { OidcTokenProvider } from '@/apis/index.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

/**
 * Completes an API command: when a caller supplied a callback URL with a request, this POSTs the
 * station's answer back to it.
 */
export class CallbackUrlNotifier {
  private readonly _cache: ICache;
  private readonly _logger: Logger<ILogObj>;
  private readonly _oidcTokenProvider?: OidcTokenProvider;

  constructor({
    cache,
    config,
    logger,
  }: {
    cache: ICache;
    config?: SystemConfig;
    logger?: Logger<ILogObj>;
  }) {
    this._cache = cache;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    if (config?.oidcClient) {
      this._oidcTokenProvider = new OidcTokenProvider(config.oidcClient, this._logger);
    }
  }

  async notify(correlationId: string, ocppConnectionName: string, payload: any): Promise<void> {
    const url: string | null = await this._cache.get(
      correlationId,
      AbstractModule.CALLBACK_URL_CACHE_PREFIX + ocppConnectionName,
    );
    if (!url) return;

    this._logger.debug(`Sending callback to ${url} for correlationId: ${correlationId}`);

    const headers: { [key: string]: string } = { 'Content-Type': 'application/json' };

    if (this._oidcTokenProvider) {
      try {
        const token = await this._oidcTokenProvider.getToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        this._logger.error('Failed to get OIDC token for callback:', error);
        return;
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        this._logger.error(
          `Callback to ${url} failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }
    } catch (error) {
      this._logger.error(`Callback to ${url} failed:`, error);
    }
  }
}
