// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AttributeEnumType,
  CacheNamespace,
  IAuthenticator,
  ICache,
  notNull,
  SetVariableStatusEnumType,
} from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
import * as bcrypt from 'bcrypt';
import { IDeviceModelRepository, ILocationRepository } from '@citrineos/data';

export class Authenticator implements IAuthenticator {
  protected _cache: ICache;
  protected _logger: Logger<ILogObj>;
  private _locationRepository: ILocationRepository;
  private _deviceModelRepository: IDeviceModelRepository;

  constructor(
    cache: ICache,
    locationRepository: ILocationRepository,
    deviceModelRepository: IDeviceModelRepository,
    logger?: Logger<ILogObj>,
  ) {
    this._cache = cache;
    this._locationRepository = locationRepository;
    this._deviceModelRepository = deviceModelRepository;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async authenticate(
    allowUnknownChargingStations: boolean,
    identifier: string,
    username: string,
    password: string,
  ): Promise<boolean> {
    if (!allowUnknownChargingStations && !(await this._isKnown(identifier))) {
      this._logger.warn('Unknown identifier', identifier);
      return false;
    }

    if (await this._isAlreadyConnected(identifier)) {
      this._logger.warn(
        'New connection attempted for already connected identifier',
        identifier,
      );
      return false;
    }

    if (
      username !== identifier ||
      !(await this._isPasswordValid(username, password))
    ) {
      this._logger.warn('Unauthorized', identifier);
      return false;
    }

    this._logger.debug(
      'Successfully got past the authentication step for identifier',
      identifier,
    );
    return true;
  }

  private async _isKnown(identifier: string) {
    return notNull(
      await this._locationRepository.readChargingStationByStationId(identifier),
    );
  }

  private async _isAlreadyConnected(identifier: string) {
    return notNull(
      await this._cache.get(identifier, CacheNamespace.Connections),
    );
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
          // Grabbing value most recently *successfully* set on charger
          const hashedPassword = r[0].statuses
            ?.filter(
              (status) => status.status !== SetVariableStatusEnumType.Rejected,
            )
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .shift();
          if (hashedPassword?.value) {
            return bcrypt.compare(password, hashedPassword.value);
          }
        }
        this._logger.warn('Has no password', username);
        return false;
      });
  }
}
