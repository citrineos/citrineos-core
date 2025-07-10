import { IAuthorizer } from './authorization';
import { Authorization, ILocationRepository } from '@citrineos/data';
import { IAuthorizationDto, IMessageContext, RealTimeAuthEnumType } from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';

export class RealTimeAuthorizer implements IAuthorizer {
  private _locationRepository: ILocationRepository;
  private readonly _logger: Logger<ILogObj>;

  constructor(locationRepository: ILocationRepository, logger?: Logger<ILogObj>) {
    this._locationRepository = locationRepository;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async authorize(
    authorization: Authorization,
    context: IMessageContext,
  ): Promise<Partial<IAuthorizationDto>> {
    if (!authorization.realTimeAuthUrl) {
      this._logger.error(`No Realtime Auth URL from authorization ${authorization.id}`);
      throw new Error(`No Realtime Auth URL from authorization ${authorization.id}`);
    }

    let result: Partial<IAuthorizationDto> = {
      realTimeAuth: RealTimeAuthEnumType.Rejected,
    };
    try {
      const chargingStation = await this._locationRepository.readChargingStationByStationId(
        context.tenantId,
        context.stationId,
      );

      const payload = {
        idToken: authorization.idToken,
        idTokenType: authorization.idTokenType,
        locationId: chargingStation?.locationId,
        stationId: context.stationId,
      };

      const response = await fetch(authorization.realTimeAuthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      result = await response.json();
    } catch (error) {
      this._logger.error(`Real-Time Auth failed: ${error}`);
      throw new Error(`Real-Time Auth failed: ${error}`);
    }

    return result;
  }
}
