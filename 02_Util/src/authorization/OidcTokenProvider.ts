// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ILogObj, Logger } from 'tslog';

export interface OidcTokenProviderConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  audience: string;
}

interface OidcToken {
  accessToken: string;
  expiresAt: number;
}

export class OidcTokenProvider {
  private oidcToken?: OidcToken;
  private readonly _logger: Logger<ILogObj>;

  constructor(
    private config: OidcTokenProviderConfig,
    logger?: Logger<ILogObj>,
  ) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  public async getToken(): Promise<string> {
    if (this.oidcToken && this.oidcToken.expiresAt > Date.now()) {
      this._logger.debug('Returning cached OIDC token');
      return this.oidcToken.accessToken;
    }

    this._logger.debug('Fetching new OIDC token');
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        audience: this.config.audience,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this._logger.error('Failed to fetch OIDC token:', errorText);
      throw new Error(`Failed to fetch OIDC token: ${response.statusText}`);
    }

    const tokenData = await response.json();
    this.oidcToken = {
      accessToken: tokenData.access_token,
      // Set expiry to 1 minute before actual expiration to be safe
      expiresAt: Date.now() + (tokenData.expires_in - 60) * 1000,
    };

    return this.oidcToken.accessToken;
  }
}
