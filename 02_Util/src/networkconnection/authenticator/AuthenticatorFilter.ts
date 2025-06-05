import { IncomingMessage } from 'http';
import { ILogObj, Logger } from 'tslog';
import { AuthenticationOptions } from '@citrineos/base';

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
    identifier: string,
    request: IncomingMessage,
    options?: AuthenticationOptions,
  ): Promise<void>;

  async authenticate(
    tenantId: number,
    identifier: string,
    request: IncomingMessage,
    options: AuthenticationOptions,
  ): Promise<void> {
    if (this.shouldFilter(options)) {
      this._logger.debug(`Applying filter for: ${identifier}`);
      try {
        await this.filter(tenantId, identifier, request, options);
        this._logger.debug(`Filter passed for: ${identifier}`);
      } catch (error) {
        this._logger.warn(`Filter failed for: ${identifier}`);
        throw error;
      }
    } else {
      this._logger.debug(`Filter skipped for: ${identifier}`);
    }
  }
}
