// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IAuthenticator, AuthenticationOptions } from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
import { IncomingMessage } from 'http';
import { UnknownStationFilter } from './UnknownStationFilter';
import { BasicAuthenticationFilter } from './BasicAuthenticationFilter';
import { ConnectedStationFilter } from './ConnectedStationFilter';
import { NetworkProfileFilter } from './NetworkProfileFilter';

export class Authenticator implements IAuthenticator {
  protected _logger: Logger<ILogObj>;
  private _unknownStationFilter: UnknownStationFilter;
  private _connectedStationFilter: ConnectedStationFilter;
  private _networkProfileFilter: NetworkProfileFilter;
  private _basicAuthenticationFilter: BasicAuthenticationFilter;

  constructor(
    unknownStationFilter: UnknownStationFilter,
    connectedStationFilter: ConnectedStationFilter,
    networkProfileFilter: NetworkProfileFilter,
    basicAuthenticationFilter: BasicAuthenticationFilter,
    logger?: Logger<ILogObj>,
  ) {
    this._unknownStationFilter = unknownStationFilter;
    this._connectedStationFilter = connectedStationFilter;
    this._networkProfileFilter = networkProfileFilter;
    this._basicAuthenticationFilter = basicAuthenticationFilter;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async authenticate(
    request: IncomingMessage,
    tenantId: number,
    options: AuthenticationOptions,
  ): Promise<{ identifier: string }> {
    const identifier = this._getClientIdFromUrl(request.url as string);
    this._logger.debug(`Starting authentication for identifier: ${identifier}`);

    await this._unknownStationFilter.authenticate(tenantId, identifier, request, options);
    await this._connectedStationFilter.authenticate(tenantId, identifier, request, options);
    await this._networkProfileFilter.authenticate(tenantId, identifier, request, options);
    await this._basicAuthenticationFilter.authenticate(tenantId, identifier, request, options);

    this._logger.debug(`Authentication successful for identifier: ${identifier}`);
    return { identifier };
  }

  private _getClientIdFromUrl(url: string): string {
    return url.split('/').pop() as string;
  }
}
