import { ILogObj, Logger } from 'tslog';
import { CryptoUtils, IDeviceModelRepository } from '@citrineos/data';
import { IncomingMessage } from 'http';
import { extractBasicCredentials } from '../../util/RequestOperations';
import { AuthenticatorFilter } from './AuthenticatorFilter';
import { AuthenticationOptions, OCPP2_0_1 } from '@citrineos/base';
import { UpgradeAuthenticationError } from './errors/AuthenticationError';

/**
 * Filter used to authenticate incoming HTTP requests based on basic authorization header.
 * It only applies when the security profile is set to 1 or 2.
 */
export class BasicAuthenticationFilter extends AuthenticatorFilter {
  private _deviceModelRepository: IDeviceModelRepository;

  constructor(deviceModelRepository: IDeviceModelRepository, logger?: Logger<ILogObj>) {
    super(logger);
    this._deviceModelRepository = deviceModelRepository;
  }

  protected shouldFilter(options: AuthenticationOptions): boolean {
    return options.securityProfile === 1 || options.securityProfile === 2;
  }

  protected async filter(
    tenantId: number,
    identifier: string,
    request: IncomingMessage,
  ): Promise<void> {
    const { username, password } = extractBasicCredentials(request);
    if (!username || !password) {
      throw new UpgradeAuthenticationError('Auth header missing or incorrectly formatted');
    }

    if (username !== identifier || !(await this._isPasswordValid(tenantId, username, password))) {
      throw new UpgradeAuthenticationError(`Unauthorized ${identifier}`);
    }
  }

  private async _isPasswordValid(tenantId: number, username: string, password: string) {
    return await this._deviceModelRepository
      .readAllByQuerystring(tenantId, {
        tenantId,
        stationId: username,
        component_name: 'SecurityCtrlr',
        variable_name: 'BasicAuthPassword',
        type: OCPP2_0_1.AttributeEnumType.Actual,
      })
      .then((r) => {
        if (r && r[0]) {
          const hashedPassword = r[0].value;
          if (hashedPassword) {
            return CryptoUtils.isPasswordMatch(hashedPassword, password);
          }
        }
        this._logger.warn('Has no password', username);
        return false;
      });
  }
}
