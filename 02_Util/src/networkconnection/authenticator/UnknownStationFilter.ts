import { ILogObj, Logger } from 'tslog';
import { ILocationRepository } from '@citrineos/data';
import { IncomingMessage } from 'http';
import { AuthenticatorFilter } from './AuthenticatorFilter';
import { AuthenticationOptions } from '@citrineos/base';
import { UpgradeUnknownError } from './errors/UnknownError';

/**
 * Filter used to block connections from charging stations that are not recognized in the system.
 * It only applies when unknown charging stations are not allowed.
 */
export class UnknownStationFilter extends AuthenticatorFilter {
  private _locationRepository: ILocationRepository;

  constructor(locationRepository: ILocationRepository, logger?: Logger<ILogObj>) {
    super(logger);
    this._locationRepository = locationRepository;
  }

  protected shouldFilter(options: AuthenticationOptions) {
    return !options.allowUnknownChargingStations;
  }

  protected async filter(
    tenantId: number,
    identifier: string,
    _request: IncomingMessage,
  ): Promise<void> {
    const isStationKnown = await this._locationRepository.doesChargingStationExistByStationId(
      tenantId,
      identifier,
    );
    if (!isStationKnown) {
      throw new UpgradeUnknownError(`Unknown identifier ${identifier}`);
    }
  }
}
