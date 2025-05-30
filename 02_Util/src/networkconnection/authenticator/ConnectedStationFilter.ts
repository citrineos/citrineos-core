import { CacheNamespace, ICache, notNull, AuthenticationOptions } from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
import { IncomingMessage } from 'http';
import { AuthenticatorFilter } from './AuthenticatorFilter';
import { UpgradeAuthenticationError } from './errors/AuthenticationError';

/**
 * Filter used to prevent multiple simultaneous connections for the same charging station.
 */
export class ConnectedStationFilter extends AuthenticatorFilter {
  private _cache: ICache;

  constructor(cache: ICache, logger?: Logger<ILogObj>) {
    super(logger);
    this._cache = cache;
  }

  protected shouldFilter(_options: AuthenticationOptions) {
    return true;
  }

  protected async filter(
    tenantId: number,
    identifier: string,
    _request: IncomingMessage,
  ): Promise<void> {
    const isAlreadyConnected = notNull(
      await this._cache.get(identifier, CacheNamespace.Connections),
    );
    if (isAlreadyConnected) {
      throw new UpgradeAuthenticationError(
        `New connection attempted for already connected identifier ${identifier}`,
      );
    }
  }
}
