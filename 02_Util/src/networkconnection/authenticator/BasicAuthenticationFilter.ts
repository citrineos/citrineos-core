import { AttributeEnumType } from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
import { IDeviceModelRepository } from '@citrineos/data';
import { IncomingMessage } from 'http';
import * as bcrypt from 'bcrypt';
import { extractBasicCredentials } from '../../util/RequestOperations';
import { AuthenticatorFilter } from './AuthenticatorFilter';
import { AuthenticationOptions } from '@citrineos/base';
import { UpgradeAuthenticationError } from './errors/AuthenticationError';

/**
 * Filter used to authenticate incoming HTTP requests based on basic authorization header.
 * It only applies when the security profile is set to 1 or 2.
 */
export class BasicAuthenticationFilter extends AuthenticatorFilter {
  private _deviceModelRepository: IDeviceModelRepository;

  constructor(
    deviceModelRepository: IDeviceModelRepository,
    logger?: Logger<ILogObj>,
  ) {
    super(logger);
    this._deviceModelRepository = deviceModelRepository;
  }

  protected shouldFilter(options: AuthenticationOptions): boolean {
    return options.securityProfile === 1 || options.securityProfile === 2;
  }

  protected async filter(
    identifier: string,
    request: IncomingMessage,
  ): Promise<void> {
    const { username, password } = extractBasicCredentials(request);
    if (!username || !password) {
      throw Error('Auth header missing or incorrectly formatted');
    }

    if (
      username !== identifier ||
      !(await this._isPasswordValid(username, password))
    ) {
      throw new UpgradeAuthenticationError(`Unauthorized ${identifier}`);
    }
  }

  private async _isPasswordValid(username: string, password: string) {
    return await this._deviceModelRepository
      .readAllByQuerystring({
        stationId: username,
        component_name: 'SecurityCtrlr',
        variable_name: 'BasicAuthPassword',
        type: AttributeEnumType.Actual,
      })
      .then((r) => {
        if (r && r[0]) {
          const hashedPassword = r[0].value;
          if (hashedPassword) {
            return bcrypt.compare(password, hashedPassword);
          }
        }
        this._logger.warn('Has no password', username);
        return false;
      });
  }
}
