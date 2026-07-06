// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { AuthenticationOptions } from '@citrineos/base';
import { OCPP2_0_1 } from '@citrineos/base';
import type { VariableAttribute } from '@dal/layers/sequelize/model/DeviceModel/VariableAttribute.js';
import type { VariableAttributeQuerystring } from '@dal/interfaces/queries/VariableAttribute.js';
import { IncomingMessage } from 'http';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { extractBasicCredentials } from '@util/util/RequestOperations.js';
import { AuthenticatorFilter } from './AuthenticatorFilter.js';
import { UpgradeAuthenticationError } from './errors/AuthenticationError.js';

/**
 * Filter used to authenticate incoming HTTP requests based on basic authorization header.
 * It only applies when the security profile is set to 1 or 2.
 */
interface IDeviceModelLookup {
  readAllByQuerystring(
    tenantId: number,
    query: VariableAttributeQuerystring,
  ): Promise<VariableAttribute[]>;
}

export class BasicAuthenticationFilter extends AuthenticatorFilter {
  private _deviceModelRepository: IDeviceModelLookup;

  constructor({
    deviceModelRepository,
    logger,
  }: {
    deviceModelRepository: IDeviceModelLookup;
    logger: Logger<ILogObj>;
  }) {
    super(logger);
    this._deviceModelRepository = deviceModelRepository;
  }

  protected shouldFilter(options: AuthenticationOptions): boolean {
    return (
      (options.securityProfile === 1 || options.securityProfile === 2) &&
      !options.ignoreAuthenticationHeaders
    );
  }

  protected async filter(
    tenantId: number,
    ocppConnectionName: string,
    request: IncomingMessage,
  ): Promise<void> {
    const { username, password } = extractBasicCredentials(request);
    if (!username || !password) {
      throw new UpgradeAuthenticationError('Auth header missing or incorrectly formatted');
    }

    if (
      username !== ocppConnectionName ||
      !(await this._isPasswordValid(tenantId, username, password))
    ) {
      throw new UpgradeAuthenticationError(`Unauthorized ${ocppConnectionName}`);
    }
  }

  private async _isPasswordValid(tenantId: number, username: string, password: string) {
    return await this._deviceModelRepository
      .readAllByQuerystring(tenantId, {
        tenantId,
        ocppConnectionName: username,
        component_name: 'SecurityCtrlr',
        variable_name: 'BasicAuthPassword',
        type: OCPP2_0_1.AttributeEnumType.Actual,
      })
      .then((r) => {
        if (r && r[0]) {
          const storedPassword = r[0].value;
          if (storedPassword) {
            return storedPassword === password;
          }
        }
        this._logger.warn('Has no password', username);
        return false;
      });
  }
}

export default BasicAuthenticationFilter;
